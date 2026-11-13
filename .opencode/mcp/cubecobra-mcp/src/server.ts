import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  analyzeStructureCsv,
  analyzeStructureFromCube,
  parseCsvRows,
} from "./analyze.js";

// Minimal fetch type helpers for Node without DOM lib
type HeadersInit =
  | Record<string, string>
  | Array<[string, string]>
  | { forEach?: (cb: (value: string, key: string) => void) => void };
type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: string | null;
};

const server = new McpServer({
  name: "cubecobra-mcp",
  version: "0.1.0",
});

const CUBECOBRA_BASE_URL =
  process.env.CUBECOBRA_BASE_URL?.replace(/\/$/, "") ?? "https://cubecobra.com";
const CUBECOBRA_COOKIE = process.env.CUBECOBRA_COOKIE;
const CUBECOBRA_CSRF = process.env.CUBECOBRA_CSRF;
const DEFAULT_CUBE_SHORT_ID = process.env.DEFAULT_CUBE_SHORT_ID;
const DEFAULT_CUBE_ID = process.env.DEFAULT_CUBE_ID;
const DEFAULT_RECORD_ID = process.env.DEFAULT_RECORD_ID;

const buildAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (CUBECOBRA_COOKIE) {
    headers["Cookie"] = CUBECOBRA_COOKIE;
  }
  if (CUBECOBRA_CSRF) {
    headers["x-csrf-token"] = CUBECOBRA_CSRF;
  }
  return headers;
};

const ensureBaseUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${CUBECOBRA_BASE_URL}${normalizedPath}`;
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (Array.isArray(headers)) {
    for (const [k, v] of headers) {
      result[k] = v;
    }
    return result;
  }
  if (typeof headers === "object") {
    // Might be Headers-like
    // @ts-ignore
    if (typeof headers.forEach === "function") {
      // @ts-ignore
      headers.forEach((v: string, k: string) => {
        result[k] = v;
      });
      return result;
    }
    return { ...(headers as Record<string, string>) };
  }
  return result;
};

const resolveShortId = (shortId?: string): string => {
  if (shortId && shortId.trim().length > 0) return shortId.trim();
  if (DEFAULT_CUBE_SHORT_ID) return DEFAULT_CUBE_SHORT_ID;
  throw new Error(
    "shortId is required (provide input or set DEFAULT_CUBE_SHORT_ID)"
  );
};

const resolveCubeId = (cubeId?: string): string => {
  if (cubeId && cubeId.trim().length > 0) return cubeId.trim();
  if (DEFAULT_CUBE_ID) return DEFAULT_CUBE_ID;
  throw new Error("cubeId is required (provide input or set DEFAULT_CUBE_ID)");
};

const resolveRecordId = (recordId?: string): string => {
  if (recordId && recordId.trim().length > 0) return recordId.trim();
  if (DEFAULT_RECORD_ID) return DEFAULT_RECORD_ID;
  throw new Error(
    "recordId is required (provide input or set DEFAULT_RECORD_ID)"
  );
};

const fetchText = async (path: string, init?: RequestInit): Promise<string> => {
  const url = ensureBaseUrl(path);
  const mergedHeaders: Record<string, string> = {
    ...buildAuthHeaders(),
    ...normalizeHeaders(init?.headers),
  };
  const response = await fetch(url, { ...init, headers: mergedHeaders });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Request failed (${response.status}): ${body || response.statusText}`
    );
  }
  return response.text();
};

const fetchJson = async <T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const text = await fetchText(path, init);
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

server.registerTool(
  "hello",
  {
    description: "Simple connectivity check",
    inputSchema: z.object({ name: z.string() }),
  },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  })
);

server.registerTool(
  "get_cube_list",
  {
    description: "Fetch a cube list from CubeCobra as an array of card names",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    const resolvedShortId = resolveShortId(shortId);
    const url = `${CUBECOBRA_BASE_URL}/cube/api/cubelist/${encodeURIComponent(
      resolvedShortId
    )}`;

    let responseText: string;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `CubeCobra request failed (${response.status}): ${
            body || response.statusText
          }`
        );
      }
      responseText = await response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube list: ${message}` },
        ],
      };
    }

    const cards = responseText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ cards }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "get_cube_csv_export",
  {
    description: "Fetch cube CSV export and return parsed rows",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      const csvText = await fetchText(
        `/cube/download/csv/${encodeURIComponent(resolvedShortId)}`
      );
      const rows = parseCsvRows(csvText);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ rows }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube CSV: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "get_cube_json",
  {
    description: "Fetch cube JSON (cards + metadata)",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      const data = await fetchJson(
        `/cube/api/cubeJSON/${encodeURIComponent(resolvedShortId)}`
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube JSON: ${message}` },
        ],
      };
    }
  }
);

