import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { languages } from "@/lib/i18n/settings";
export async function GET(request: NextRequest) {
  const secret = process.env.CRAFT_REVALIDATE_SECRET_TOKEN;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret)
    return NextResponse.json(
      { revalidated: false, message: "Invalid token" },
      { status: 401 },
    );
  const uri = request.nextUrl.searchParams.get("uri");
  if (!uri || uri.includes("..") || /[?#\\]/.test(uri))
    return NextResponse.json(
      { revalidated: false, message: "Invalid path" },
      { status: 400 },
    );
  const path = uri === "__home__" ? "" : uri.replace(/^\/+/, "");
  revalidateTag("craft", { expire: 0 });
  for (const locale of languages) {
    revalidatePath(`/${locale}/${path}`);
    revalidatePath(`/${locale}/guided-experiences`, "layout");
    revalidatePath(`/${locale}/explorer`);
  }
  revalidatePath(`/${path}`);
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
