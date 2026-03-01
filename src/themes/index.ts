import type { ComponentType } from "react";
import type { Mechanic, ThemeLayoutProps } from "@/types";
import {
  SymbolLayout,
  TripleLayout,
  CompareLayout,
  BingoLayout,
} from "./wealth-god";

type ThemeLayoutMap = Record<Mechanic, ComponentType<ThemeLayoutProps>>;

const themeRegistry: Record<string, ThemeLayoutMap> = {
  "wealth-god": {
    symbol: SymbolLayout,
    triple: TripleLayout,
    compare: CompareLayout,
    bingo: BingoLayout,
  },
};

export function getThemeLayout(
  themeId: string,
  mechanic: Mechanic,
): ComponentType<ThemeLayoutProps> {
  const theme = themeRegistry[themeId];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeId}`);
  }
  return theme[mechanic];
}
