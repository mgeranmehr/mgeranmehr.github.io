import "./style.css";
import type { SelectableModelObject, SwmmModel } from "./domain/model";
import { parseInp } from "./inp/parser";
import { Viewer3D } from "./viewer/viewer";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Application root was not found.");

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="./" aria-label="SWMM 3D Viewer home">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <span><strong>SWMM</strong><small>3D VIEWER</small></span>
    </a>
    <div class="topbar-actions">
      <span class="privacy-pill"><span aria-hidden="true">●</span> Local only</span>
      <button class="button button-quiet" id="sampleButton" type="button">Load example</button>
      <label class="button button-primary" for="fileInput">Open INP</label>
      <input id="fileInput" type="file" accept=".inp,text/plain" hidden />
    </div>
  </header>

  <main class="workspace">
    <aside class="panel model-panel" aria-label="Model controls">
      <section class="intro-block">
        <p class="eyebrow">MODEL WORKSPACE</p>
        <h1 id="modelTitle">See the system below the surface.</h1>
        <p id="modelDescription">Open an EPA SWMM input file to inspect elevations, structures and connectivity in interactive 3D.</p>
      </section>

      <div class="drop-zone" id="dropZone" tabindex="0" role="button" aria-label="Drop a SWMM INP file or press Enter to browse">
        <span class="drop-icon" aria-hidden="true">↥</span>
        <strong>Drop an .inp file</strong>
        <span>or choose Open INP</span>
      </div>

      <section class="stats" aria-label="Model summary">
        <div><span>Nodes</span><strong id="nodeCount">—</strong></div>
        <div><span>Links</span><strong id="linkCount">—</strong></div>
        <div><span>Subcatchments</span><strong id="subcatchmentCount">—</strong></div>
      </section>

      <section class="control-section">
        <div class="section-heading"><h2>Layers</h2><span>VISIBILITY</span></div>
        <label class="switch-row"><span><i class="legend-dot dot-node"></i>Nodes</span><input data-layer="nodes" type="checkbox" checked /></label>
        <label class="switch-row"><span><i class="legend-dot dot-link"></i>Links</span><input data-layer="links" type="checkbox" checked /></label>
        <label class="switch-row"><span><i class="legend-dot dot-catchment"></i>Subcatchments</span><input data-layer="subcatchments" type="checkbox" checked /></label>
        <label class="switch-row"><span><i class="legend-dot dot-grid"></i>Reference grid</span><input data-layer="grid" type="checkbox" checked /></label>
      </section>

      <section class="control-section">
        <div class="section-heading"><h2>Vertical scale</h2><output id="verticalOutput" for="verticalScale">5×</output></div>
        <input class="range" id="verticalScale" type="range" min="1" max="20" step="1" value="5" />
        <div class="range-labels"><span>TRUE SCALE</span><span>20×</span></div>
      </section>

      <section class="notice" id="notice" aria-live="polite">
        <strong>Your model stays on this device.</strong>
        <span>This static viewer has no upload endpoint.</span>
      </section>

      <details class="warnings" id="warningsPanel" hidden>
        <summary><span>Model notes</span><strong id="warningCount">0</strong></summary>
        <ul id="warningList"></ul>
      </details>
    </aside>

    <section class="viewer-shell" aria-label="Interactive 3D model">
      <div class="viewer-toolbar">
        <div class="model-state"><span class="state-dot"></span><span id="fileName">Waiting for model</span></div>
        <button class="icon-button" id="fitButton" type="button" aria-label="Fit model to view">Fit view</button>
      </div>
      <div id="viewer" class="viewer"></div>
      <div class="axis-key" aria-hidden="true"><b>Z</b><span></span><b>Y</b><span></span><b>X</b></div>
      <p class="viewer-help">Drag to orbit · Scroll to zoom · Right-drag to pan · Click an object to inspect</p>
      <div class="empty-state" id="emptyState">
        <div class="empty-glyph" aria-hidden="true"><span></span><span></span><span></span></div>
        <h2>Open a drainage model</h2>
        <p>Use your own INP file or explore the included example.</p>
        <button class="button button-primary" id="emptySampleButton" type="button">Explore example</button>
      </div>
    </section>

    <aside class="panel inspector-panel" aria-label="Object inspector">
      <section class="inspector-top">
        <p class="eyebrow">INSPECTOR</p>
        <h2 id="selectedTitle">Nothing selected</h2>
        <p id="selectedSubtitle">Choose a node, link or subcatchment in the 3D view.</p>
        <dl class="properties" id="properties"></dl>
      </section>

      <section class="object-browser">
        <div class="section-heading"><h2>Model objects</h2><span id="objectTotal">0</span></div>
        <label class="search-label" for="objectSearch">Search by ID</label>
        <input class="search" id="objectSearch" type="search" placeholder="e.g. J12 or C4" autocomplete="off" />
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Type</th></tr></thead>
            <tbody id="objectTable"><tr><td colspan="2" class="table-empty">Open a model to browse objects.</td></tr></tbody>
          </table>
        </div>
        <p class="table-note" id="tableNote" hidden></p>
      </section>
    </aside>
  </main>

  <footer>
    <span>SWMM 3D Viewer</span>
    <span>Visualization only—not a hydraulic solver or EPA product.</span>
  </footer>
