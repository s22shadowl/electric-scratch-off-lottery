import { describe, it, expect } from "vitest";
import {
  normalizeProbabilities,
  drawPrize,
  buildCard,
  buildDeck,
  generateSessionCode,
} from "./lottery";
import type { Prize, GameConfig } from "@/types";

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
      cardType.mechanicOptions.cellsPerZone,
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
        config.cardTypes[0]!.mechanicOptions.cellsPerZone,
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