const CARD_BOARDS = ["mainboard", "maybeboard", "basics"] as const;
type CardBoard = (typeof CARD_BOARDS)[number];

const CARD_FIELDS = [
  "name",
  "type",
  "cmc",
  "colors",
  "color_identity",
  "rarity",
  "scryfall_uri",
  "oracle_text",
  "tags",
  "status",
  "set",
  "image_small",
] as const;
type CardField = (typeof CARD_FIELDS)[number];

const CARD_FIELD_SOURCES: Record<
  CardField,
  (card: any) => unknown
> = {
  name: (card) => card.name ?? card.details?.name ?? null,
  type: (card) => card.details?.type ?? card.type_line ?? null,
  cmc: (card) => card.details?.cmc ?? card.cmc ?? null,
  colors: (card) => card.details?.colors ?? card.colors ?? null,
  color_identity: (card) => card.details?.color_identity ?? null,
  rarity: (card) => card.details?.rarity ?? card.rarity ?? null,
  scryfall_uri: (card) => card.details?.scryfall_uri ?? null,
  oracle_text: (card) => card.details?.oracle_text ?? null,
  tags: (card) => card.tags ?? [],
  status: (card) => card.status ?? null,
  set: (card) => card.details?.set ?? null,
  image_small: (card) => card.details?.image_small ?? null,
};

const DEFAULT_CARD_FIELDS: CardField[] = [
  "name",
  "type",
  "cmc",
  "colors",
  "color_identity",
  "rarity",
  "scryfall_uri",
];

const stripCard = (
  card: any,
  fields: CardField[]
): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  for (const field of fields) {
    const value = CARD_FIELD_SOURCES[field]?.(card);
    if (value !== undefined && value !== null) row[field] = value;
  }
  return row;
};

