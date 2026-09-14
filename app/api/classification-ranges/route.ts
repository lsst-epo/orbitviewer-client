import { getClassificationRanges } from "@/lib/api/hasura";

export async function GET() {
  try {
    return Response.json(await getClassificationRanges());
  } catch {
    return Response.json(
      { error: "Classification ranges are unavailable" },
      { status: 502 },
    );
  }
}
