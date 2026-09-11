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

/**
 * Bytes of the dataset to read when all that is wanted is the discovery count.
 *
 * `rubin_discoveries_count` is the first key of the object, ahead of the
 * `mpc_orbits` array, so the number is always within the first few dozen
 * bytes. 256 is generous cover for the key moving slightly.
 */
const COUNT_PROBE_BYTES = 256;

/** Matches the count wherever it sits in the probed head. */
const COUNT_PATTERN = /"rubin_discoveries_count"\s*:\s*(\d+)/;

/**
 * Reads the Rubin discovery total out of the head of a dataset file.
 *
 * This is where the legacy gets the figure the splash counts up to:
 * `LoadManager.loadSample` keeps `json.rubin_discoveries_count` and
 * `OrbitViewerPage.transitionIn` animates to it. It is an editorial number
 * published alongside the orbits -- 35,000 today, the same in every tier's
 * file -- and not the row count of anything.
 *
 * Which is why asking Hasura for `count(*) where rubin_discovery` gave a
 * different answer: that counts the flagged rows in the catalogue, a
 * different quantity that nothing in the legacy ever showed.
 *
 * Fetched as a range request so the splash does not pull a file that runs
 * from 6 MB to 343 MB. A server that ignores the range would answer 200 with
 * the whole body, so anything but 206 is abandoned unread.
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
