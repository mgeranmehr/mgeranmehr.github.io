import type {
  CrossSection,
  ModelBounds,
  ParseWarning,
  Point2D,
  SwmmLink,
  SwmmModel,
  SwmmNode,
  SwmmSubcatchment,
} from "../domain/model";

interface ParsedLine {
  line: number;
  tokens: string[];
}

type SectionMap = Map<string, ParsedLine[]>;

const numberOr = (value: string | undefined, fallback = 0): number => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function tokenize(line: string): string[] {
  const content = line.split(";")[0]?.trim() ?? "";
  if (!content) return [];
  return content.match(/"[^"]*"|\S+/g)?.map((token) => token.replace(/^"|"$/g, "")) ?? [];
}

function readSections(text: string): { sections: SectionMap; title: string } {
  const sections: SectionMap = new Map();
  const titleLines: string[] = [];
  let activeSection = "";

  text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((rawLine, index) => {
    const trimmed = rawLine.trim();
    const match = trimmed.match(/^\[([^\]]+)]/);
    if (match?.[1]) {
      activeSection = match[1].trim().toUpperCase();
      if (!sections.has(activeSection)) sections.set(activeSection, []);
      return;
    }

    if (activeSection === "TITLE" && trimmed) {
      const titleText = trimmed.replace(/^;+\s*/, "");
      if (titleText) titleLines.push(titleText);
    }

    const tokens = tokenize(rawLine);
    if (activeSection && tokens.length > 0) {
      sections.get(activeSection)?.push({ line: index + 1, tokens });
    }
  });

  return { sections, title: titleLines.join(" ") || "Untitled SWMM model" };
}

function parseNodes(sections: SectionMap, warnings: ParseWarning[]): Map<string, SwmmNode> {
  const nodes = new Map<string, SwmmNode>();

  for (const row of sections.get("JUNCTIONS") ?? []) {
    const [id, invert, maxDepth, initialDepth, surchargeDepth, pondedArea] = row.tokens;
    if (!id) continue;
    nodes.set(id, {
      id,
      kind: "junction",
      invertElevation: numberOr(invert),
      maxDepth: numberOr(maxDepth),
      attributes: {
        initialDepth: numberOr(initialDepth),
        surchargeDepth: numberOr(surchargeDepth),
        pondedArea: numberOr(pondedArea),
      },
    });
  }

  for (const row of sections.get("OUTFALLS") ?? []) {
    const [id, invert, type = "FREE", stageData = "", gated = "NO", routeTo = ""] = row.tokens;
    if (!id) continue;
    nodes.set(id, {
      id,
      kind: "outfall",
      invertElevation: numberOr(invert),
      maxDepth: 0,
      attributes: { type, stageData, gated, routeTo },
    });
  }

  for (const row of sections.get("STORAGE") ?? []) {
    const [id, invert, maxDepth, initialDepth, shape = "FUNCTIONAL", ...shapeData] = row.tokens;
    if (!id) continue;
    nodes.set(id, {
      id,
      kind: "storage",
      invertElevation: numberOr(invert),
      maxDepth: numberOr(maxDepth),
      attributes: {
        initialDepth: numberOr(initialDepth),
        shape,
        shapeData: shapeData.join(" "),
      },
    });
  }

  for (const row of sections.get("COORDINATES") ?? []) {
    const [id, x, y] = row.tokens;
    if (!id) continue;
    const node = nodes.get(id);
    if (!node) {
      warnings.push({
        code: "ORPHAN_COORDINATE",
        line: row.line,
        message: `Coordinate ${id} does not reference a supported node.`,
      });
      continue;
    }
    node.coordinate = { x: numberOr(x), y: numberOr(y) };
  }

  return nodes;
}

