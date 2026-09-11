import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET() {
  const file = await readFile(
    path.join(process.cwd(), "components/models/saturn-rings/assets/ring.glb"),
  );
  return new Response(file, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
