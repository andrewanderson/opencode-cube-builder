import Papa from "papaparse";

export type ParsedCardRow = {
  name: string;
  color: string | null;
  colorCategory: string | null;
  cmc: number;
  typeLine: string;
  maybeboard: string | null;
};

export type StructureSummary = {
  count: number;
  sections: {
    colors: Record<string, number>;
    lands: number;
  };
  types: Record<string, number>;
  cmc: Record<string, number>;
  tags: Record<string, number>;
  perColor: Record<
    string,
    {
      count: number;
      creatures: number;
      noncreatures: number;
      cmcCreatures: Record<string, number>;
      cmcNoncreatures: Record<string, number>;
      types: Record<string, number>;
    }
  >;
};

const mapCategoryToBucket = (cat?: string | null): string | null => {
  if (!cat) return null;
  const c = cat.toLowerCase();
  if (c === "null") return null;
  if (c.includes("white")) return "W";
  if (c.includes("blue")) return "U";
  if (c.includes("black")) return "B";
  if (c.includes("red")) return "R";
  if (c.includes("green")) return "G";
  if (c.includes("colorless")) return "C";
  if (c.includes("land")) return "LAND";
  if (c.includes("multi")) return "MULTI";
  return null; // hybrid/etc -> fall back to color letters
};

const parseColorString = (raw: string | null): string[] => {
  if (!raw) return [];
  const cleaned = raw.toUpperCase();
  const letters = cleaned.replace(/[^WUBRG]/g, "");
  if (!letters) return [];
  return letters.split("");
};

export const parseCsvRows = (csvText: string): ParsedCardRow[] => {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows.map((row) => {
    const name = row["Name"] ?? row["name"] ?? "";
    const color = row["Color"] ?? row["color"] ?? null;
    const colorCategory =
      row["Color Category"] ??
      row["color category"] ??
      row["colorCategory"] ??
      row["colorcategory"] ??
      null;
    const cmcRaw = row["CMC"] ?? row["cmc"];
    const cmcNum = cmcRaw ? parseFloat(cmcRaw) : 0;
    const typeLine = row["Type"] ?? row["type"] ?? "";
    const maybeboard = row["maybeboard"] ?? row["Maybeboard"] ?? null;
    return {
      name,
      color,
      colorCategory,
      cmc: Number.isFinite(cmcNum) ? cmcNum : 0,
      typeLine,
      maybeboard,
    };
  });
};

export const analyzeStructureCsv = (
  cards: ParsedCardRow[]
): StructureSummary => {
  const colorCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const cmcCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const perColor: StructureSummary["perColor"] = {};

  const ensureBucket = (bucket: string) => {
    if (!perColor[bucket]) {
      perColor[bucket] = {
        count: 0,
        creatures: 0,
        noncreatures: 0,
        cmcCreatures: {},
        cmcNoncreatures: {},
        types: {},
      };
    }
    return perColor[bucket];
  };

  let landCounter = 0;

  for (const card of cards) {
    if (String(card.maybeboard ?? "").toLowerCase() === "true") {
      continue; // skip maybeboard entries to match cube UI counts
    }
    const normalizedType = (card.typeLine ?? "")
      .replace(/\bLegendary\b/gi, "")
      .trim();
    const isLand = /\bLand\b/i.test(normalizedType);
    const isCreature = /\bCreature\b/i.test(normalizedType);

    // CMC curve covers every card (lands are cmc 0)
    const cmc = Number.isFinite(card.cmc) ? card.cmc : 0;
    const cmcKey = cmc >= 7 ? "7+" : `${Math.floor(cmc)}`;
    cmcCounts[cmcKey] = (cmcCounts[cmcKey] ?? 0) + 1;

    // Artifact/enchantment creatures count under Creature
    const primaryType = (() => {
      const head = (normalizedType.split("—")[0] ?? "").trim();
      const parts = head.split(/\s+/).filter(Boolean);
      return isCreature ? "Creature" : parts[0] ?? "Other";
    })();
    typeCounts[primaryType] = (typeCounts[primaryType] ?? 0) + 1;

    const colorsFromColor = parseColorString(card.color);
    const bucketFromCategory = mapCategoryToBucket(card.colorCategory);

    let bucket = "C";
    if (isLand) {
      // Lands stay lands unless explicitly assigned a single color
      if (colorsFromColor.length === 1) {
        bucket = colorsFromColor[0]!;
      } else {
        landCounter += 1;
        continue;
      }
    } else {
      if (colorsFromColor.length > 0) {
        const sorted = [...colorsFromColor].sort();
        bucket = sorted.length === 1 ? sorted[0]! : sorted.join("");
      } else if (bucketFromCategory && bucketFromCategory !== "LAND") {
        bucket = bucketFromCategory;
      }
    }

    colorCounts[bucket] = (colorCounts[bucket] ?? 0) + 1;

    const bucketStats = ensureBucket(bucket);
    bucketStats.count += 1;
    if (isCreature) {
      bucketStats.creatures += 1;
      bucketStats.cmcCreatures[cmcKey] =
        (bucketStats.cmcCreatures[cmcKey] ?? 0) + 1;
    } else {
      bucketStats.noncreatures += 1;
      bucketStats.cmcNoncreatures[cmcKey] =
        (bucketStats.cmcNoncreatures[cmcKey] ?? 0) + 1;
    }
    bucketStats.types[primaryType] = (bucketStats.types[primaryType] ?? 0) + 1;
  }

  return {
    count: cards.length,
    sections: {
      colors: colorCounts,
      lands: landCounter,
    },
    types: typeCounts,
    cmc: cmcCounts,
    tags: tagCounts,
    perColor,
  };
};

