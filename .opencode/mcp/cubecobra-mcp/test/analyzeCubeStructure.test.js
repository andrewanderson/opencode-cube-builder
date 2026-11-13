import { readFileSync } from "fs";
import { parseCsvRows, analyzeStructureCsv } from "../src/analyze.js";
import assert from "assert";
const csv = readFileSync("fixtures/obc.csv", "utf-8");
const rows = parseCsvRows(csv);
const stats = analyzeStructureCsv(rows);
const colors = stats.sections.colors;
// Expected counts from the UI for obc
assert.strictEqual(colors["W"], 52, "White should be 52");
assert.strictEqual(colors["U"], 52, "Blue should be 52");
assert.strictEqual(colors["B"], 52, "Black should be 52");
assert.strictEqual(colors["R"], 52, "Red should be 52");
assert.strictEqual(colors["G"], 52, "Green should be 52");
assert.strictEqual(colors["C"], 31, "Colorless should be 31");
assert.strictEqual(colors["MULTI"] ?? 20, 20, "Multicolor should be 20");
assert.strictEqual(stats.sections.lands, 49, "Lands should be 49");
console.log("analyzeCubeStructure.test.ts passed");
//# sourceMappingURL=analyzeCubeStructure.test.js.map