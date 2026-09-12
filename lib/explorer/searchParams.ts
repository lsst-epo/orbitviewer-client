import { z } from "zod";

/**
 * The /explorer search-param vocabulary.
 *
 * This replaces the legacy `generateShareableURL()` scheme, which used terse
 * keys with ad-hoc encodings: d, ts, cp, cq, db, ntypes, dr and id. Those are
 * intentionally NOT accepted -- old share links still resolve to /explorer,
 * they just open at defaults.
 *
 * Legacy -> current:
 *   d       -> date        (ISO 8601, colons intact)
 *   ts      -> timeScale   (hours per second)
 *   cp      -> camera      (x,y,z,qx,qy,qz,qw -- was two params, underscore-joined)
 *   cq      -> camera
 *   db      -> discovery   ("all" | "rubin" | "other"; was an integer enum)
 *   ntypes  -> types       (comma-joined INCLUDED categories; was '+'-joined EXCLUDED)
 *   dr      -> distance    ("min,max" AU; was "min-max", ambiguous for negatives)
 *   id      -> object
 */

const csv = (value: string) => value.split(",").map((part) => part.trim());

const numberTuple = (length: number) =>
  z
    .string()
    .transform(csv)
    .refine(
      (parts) =>
        parts.length === length &&
        parts.every((p) => p !== "" && !Number.isNaN(Number(p))),
      { message: `expected ${length} comma-separated numbers` }
    )
    .transform((parts) => parts.map(Number));

export const ExplorerParamsSchema = z.object({
  /**
   * Identifier of the object whose detail panel is open.
   *
   * Case is preserved deliberately. MPC packed designations encode the cycle
   * count in base 62, where "A" is 10 but "a" is 36, so lowercasing changes
   * the identifier -- roughly 5% of the catalogue carries a lowercase letter.
   */
  object: z.string().min(1).optional(),
  /** Whether the objects list panel is open. */
  panel: z.enum(["objects", "filters", "search"]).optional(),
  /**
   * How the camera frames the selected object: on the body, or pulled back to
   * take in its whole orbit. Ported from the legacy's ORBIT/OBJECT toggle,
   * without which a selected path is drawn but never in shot.
   */
  view: z.enum(["object", "orbit"]).optional(),
  /** Simulated date. Absent means "live". */
  date: z.iso.datetime({ offset: true }).optional(),
  /** Simulation rate, in hours per real-time second. */
  timeScale: z.coerce.number().finite().optional(),
  /** Camera position + orientation: x,y,z,qx,qy,qz,qw */
  camera: numberTuple(7).optional(),
  /** Discovery-source filter. */
  discovery: z.enum(["all", "rubin", "other"]).default("all"),
  /** Included object-type category slugs. Absent means all. */
  types: z.string().transform(csv).optional(),
  /** Semi-major axis range in AU: min,max */
  distance: numberTuple(2).optional(),
});

export type ExplorerParams = z.infer<typeof ExplorerParamsSchema>;

/** Panels that can occupy the explorer's side rail. */
export type ExplorerPanel = NonNullable<ExplorerParams["panel"]>;

/**
 * Parses loosely: an unparseable param falls back to its default rather than
 * erroring the page, so a mangled share link still renders the scene.
 */
export function parseExplorerParams(
  searchParams: Record<string, string | Array<string> | undefined>
): ExplorerParams {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );

  const result = ExplorerParamsSchema.safeParse(flat);

  if (result.success) return result.data;

  // Retry field by field, dropping only what failed.
  const salvaged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined) continue;
    const shape = ExplorerParamsSchema.shape[key as keyof ExplorerParams];
    if (!shape) continue;
    const field = shape.safeParse(value);
    if (field.success) salvaged[key] = value;
  }

  return ExplorerParamsSchema.parse(salvaged);
}

/**
 * The query keys the explorer owns.
 *
 * It is not the only thing writing the query string -- a tour keeps its slide
 * there too -- so the URL sync replaces these and leaves everything else
 * alone. Derived from the schema, so a new param cannot be forgotten here.
 */
export const EXPLORER_PARAM_KEYS = Object.keys(
  ExplorerParamsSchema.shape
) as Array<keyof ExplorerParams>;

/**
 * Serialises state back to a query string. Defaults are omitted so a pristine
 * viewer produces a bare /explorer URL.
 */
export function serializeExplorerParams(
  params: Partial<ExplorerParams>
): string {
  const search = new URLSearchParams();

  if (params.object) search.set("object", params.object);
  if (params.panel) search.set("panel", params.panel);
  if (params.view) search.set("view", params.view);
  if (params.date) search.set("date", params.date);
  if (params.timeScale !== undefined)
    search.set("timeScale", String(params.timeScale));
  if (params.camera?.length === 7)
    search.set("camera", params.camera.join(","));
  if (params.discovery && params.discovery !== "all")
    search.set("discovery", params.discovery);
  if (params.types?.length) search.set("types", params.types.join(","));
  if (params.distance?.length === 2)
    search.set("distance", params.distance.join(","));

  return search.toString();
}

/**
 * Merges explorer state into an existing query string.
 *
 * Only the keys in `EXPLORER_PARAM_KEYS` are touched; anything else in the
 * URL is preserved. Without this the explorer's URL sync rebuilt the whole
 * query string from its own state and silently dropped a tour's `slide`.
 */
export function mergeExplorerParams(
  search: string,
  params: Partial<ExplorerParams>
): string {
  const merged = new URLSearchParams(search);

  for (const key of EXPLORER_PARAM_KEYS) merged.delete(key);

  for (const [key, value] of new URLSearchParams(
    serializeExplorerParams(params)
  )) {
    merged.set(key, value);
  }

  return merged.toString();
}
