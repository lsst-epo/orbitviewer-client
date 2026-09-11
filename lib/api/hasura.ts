import "server-only";
import planets from "@/lib/data/planet_elems.json";
import dwarfs from "@/lib/data/dwarf_planet_elems.json";

export interface OrbitRecord {
  id?: string;
  fulldesignation: string;
  mpcdesignation?: string;
  a: number;
  e: number;
  q: number;
  i: number;
  node: number;
  argperi: number;
  mean_anomaly: number;
  mean_motion?: number;
  epoch_mjd: number;
  peri_time?: number;
  object_type?: number[];
  rubin_discovery?: boolean;
}

export async function getPlanetOrbits(): Promise<OrbitRecord[]> {
  // TODO Hasura: query planet_orbits after the table mirrors mpc_orbits.
  return [...planets, ...dwarfs].map((record) => ({
    id: record.id,
    fulldesignation: record.fulldesignation,
    a: record.a,
    e: record.e,
    q: record.q,
    i: record.incl,
    node: record.node,
    argperi: record.peri,
    mean_anomaly: record.M,
    mean_motion: record.n,
    epoch_mjd: record.epoch,
    peri_time: record.tperi - 2400000.5,
    object_type: [7],
    rubin_discovery: false,
  }));
}

export async function searchOrbits(term: string): Promise<OrbitRecord[]> {
  // Variables prevent search text from changing the GraphQL operation.
  // Derive mean motion from a when absent; the legacy query incorrectly aliases mean anomaly.
  const query = `query SearchOrbits($pattern: String!) {
    mpc_orbits(where: {_or: [
      {packed_primary_provisional_designation: {_ilike: $pattern}},
      {unpacked_primary_provisional_designation: {_ilike: $pattern}}
    ]}, limit: 100) {
      a: a_rubin mean_anomaly: mean_anomaly_rubin node i e q
      rubin_discovery object_type epoch_mjd peri_time argperi
      mpcdesignation: packed_primary_provisional_designation
      fulldesignation: unpacked_primary_provisional_designation
    }
  }`;
  const response = await fetch(process.env.HASURA_GRAPHQL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { pattern: `%${term.replace(/[\\%_]/g, "\\$&")}%` },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  const result = (await response.json()) as {
    data?: { mpc_orbits: OrbitRecord[] };
    errors?: { message: string }[];
  };
  if (result.errors?.length || !result.data)
    throw new Error("Search service returned an error");
  return result.data.mpc_orbits;
}

export async function getClassificationRanges() {
  const response = await fetch(
    `${process.env.HASURA_URL}/classification_ranges`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15000) },
  );
  if (!response.ok)
    throw new Error(`Classification ranges failed (${response.status})`);
  return response.json();
}
