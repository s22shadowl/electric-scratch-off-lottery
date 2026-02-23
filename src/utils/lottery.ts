import type {
  Prize,
  ScratchCard,
  ScratchZone,
  ScratchCell,
  GameConfig,
  CardTypeConfig,
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

// 建立單一刮除格（zone-aware cell ID）
function buildCell(
  cardId: string,
  zoneIndex: number,
  cellIndex: number,
  prizes: Prize[],
): ScratchCell {
  return {
    id: `${cardId}-zone-${zoneIndex}-cell-${cellIndex}`,
    prize: drawPrize(prizes),
    scratchProgress: 0,
    isRevealed: false,
  };
}

// 建立單一刮除區
function buildZone(
  cardId: string,
  zoneIndex: number,
  cellCount: number,
  prizes: Prize[],
): ScratchZone {
  return {
    id: `${cardId}-zone-${zoneIndex}`,
    shapeVariant: "single",
    cells: Array.from({ length: cellCount }, (_, i) =>
      buildCell(cardId, zoneIndex, i, prizes),
    ),
  };
}

// 建立一張刮刮樂卡（在建卡時依機率分配獎項）
export function buildCard(
  cardTypeConfig: CardTypeConfig,
  cardId: string,
  serialNumber: string,
  cardTypeIndex: number,
): ScratchCard {
  const normalized = normalizeProbabilities(cardTypeConfig.prizes);
  return {
    id: cardId,
    serialNumber,
    cardTypeIndex,
    zones: [buildZone(cardId, 0, cardTypeConfig.mechanicOptions.cellsPerZone, normalized)],
    status: "in-pile",
    totalWinnings: 0,
  };
}

// 建立整副牌堆（迭代 cardTypes，globalIndex 跨類型遞增）
export function buildDeck(config: GameConfig): ScratchCard[] {
  const sessionCode = generateSessionCode();
  const cards: ScratchCard[] = [];
  let globalIndex = 0;

  for (const [typeIndex, cardType] of config.cardTypes.entries()) {
    for (let i = 0; i < cardType.count; i++) {
      cards.push(
        buildCard(
          cardType,
          `card-${globalIndex}`,
          `${sessionCode}-${String(globalIndex + 1).padStart(2, "0")}`,
          typeIndex,
        ),
      );
      globalIndex++;
    }
  }

  return cards;
}
