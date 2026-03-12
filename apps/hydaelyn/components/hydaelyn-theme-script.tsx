"use client";

import { useEffect } from "react";

/**
 * Sets data-theme="hydaelyn" on the document root so CSS variables
 * are scoped to the Hydaelyn palette. Run once on mount.
 */
export function HydaelynThemeScript() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "hydaelyn");
  }, []);
  return null;
}
