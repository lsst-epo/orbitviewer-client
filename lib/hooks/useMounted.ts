"use client";

import { useEffect, useState } from "react";

/** False during server rendering and the first client render, true after. */
export default function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted;
}
