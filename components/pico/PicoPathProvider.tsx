"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { buildPicoPath } from "@/lib/pico/routing";

const PicoPathContext = createContext<string>("/pico");

export function PicoPathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  return <PicoPathContext.Provider value={basePath}>{children}</PicoPathContext.Provider>;
}

export function usePicoBasePath() {
  return useContext(PicoPathContext);
}

export function usePicoPath(path = "/") {
  const basePath = usePicoBasePath();
  return buildPicoPath(basePath, path);
}
