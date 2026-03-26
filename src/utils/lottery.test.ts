import { describe, it, expect } from "vitest";
import {
  normalizeProbabilities,
  drawPrize,
  buildCard,
  buildDeck,
  generateSessionCode,
} from "./lottery";
import type {
  Prize,
  GameConfig,
  SymbolOptions,
  TripleOptions,
  CompareOptions,
  BingoOptions,
  CardTypeConfig,
} from "@/types";

// ── 測試資料 ──────────────────────────────────────────────

const makePrize = (
  overrides: Partial<Prize> & Pick<Prize, "id" | "amount" | "probability">,
): Prize => ({
  label: `$${overrides.amount}`,
  symbolCode: undefined,
  isWin: overrides.amount > 0,
  ...overrides,
});

const prizes: Prize[] = [
  makePrize({ id: "p1", amount: 0, probability: 2, label: "謝謝" }),
  makePrize({ id: "p2", amount: 100, probability: 1 }),
  makePrize({ id: "p3", amount: 500, probability: 1 }),
];

const config: GameConfig = {
  sessionTitle: "測試活動",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes,
      count: 5,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 6 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

// ── normalizeProbabilities ────────────────────────────────

describe("normalizeProbabilities", () => {
  it("正規化後所有機率總和應等於 1", () => {
    const result = normalizeProbabilities(prizes);
    const sum = result.reduce((acc, p) => acc + p.probability, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("各獎項機率比例應符合輸入的相對權重", () => {
    const result = normalizeProbabilities(prizes);
    // 權重 [2, 1, 1]，正規化後應為 [0.5, 0.25, 0.25]
    expect(result[0]!.probability).toBeCloseTo(0.5);
    expect(result[1]!.probability).toBeCloseTo(0.25);
    expect(result[2]!.probability).toBeCloseTo(0.25);
  });

  it("不應修改原始陣列（不可變）", () => {
    const original = prizes.map((p) => p.probability);
    normalizeProbabilities(prizes);
    prizes.forEach((p, i) => {
      expect(p.probability).toBe(original[i]);
    });
  });

  it("所有權重相同時，每個機率應相等", () => {
    const equal = [
      makePrize({ id: "a", amount: 0, probability: 1, label: "謝謝" }),
      makePrize({ id: "b", amount: 100, probability: 1 }),
      makePrize({ id: "c", amount: 200, probability: 1 }),
    ];
    const result = normalizeProbabilities(equal);
    result.forEach((p) => expect(p.probability).toBeCloseTo(1 / 3));
  });
});

// ── drawPrize ─────────────────────────────────────────────

describe("drawPrize", () => {
  it("回傳的獎項應來自輸入的獎項池", () => {
    const normalized = normalizeProbabilities(prizes);
    const ids = normalized.map((p) => p.id);
    for (let i = 0; i < 50; i++) {
      const drawn = drawPrize(normalized);
      expect(ids).toContain(drawn.id);
    }
  });

  it("機率為 0 的獎項永遠不應被抽中", () => {
    const pool = [
      makePrize({ id: "never", amount: 9999, probability: 0 }),
      makePrize({ id: "always", amount: 100, probability: 1 }),
    ];
    // 不需正規化，機率已明確
    for (let i = 0; i < 100; i++) {
      const drawn = drawPrize(pool);
      expect(drawn.id).not.toBe("never");
    }
  });

  it("大量抽樣後，分佈應接近預期機率（容差 ±5%）", () => {
    const normalized = normalizeProbabilities(prizes);
    const counts: Record<string, number> = { p1: 0, p2: 0, p3: 0 };
    const total = 10_000;

    for (let i = 0; i < total; i++) {
      const drawn = drawPrize(normalized);
      counts[drawn.id]!++;
    }

    expect(counts["p1"]! / total).toBeCloseTo(0.5, 1);
    expect(counts["p2"]! / total).toBeCloseTo(0.25, 1);
    expect(counts["p3"]! / total).toBeCloseTo(0.25, 1);
  });
});

// ── generateSessionCode ──────────────────────────────────

describe("generateSessionCode", () => {
  it("應回傳 4 碼大寫英文字串", () => {
    const code = generateSessionCode();
    expect(code).toMatch(/^[A-Z]{4}$/);
  });

  it("多次呼叫應產生不同 code（機率極低重複）", () => {
    const codes = new Set(
      Array.from({ length: 10 }, () => generateSessionCode()),
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});

// ── buildCard ─────────────────────────────────────────────

describe("buildCard", () => {
  const cardType = config.cardTypes[0]!;

  it("卡片格數應等於 mechanicOptions.cellsPerZone", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    expect(card.zones[0]!.cells).toHaveLength(
      (cardType.mechanicOptions as SymbolOptions).cellsPerZone,
    );
  });

  it("每個 cell 初始狀態：scratchProgress 為 0、isRevealed 為 false", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    card.zones[0]!.cells.forEach((cell) => {
      expect(cell.scratchProgress).toBe(0);
      expect(cell.isRevealed).toBe(false);
    });
  });

  it("卡片初始狀態應為 in-pile，totalWinnings 為 0", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    expect(card.status).toBe("in-pile");
    expect(card.totalWinnings).toBe(0);
  });

  it("每個 cell 的 prize 應來自 cardType.prizes 的獎項池", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    const prizeIds = cardType.prizes.map((p) => p.id);
    card.zones[0]!.cells.forEach((cell) => {
      expect(prizeIds).toContain(cell.prize.id);
    });
  });

  it("所有 cell.id 應唯一", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    const ids = card.zones[0]!.cells.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cell.id 格式應包含 zone index（zone-aware）", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 0);
    card.zones[0]!.cells.forEach((cell, i) => {
      expect(cell.id).toBe(`card-1-zone-0-cell-${i}`);
    });
  });

  it("serialNumber 應儲存在卡片上", () => {
    const card = buildCard(cardType, "card-1", "ABCD-01", 0);
    expect(card.serialNumber).toBe("ABCD-01");
  });

  it("cardTypeIndex 應儲存在卡片上", () => {
    const card = buildCard(cardType, "card-1", "TEST-01", 2);
    expect(card.cardTypeIndex).toBe(2);
  });
});

// ── buildDeck ─────────────────────────────────────────────

describe("buildDeck", () => {
  it("牌堆數量應等於所有 cardType.count 的總和", () => {
    const deck = buildDeck(config);
    const totalCount = config.cardTypes.reduce((s, ct) => s + ct.count, 0);
    expect(deck).toHaveLength(totalCount);
  });

  it("每張卡的 id 應唯一", () => {
    const deck = buildDeck(config);
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每張卡應有完整的 zones 與 cells", () => {
    const deck = buildDeck(config);
    deck.forEach((card) => {
      expect(card.zones[0]).toBeDefined();
      expect(card.zones[0]!.cells).toHaveLength(
        (config.cardTypes[0]!.mechanicOptions as SymbolOptions).cellsPerZone,
      );
    });
  });

  it("同一牌堆所有卡片的 session code（前 4 碼）應相同", () => {
    const deck = buildDeck(config);
    const sessionCodes = deck.map((c) => c.serialNumber.split("-")[0]);
    const unique = new Set(sessionCodes);
    expect(unique.size).toBe(1);
  });

  it("serialNumber 格式應符合 XXXX-NN", () => {
    const deck = buildDeck(config);
    deck.forEach((card) => {
      expect(card.serialNumber).toMatch(/^[A-Z]{4}-\d{2,}$/);
    });
  });

  it("serialNumber 序列號應從 01 遞增", () => {
    const deck = buildDeck(config);
    deck.forEach((card, i) => {
      const seq = card.serialNumber.split("-")[1];
      expect(seq).toBe(String(i + 1).padStart(2, "0"));
    });
  });

  it("多個 cardType 時，globalIndex 應跨類型連續遞增", () => {
    const multiConfig: GameConfig = {
      ...config,
      cardTypes: [
        { ...config.cardTypes[0]!, count: 2 },
        { ...config.cardTypes[0]!, count: 3 },
      ],
    };
    const deck = buildDeck(multiConfig);
    expect(deck).toHaveLength(5);
    // cardTypeIndex 前 2 張應為 0，後 3 張應為 1
    expect(deck[0]!.cardTypeIndex).toBe(0);
    expect(deck[1]!.cardTypeIndex).toBe(0);
    expect(deck[2]!.cardTypeIndex).toBe(1);
    expect(deck[3]!.cardTypeIndex).toBe(1);
    expect(deck[4]!.cardTypeIndex).toBe(1);
  });
});

// ── buildCard (symbol matching) ───────────────────────────

describe("buildCard (symbol matching)", () => {
  it("symbol 玩法：同一張卡的中獎格應有相同 symbolCode", () => {
    const winOnly: Prize[] = [
      makePrize({ id: "win", amount: 300, probability: 1 }),
    ];
    const cardType: CardTypeConfig = {
      mechanic: "symbol",
      prizes: winOnly,
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 4 } satisfies SymbolOptions,
      ticketPrice: 100,
    };
    const card = buildCard(cardType, "card-0", "TEST-01", 0);
    const cells = card.zones.flatMap((z) => z.cells);
    const codes = cells.map((c) => c.prize.symbolCode);
    // 全部中獎格 → 同一個 prize.id → 應共享 symbolCode
    expect(new Set(codes).size).toBe(1);
  });

  it("symbol 玩法：未中獎格的 symbolCode 應各不相同（pool 足夠時）", () => {
    const loseOnly: Prize[] = [
      makePrize({ id: "lose", amount: 0, probability: 1, label: "謝謝" }),
    ];
    const cardType: CardTypeConfig = {
      mechanic: "symbol",
      prizes: loseOnly,
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 4 } satisfies SymbolOptions,
      ticketPrice: 100,
    };
    const card = buildCard(cardType, "card-0", "TEST-01", 0);
    const cells = card.zones.flatMap((z) => z.cells);
    const codes = cells.map((c) => c.prize.symbolCode);
    expect(new Set(codes).size).toBe(codes.length); // 各不相同
  });

  it("symbol 玩法：混合中獎/未中獎時，中獎格共享 symbolCode 且未中獎格各不同", () => {
    const mixed: Prize[] = [
      makePrize({ id: "win", amount: 300, probability: 1 }),
      makePrize({ id: "lose", amount: 0, probability: 1, label: "謝謝" }),
    ];
    const cardType: CardTypeConfig = {
      mechanic: "symbol",
      prizes: mixed,
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 6 } satisfies SymbolOptions,
      ticketPrice: 100,
    };
    // Run 50 times to cover randomness
    for (let i = 0; i < 50; i++) {
      const card = buildCard(cardType, `card-${i}`, `TEST-${i}`, 0);
      const cells = card.zones.flatMap((z) => z.cells);
      const winCells = cells.filter((c) => c.prize.isWin);
      const loseCells = cells.filter((c) => !c.prize.isWin);

      // All winning cells share the same symbolCode
      if (winCells.length > 1) {
        const winCodes = new Set(winCells.map((c) => c.prize.symbolCode));
        expect(winCodes.size).toBe(1);
      }

      // Losing cells have distinct symbolCodes (pool size 10 > 6 cells)
      if (loseCells.length > 1) {
        const loseCodes = loseCells.map((c) => c.prize.symbolCode);
        expect(new Set(loseCodes).size).toBe(loseCodes.length);
      }

      // Win code should not appear in lose codes
      if (winCells.length > 0 && loseCells.length > 0) {
        const winCode = winCells[0]!.prize.symbolCode;
        loseCells.forEach((c) => {
          expect(c.prize.symbolCode).not.toBe(winCode);
        });
      }
    }
  });
});

