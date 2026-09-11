import { fromMpcRow } from "@/lib/solar/elements";
import type { OrbitElements } from "@/lib/solar/types";
import type { SimQuality } from "@/lib/solar/quality";

/**
 * Loads an MPC orbital dataset.
 *
 * These files are fetched by the browser directly from Google Cloud Storage,
 * as the legacy client did. They are far too large to proxy through the
 * Next.js server or to embed in an RSC payload -- the smallest tier is 6 MB
 * and the largest is over 340 MB, served uncompressed. The URLs themselves
 * come from Craft (`getDataFileUrls`), so which file each tier points at
 * stays editorially controlled.
 */

/**
 * A row of the MPC dataset, exactly as served from the GCS files Craft points
 * at. Snake_case throughout because it mirrors the wire format verbatim; it
 * lives here, beside the fetch, rather than in lib/solar so that the domain
 * modules hold only normalised shapes.
 *
 * Field names coincide with the Hasura `mpc_orbits` columns.
 */
export interface MpcOrbitRow {
  node: number;
  a: number;
  e: number;
  i: number;
  q: number;
  mean_motion: number;
  mean_anomaly: number;
  peri_time: number;
  epoch_mjd: number;
  argperi: number;
  object_type: Array<number>;
  rubin_discovery: boolean;
  fulldesignation: string;
  mpcdesignation?: string;
  /** Render-priority hint from the dataset; unused so far. */
  viz_priority?: number;
}

export interface MpcDataset {
  /** Count of Rubin discoveries in the full catalogue, not just this file. */
  rubinDiscoveryCount: number;
  elements: Array<OrbitElements>;
}

interface MpcDataFile {
  rubin_discoveries_count: number;
  mpc_orbits: Array<MpcOrbitRow>;
}

/* The type-only import in lib/solar/elements.ts is erased at compile time,
   so this pairing creates no runtime import cycle. */

export interface LoadOptions {
  signal?: AbortSignal;
  /** Reports 0-1 progress when the response advertises a length. */
  onProgress?: (fraction: number) => void;
}

/**
 * Streams the response so a 6-340 MB download can report progress instead of
 * appearing to hang. Falls back to a plain read when the body is not
 * streamable or no length is advertised.
 */
async function readWithProgress(
  response: Response,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const total = Number(response.headers.get("content-length")) || 0;

  if (!onProgress || !total || !response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Array<Uint8Array> = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(received / total, 1));
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(merged);
}

export async function loadMpcDataset(
  url: string,
  { signal, onProgress }: LoadOptions = {}
): Promise<MpcDataset> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load MPC dataset (${response.status}): ${url}`);
  }

  const text = await readWithProgress(response, onProgress);
  const data = JSON.parse(text) as MpcDataFile;

  return {
    rubinDiscoveryCount: data.rubin_discoveries_count ?? 0,
    elements: (data.mpc_orbits ?? []).map(fromMpcRow),
  };
}

/** Picks the dataset URL for a tier, falling back to the lowest available. */
export function datasetUrlFor(
  urls: Record<string, string>,
  quality: SimQuality
): string | undefined {
  return urls[quality] ?? urls.low ?? Object.values(urls)[0];
}
