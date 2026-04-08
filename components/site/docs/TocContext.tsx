'use client';

import { createContext, useContext } from 'react';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export interface TocContextValue {
  headings: TocHeading[];
  setHeadings: (h: TocHeading[]) => void;
}

export const TocContext = createContext<TocContextValue>({
  headings: [],
  setHeadings: () => {},
});

export function useTocContext() {
  return useContext(TocContext);
}
