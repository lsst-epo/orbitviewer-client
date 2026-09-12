"use client";

import { useEffect, useState } from "react";

/**
 * False during server rendering and the first client render, true after.
 *
 * Anything computed from the simulation clock has no correct server value:
 * the clock seeds itself from `new Date()`, so the server and the client are
 * describing different instants and React reports a hydration mismatch on
 * every figure derived from it. Gating those on this is the fix, not a
 * workaround -- a live readout genuinely cannot be prerendered.
 *
 * Use it only for genuinely time-dependent output. Static content should
 * still render on the server so it reaches crawlers and shows up before
 * hydration.
 */
export default function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted;
}
