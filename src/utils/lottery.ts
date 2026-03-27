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
  BingoOptions,
} from "@/types";
import { assignSymbolsToPrizes, SYMBOL_POOL } from "@/utils/symbol-pool";

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

// 建立賓果玩法的 2 個刮除區（zone[0]=開獎號碼自動揭曉 / zone[1]=賓果格）
function buildBingoZones(cardId: string, options: BingoOptions): ScratchZone[] {
  const { gridSize, drawnCount } = options;
  const poolSize = Math.ceil(gridSize * gridSize * 2);

  // 從 1..poolSize 隨機不重複取樣 n 個數
  function sampleWithoutReplacement(
    n: number,
    exclude?: Set<number>,
  ): number[] {
    const pool: number[] = [];
    for (let i = 1; i <= poolSize; i++) {
      if (!exclude?.has(i)) pool.push(i);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    return pool.slice(0, n);
  }

  // zone[0]：開獎號碼（初始未揭曉，需逐格刮開）
  const drawnNums = sampleWithoutReplacement(drawnCount);
  const drawnCells: ScratchCell[] = drawnNums.map((num, i) => ({
    id: `${cardId}-zone-0-cell-${i}`,
    prize: {
      id: "dummy",
      label: String(num),
      amount: 0,
      probability: 1,
      isWin: false,
    },
    scratchProgress: 0,
    isRevealed: false,
    bingoNumber: num,
  }));

  // zone[1]：賓果格（gridSize²，從整個 pool 不重複取樣，獨立於 zone[0]）
  const gridNums = sampleWithoutReplacement(gridSize * gridSize);
  const gridCells: ScratchCell[] = gridNums.map((num, i) => ({
    id: `${cardId}-zone-1-cell-${i}`,
    prize: {
      id: "dummy",
      label: String(num),
      amount: 0,
      probability: 1,
      isWin: false,
    },
    scratchProgress: 0,
    isRevealed: false,
    bingoNumber: num,
  }));

  return [
    { id: `${cardId}-zone-0`, shapeVariant: "single", cells: drawnCells },
    { id: `${cardId}-zone-1`, shapeVariant: "single", cells: gridCells },
  ];
}

// Symbol 玩法後處理：中獎格共享 symbolCode、未中獎格各不相同
function assignMatchingSymbols(zones: ScratchZone[]): ScratchZone[] {
  const allCells = zones.flatMap((z) => z.cells);
  const usedCodes = new Set<string>();

  // 1. 收集中獎格，按 prize.id 分組
  const winGroups = new Map<string, ScratchCell[]>();
  for (const cell of allCells) {
    if (cell.prize.isWin) {
      const group = winGroups.get(cell.prize.id) ?? [];
      group.push(cell);
      winGroups.set(cell.prize.id, group);
    }
  }

  // 2. 每組中獎格分配相同的 symbolCode
  const assignedCodes = new Map<string, string>(); // prizeId → symbolCode
  let poolIdx = 0;
  for (const [prizeId] of winGroups) {
    const code = SYMBOL_POOL[poolIdx % SYMBOL_POOL.length]!.code;
    assignedCodes.set(prizeId, code);
    usedCodes.add(code);
    poolIdx++;
  }

  // 3. 未中獎格各分配不同的 symbolCode（避開已用的）
  let loseCodes: string[] = [];
  for (const sym of SYMBOL_POOL) {
    if (!usedCodes.has(sym.code)) loseCodes.push(sym.code);
  }
  // fallback：若中獎組數 >= SYMBOL_POOL 大小導致 loseCodes 為空，從完整池循環分配
  if (loseCodes.length === 0) {
    loseCodes = SYMBOL_POOL.map((s) => s.code);
  }

  // 4. 重建 zones（不可變）
  let loseIdx = 0;
  return zones.map((zone) => ({
    ...zone,
    cells: zone.cells.map((cell) => {
      const code = cell.prize.isWin
        ? assignedCodes.get(cell.prize.id)!
        : loseCodes[loseIdx++ % loseCodes.length]!;
      return { ...cell, prize: { ...cell.prize, symbolCode: code } };
    }),
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
  // symbol / triple 玩法需為 prizes 分配符號 code，讓 cell.prize.symbolCode 有值供 sprite 渲染
  const prizes =
    cardTypeConfig.mechanic === "symbol" || cardTypeConfig.mechanic === "triple"
      ? assignSymbolsToPrizes(normalized)
      : normalized;
  const zones =
    cardTypeConfig.mechanic === "triple"
      ? buildTripleZones(
          cardId,
          (cardTypeConfig.mechanicOptions as TripleOptions).rowsPerCard,
          prizes,
        )
      : cardTypeConfig.mechanic === "compare"
        ? buildCompareZones(
            cardId,
            (cardTypeConfig.mechanicOptions as CompareOptions).roundsPerCard,
            prizes,
          )
        : cardTypeConfig.mechanic === "bingo"
          ? buildBingoZones(
              cardId,
              cardTypeConfig.mechanicOptions as BingoOptions,
            )
          : [
              buildZone(
                cardId,
                0,
                (cardTypeConfig.mechanicOptions as SymbolOptions).cellsPerZone,
                prizes,
              ),
            ];
  const finalZones =
    cardTypeConfig.mechanic === "symbol"
      ? assignMatchingSymbols(zones)
      : zones;
  return {
    id: cardId,
    serialNumber,
    cardTypeIndex,
    zones: finalZones,
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
