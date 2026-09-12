"server-only";

import { env } from "@/env";

/**
 * Hasura federated query service. Replaces the ad-hoc fetches in the legacy
 * `src/js/core/data/QueryManager.ts`.
 *
 * Two deliberate changes from the legacy implementation:
 *
 * 1. These run on the server. The legacy client shipped HASURA_SECRET_KEY to
 *    the browser via an esbuild `define` and sent it as an X-Hasura-Admin-Secret
 *    header from page JS. The proxy no longer requires that header, and keeping
 *    these calls server-side means neither the endpoint nor any credential is
 *    exposed in the client bundle.
 * 2. `getA()` and `fetchSolarElements()` are not ported. Both were unreachable
 *    (no callers), and their endpoints -- /api/rest/a-v2 and
 *    /api/rest/orbit-viewer/fetch/:id -- now return 404 on the proxy.
 */

/** Object type codes as stored in Craft's objectTypes category group. */
export type ObjectTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OrbitElements {
  a: number;
  mean_anomaly: number;
  mean_motion: number;
  node: number;
  i: number;
  e: number;
  q: number;
  rubin_discovery: boolean;
  object_type: string;
  epoch_mjd: number;
  peri_time: number;
  argperi: number;
  mpcdesignation: string;
  fulldesignation: string;
}

interface HasuraResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function hasuraQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  fetchOptions: RequestInit = {}
): Promise<T | undefined> {
  const response = await fetch(env.HASURA_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    ...fetchOptions,
  });

  if (!response.ok) {
    console.error(`Hasura query failed: ${response.status}`);
    return undefined;
  }

  const result = (await response.json()) as HasuraResponse<T>;

  if (result.errors?.length) {
    result.errors.forEach(({ message }) => console.error(message));
    return undefined;
  }

  return result.data;
}

export interface SearchFilters {
  /** Object type codes to include. 0 is always included (unclassified). */
  types?: Array<ObjectTypeCode>;
  /** undefined = no filter, true = Rubin discoveries only, false = exclude. */
  rubinDiscovery?: boolean;
  limit?: number;
}

/**
 * Free-text search across packed and unpacked MPC designations.
 * Replaces the legacy async web worker in `src/assets/js/search.js`.
 */
export async function searchSolarElements(
  q: string,
  { types = [], rubinDiscovery, limit = 100 }: SearchFilters = {}
): Promise<Array<OrbitElements>> {
  const query = `
    query SearchOrbits(
      $q: String!
      $types: [Int!]
      $rubinDiscovery: Boolean
      $limit: Int!
    ) {
      mpc_orbits(
        where: {
          _or: [
            { packed_primary_provisional_designation: { _ilike: $q } }
            { unpacked_primary_provisional_designation: { _ilike: $q } }
          ]
          object_type_int: { _in: $types }
          ${rubinDiscovery === undefined ? "" : "rubin_discovery: { _eq: $rubinDiscovery }"}
        }
        limit: $limit
      ) {
        a: a_rubin
        mean_anomaly: mean_anomaly_rubin
        mean_motion: mean_anomaly_rubin
        node
        i
        e
        q
        rubin_discovery
        object_type
        epoch_mjd
        peri_time
        argperi
        mpcdesignation: packed_primary_provisional_designation
        fulldesignation: unpacked_primary_provisional_designation
      }
    }
  `;

  const data = await hasuraQuery<{ mpc_orbits: Array<OrbitElements> }>(
    query,
    {
      q: `%${q}%`,
      types: [0, ...types],
      rubinDiscovery,
      limit,
    },
    { cache: "no-store" }
  );

  return data?.mpc_orbits ?? [];
}

export interface ClassificationRange {
  cr_id: number;
  object_type: Array<number>;
  observed_object_type: string;
  observed_property: string;
  observed_range_type: string;
  observed_value: number;
  provid: string;
  mpc_orbits_id: number;
  date_last_updated: string;
}

/**
 * Per-category min/max bounds used to seed the filter sliders.
 * This is the one legacy REST endpoint still live on the proxy.
 */
export async function getClassificationRanges(): Promise<
  Array<ClassificationRange>
> {
  const response = await fetch(`${env.HASURA_URL}/classification_ranges`, {
    // Ranges shift as new observations land; revalidate hourly.
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    console.error(`Classification ranges failed: ${response.status}`);
    return [];
  }

  const json = (await response.json()) as {
    classification_ranges?: Array<ClassificationRange>;
  };

  return json.classification_ranges ?? [];
}

/**
 * How many catalogue objects Rubin discovered.
 *
 * Shown on the splash, where the legacy hardcoded `745,259` into the markup
 * and never replaced it -- a placeholder that shipped. An aggregate keeps it
 * a single number over the wire rather than the 6 MB dataset the count would
 * otherwise have to be derived from.
 */
export async function getRubinDiscoveryCount(): Promise<number | null> {
  const query = `
    query RubinDiscoveryCount {
      mpc_orbits_aggregate(where: { rubin_discovery: { _eq: true } }) {
        aggregate {
          count
        }
      }
    }
  `;

  try {
    const response = await fetch(env.HASURA_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      // New discoveries land continuously, but not by the minute.
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(`Rubin discovery count failed: ${response.status}`);
      return null;
    }

    const json = (await response.json()) as {
      data?: { mpc_orbits_aggregate?: { aggregate?: { count?: number } } };
    };

    return json.data?.mpc_orbits_aggregate?.aggregate?.count ?? null;
  } catch (cause) {
    // The splash must render regardless; the figure is a flourish.
    console.error("Rubin discovery count failed", cause);
    return null;
  }
}