server.registerTool(
  "get_cube_board",
  {
    description:
      "Fetch a board (mainboard/maybeboard/basics) from a cube as compact stripped card rows. Use instead of get_cube_json for per-card work to keep payloads small. Default fields: name, type, cmc, colors, color_identity, rarity, scryfall_uri. Add 'oracle_text' for rules text.",
    inputSchema: z.object({
      shortId: z.string().optional(),
      board: z.enum(CARD_BOARDS).optional(),
      fields: z.array(z.enum(CARD_FIELDS)).optional(),
      limit: z.number().optional(),
    }),
  },
  async ({ shortId, board, fields, limit }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      const resolvedBoard: CardBoard = board ?? "mainboard";
      const resolvedFields: CardField[] = fields ?? DEFAULT_CARD_FIELDS;
      const data = await fetchJson<{
        name?: string;
        cardCount?: number;
        cards?: Record<string, unknown[]>;
      }>(`/cube/api/cubeJSON/${encodeURIComponent(resolvedShortId)}`);
      const cards = data?.cards?.[resolvedBoard] ?? [];
      const stripped = cards.map((card) => stripCard(card, resolvedFields));
      const limited =
        limit && limit > 0 ? stripped.slice(0, limit) : stripped;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                cube: {
                  shortId: resolvedShortId,
                  name: data?.name ?? null,
                  cardCount: data?.cardCount ?? null,
                },
                board: resolvedBoard,
                count: limited.length,
                cards: limited,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube board: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "get_cube_metadata",
  {
    description: "Fetch cube metadata (no cards)",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      // CubeCobra POST /cubemetadata can reject cross-origin without CSRF; fall back to cubeJSON
      const data = await fetchJson<Record<string, unknown>>(
        `/cube/api/cubeJSON/${encodeURIComponent(resolvedShortId)}`
      );
      const { cards, ...metadata } = data ?? {};
      return {
        content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube metadata: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "get_cube_plaintext",
  {
    description: "Fetch board-labeled plaintext export",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      const text = await fetchText(
        `/cube/download/plaintext/${encodeURIComponent(resolvedShortId)}`
      );
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch cube plaintext: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "analyze_cube_structure",
  {
    description:
      "Compute cube structure (color, types, CMC curve, tags) from cube JSON using overrides (colors array)",
    inputSchema: z.object({ shortId: z.string().optional() }),
  },
  async ({ shortId }) => {
    try {
      const resolvedShortId = resolveShortId(shortId);
      const data = await fetchJson(
        `/cube/api/cubeJSON/${encodeURIComponent(resolvedShortId)}`
      );
      const stats = analyzeStructureFromCube(data);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                cube: {
                  shortId: resolvedShortId,
                  name: (data as any)?.name ?? null,
                },
                summary: stats,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to analyze cube: ${message}` }],
      };
    }
  }
);

server.registerTool(
  "list_cube_records",
  {
    description:
      "List cube records (requires CubeCobra session cookie + CSRF for private/owner data)",
    inputSchema: z.object({
      cubeId: z.string().optional(),
      lastKey: z.string().optional(),
    }),
  },
  async ({ cubeId, lastKey }) => {
    if (!CUBECOBRA_COOKIE) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "CUBECOBRA_COOKIE is not set; please provide your session cookie to list records.",
          },
        ],
      };
    }
    try {
      const resolvedCubeId = resolveCubeId(cubeId);
      const data = await fetchJson<{ records: unknown; lastKey?: unknown }>(
        `/cube/records/list/${encodeURIComponent(resolvedCubeId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lastKey }),
        }
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to list records: ${message}` }],
      };
    }
  }
);

const extractPreloadedState = (html: string): unknown | null => {
  const marker = "window.__PRELOADED_STATE__";
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const slice = html.slice(start);
  const eqIndex = slice.indexOf("=");
  if (eqIndex === -1) return null;

  const afterEq = slice.slice(eqIndex + 1);
  const endScript = afterEq.indexOf("</script>");
  if (endScript === -1) return null;

  let payload = afterEq.slice(0, endScript).trim();
  if (payload.endsWith(";")) {
    payload = payload.slice(0, -1).trim();
  }

  // Handle JSON.parse("...") wrapping if present
  if (payload.startsWith("JSON.parse(")) {
    const inner = payload.slice("JSON.parse(".length).replace(/\)\s*$/, "");
    try {
      const decoded = JSON.parse(inner);
      return typeof decoded === "string" ? JSON.parse(decoded) : decoded;
    } catch {
      // fall through to normal parse
    }
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

type ReactPropsParseResult =
  | { parsed: unknown; payload: string; error?: undefined }
  | { parsed?: undefined; payload: string; error: string };

const extractReactProps = (html: string): ReactPropsParseResult | null => {
  // Grab everything after window.reactProps = up to </script>
  const match = html.match(/window\.reactProps\s*=\s*([\s\S]*?)<\/script>/);
  if (!match?.[1]) return null;
  let payload = match[1].trim();
  if (payload.endsWith(";")) payload = payload.slice(0, -1).trim();
  try {
    const sanitized = payload.replace(/\bundefined\b/g, "null");
    return { parsed: JSON.parse(sanitized), payload: sanitized };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown parse error",
      payload,
    };
  }
};

const flattenCardNames = (
  slots: unknown,
  cards: Array<{ details?: { name?: string } }> = []
): string[] => {
  const names: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
    } else if (typeof node === "number") {
      const card = cards[node];
      if (card?.details?.name) names.push(card.details.name);
    }
  };
  walk(slots);
  return names;
};

const flattenCardDetails = (
  slots: unknown,
  cards: Array<{ details?: Record<string, unknown> }> = []
): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
    } else if (typeof node === "number") {
      const card = cards[node];
      if (card?.details) result.push(card.details);
    }
  };
  walk(slots);
  return result;
};

const buildRecordData = (payload: any): Record<string, unknown> => {
  const record = payload?.record;
  const draft = payload?.draft;
  const cube = payload?.cube;
  const cards = Array.isArray(draft?.cards) ? draft.cards : [];
  const seats = Array.isArray(draft?.seats)
    ? draft.seats.map((seat: any) => ({
        name: seat?.title ?? seat?.name ?? null,
        mainboard: flattenCardNames(seat?.mainboard, cards),
        sideboard: flattenCardNames(seat?.sideboard, cards),
        mainboardDetails: flattenCardDetails(seat?.mainboard, cards),
        sideboardDetails: flattenCardDetails(seat?.sideboard, cards),
      }))
    : [];

  return {
    cube: cube
      ? {
          id: cube.id,
          shortId: cube.shortId,
          name: cube.name,
          owner: cube.owner?.username,
        }
      : null,
    record: record
      ? {
          id: record.id,
          name: record.name,
          description: record.description,
          date: record.date,
          players: record.players,
          trophy: record.trophy,
          matches: record.matches,
        }
      : null,
    draft: draft
      ? {
          id: draft.id,
          name: draft.name,
          seats,
          basics: draft.basics,
        }
      : null,
  };
};

type CardAgg = {
  name: string;
  games: number;
  wins: number;
  timesInMain: number;
};

const aggregateCardStats = (records: any[]): CardAgg[] => {
  const byName: Record<string, CardAgg> = {};

  for (const rec of records) {
    const draft = rec?.draft;
    const record = rec?.record;
    if (!draft || !record) continue;
    const cards = Array.isArray(draft.cards) ? draft.cards : [];
    const seats = Array.isArray(draft.seats) ? draft.seats : [];

    // Compute games per match
    const matchResults = Array.isArray(record.matches) ? record.matches : [];
    let gamesBySeat: Record<string, { games: number; wins: number }> = {};
    for (const round of matchResults) {
      for (const m of round.matches ?? []) {
        const p1 = m.p1;
        const p2 = m.p2;
        const res: number[] = Array.isArray(m.results) ? m.results : [];
        const g1 = res[0] ?? 0;
        const g2 = res[1] ?? 0;
        const g3 = res[2] ?? 0;
        const total = g1 + g2 + g3;
        if (!gamesBySeat[p1]) gamesBySeat[p1] = { games: 0, wins: 0 };
        if (!gamesBySeat[p2]) gamesBySeat[p2] = { games: 0, wins: 0 };
        gamesBySeat[p1].games += total;
        gamesBySeat[p2].games += total;
        gamesBySeat[p1].wins += g1;
        gamesBySeat[p2].wins += g2;
      }
    }

    // Attribute games/wins to cards in each seat mainboard
    seats.forEach((seat: any) => {
      const seatName = seat?.title ?? seat?.name;
      const gameStats = seatName ? gamesBySeat[seatName] : undefined;
      const mainboardSlots = seat?.mainboard;
      const names = flattenCardNames(mainboardSlots, cards);
      for (const n of names) {
        if (!byName[n]) {
          byName[n] = { name: n, games: 0, wins: 0, timesInMain: 0 };
        }
        byName[n].timesInMain += 1;
        if (gameStats) {
          byName[n].games += gameStats.games;
          byName[n].wins += gameStats.wins;
        }
      }
    });
  }

  return Object.values(byName).sort(
    (a, b) => b.games - a.games || a.name.localeCompare(b.name)
  );
};

const parseDate = (value?: string): number | null => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
};

server.registerTool(
  "compute_card_stats_for_cube",
  {
    description:
      "Aggregate per-card games/wins and maindeck counts from cube records (requires auth for private cubes)",
    inputSchema: z.object({
      cubeId: z.string().optional(),
      minGames: z.number().optional(),
      since: z.string().optional(), // ISO date
    }),
  },
  async ({ cubeId, minGames, since }) => {
    if (!CUBECOBRA_COOKIE) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "CUBECOBRA_COOKIE is not set; please provide your session cookie to compute stats.",
          },
        ],
      };
    }

    try {
      const resolvedCubeId = resolveCubeId(cubeId);
      const sinceTs = parseDate(since);

      let lastKey: any = undefined;
      const records: any[] = [];
      do {
        const page = await fetchJson<{ records?: any[]; lastKey?: any }>(
          `/cube/records/list/${encodeURIComponent(resolvedCubeId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lastKey }),
          }
        );
        const items = page.records ?? [];
        for (const rec of items) {
          if (sinceTs && rec.date && rec.date < sinceTs) continue;
          // Fetch full record payload
          const html = await fetchText(
            `/cube/record/${encodeURIComponent(rec.id)}`
          );
          const payload =
            extractPreloadedState(html) ??
            (extractReactProps(html) as any)?.parsed ??
            null;
          if (payload) {
            records.push(buildRecordData(payload));
          }
        }
        lastKey = page.lastKey;
      } while (lastKey);

      let stats = aggregateCardStats(records);
      if (minGames && minGames > 0) {
        stats = stats.filter((s) => s.games >= minGames);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { cubeId: resolvedCubeId, cards: stats },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to compute card stats: ${message}` },
        ],
      };
    }
  }
);
server.registerTool(
  "get_record_page",
  {
    description:
      "Fetch record page and return parsed preloaded state (may need cookie for private cubes)",
    inputSchema: z.object({ recordId: z.string() }),
  },
  async ({ recordId }) => {
    try {
      const html = await fetchText(
        `/cube/record/${encodeURIComponent(resolveRecordId(recordId))}`
      );
      const preloadedMarker = "window.__PRELOADED_STATE__";
      const idxPre = html.indexOf(preloadedMarker);
      const snippetPre =
        idxPre !== -1
          ? html.slice(idxPre, Math.min(html.length, idxPre + 4000))
          : null;

      const reactPropsMarker = "window.reactProps";
      const idxReact = html.indexOf(reactPropsMarker);
      const snippetReact =
        idxReact !== -1
          ? html.slice(idxReact, Math.min(html.length, idxReact + 4000))
          : null;

      const preloadedState = extractPreloadedState(html);
      const reactPropsResult = extractReactProps(html);
      const state =
        preloadedState ??
        (reactPropsResult && "parsed" in reactPropsResult
          ? reactPropsResult.parsed
          : null);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                preloaded: state ?? null,
                preloadedMarkerFound: idxPre !== -1,
                reactPropsMarkerFound: idxReact !== -1,
                snippetPreloaded: snippetPre,
                snippetReactProps: snippetReact,
                reactPropsParseError:
                  reactPropsResult && "error" in reactPropsResult
                    ? reactPropsResult.error
                    : null,
                reactPropsPayloadLength:
                  reactPropsResult?.payload?.length ?? null,
                headSnippet: html.slice(0, Math.min(html.length, 2000)),
                rawLength: html.length,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch record page: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "get_record_data",
  {
    description:
      "Fetch record page and return a trimmed record/draft summary (needs cookie for private cubes)",
    inputSchema: z.object({ recordId: z.string().optional() }),
  },
  async ({ recordId }) => {
    try {
      const html = await fetchText(
        `/cube/record/${encodeURIComponent(resolveRecordId(recordId))}`
      );
      const payload =
        extractPreloadedState(html) ??
        (extractReactProps(html) as any)?.parsed ??
        null;

      const data = payload ? buildRecordData(payload) : null;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                data,
                source: payload ? "parsed" : "missing",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch record data: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "get_record_decks",
  {
    description:
      "Fetch record page and return seats with card details and match info (needs cookie for private cubes)",
    inputSchema: z.object({ recordId: z.string().optional() }),
  },
  async ({ recordId }) => {
    try {
      const html = await fetchText(
        `/cube/record/${encodeURIComponent(resolveRecordId(recordId))}`
      );
      const payload =
        extractPreloadedState(html) ??
        (extractReactProps(html) as any)?.parsed ??
        null;

      if (!payload?.draft || !payload.record) {
        return {
          isError: true,
          content: [{ type: "text", text: "Record data not found." }],
        };
      }

      const draft = payload.draft;
      const record = payload.record;
      const cards = Array.isArray(draft.cards) ? draft.cards : [];
      const seats = Array.isArray(draft.seats)
        ? draft.seats.map((seat: any) => ({
            name: seat?.title ?? seat?.name ?? null,
            mainboard: flattenCardDetails(seat?.mainboard, cards),
            sideboard: flattenCardDetails(seat?.sideboard, cards),
          }))
        : [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record: {
                  id: record.id,
                  name: record.name,
                  description: record.description,
                  date: record.date,
                  players: record.players,
                  matches: record.matches,
                  trophy: record.trophy,
                },
                draft: {
                  id: draft.id,
                  name: draft.name,
                  seats,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [
          { type: "text", text: `Failed to fetch record decks: ${message}` },
        ],
      };
    }
  }
);

server.registerTool(
  "search_cubes",
  {
    description: "Search CubeCobra for cubes (public)",
    inputSchema: z.object({
      query: z.string(),
      order: z.enum(["pop", "alpha", "cards", "date"]).optional(),
      ascending: z.boolean().optional(),
      lastKey: z.string().optional(),
    }),
  },
  async ({ query, order, ascending, lastKey }) => {
    try {
      const data = await fetchJson<{
        success?: string;
        cubes?: unknown[];
        lastKey?: unknown;
        error?: string;
      }>("/search/getmoresearchitems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          order: order ?? "pop",
          ascending: ascending ? "true" : "false",
          lastKey: lastKey ?? null,
        }),
      });
      if (data?.error) {
        return {
          isError: true,
          content: [
            { type: "text", text: `CubeCobra search error: ${data.error}` },
          ],
        };
      }
      const cubes = Array.isArray(data?.cubes) ? data.cubes : [];
      const results = cubes.map((c: any) => ({
        id: c.id,
        shortId: c.shortId,
        name: c.name,
        owner: c.owner?.username,
        cardCount: c.cardCount,
        categoryOverride: c.categoryOverride ?? undefined,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { results, lastKey: data?.lastKey ?? null },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to search cubes: ${message}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();

await server.connect(transport);

console.error("CubeCobra MCP server running over stdio");