`;

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const fileInput = required<HTMLInputElement>("#fileInput");
const dropZone = required<HTMLDivElement>("#dropZone");
const emptyState = required<HTMLDivElement>("#emptyState");
const fileName = required<HTMLSpanElement>("#fileName");
const notice = required<HTMLElement>("#notice");
const objectSearch = required<HTMLInputElement>("#objectSearch");
const objectTable = required<HTMLTableSectionElement>("#objectTable");
const tableNote = required<HTMLParagraphElement>("#tableNote");
const viewer = new Viewer3D(required<HTMLDivElement>("#viewer"));
let currentModel: SwmmModel | undefined;

function objectType(object: SelectableModelObject): string {
  if ("kind" in object) return object.kind;
  return "subcatchment";
}

function formatLabel(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function showSelection(object?: SelectableModelObject): void {
  const title = required<HTMLElement>("#selectedTitle");
  const subtitle = required<HTMLElement>("#selectedSubtitle");
  const properties = required<HTMLDListElement>("#properties");
  properties.replaceChildren();
  if (!object) {
    title.textContent = "Nothing selected";
    subtitle.textContent = "Choose a node, link or subcatchment in the 3D view.";
    return;
  }
  const type = objectType(object);
  title.textContent = object.id;
  subtitle.textContent = formatLabel(type);

  const values: Record<string, string | number> = { type };
  if ("invertElevation" in object) {
    values["invert elevation"] = object.invertElevation;
    values["maximum depth"] = object.maxDepth;
    if (object.coordinate) {
      values["x coordinate"] = object.coordinate.x;
      values["y coordinate"] = object.coordinate.y;
    }
  } else if ("fromNode" in object) {
    values["from node"] = object.fromNode;
    values["to node"] = object.toNode;
    values["inlet offset"] = object.inletOffset;
    values["outlet offset"] = object.outletOffset;
    if (object.crossSection) values["cross section"] = object.crossSection.shape;
  } else {
    values.outlet = object.outlet;
    values.area = object.area;
    values["impervious area"] = `${object.percentImpervious}%`;
  }
  Object.assign(values, object.attributes);

  Object.entries(values).forEach(([label, value]) => {
    if (value === "" || value === undefined) return;
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = formatLabel(label);
    dd.textContent = String(value);
    properties.append(dt, dd);
  });
}

viewer.setSelectionHandler(showSelection);

function allObjects(model: SwmmModel): SelectableModelObject[] {
  return [...model.nodes, ...model.links, ...model.subcatchments];
}

function renderObjectTable(query = ""): void {
  objectTable.replaceChildren();
  if (!currentModel) {
    const row = objectTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 2;
    cell.className = "table-empty";
    cell.textContent = "Open a model to browse objects.";
    return;
  }
  const normalized = query.trim().toLowerCase();
  const matching = allObjects(currentModel).filter((object) =>
    object.id.toLowerCase().includes(normalized) || objectType(object).includes(normalized),
  );
  const visible = matching.slice(0, 500);
  visible.forEach((object) => {
    const row = objectTable.insertRow();
    const idCell = row.insertCell();
    const typeCell = row.insertCell();
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = object.id;
    button.addEventListener("click", () => viewer.focusObject(object.id));
    idCell.append(button);
    typeCell.textContent = formatLabel(objectType(object));
  });
  if (visible.length === 0) {
    const row = objectTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 2;
    cell.className = "table-empty";
    cell.textContent = "No matching objects.";
  }
  tableNote.hidden = matching.length <= visible.length;
  tableNote.textContent = tableNote.hidden ? "" : `Showing the first ${visible.length} of ${matching.length} matches.`;
}

function updateModelUI(model: SwmmModel, sourceName: string): void {
  currentModel = model;
  required<HTMLElement>("#modelTitle").textContent = model.title;
  required<HTMLElement>("#modelDescription").textContent = `${model.sections.length} INP sections · ${model.flowUnits ?? "flow units not specified"}`;
  required<HTMLElement>("#nodeCount").textContent = model.nodes.length.toLocaleString();
  required<HTMLElement>("#linkCount").textContent = model.links.length.toLocaleString();
  required<HTMLElement>("#subcatchmentCount").textContent = model.subcatchments.length.toLocaleString();
  required<HTMLElement>("#objectTotal").textContent = allObjects(model).length.toLocaleString();
  fileName.textContent = sourceName;
  emptyState.hidden = true;
  notice.classList.remove("notice-error");
  notice.replaceChildren();
  const noticeStrong = document.createElement("strong");
  const noticeText = document.createElement("span");
  noticeStrong.textContent = "Model loaded locally.";
  noticeText.textContent = `${model.nodes.length} nodes and ${model.links.length} links are ready to inspect.`;
  notice.append(noticeStrong, noticeText);

  const warningPanel = required<HTMLDetailsElement>("#warningsPanel");
  const warningList = required<HTMLUListElement>("#warningList");
  warningList.replaceChildren();
  model.warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning.line ? `Line ${warning.line}: ${warning.message}` : warning.message;
    warningList.append(item);
  });
  required<HTMLElement>("#warningCount").textContent = String(model.warnings.length);
  warningPanel.hidden = model.warnings.length === 0;
  objectSearch.value = "";
  renderObjectTable();
  showSelection();
  viewer.loadModel(model);
}

function showError(message: string): void {
  notice.classList.add("notice-error");
  notice.replaceChildren();
  const strong = document.createElement("strong");
  const text = document.createElement("span");
  strong.textContent = "The model could not be opened.";
  text.textContent = message;
  notice.append(strong, text);
}

async function loadFile(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith(".inp")) {
    showError("Choose a file with the .inp extension.");
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showError("This viewer currently limits INP files to 25 MB.");
    return;
  }
  try {
    updateModelUI(parseInp(await file.text()), file.name);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unexpected parsing error.");
  }
}

async function loadExample(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}examples/demo.inp`);
    if (!response.ok) throw new Error("The example model is unavailable.");
    updateModelUI(parseInp(await response.text()), "demo.inp · included example");
  } catch (error) {
    showError(error instanceof Error ? error.message : "Could not load the example.");
  }
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
  fileInput.value = "";
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const file = event.dataTransfer?.files[0];
  if (file) void loadFile(file);
});
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

required<HTMLButtonElement>("#sampleButton").addEventListener("click", () => void loadExample());
required<HTMLButtonElement>("#emptySampleButton").addEventListener("click", () => void loadExample());
required<HTMLButtonElement>("#fitButton").addEventListener("click", () => viewer.fitView());
objectSearch.addEventListener("input", () => renderObjectTable(objectSearch.value));

required<HTMLInputElement>("#verticalScale").addEventListener("input", (event) => {
  const value = Number((event.target as HTMLInputElement).value);
  required<HTMLOutputElement>("#verticalOutput").textContent = `${value}×`;
  viewer.setVerticalExaggeration(value);
});

document.querySelectorAll<HTMLInputElement>("[data-layer]").forEach((input) => {
  input.addEventListener("change", () => {
    const layer = input.dataset.layer as "nodes" | "links" | "subcatchments" | "grid";
    viewer.setLayerVisible(layer, input.checked);
  });
});

window.addEventListener("beforeunload", () => viewer.dispose());
