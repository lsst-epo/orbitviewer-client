import { fromMpcRow } from "@/lib/solar/elements";
import type { OrbitElements } from "@/lib/solar/types";
import type { SimQuality } from "@/lib/solar/quality";

/**
 * A row of the MPC dataset, exactly as served. Snake_case because it mirrors
 * the wire format verbatim -- see README.
 */
export interface MpcOrbitRow {
  node: number;
  a: number | null;
  e: number;
  i: number;
  q: number;
  /**
   * Null on the name-only stubs, and also on every unbound orbit, where a
   * mean motion does not exist -- see README.
   */
  mean_motion: number | null;
  mean_anomaly: number | null;
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

/** A row carrying orbital elements, as opposed to a name-only stub. */
export type OrbitalMpcRow = MpcOrbitRow & { a: number };

/**
 * Whether a row carries an orbit at all. Around 14% of the dataset is
 * name-only comet stubs with every element null -- see README.
 *
 * Deliberately narrower than the legacy's test, which also required
 * `mean_anomaly` and `mean_motion`: neither exists on an unbound orbit, and
 * this port can draw those where the legacy could not.
 */
export const hasOrbitElements = (row: MpcOrbitRow): row is OrbitalMpcRow =>
  row.a !== null;

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

/** Streams the response so a 6-340 MB download can report progress. */
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
    elements: (data.mpc_orbits ?? []).filter(hasOrbitElements).map(fromMpcRow),
  };
}

/** Picks the dataset URL for a tier, falling back to the lowest available. */
export function datasetUrlFor(
  urls: Record<string, string>,
  quality: SimQuality
): string | undefined {
  return urls[quality] ?? urls.low ?? Object.values(urls)[0];
}

/** Bytes of the dataset head to read for the discovery count -- see README. */
const COUNT_PROBE_BYTES = 256;

/** Matches the count wherever it sits in the probed head. */
const COUNT_PATTERN = /"rubin_discoveries_count"\s*:\s*(\d+)/;

/**
 * Reads the Rubin discovery total out of the head of a dataset file, as a
 * range request. An editorial number, not a row count -- see README.
 */
export async function fetchRubinDiscoveryCount(
  url: string,
  { revalidate = 3600 }: { revalidate?: number } = {}
): Promise<number | null> {
  try {
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${COUNT_PROBE_BYTES - 1}` },
      next: { revalidate },
    });

    if (response.status !== 206) {
      console.error(
        `Discovery count: expected a partial response, got ${response.status}`
      );
      return null;
    }

    return Number(COUNT_PATTERN.exec(await response.text())?.[1]) || null;
  } catch (cause) {
    console.error("Failed to read the Rubin discovery count", cause);
    return null;
  }
}
