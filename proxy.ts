import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

/**
 * Renamed from `middleware.ts`: Next.js 16 deprecates the middleware file
 * convention in favour of `proxy.ts`. Behaviour is unchanged -- next-intl
 * resolves the active locale, sets the locale cookie, and (because
 * localePrefix is "as-needed") redirects prefixed default-locale paths such
 * as /en/about down to /about.
 */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, and anything with a file extension.
  matcher: "/((?!api|static|.*\\..*|_next).*)",
};
