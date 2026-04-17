export interface StackOffset {
  offsetY: number; // px, ±6
  rotation: number; // deg, ±2.5
}

/** Simple deterministic hash from string → 0..1 */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Returns a deterministic { offsetY, rotation } for a given cardId.
 * Values look hand-scattered — not perfectly aligned.
 */
export function cardStackOffset(cardId: string): StackOffset {
  const h1 = hashStr(cardId + "_y");
  const h2 = hashStr(cardId + "_r");
  return {
    offsetY: h1 * 12 - 6, // range: -6 to +6
    rotation: h2 * 5 - 2.5, // range: -2.5 to +2.5
  };
}
