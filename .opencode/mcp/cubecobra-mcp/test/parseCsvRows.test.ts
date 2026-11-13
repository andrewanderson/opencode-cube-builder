import { parseCsvRows } from "../src/analyze.js";
import assert from "assert";

const csv = [
  "name,CMC,Type,Color,Set,Rarity,maybeboard",
  "Lightning Bolt,1,Instant,R,lea,common,false",
  "Giant Growth,1,Instant,G,lea,common,false",
].join("\n");

const rows = parseCsvRows(csv);
const first = rows[0];
const second = rows[1];

assert.strictEqual(rows.length, 2, "should parse both rows");
assert.ok(first, "should have a first row");
assert.ok(second, "should have a second row");
assert.strictEqual(
  first.name,
  "Lightning Bolt",
  "name should be extracted from the CSV name column"
);
assert.strictEqual(second.name, "Giant Growth", "name should be extracted for every row");
assert.strictEqual(first.color, "R", "existing color extraction should keep working");
assert.strictEqual(first.cmc, 1, "existing cmc extraction should keep working");

console.log("parseCsvRows.test.ts passed");
