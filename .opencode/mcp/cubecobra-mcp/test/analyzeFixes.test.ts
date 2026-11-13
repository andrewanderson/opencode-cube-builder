import assert from "assert";
import { analyzeStructureFromCube, analyzeStructureCsv } from "../src/analyze.js";

// Fixture models the archive-cube edge cases:
//  - Barren Moor: land with color_identity ["B"] but no colors -> must stay a LAND
//  - Wasteland: plain land -> must be counted in cmc/types too
//  - Drownyard Behemoth: colorless card, colorcategory "Blue" -> counts as U (CubeCobra's own classification)
//  - Meteor Golem / Boon Satyr: artifact/enchantment creatures -> types.Creature
//  - Absorb: multicolor nonland
const cube: any = {
  cards: {
    mainboard: [
      {
        details: {
          name: "Plains Bear",
          colors: ["W"],
          color_identity: ["W"],
          colorcategory: "White",
          type: "Creature — Bear",
          cmc: 2,
        },
      },
      {
        details: {
          name: "Barren Moor",
          colors: [],
          color_identity: ["B"],
          colorcategory: "Lands",
          type: "Land",
          cmc: 0,
        },
      },
      {
        details: {
          name: "Wasteland",
          colors: [],
          color_identity: [],
          colorcategory: "Lands",
          type: "Land",
          cmc: 0,
        },
      },
      {
        details: {
          name: "Drownyard Behemoth",
          colors: [],
          color_identity: ["U"],
          colorcategory: "Blue",
          type: "Creature — Eldrazi Crab",
          cmc: 8,
        },
      },
      {
        details: {
          name: "Meteor Golem",
          colors: [],
          color_identity: [],
          colorcategory: "Colorless",
          type: "Artifact Creature — Golem",
          cmc: 7,
        },
      },
      {
        details: {
          name: "Boon Satyr",
          colors: ["G"],
          color_identity: ["G"],
          colorcategory: "Green",
          type: "Enchantment Creature — Satyr",
          cmc: 3,
        },
      },
      {
        details: {
          name: "Absorb",
          colors: ["W", "U"],
          color_identity: ["W", "U"],
          colorcategory: "Multicolor",
          type: "Instant",
          cmc: 3,
        },
      },
    ],
  },
};

const stats = analyzeStructureFromCube(cube);

assert.strictEqual(stats.count, 7, "count should include every card");
assert.strictEqual(
  stats.sections.lands,
  2,
  "lands with color_identity but no colors must count as lands, not colors"
);
assert.strictEqual(
  stats.sections.colors["B"],
  undefined,
  "Barren Moor must not be bucketed into Black via color_identity"
);
assert.strictEqual(stats.sections.colors["W"], 1, "Plains Bear stays White");
assert.strictEqual(
  stats.sections.colors["U"],
  1,
  "Drownyard Behemoth counts as Blue via colorcategory"
);
assert.strictEqual(stats.sections.colors["G"], 1, "Boon Satyr stays Green");
assert.strictEqual(
  stats.sections.colors["UW"],
  1,
  "Absorb stays a two-color UW card"
);
assert.strictEqual(stats.sections.colors["C"], 1, "Meteor Golem stays colorless");

assert.strictEqual(
  stats.types["Creature"],
  4,
  "artifact/enchantment creatures must count under Creature (Plains Bear, Drownyard, Meteor Golem, Boon Satyr)"
);
assert.strictEqual(stats.types["Land"], 2, "both lands must appear in the types map");
assert.strictEqual(stats.types["Artifact"], undefined, "no pure Artifact cards");
assert.strictEqual(stats.types["Enchantment"], undefined, "no pure Enchantment cards");
assert.strictEqual(stats.types["Instant"], 1, "Absorb stays an Instant");

assert.strictEqual(stats.cmc["0"], 2, "cmc curve must include lands (cmc 0)");
assert.strictEqual(stats.cmc["2"], 1, "cmc 2 present");
assert.strictEqual(stats.cmc["3"], 2, "cmc 3 for Boon Satyr and Absorb");
assert.strictEqual(
  stats.cmc["7+"],
  2,
  "cmc 7+ for Meteor Golem and Drownyard Behemoth"
);

assert.strictEqual(
  stats.perColor["U"]!.creatures,
  1,
  "Drownyard Behemoth is a blue creature"
);
assert.strictEqual(
  stats.perColor["C"]!.creatures,
  1,
  "Meteor Golem is a colorless creature"
);

// CSV path: same conventions, and lands must not be double-counted.
const csv = [
  "name,CMC,Type,Color,maybeboard",
  "Plains Bear,2,Creature,W,false",
  "Barren Moor,0,Land,,false",
  "Wasteland,0,Land,,false",
  "Drownyard Behemoth,8,Creature,,false",
  "Meteor Golem,7,Artifact Creature,,false",
  "Boon Satyr,3,Enchantment Creature,G,false",
].join("\n");

const csvRows = (await import("../src/analyze.js")).parseCsvRows(csv);
const csvStats = analyzeStructureCsv(csvRows);

assert.strictEqual(
  csvStats.sections.lands,
  2,
  "CSV path must not double-count lands"
);
assert.strictEqual(csvStats.sections.colors["W"], 1, "CSV keeps White");
assert.strictEqual(csvStats.sections.colors["G"], 1, "CSV keeps Green");
assert.strictEqual(csvStats.sections.colors["C"], 2, "CSV: colorless Drownyard + Meteor Golem");
assert.strictEqual(
  csvStats.types["Creature"],
  4,
  "CSV path must count artifact/enchantment creatures as Creature"
);
assert.strictEqual(csvStats.cmc["0"], 2, "CSV path cmc must include lands");

console.log("analyzeFixes.test.ts passed");
