import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type {
  Point2D,
  SelectableModelObject,
  SwmmLink,
  SwmmModel,
  SwmmNode,
} from "../domain/model";

const COLORS = {
  junction: 0x5cc8ff,
  outfall: 0xffb45c,
  storage: 0xb888ff,
  conduit: 0x83a5b9,
  pump: 0xff6f91,
  orifice: 0xffd166,
  weir: 0x78e08f,
  outlet: 0x55efc4,
  subcatchment: 0x3fcf8e,
  selected: 0xffffff,
};

type LayerName = "nodes" | "links" | "subcatchments" | "grid";

interface Transform {
  centerX: number;
  centerY: number;
  minElevation: number;
  scale: number;
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export class Viewer3D {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.05, 5000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly root = new THREE.Group();
  private readonly groups: Record<LayerName, THREE.Group> = {
    nodes: new THREE.Group(),
    links: new THREE.Group(),
    subcatchments: new THREE.Group(),
    grid: new THREE.Group(),
  };
  private readonly objectsById = new Map<string, THREE.Object3D[]>();
  private readonly resizeObserver: ResizeObserver;
  private frame = 0;
  private model?: SwmmModel;
  private transform: Transform = { centerX: 0, centerY: 0, minElevation: 0, scale: 1 };
  private exaggeration = 5;
  private selected?: THREE.Object3D;
  private onSelection: (object?: SelectableModelObject) => void = () => undefined;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x071018, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional drainage model. Drag to orbit, scroll to zoom, and right-drag to pan.",
    );
    this.container.append(this.renderer.domElement);

    this.camera.position.set(90, 95, 115);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.target.set(0, 8, 0);

