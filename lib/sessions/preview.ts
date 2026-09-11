"server-only";

import { cookies, draftMode } from "next/headers";

const PREVIEW_TOKEN_COOKIE = "ov-preview-token";

/**
 * Craft preview tokens are handed to us on the /api/preview round trip and
 * then replayed on every subsequent GraphQL request for the duration of the
 * draft-mode session.
 *
 * Every method is async: `cookies()` and `draftMode()` both return Promises
 * as of Next.js 15, so there is no synchronous way to read the token.
 */
const previewSession = () => ({
  async start({ previewToken }: { previewToken?: string }) {
    const draft = await draftMode();
    draft.enable();

    if (previewToken) {
      const store = await cookies();
      store.set(PREVIEW_TOKEN_COOKIE, previewToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  },

  async end() {
    const draft = await draftMode();
    draft.disable();

    const store = await cookies();
    store.delete(PREVIEW_TOKEN_COOKIE);
  },

  /**
   * Resolves to undefined outside a request scope -- notably during static
   * generation, where reading cookies would otherwise opt the route into
   * dynamic rendering.
   */
  async token(): Promise<string | undefined> {
    try {
      const draft = await draftMode();
      if (!draft.isEnabled) return undefined;

      const store = await cookies();
      return store.get(PREVIEW_TOKEN_COOKIE)?.value;
    } catch {
      return undefined;
    }
  },
});

export default previewSession;