// ── buildCard (triple) ────────────────────────────────────

const tripleCardType: CardTypeConfig = {
  mechanic: "triple",
  prizes,
  count: 3,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { rowsPerCard: 3 } satisfies TripleOptions,
  ticketPrice: 100,
};

describe("buildCard (triple)", () => {
  it("三同卡片應有 3 個 zones", () => {
    const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
    expect(card.zones).toHaveLength(3);
  });

  it("每個 zone 應有 rowsPerCard 個 cells", () => {
    const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
    card.zones.forEach((zone) => {
      expect(zone.cells).toHaveLength(
        (tripleCardType.mechanicOptions as TripleOptions).rowsPerCard,
      );
    });
  });

  it("所有 cell.id 應唯一", () => {
    const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
    const ids = card.zones.flatMap((z) => z.cells.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cell.id 格式應包含 zone index（zone-aware）", () => {
    const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
    card.zones.forEach((zone, z) => {
      zone.cells.forEach((cell, i) => {
        expect(cell.id).toBe(`card-t-zone-${z}-cell-${i}`);
      });
    });
  });

  it("卡片初始狀態：status=in-pile, totalWinnings=0", () => {
    const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
    expect(card.status).toBe("in-pile");
    expect(card.totalWinnings).toBe(0);
  });

  it("不變量：同一列三格 prize.id 一致時，prize.isWin 必須為 true（100 次迭代）", () => {
    const rowsPerCard = (tripleCardType.mechanicOptions as TripleOptions)
      .rowsPerCard;
    for (let iter = 0; iter < 100; iter++) {
      const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
      for (let row = 0; row < rowsPerCard; row++) {
        const p0 = card.zones[0]!.cells[row]!.prize;
        const p1 = card.zones[1]!.cells[row]!.prize;
        const p2 = card.zones[2]!.cells[row]!.prize;
        if (p0.id === p1.id && p1.id === p2.id) {
          expect(p0.isWin).toBe(true);
        }
      }
    }
  });

  it("不變量：落敗列（zone[0].prize.isWin=false）zone[2] 的 prize.id 必須不同（100 次迭代）", () => {
    const rowsPerCard = (tripleCardType.mechanicOptions as TripleOptions)
      .rowsPerCard;
    for (let iter = 0; iter < 100; iter++) {
      const card = buildCard(tripleCardType, "card-t", "TEST-01", 0);
      for (let row = 0; row < rowsPerCard; row++) {
        const p0 = card.zones[0]!.cells[row]!.prize;
        const p2 = card.zones[2]!.cells[row]!.prize;
        if (!p0.isWin) {
          expect(p2.id).not.toBe(p0.id);
        }
      }
    }
  });
});

// ── buildCard (compare) ───────────────────────────────────

const compareCardType: CardTypeConfig = {
  mechanic: "compare",
  prizes,
  count: 3,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { roundsPerCard: 3 } satisfies CompareOptions,
  ticketPrice: 100,
};

describe("buildCard (compare)", () => {
  it("比大小卡片應有 3 個 zones（你的 / 莊家 / 獎金）", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    expect(card.zones).toHaveLength(3);
  });

  it("每個 zone 應有 roundsPerCard 個 cells", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    const rounds = (compareCardType.mechanicOptions as CompareOptions)
      .roundsPerCard;
    card.zones.forEach((zone) => {
      expect(zone.cells).toHaveLength(rounds);
    });
  });

  it("所有 cell.id 應唯一", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    const ids = card.zones.flatMap((z) => z.cells.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cell.id 格式應包含 zone index（zone-aware）", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    card.zones.forEach((zone, z) => {
      zone.cells.forEach((cell, i) => {
        expect(cell.id).toBe(`card-c-zone-${z}-cell-${i}`);
      });
    });
  });

  it("卡片初始狀態：status=in-pile, totalWinnings=0", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    expect(card.status).toBe("in-pile");
    expect(card.totalWinnings).toBe(0);
  });

  it("zone[0/1] 的 compareValue 應在 30–60 範圍內（100 次迭代）", () => {
    for (let iter = 0; iter < 100; iter++) {
      const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
      for (const zone of [card.zones[0]!, card.zones[1]!]) {
        for (const cell of zone.cells) {
          expect(cell.compareValue).toBeGreaterThanOrEqual(30);
          expect(cell.compareValue).toBeLessThanOrEqual(60);
        }
      }
    }
  });

  it("zone[2]（獎金格）的 compareValue 應為 undefined", () => {
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    card.zones[2]!.cells.forEach((cell) => {
      expect(cell.compareValue).toBeUndefined();
    });
  });

  it("zone[2] 的 prize 應來自獎項池", () => {
    const prizeIds = compareCardType.prizes.map((p) => p.id);
    const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
    card.zones[2]!.cells.forEach((cell) => {
      expect(prizeIds).toContain(cell.prize.id);
    });
  });

  it("不變量：中獎列 zone[0].compareValue > zone[1].compareValue（100 次迭代）", () => {
    const rounds = (compareCardType.mechanicOptions as CompareOptions)
      .roundsPerCard;
    for (let iter = 0; iter < 100; iter++) {
      const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
      for (let row = 0; row < rounds; row++) {
        const prizeCell = card.zones[2]!.cells[row]!;
        if (prizeCell.prize.isWin) {
          const playerVal = card.zones[0]!.cells[row]!.compareValue!;
          const dealerVal = card.zones[1]!.cells[row]!.compareValue!;
          expect(playerVal).toBeGreaterThan(dealerVal);
        }
      }
    }
  });

  it("不變量：落敗列 zone[0].compareValue <= zone[1].compareValue（平手算輸，100 次迭代）", () => {
    const rounds = (compareCardType.mechanicOptions as CompareOptions)
      .roundsPerCard;
    for (let iter = 0; iter < 100; iter++) {
      const card = buildCard(compareCardType, "card-c", "TEST-01", 0);
      for (let row = 0; row < rounds; row++) {
        const prizeCell = card.zones[2]!.cells[row]!;
        if (!prizeCell.prize.isWin) {
          const playerVal = card.zones[0]!.cells[row]!.compareValue!;
          const dealerVal = card.zones[1]!.cells[row]!.compareValue!;
          expect(playerVal).toBeLessThanOrEqual(dealerVal);
        }
      }
    }
  });
});