    this.scene.fog = new THREE.FogExp2(0x071018, 0.0024);
    this.scene.add(this.root);
    Object.values(this.groups).forEach((group) => this.root.add(group));
    this.addLighting();
    this.addGrid();

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.container);
    this.resize();
    this.animate();
  }

  setSelectionHandler(handler: (object?: SelectableModelObject) => void): void {
    this.onSelection = handler;
  }

  loadModel(model: SwmmModel): void {
    this.model = model;
    const width = Math.max(model.bounds.maxX - model.bounds.minX, 1);
    const height = Math.max(model.bounds.maxY - model.bounds.minY, 1);
    this.transform = {
      centerX: (model.bounds.minX + model.bounds.maxX) / 2,
      centerY: (model.bounds.minY + model.bounds.maxY) / 2,
      minElevation: model.bounds.minElevation,
      scale: 150 / Math.max(width, height),
    };
    this.rebuildModel();
    this.fitView();
  }

  setVerticalExaggeration(value: number): void {
    this.exaggeration = Math.max(1, value);
    if (this.model) {
      this.rebuildModel();
      this.fitView();
    }
  }

  setLayerVisible(layer: LayerName, visible: boolean): void {
    this.groups[layer].visible = visible;
  }

  focusObject(id: string): boolean {
    const target = this.objectsById.get(id)?.[0];
    if (!target) return false;
    const bounds = new THREE.Box3().setFromObject(target);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3()).length();
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    this.controls.target.copy(center);
    this.camera.position.copy(center.clone().add(direction.multiplyScalar(Math.max(size * 4, 28))));
    this.controls.update();
    this.select(target);
    return true;
  }

  fitView(): void {
    const bounds = new THREE.Box3().setFromObject(this.root);
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 30);
    const distance = maxSize / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
    this.controls.target.copy(center);
    this.camera.position.set(center.x + distance * 0.7, center.y + distance * 0.65, center.z + distance * 0.85);
    this.camera.near = Math.max(distance / 1000, 0.01);
    this.camera.far = distance * 20;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    disposeObject(this.root);
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  private addLighting(): void {
    this.scene.add(new THREE.HemisphereLight(0xb9ddff, 0x13202c, 2.3));
    const sun = new THREE.DirectionalLight(0xffffff, 2.8);
    sun.position.set(80, 140, 70);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
  }

  private addGrid(): void {
    const grid = new THREE.GridHelper(220, 22, 0x355064, 0x1d3443);
    grid.position.y = -0.15;
    this.groups.grid.add(grid);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: 0x091923, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.groups.grid.add(ground);
  }

  private rebuildModel(): void {
    if (!this.model) return;
    this.selected = undefined;
    this.objectsById.clear();
    (Object.keys(this.groups) as LayerName[])
      .filter((name) => name !== "grid")
      .forEach((name) => {
        disposeObject(this.groups[name]);
        this.groups[name].clear();
      });

    const nodes = new Map(this.model.nodes.map((node) => [node.id, node]));
    this.model.subcatchments.forEach((subcatchment) => {
      if (subcatchment.polygon.length < 3) return;
      const shape = new THREE.Shape();
      subcatchment.polygon.forEach((point, index) => {
        const x = (point.x - this.transform.centerX) * this.transform.scale;
        const y = -(point.y - this.transform.centerY) * this.transform.scale;
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.subcatchment,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0.02;
      this.makeSelectable(mesh, subcatchment);
      this.groups.subcatchments.add(mesh);
    });

    this.model.links.forEach((link) => this.addLink(link, nodes));
    this.model.nodes.forEach((node) => this.addNode(node));
  }

  private addNode(node: SwmmNode): void {
    if (!node.coordinate) return;
    const bottom = this.world(node.coordinate, node.invertElevation);
    const height = Math.max(node.maxDepth * this.transform.scale * this.exaggeration, 1.2);
    const radius = node.kind === "storage" ? 2.2 : node.kind === "outfall" ? 1.25 : 0.95;
    const geometry = node.kind === "outfall"
      ? new THREE.CylinderGeometry(radius * 0.4, radius, height, 16)
      : new THREE.CylinderGeometry(radius, radius, height, 16);
    const material = new THREE.MeshStandardMaterial({
      color: COLORS[node.kind],
      roughness: 0.44,
      metalness: 0.12,
      emissive: 0x000000,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(bottom.x, bottom.y + height / 2, bottom.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.makeSelectable(mesh, node);
    this.groups.nodes.add(mesh);
  }

  private addLink(link: SwmmLink, nodes: Map<string, SwmmNode>): void {
    const from = nodes.get(link.fromNode);
    const to = nodes.get(link.toNode);
    if (!from?.coordinate || !to?.coordinate) return;
    const startElevation = from.invertElevation + link.inletOffset;
    const endElevation = to.invertElevation + link.outletOffset;
    const planPoints = [from.coordinate, ...link.vertices, to.coordinate];
    const lengths = [0];
    let totalLength = 0;
    for (let i = 1; i < planPoints.length; i += 1) {
      const current = planPoints[i];
      const previous = planPoints[i - 1];
      if (!current || !previous) continue;
      totalLength += Math.hypot(current.x - previous.x, current.y - previous.y);
      lengths.push(totalLength);
    }
    const points = planPoints.map((point, index) => {
      const fraction = totalLength > 0 ? (lengths[index] ?? 0) / totalLength : index / Math.max(planPoints.length - 1, 1);
      return this.world(point, THREE.MathUtils.lerp(startElevation, endElevation, fraction));
    });
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const diameter = link.crossSection?.geometry1 ?? (link.kind === "conduit" ? 1 : 1.5);
    const radius = THREE.MathUtils.clamp(diameter * this.transform.scale * 0.5, 0.18, 1.4);
    const tubularSegments = Math.min(Math.max(points.length * 6, 8), 72);
    const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color: COLORS[link.kind],
      roughness: 0.5,
      metalness: 0.16,
      emissive: 0x000000,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.makeSelectable(mesh, link);
    this.groups.links.add(mesh);
  }

  private world(point: Point2D, elevation: number): THREE.Vector3 {
    return new THREE.Vector3(
      (point.x - this.transform.centerX) * this.transform.scale,
      (elevation - this.transform.minElevation) * this.transform.scale * this.exaggeration,
      -(point.y - this.transform.centerY) * this.transform.scale,
    );
  }

  private makeSelectable(object: THREE.Object3D, modelObject: SelectableModelObject): void {
    object.userData.modelObject = modelObject;
    const existing = this.objectsById.get(modelObject.id) ?? [];
    existing.push(object);
    this.objectsById.set(modelObject.id, existing);
  }

  private select(object?: THREE.Object3D): void {
    if (this.selected instanceof THREE.Mesh && this.selected.material instanceof THREE.MeshStandardMaterial) {
      this.selected.material.emissive.setHex(0x000000);
    }
    this.selected = object;
    if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
      object.material.emissive.setHex(0x41687d);
    }
    this.onSelection(object?.userData.modelObject as SelectableModelObject | undefined);
  }

  private handlePointer = (event: PointerEvent): void => {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const selectable = [this.groups.nodes, this.groups.links, this.groups.subcatchments];
    const hit = this.raycaster.intersectObjects(selectable, true)[0]?.object;
    this.select(hit);
  };

  private resize = (): void => {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private animate = (): void => {
    this.frame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
