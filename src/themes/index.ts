import type { Mechanic, ThemeLayoutEntry } from "@/types";
import {
  SymbolLayout,
  TripleLayout,
  CompareLayout,
  BingoLayout,
} from "./wealth-god";

type ThemeLayoutMap = Record<Mechanic, ThemeLayoutEntry>;

const themeRegistry: Record<string, ThemeLayoutMap> = {
  "wealth-god": {
    symbol: { component: SymbolLayout, fullCard: true },
    triple: { component: TripleLayout },
    compare: { component: CompareLayout },
    bingo: { component: BingoLayout },
  },
};

export function getThemeLayout(
  themeId: string,
  mechanic: Mechanic,
): ThemeLayoutEntry {
  const theme = themeRegistry[themeId];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeId}`);
  }
  return theme[mechanic];
}