// ── buildCard (bingo) ─────────────────────────────────────

const bingoCardType: CardTypeConfig = {
  mechanic: "bingo",
  prizes: prizes,
  count: 2,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: {
    gridSize: 3,
    drawnCount: 6,
    prizePerLine: 100,
  } satisfies BingoOptions,
  ticketPrice: 100,
};

describe("buildCard (bingo)", () => {
  it("賓果卡片應有 2 個 zones", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    expect(card.zones).toHaveLength(2);
  });

  it("zone[0] 應有 drawnCount 個 cells", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    const { drawnCount } = bingoCardType.mechanicOptions as BingoOptions;
    expect(card.zones[0]!.cells).toHaveLength(drawnCount);
  });

  it("zone[1] 應有 gridSize×gridSize 個 cells", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    const { gridSize } = bingoCardType.mechanicOptions as BingoOptions;
    expect(card.zones[1]!.cells).toHaveLength(gridSize * gridSize);
  });

  it("zone[0] 所有 cells 初始應為未揭曉（isRevealed=false，需逐格刮開）", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    card.zones[0]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(false);
      expect(cell.scratchProgress).toBe(0);
    });
  });

  it("zone[1] 所有 cells 初始應為未揭曉（isRevealed=false）", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    card.zones[1]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(false);
    });
  });

  it("zone[0] 所有 cells 應有 bingoNumber 在 1..poolSize 範圍", () => {
    const { gridSize } = bingoCardType.mechanicOptions as BingoOptions;
    const poolSize = Math.ceil(gridSize * gridSize * 2);
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    card.zones[0]!.cells.forEach((cell) => {
      expect(cell.bingoNumber).toBeDefined();
      expect(cell.bingoNumber!).toBeGreaterThanOrEqual(1);
      expect(cell.bingoNumber!).toBeLessThanOrEqual(poolSize);
    });
  });

  it("zone[1] 所有 cells 應有 bingoNumber 在 1..poolSize 範圍", () => {
    const { gridSize } = bingoCardType.mechanicOptions as BingoOptions;
    const poolSize = Math.ceil(gridSize * gridSize * 2);
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    card.zones[1]!.cells.forEach((cell) => {
      expect(cell.bingoNumber).toBeDefined();
      expect(cell.bingoNumber!).toBeGreaterThanOrEqual(1);
      expect(cell.bingoNumber!).toBeLessThanOrEqual(poolSize);
    });
  });

  it("zone[0] 開獎號碼應無重複", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    const nums = card.zones[0]!.cells.map((c) => c.bingoNumber!);
    expect(new Set(nums).size).toBe(nums.length);
  });

  it("zone[1] 賓果格號碼應無重複", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    const nums = card.zones[1]!.cells.map((c) => c.bingoNumber!);
    expect(new Set(nums).size).toBe(nums.length);
  });

  it("所有 cell.id 應唯一", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    const ids = card.zones.flatMap((z) => z.cells.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cell.id 格式應包含 zone index（zone-aware）", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    card.zones.forEach((zone, z) => {
      zone.cells.forEach((cell, i) => {
        expect(cell.id).toBe(`card-b-zone-${z}-cell-${i}`);
      });
    });
  });

  it("卡片初始 status=in-pile, totalWinnings=0", () => {
    const card = buildCard(bingoCardType, "card-b", "TEST-01", 0);
    expect(card.status).toBe("in-pile");
    expect(card.totalWinnings).toBe(0);
  });
});
