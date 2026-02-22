import type {
  Prize,
  ScratchCard,
  ScratchZone,
  ScratchCell,
  GameConfig,
} from "@/types";

// 生成 4 碼大寫英文 session code
export function generateSessionCode(): string {
  return Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join("");
}

// 將相對權重正規化為總和等於 1 的機率，回傳新陣列（不可變）
export function normalizeProbabilities(prizes: Prize[]): Prize[] {
  const total = prizes.reduce((sum, p) => sum + p.probability, 0);
  if (total === 0) return prizes.map((p) => ({ ...p, probability: 0 }));
  return prizes.map((p) => ({ ...p, probability: p.probability / total }));
}

// 依機率從獎項池抽出一個獎項（加權隨機）
export function drawPrize(prizes: Prize[]): Prize {
  const roll = Math.random();
  let cursor = 0;
  for (const prize of prizes) {
    cursor += prize.probability;
    if (roll < cursor) return prize;
  }
  // 浮點誤差保底：回傳最後一個
  return prizes[prizes.length - 1]!;
}

// 建立單一刮除格
function buildCell(
  cellIndex: number,
  cardId: string,
  prizes: Prize[],
): ScratchCell {
  return {
    id: `${cardId}-cell-${cellIndex}`,
    prize: drawPrize(prizes),
    scratchProgress: 0,
    isRevealed: false,
  };
}

// 建立單一刮除區
function buildZone(
  cardId: string,
  cellCount: number,
  prizes: Prize[],
): ScratchZone {
  return {
    id: `${cardId}-zone`,
    shapeVariant: "single",
    cells: Array.from({ length: cellCount }, (_, i) =>
      buildCell(i, cardId, prizes),
    ),
  };
}

// 建立一張刮刮樂卡（在建卡時依機率分配獎項）
export function buildCard(
  config: GameConfig,
  cardId: string,
  serialNumber: string,
): ScratchCard {
  const normalized = normalizeProbabilities(config.prizes);
  return {
    id: cardId,
    serialNumber,
    zone: buildZone(cardId, config.cellsPerZone, normalized),
    status: "in-pile",
    totalWinnings: 0,
  };
}

// 建立整副牌堆
export function buildDeck(config: GameConfig): ScratchCard[] {
  const sessionCode = generateSessionCode();
  return Array.from({ length: config.cardCount }, (_, i) =>
    buildCard(
      config,
      `card-${i}`,
      `${sessionCode}-${String(i + 1).padStart(2, "0")}`,
    ),
  );
}
