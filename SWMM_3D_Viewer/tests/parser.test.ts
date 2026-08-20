import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInp } from "../src/inp/parser.ts";

const basicModel = `
[TITLE]
Parser test

[OPTIONS]
FLOW_UNITS CMS

[JUNCTIONS]
J1 100 5 0 0 0
J2 95 6 0 0 0

[OUTFALLS]
O1 90 FREE NO

[CONDUITS]
C1 J1 J2 100 0.013 1 2 0 0
C2 J2 O1 120 0.014 0 0 0 0

[XSECTIONS]
C1 CIRCULAR 1.2 0 0 0 1
C2 CIRCULAR 1.5 0 0 0 1

[COORDINATES]
J1 0 0
J2 100 0
O1 200 25

[VERTICES]
C2 150 10
`;

describe("parseInp", () => {
  it("parses nodes, links, coordinates and cross sections", () => {
    const model = parseInp(basicModel);
    assert.equal(model.title, "Parser test");
    assert.equal(model.flowUnits, "CMS");
    assert.equal(model.nodes.length, 3);
    assert.equal(model.links.length, 2);
    assert.equal(model.links[0]?.crossSection?.geometry1, 1.2);
    assert.deepEqual(model.links[1]?.vertices, [{ x: 150, y: 10 }]);
    assert.equal(model.bounds.maxX, 200);
  });

  it("creates a schematic coordinate for a node without coordinates", () => {
    const model = parseInp(`${basicModel}\n[JUNCTIONS]\nJ3 92 5`);
    const generated = model.nodes.find((node) => node.id === "J3");
    assert.ok(generated?.coordinate);
    assert.equal(model.warnings.some((warning) => warning.code === "GENERATED_COORDINATES"), true);
  });

  it("rejects empty or non-INP content", () => {
    assert.throws(() => parseInp("  "), /empty/);
    assert.throws(() => parseInp("not a model"), /No SWMM sections/);
  });
});