// Analyze from cube JSON (uses colors override from cube data, ignores color_identity)
export const analyzeStructureFromCube = (cube: any): StructureSummary => {
  const cards = cube?.cards?.mainboard ?? [];
  const colorCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const cmcCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const perColor: StructureSummary["perColor"] = {};

  const ensureBucket = (bucket: string) => {
    if (!perColor[bucket]) {
      perColor[bucket] = {
        count: 0,
        creatures: 0,
        noncreatures: 0,
        cmcCreatures: {},
        cmcNoncreatures: {},
        types: {},
      };
    }
    return perColor[bucket];
  };

  let landCounter = 0;

  for (const card of cards) {
    if (String(card.maybeboard ?? "").toLowerCase() === "true") continue;
    const typeLine =
      card.type_line ??
      card.details?.type_line ??
      card.type ??
      card.details?.type ??
      "";
    const normalizedType = typeLine.replace(/\bLegendary\b/gi, "").trim();
    const isLand = /\bLand\b/i.test(normalizedType);
    const isCreature = /\bCreature\b/i.test(normalizedType);

    // CMC curve covers every card (lands are cmc 0)
    const cmcRaw =
      (card as any).cmc ??
      card.details?.cmc ??
      card.details?.manaValue ??
      (typeof (card as any)?.manaValue === "number"
        ? (card as any).manaValue
        : 0);
    const cmcKey = cmcRaw >= 7 ? "7+" : `${Math.floor(cmcRaw)}`;
    cmcCounts[cmcKey] = (cmcCounts[cmcKey] ?? 0) + 1;

    // Artifact/enchantment creatures count under Creature
    const primaryType = (() => {
      const head = (normalizedType.split("—")[0] ?? "").trim();
      const parts = head.split(/\s+/).filter(Boolean);
      return isCreature ? "Creature" : parts[0] ?? "Other";
    })();
    typeCounts[primaryType] = (typeCounts[primaryType] ?? 0) + 1;

    const colorsArr = (
      Array.isArray(card.colors) && card.colors.length
        ? card.colors
        : Array.isArray(card.details?.colors)
        ? card.details.colors
        : []
    ) as string[];
    // Top-level `colors` override takes priority when present. color_identity is
    // never a color signal: lands with identity but no colors stay lands.
    const colors = colorsArr.map((c) => c.toUpperCase());
    const bucketFromCategory = mapCategoryToBucket(
      (card as any).colorCategory ??
        (card as any).color_category ??
        card.details?.colorCategory ??
        card.details?.colorcategory ??
        null
    );

    let bucket: string = "C";

    if (isLand) {
      // Lands stay lands unless explicitly overridden with a single color
      if (colors.length > 1) {
        landCounter += 1;
        continue;
      }
      if (colors.length === 1) {
        bucket = colors[0]!;
      } else {
        landCounter += 1; // colorless/uncategorized land
        continue;
      }
    } else {
      if (colors.length === 1) bucket = colors[0]!;
      else if (colors.length > 1) {
        const sorted = [...colors].sort();
        bucket = sorted.join("");
      } else if (bucketFromCategory && bucketFromCategory !== "LAND")
        bucket = bucketFromCategory;
    }

    colorCounts[bucket] = (colorCounts[bucket] ?? 0) + 1;

    for (const tag of card.details?.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }

    const bucketStats = ensureBucket(bucket);
    bucketStats.count += 1;
    if (isCreature) {
      bucketStats.creatures += 1;
      bucketStats.cmcCreatures[cmcKey] =
        (bucketStats.cmcCreatures[cmcKey] ?? 0) + 1;
    } else {
      bucketStats.noncreatures += 1;
      bucketStats.cmcNoncreatures[cmcKey] =
        (bucketStats.cmcNoncreatures[cmcKey] ?? 0) + 1;
    }
    bucketStats.types[primaryType] = (bucketStats.types[primaryType] ?? 0) + 1;
  }

  return {
    count: cards.length,
    sections: {
      colors: colorCounts,
      lands: landCounter,
    },
    types: typeCounts,
    cmc: cmcCounts,
    tags: tagCounts,
    perColor,
  };
};
