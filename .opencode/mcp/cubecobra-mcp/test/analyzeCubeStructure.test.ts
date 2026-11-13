import { readFileSync } from "fs";
import { analyzeStructureFromCube } from "../src/analyze.js";
import assert from "assert";

const cube = JSON.parse(readFileSync("fixtures/obc.json", "utf-8"));
const stats = analyzeStructureFromCube(cube);

const colors = stats.sections.colors;

// Expected counts based on cube JSON colors override (lands with color_identity but no
// colors stay lands; multicolor split by pair). Volrath's Stronghold (identity B, no
// colors) counts as a land, hence B=51 and lands=50.
assert.strictEqual(colors["W"], 52, "White should be 52");
assert.strictEqual(colors["U"], 52, "Blue should be 52");
assert.strictEqual(colors["B"], 51, "Black should be 51");
assert.strictEqual(colors["R"], 52, "Red should be 52");
assert.strictEqual(colors["G"], 52, "Green should be 52");
assert.strictEqual(colors["C"], 31, "Colorless should be 31");
assert.strictEqual(colors["UW"], 2, "UW should be 2");
assert.strictEqual(colors["BU"], 2, "BU should be 2");
assert.strictEqual(colors["BR"], 2, "BR should be 2");
assert.strictEqual(colors["GR"], 2, "GR should be 2");
assert.strictEqual(colors["GW"], 2, "GW should be 2");
assert.strictEqual(colors["BW"], 2, "BW should be 2");
assert.strictEqual(colors["RU"], 2, "RU should be 2");
assert.strictEqual(colors["BG"], 2, "BG should be 2");
assert.strictEqual(colors["RW"], 2, "RW should be 2");
assert.strictEqual(colors["GU"], 2, "GU should be 2");
assert.strictEqual(stats.sections.lands, 50, "Lands should be 50");

console.log("analyzeCubeStructure.test.ts passed");