function createFallbackCoordinates(nodes: Map<string, SwmmNode>, warnings: ParseWarning[]): void {
  const missing = [...nodes.values()].filter((node) => !node.coordinate);
  if (missing.length === 0) return;

  const known = [...nodes.values()].flatMap((node) => (node.coordinate ? [node.coordinate] : []));
  const maxX = known.length ? Math.max(...known.map((point) => point.x)) : 0;
  const minX = known.length ? Math.min(...known.map((point) => point.x)) : 0;
  const maxY = known.length ? Math.max(...known.map((point) => point.y)) : 0;
  const minY = known.length ? Math.min(...known.map((point) => point.y)) : 0;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const radius = Math.max(maxX - minX, maxY - minY, 100) * 0.65;

  missing.forEach((node, index) => {
    const angle = (index / Math.max(missing.length, 1)) * Math.PI * 2;
    node.coordinate = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  warnings.push({
    code: "GENERATED_COORDINATES",
    message: `${missing.length} node${missing.length === 1 ? "" : "s"} had no coordinates and received a schematic layout.`,
  });
}

function parseCrossSections(sections: SectionMap): Map<string, CrossSection> {
  const crossSections = new Map<string, CrossSection>();
  for (const row of sections.get("XSECTIONS") ?? []) {
    const [id, shape = "CIRCULAR", g1, g2, g3, g4, barrels] = row.tokens;
    if (!id) continue;
    crossSections.set(id, {
      shape,
      geometry1: g1 === undefined ? undefined : numberOr(g1),
      geometry2: g2 === undefined ? undefined : numberOr(g2),
      geometry3: g3 === undefined ? undefined : numberOr(g3),
      geometry4: g4 === undefined ? undefined : numberOr(g4),
      barrels: barrels === undefined ? undefined : numberOr(barrels, 1),
    });
  }
  return crossSections;
}

function parseLinks(
  sections: SectionMap,
  nodes: Map<string, SwmmNode>,
  warnings: ParseWarning[],
): SwmmLink[] {
  const links: SwmmLink[] = [];
  const crossSections = parseCrossSections(sections);
  const vertices = new Map<string, Point2D[]>();

  for (const row of sections.get("VERTICES") ?? []) {
    const [id, x, y] = row.tokens;
    if (!id) continue;
    const points = vertices.get(id) ?? [];
    points.push({ x: numberOr(x), y: numberOr(y) });
    vertices.set(id, points);
  }

  const addLink = (
    row: ParsedLine,
    kind: SwmmLink["kind"],
    inletOffsetIndex?: number,
    outletOffsetIndex?: number,
  ) => {
    const [id, fromNode, toNode] = row.tokens;
    if (!id || !fromNode || !toNode) return;
    if (!nodes.has(fromNode) || !nodes.has(toNode)) {
      warnings.push({
        code: "MISSING_LINK_NODE",
        line: row.line,
        message: `${kind} ${id} references a node that was not parsed.`,
      });
    }
    links.push({
      id,
      kind,
      fromNode,
      toNode,
      inletOffset: inletOffsetIndex === undefined ? 0 : numberOr(row.tokens[inletOffsetIndex]),
      outletOffset: outletOffsetIndex === undefined ? 0 : numberOr(row.tokens[outletOffsetIndex]),
      vertices: vertices.get(id) ?? [],
      crossSection: crossSections.get(id),
      attributes: linkAttributes(row.tokens, kind),
    });
  };

  for (const row of sections.get("CONDUITS") ?? []) addLink(row, "conduit", 5, 6);
  for (const row of sections.get("PUMPS") ?? []) addLink(row, "pump");
  for (const row of sections.get("ORIFICES") ?? []) addLink(row, "orifice", 4, 4);
  for (const row of sections.get("WEIRS") ?? []) addLink(row, "weir", 4, 4);
  for (const row of sections.get("OUTLETS") ?? []) addLink(row, "outlet", 3, 3);

  return links;
}

function linkAttributes(tokens: string[], kind: SwmmLink["kind"]): Record<string, string | number> {
  if (kind === "conduit") {
    return {
      length: numberOr(tokens[3]),
      roughness: numberOr(tokens[4]),
      initialFlow: numberOr(tokens[7]),
      maxFlow: numberOr(tokens[8]),
    };
  }
  return { definition: tokens.slice(3).join(" ") };
}

function parseSubcatchments(sections: SectionMap): SwmmSubcatchment[] {
  const polygons = new Map<string, Point2D[]>();
  for (const row of sections.get("POLYGONS") ?? []) {
    const [id, x, y] = row.tokens;
    if (!id) continue;
    const points = polygons.get(id) ?? [];
    points.push({ x: numberOr(x), y: numberOr(y) });
    polygons.set(id, points);
  }

  return (sections.get("SUBCATCHMENTS") ?? []).flatMap((row) => {
    const [id, rainGage = "", outlet = "", area, impervious, width, slope, curbLength] = row.tokens;
    if (!id) return [];
    return [{
      id,
      outlet,
      area: numberOr(area),
      percentImpervious: numberOr(impervious),
      polygon: polygons.get(id) ?? [],
      attributes: {
        rainGage,
        width: numberOr(width),
        slope: numberOr(slope),
        curbLength: numberOr(curbLength),
      },
    } satisfies SwmmSubcatchment];
  });
}

function modelBounds(nodes: SwmmNode[]): ModelBounds {
  const coordinates = nodes.flatMap((node) => (node.coordinate ? [node.coordinate] : []));
  const elevations = nodes.map((node) => node.invertElevation);
  const tops = nodes.map((node) => node.invertElevation + node.maxDepth);
  return {
    minX: coordinates.length ? Math.min(...coordinates.map((point) => point.x)) : 0,
    minY: coordinates.length ? Math.min(...coordinates.map((point) => point.y)) : 0,
    maxX: coordinates.length ? Math.max(...coordinates.map((point) => point.x)) : 1,
    maxY: coordinates.length ? Math.max(...coordinates.map((point) => point.y)) : 1,
    minElevation: elevations.length ? Math.min(...elevations) : 0,
    maxElevation: tops.length ? Math.max(...tops) : 1,
  };
}

function flowUnits(sections: SectionMap): string | undefined {
  for (const row of sections.get("OPTIONS") ?? []) {
    if (row.tokens[0]?.toUpperCase() === "FLOW_UNITS") return row.tokens[1]?.toUpperCase();
  }
  return undefined;
}

export function parseInp(text: string): SwmmModel {
  if (!text.trim()) throw new Error("The selected file is empty.");
  const { sections, title } = readSections(text);
  if (sections.size === 0) throw new Error("No SWMM sections were found in this file.");

  const warnings: ParseWarning[] = [];
  const nodes = parseNodes(sections, warnings);
  createFallbackCoordinates(nodes, warnings);
  const nodeList = [...nodes.values()];
  const links = parseLinks(sections, nodes, warnings);
  const subcatchments = parseSubcatchments(sections);

  if (nodeList.length === 0) {
    warnings.push({ code: "NO_NODES", message: "No supported SWMM nodes were found." });
  }
  if (links.length === 0) {
    warnings.push({ code: "NO_LINKS", message: "No supported SWMM links were found." });
  }

  return {
    title,
    flowUnits: flowUnits(sections),
    nodes: nodeList,
    links,
    subcatchments,
    sections: [...sections.keys()],
    warnings,
    bounds: modelBounds(nodeList),
  };
}
