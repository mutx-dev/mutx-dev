"use client";

import { createContext, useContext } from "react";
import { DocNavItem } from "@/lib/docs";

export const DocsNavContext = createContext<{
  nav: DocNavItem[];
}>({ nav: [] });

export function useDocsNav() {
  return useContext(DocsNavContext);
}
