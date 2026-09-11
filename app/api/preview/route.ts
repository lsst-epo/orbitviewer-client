import { NextRequest, NextResponse } from "next/server";
import { cookies, draftMode } from "next/headers";
import { PagePreviewQueryDocument } from "@/gql/graphql";
import { queryCraft } from "@/lib/api/craft";
import { isLocale } from "@/lib/i18n/settings";
export async function GET(request: NextRequest) {
  const secret = process.env.CRAFT_SECRET_TOKEN;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret)
    return new NextResponse("Invalid token", { status: 401 });
  const uri = request.nextUrl.searchParams.get("uri");
  if (!uri) return new NextResponse("URI missing", { status: 422 });
  const site = request.nextUrl.searchParams.get("site")?.toLowerCase() ?? "en";
  const locale = isLocale(site) ? site : "en";
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const data = await queryCraft<{ entry?: { uri: string } }>(
    PagePreviewQueryDocument,
    { site: [locale === "en" ? "default" : locale], uri: [uri] },
    token,
  );
  const target = data.entry?.uri;
  if (
    !target ||
    /[\\?#]/.test(target) ||
    target.startsWith("/") ||
    target.includes("..")
  )
    return new NextResponse("Invalid URI", { status: 422 });
  (await draftMode()).enable();
  if (token)
    (await cookies()).set("previewToken", token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
    });
  return NextResponse.redirect(
    new URL(`/${locale}/${target === "__home__" ? "" : target}`, request.url),
  );
}
