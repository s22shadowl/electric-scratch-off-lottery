import type {
  Prize,
  ScratchCard,
  ScratchZone,
  ScratchCell,
  GameConfig,
  CardTypeConfig,
  SymbolOptions,
  TripleOptions,
  CompareOptions,
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

// 比大小玩法用亂數（整數，含兩端）
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COMPARE_MIN = 30;
const COMPARE_MAX = 60;

// 建立比大小玩法的 3 個刮除區（zone[0]=玩家 / zone[1]=莊家 / zone[2]=獎金）
function buildCompareZones(
  cardId: string,
  roundsPerCard: number,
  normalized: Prize[],
): ScratchZone[] {
  const playerCells: ScratchCell[] = [];
  const dealerCells: ScratchCell[] = [];
  const prizeCells: ScratchCell[] = [];
  const dummyPrize = normalized[0]!;

  for (let row = 0; row < roundsPerCard; row++) {
    const rowPrize = drawPrize(normalized);
    let playerVal: number;
    let dealerVal: number;

    if (rowPrize.isWin) {
      // 中獎：玩家數字嚴格大於莊家（31–60 vs 30–player-1）
      playerVal = randInt(COMPARE_MIN + 1, COMPARE_MAX);
      dealerVal = randInt(COMPARE_MIN, playerVal - 1);
    } else {
      // 落敗：玩家數字 <= 莊家（平手算輸，30–60 vs player–60）
      dealerVal = randInt(COMPARE_MIN, COMPARE_MAX);
      playerVal = randInt(COMPARE_MIN, dealerVal);
    }

    playerCells.push({
      id: `${cardId}-zone-0-cell-${row}`,
      prize: dummyPrize,
      scratchProgress: 0,
      isRevealed: false,
      compareValue: playerVal,
    });
    dealerCells.push({
      id: `${cardId}-zone-1-cell-${row}`,
      prize: dummyPrize,
      scratchProgress: 0,
      isRevealed: false,
      compareValue: dealerVal,
    });
    prizeCells.push({
      id: `${cardId}-zone-2-cell-${row}`,
      prize: rowPrize,
      scratchProgress: 0,
      isRevealed: false,
    });
  }

  return [
    { id: `${cardId}-zone-0`, shapeVariant: "left", cells: playerCells },
    { id: `${cardId}-zone-1`, shapeVariant: "right", cells: dealerCells },
    { id: `${cardId}-zone-2`, shapeVariant: "single", cells: prizeCells },
  ];
}

// 建立三同玩法的 3 個刮除區（各區 rowsPerCard 格，同列三格對應一組三同）
function buildTripleZones(
  cardId: string,
  rowsPerCard: number,
  normalized: Prize[],
): ScratchZone[] {
  const zoneCells: ScratchCell[][] = [[], [], []];

  for (let row = 0; row < rowsPerCard; row++) {
    const rowPrize = drawPrize(normalized);

    if (rowPrize.isWin) {
      // 中獎：三個 zone 同列格均填相同獎項
      for (let z = 0; z < 3; z++) {
        zoneCells[z]!.push({
          id: `${cardId}-zone-${z}-cell-${row}`,
          prize: rowPrize,
          scratchProgress: 0,
          isRevealed: false,
        });
      }
    } else {
      // 落敗：zone 0、1 填落敗獎項，zone 2 強制填不同獎項（保證不三同）
      for (let z = 0; z < 2; z++) {
        zoneCells[z]!.push({
          id: `${cardId}-zone-${z}-cell-${row}`,
          prize: rowPrize,
          scratchProgress: 0,
          isRevealed: false,
        });
      }
      const others = normalized.filter((p) => p.id !== rowPrize.id);
      const mismatch =
        others.length > 0
          ? others[Math.floor(Math.random() * others.length)]!
          : normalized[0]!;
      zoneCells[2]!.push({
        id: `${cardId}-zone-2-cell-${row}`,
        prize: mismatch,
        scratchProgress: 0,
        isRevealed: false,
      });
    }
  }

  const shapeVariants = ["left", "single", "right"] as const;
  return [0, 1, 2].map((z) => ({
    id: `${cardId}-zone-${z}`,
    shapeVariant: shapeVariants[z]!,
    cells: zoneCells[z]!,
  }));
}

// 建立一張刮刮樂卡（在建卡時依機率分配獎項）
export function buildCard(
  cardTypeConfig: CardTypeConfig,
  cardId: string,
  serialNumber: string,
  cardTypeIndex: number,
): ScratchCard {
  const normalized = normalizeProbabilities(cardTypeConfig.prizes);
  const zones =
    cardTypeConfig.mechanic === "triple"
      ? buildTripleZones(
          cardId,
          (cardTypeConfig.mechanicOptions as TripleOptions).rowsPerCard,
          normalized,
        )
      : cardTypeConfig.mechanic === "compare"
        ? buildCompareZones(
            cardId,
            (cardTypeConfig.mechanicOptions as CompareOptions).roundsPerCard,
            normalized,
          )
        : [
            buildZone(
              cardId,
              0,
              (cardTypeConfig.mechanicOptions as SymbolOptions).cellsPerZone,
              normalized,
            ),
          ];
  return {
    id: cardId,
    serialNumber,
    cardTypeIndex,
    zones,
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
