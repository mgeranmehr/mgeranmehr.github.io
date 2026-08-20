export type NodeKind = "junction" | "outfall" | "storage";
export type LinkKind = "conduit" | "pump" | "orifice" | "weir" | "outlet";

export interface Point2D {
  x: number;
  y: number;
}

export interface SwmmNode {
  id: string;
  kind: NodeKind;
  invertElevation: number;
  maxDepth: number;
  coordinate?: Point2D;
  attributes: Record<string, string | number>;
}

export interface CrossSection {
  shape: string;
  geometry1?: number;
  geometry2?: number;
  geometry3?: number;
  geometry4?: number;
  barrels?: number;
}

export interface SwmmLink {
  id: string;
  kind: LinkKind;
  fromNode: string;
  toNode: string;
  inletOffset: number;
  outletOffset: number;
  vertices: Point2D[];
  crossSection?: CrossSection;
  attributes: Record<string, string | number>;
}

export interface SwmmSubcatchment {
  id: string;
  outlet: string;
  area: number;
  percentImpervious: number;
  polygon: Point2D[];
  attributes: Record<string, string | number>;
}

export interface ParseWarning {
  code: string;
  message: string;
  line?: number;
}

export interface ModelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minElevation: number;
  maxElevation: number;
}

export interface SwmmModel {
  title: string;
  flowUnits?: string;
  nodes: SwmmNode[];
  links: SwmmLink[];
  subcatchments: SwmmSubcatchment[];
  sections: string[];
  warnings: ParseWarning[];
  bounds: ModelBounds;
}

export type SelectableModelObject = SwmmNode | SwmmLink | SwmmSubcatchment;
