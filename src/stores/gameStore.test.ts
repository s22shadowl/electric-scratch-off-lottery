import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, REVEAL_THRESHOLD, computeWinnings } from "./gameStore";
import type { GameConfig, BingoOptions } from "@/types";

// ── 測試資料 ──────────────────────────────────────────────

const config: GameConfig = {
  sessionTitle: "測試活動",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes: [
        {
          id: "p-lose",
          label: "謝謝",
          amount: 0,
          probability: 1,
          isWin: false,
        },
        {
          id: "p-win",
          label: "$100",
          amount: 100,
          probability: 1,
          isWin: true,
        },
      ],
      count: 3,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 3 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

// 每個測試前重置 store
beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
});

// ── initGame ──────────────────────────────────────────────

describe("initGame", () => {
  it("應建立等於 cardType.count 的牌堆", () => {
    useGameStore.getState().initGame(config);
    expect(useGameStore.getState().cards).toHaveLength(3);
  });

  it("phase 應設為 pile", () => {
    useGameStore.getState().initGame(config);
    expect(useGameStore.getState().phase).toBe("pile");
  });

  it("effectsEnabled 應沿用 config 設定", () => {
    useGameStore.getState().initGame({ ...config, effectsEnabled: false });
    expect(useGameStore.getState().effectsEnabled).toBe(false);
  });

  it("selectedCardIds 應為空", () => {
    useGameStore.getState().initGame(config);
    expect(useGameStore.getState().selectedCardIds).toHaveLength(0);
  });
});

// ── selectCard / deselectCard ─────────────────────────────

describe("selectCard", () => {
  it("選牌後卡片狀態應從 in-pile 變為 selected", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    const card = useGameStore.getState().cards.find((c) => c.id === cardId);
    expect(card?.status).toBe("selected");
  });

  it("選牌後 selectedCardIds 應包含該卡 id", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    expect(useGameStore.getState().selectedCardIds).toContain(cardId);
  });

  it("重複選同一張牌不應重複加入 selectedCardIds", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().selectCard(cardId);
    expect(
      useGameStore.getState().selectedCardIds.filter((id) => id === cardId),
    ).toHaveLength(1);
  });
});

describe("deselectCard", () => {
  it("取消選牌後卡片狀態應從 selected 變回 in-pile", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().deselectCard(cardId);
    const card = useGameStore.getState().cards.find((c) => c.id === cardId);
    expect(card?.status).toBe("in-pile");
  });

  it("取消選牌後 selectedCardIds 應移除該 id", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().deselectCard(cardId);
    expect(useGameStore.getState().selectedCardIds).not.toContain(cardId);
  });
});

// ── startScratching ───────────────────────────────────────

describe("startScratching", () => {
  it("phase 應從 pile 切換為 scratching", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    expect(useGameStore.getState().phase).toBe("scratching");
  });

  it("已選的卡片狀態應從 selected 變為 scratching", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    const card = useGameStore.getState().cards.find((c) => c.id === cardId);
    expect(card?.status).toBe("scratching");
  });

  it("未選的卡片狀態應維持 in-pile", () => {
    useGameStore.getState().initGame(config);
    const [first, second] = useGameStore.getState().cards;
    useGameStore.getState().selectCard(first!.id);
    useGameStore.getState().startScratching();
    const card = useGameStore.getState().cards.find((c) => c.id === second!.id);
    expect(card?.status).toBe("in-pile");
  });
});

// ── currentScratchIndex / nextCard ────────────────────────

describe("currentScratchIndex", () => {
  it("startScratching 後 currentScratchIndex 應為 0", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    expect(useGameStore.getState().currentScratchIndex).toBe(0);
  });

  it("nextCard 應遞增 currentScratchIndex", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().nextCard();
    expect(useGameStore.getState().currentScratchIndex).toBe(1);
  });

  it("最後一張 nextCard 應跳轉 results", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().nextCard();
    expect(useGameStore.getState().phase).toBe("results");
  });

  it("returnToPile 後 currentScratchIndex 應重置為 0", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().nextCard();
    useGameStore.getState().returnToPile();
    expect(useGameStore.getState().currentScratchIndex).toBe(0);
  });
});

// ── updateCellProgress ────────────────────────────────────

describe("updateCellProgress", () => {
  it("應更新指定 cell 的 scratchProgress", () => {
    useGameStore.getState().initGame(config);
    const card = useGameStore.getState().cards[0]!;
    const cellId = card.zones[0]!.cells[0]!.id;
    useGameStore.getState().updateCellProgress(card.id, cellId, 0.5);
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    const cell = updated?.zones[0]?.cells.find((c) => c.id === cellId);
    expect(cell?.scratchProgress).toBe(0.5);
  });

  it(`進度達 REVEAL_THRESHOLD 時，cell.isRevealed 應為 true`, () => {
    useGameStore.getState().initGame(config);
    const card = useGameStore.getState().cards[0]!;
    const cellId = card.zones[0]!.cells[0]!.id;
    useGameStore
      .getState()
      .updateCellProgress(card.id, cellId, REVEAL_THRESHOLD);
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    const cell = updated?.zones[0]?.cells.find((c) => c.id === cellId);
    expect(cell?.isRevealed).toBe(true);
  });

  it("揭曉中獎格後，card.totalWinnings 應加上該獎金", () => {
    useGameStore.getState().initGame(config);
    // 找一張有 isWin cell 的卡
    const cards = useGameStore.getState().cards;
    const cardWithWin = cards.find((c) =>
      c.zones[0]!.cells.some((cell) => cell.prize.isWin),
    );
    expect(cardWithWin).toBeDefined();
    const winCell = cardWithWin!.zones[0]!.cells.find(
      (cell) => cell.prize.isWin,
    )!;
    const winAmount = winCell.prize.amount;
    useGameStore
      .getState()
      .updateCellProgress(cardWithWin!.id, winCell.id, REVEAL_THRESHOLD);
    const updated = useGameStore
      .getState()
      .cards.find((c) => c.id === cardWithWin!.id);
    expect(updated?.totalWinnings).toBe(winAmount);
  });

  it("所有 cell 揭曉後，card.status 應變為 completed", () => {
    useGameStore.getState().initGame(config);
    const card = useGameStore.getState().cards[0]!;
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.status).toBe("completed");
  });

  it("多張卡片全部刮完後 phase 應仍為 scratching（需手動 nextCard 跳 results）", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    // 刮完第一張
    cards[0]!.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(cards[0]!.id, cell.id, REVEAL_THRESHOLD);
    });
    expect(useGameStore.getState().phase).toBe("scratching");
    // 刮完第二張
    cards[1]!.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(cards[1]!.id, cell.id, REVEAL_THRESHOLD);
    });
    // 多張時不自動跳 results
    expect(useGameStore.getState().phase).toBe("scratching");
  });

  it("單張卡片刮完後 phase 應自動跳 results", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().startScratching();
    cards[0]!.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(cards[0]!.id, cell.id, REVEAL_THRESHOLD);
    });
    expect(useGameStore.getState().phase).toBe("results");
  });

  it("不應修改原始 cards 陣列（不可變）", () => {
    useGameStore.getState().initGame(config);
    const card = useGameStore.getState().cards[0]!;
    const cellId = card.zones[0]!.cells[0]!.id;
    const originalCards = useGameStore.getState().cards;
    useGameStore.getState().updateCellProgress(card.id, cellId, 0.3);
    expect(useGameStore.getState().cards).not.toBe(originalCards);
  });
});

// ── setPhase ──────────────────────────────────────────────

describe("setPhase", () => {
  it("應正確切換 phase", () => {
    useGameStore.getState().initGame(config);
    useGameStore.getState().setPhase("results");
    expect(useGameStore.getState().phase).toBe("results");
  });
});

// ── toggleEffects ─────────────────────────────────────────

describe("toggleEffects", () => {
  it("應切換 effectsEnabled", () => {
    useGameStore.getState().initGame(config);
    const before = useGameStore.getState().effectsEnabled;
    useGameStore.getState().toggleEffects();
    expect(useGameStore.getState().effectsEnabled).toBe(!before);
  });

  it("連續切換兩次應回到原始值", () => {
    useGameStore.getState().initGame(config);
    const original = useGameStore.getState().effectsEnabled;
    useGameStore.getState().toggleEffects();
    useGameStore.getState().toggleEffects();
    expect(useGameStore.getState().effectsEnabled).toBe(original);
  });
});

// ── updateCellProgress (triple) ───────────────────────────

const tripleConfig: GameConfig = {
  sessionTitle: "三同測試",
  cardTypes: [
    {
      mechanic: "triple",
      prizes: [
        {
          id: "p-lose",
          label: "謝謝",
          amount: 0,
          probability: 2,
          isWin: false,
        },
        {
          id: "p-win",
          label: "$100",
          amount: 100,
          probability: 1,
          isWin: true,
        },
      ],
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { rowsPerCard: 3 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

describe("updateCellProgress (triple)", () => {
  it("揭曉部分格子（未全部完成）時 totalWinnings 應維持 0", () => {
    useGameStore.getState().initGame(tripleConfig);
    const card = useGameStore.getState().cards[0]!;
    // 只刮開 zone[0] 的所有格，仍有 zone[1]、zone[2] 未完成
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(0);
    expect(updated?.status).not.toBe("completed");
  });

  it("三個 zones 全部揭曉後 status 應為 completed", () => {
    useGameStore.getState().initGame(tripleConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones.forEach((zone) => {
      zone.cells.forEach((cell) => {
        useGameStore
          .getState()
          .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
      });
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.status).toBe("completed");
  });

  it("全部揭曉後 totalWinnings 應等於三同中獎列的獎金加總", () => {
    useGameStore.getState().initGame(tripleConfig);
    const card = useGameStore.getState().cards[0]!;

    // 從建牌結果計算預期獎金（同列三格 prize.id 相同則中獎）
    const expectedWinnings = card.zones[0]!.cells.reduce((sum, _, row) => {
      const p0 = card.zones[0]!.cells[row]!.prize;
      const p1 = card.zones[1]!.cells[row]!.prize;
      const p2 = card.zones[2]!.cells[row]!.prize;
      return p0.id === p1.id && p1.id === p2.id ? sum + p0.amount : sum;
    }, 0);

    card.zones.forEach((zone) => {
      zone.cells.forEach((cell) => {
        useGameStore
          .getState()
          .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
      });
    });

    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(expectedWinnings);
  });
});

// ── updateCellProgress (compare) ──────────────────────────

const compareConfig: GameConfig = {
  sessionTitle: "比大小測試",
  cardTypes: [
    {
      mechanic: "compare",
      prizes: [
        {
          id: "p-lose",
          label: "謝謝",
          amount: 0,
          probability: 2,
          isWin: false,
        },
        {
          id: "p-win",
          label: "$100",
          amount: 100,
          probability: 1,
          isWin: true,
        },
      ],
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { roundsPerCard: 3 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

describe("updateCellProgress (compare)", () => {
  it("揭曉部分格子（只 zone[0]）時 totalWinnings 應維持 0", () => {
    useGameStore.getState().initGame(compareConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(0);
    expect(updated?.status).not.toBe("completed");
  });

  it("三個 zones 全部揭曉後 status 應為 completed", () => {
    useGameStore.getState().initGame(compareConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones.forEach((zone) => {
      zone.cells.forEach((cell) => {
        useGameStore
          .getState()
          .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
      });
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.status).toBe("completed");
  });

  it("全部揭曉後 totalWinnings 應等於比大小中獎列的獎金加總", () => {
    useGameStore.getState().initGame(compareConfig);
    const card = useGameStore.getState().cards[0]!;

    // 從建牌結果計算預期獎金（玩家 compareValue > 莊家 compareValue → 贏 zone[2] prize）
    const expectedWinnings = card.zones[0]!.cells.reduce((sum, _, row) => {
      const playerVal = card.zones[0]!.cells[row]!.compareValue!;
      const dealerVal = card.zones[1]!.cells[row]!.compareValue!;
      const prize = card.zones[2]!.cells[row]!.prize;
      return playerVal > dealerVal ? sum + prize.amount : sum;
    }, 0);

    card.zones.forEach((zone) => {
      zone.cells.forEach((cell) => {
        useGameStore
          .getState()
          .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
      });
    });

    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(expectedWinnings);
  });
});

// ── computeWinnings ───────────────────────────────────────

describe("computeWinnings", () => {
  it("symbol：加總所有 isRevealed & isWin 格的獎金", () => {
    useGameStore.getState().initGame(config);
    const card = useGameStore.getState().cards[0]!;
    // 找一個中獎格，手動設 isRevealed
    const winCell = card.zones[0]!.cells.find((c) => c.prize.isWin);
    if (!winCell) return; // 若這張沒中獎格就跳過
    const fakeCard = {
      ...card,
      zones: [
        {
          ...card.zones[0]!,
          cells: card.zones[0]!.cells.map((c) =>
            c.id === winCell.id ? { ...c, isRevealed: true } : c,
          ),
        },
      ],
    };
    expect(computeWinnings(fakeCard, "symbol")).toBe(winCell.prize.amount);
  });

  it("triple：全揭曉後計算三同列獎金", () => {
    useGameStore.getState().initGame(tripleConfig);
    const card = useGameStore.getState().cards[0]!;
    const allRevealedZones = card.zones.map((zone) => ({
      ...zone,
      cells: zone.cells.map((c) => ({ ...c, isRevealed: true })),
    }));
    const fakeCard = { ...card, zones: allRevealedZones };
    const expectedWinnings = card.zones[0]!.cells.reduce((sum, _, row) => {
      const p0 = card.zones[0]!.cells[row]!.prize;
      const p1 = card.zones[1]!.cells[row]!.prize;
      const p2 = card.zones[2]!.cells[row]!.prize;
      return p0.id === p1.id && p1.id === p2.id ? sum + p0.amount : sum;
    }, 0);
    expect(computeWinnings(fakeCard, "triple")).toBe(expectedWinnings);
  });

  it("compare：全揭曉後計算比大小獎金", () => {
    useGameStore.getState().initGame(compareConfig);
    const card = useGameStore.getState().cards[0]!;
    const allRevealedZones = card.zones.map((zone) => ({
      ...zone,
      cells: zone.cells.map((c) => ({ ...c, isRevealed: true })),
    }));
    const fakeCard = { ...card, zones: allRevealedZones };
    const expectedWinnings = card.zones[0]!.cells.reduce((sum, _, row) => {
      const pv = card.zones[0]!.cells[row]!.compareValue!;
      const dv = card.zones[1]!.cells[row]!.compareValue!;
      const prize = card.zones[2]!.cells[row]!.prize;
      return pv > dv ? sum + prize.amount : sum;
    }, 0);
    expect(computeWinnings(fakeCard, "compare")).toBe(expectedWinnings);
  });

  it("bingo：計算完成線數 × prizePerLine", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    const g = BINGO_GRID_SIZE;
    const drawnSet = new Set(card.zones[0]!.cells.map((c) => c.bingoNumber!));
    const matched = card.zones[1]!.cells.map((c) =>
      drawnSet.has(c.bingoNumber!),
    );
    let lines = 0;
    for (let r = 0; r < g; r++) {
      if (
        Array.from({ length: g }, (_, c) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    for (let c = 0; c < g; c++) {
      if (
        Array.from({ length: g }, (_, r) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    if (Array.from({ length: g }, (_, i) => matched[i * g + i]).every(Boolean))
      lines++;
    if (
      Array.from({ length: g }, (_, i) => matched[i * g + (g - 1 - i)]).every(
        Boolean,
      )
    )
      lines++;
    const allRevealedZones = card.zones.map((zone) => ({
      ...zone,
      cells: zone.cells.map((c) => ({ ...c, isRevealed: true })),
    }));
    const fakeCard = { ...card, zones: allRevealedZones };
    expect(computeWinnings(fakeCard, "bingo", BINGO_PRIZE_PER_LINE)).toBe(
      lines * BINGO_PRIZE_PER_LINE,
    );
  });
});

// ── revealCard ────────────────────────────────────────────

describe("revealCard", () => {
  it("symbol：revealCard 後卡片狀態應為 completed", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    useGameStore.getState().revealCard(cardId);
    const updated = useGameStore.getState().cards.find((c) => c.id === cardId);
    expect(updated?.status).toBe("completed");
  });

  it("symbol：revealCard 後所有 cells 應 isRevealed=true", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().revealCard(cardId);
    const updated = useGameStore.getState().cards.find((c) => c.id === cardId);
    updated?.zones.forEach((zone) => {
      zone.cells.forEach((cell) => expect(cell.isRevealed).toBe(true));
    });
  });

  it("bingo：revealCard 後 zone[0] 和 zone[1] 均應全部揭曉", () => {
    useGameStore.getState().initGame(bingoConfig);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().revealCard(cardId);
    const updated = useGameStore.getState().cards.find((c) => c.id === cardId)!;
    // zone[0] 和 zone[1] 均應全部揭曉
    updated.zones[0]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(true);
      expect(cell.scratchProgress).toBe(1);
    });
    updated.zones[1]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(true);
    });
  });

  it("bingo：revealCard 後 totalWinnings 應正確計算", () => {
    useGameStore.getState().initGame(bingoConfig);
    const cardId = useGameStore.getState().cards[0]!.id;
    const card = useGameStore.getState().cards[0]!;
    const g = BINGO_GRID_SIZE;
    const drawnSet = new Set(card.zones[0]!.cells.map((c) => c.bingoNumber!));
    const matched = card.zones[1]!.cells.map((c) =>
      drawnSet.has(c.bingoNumber!),
    );
    let lines = 0;
    for (let r = 0; r < g; r++) {
      if (
        Array.from({ length: g }, (_, c) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    for (let c = 0; c < g; c++) {
      if (
        Array.from({ length: g }, (_, r) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    if (Array.from({ length: g }, (_, i) => matched[i * g + i]).every(Boolean))
      lines++;
    if (
      Array.from({ length: g }, (_, i) => matched[i * g + (g - 1 - i)]).every(
        Boolean,
      )
    )
      lines++;
    useGameStore.getState().revealCard(cardId);
    const updated = useGameStore.getState().cards.find((c) => c.id === cardId);
    expect(updated?.totalWinnings).toBe(lines * BINGO_PRIZE_PER_LINE);
  });

  it("對已完成卡片呼叫 revealCard 應為 no-op", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().revealCard(cardId);
    const after1 = useGameStore.getState().cards.find((c) => c.id === cardId);
    useGameStore.getState().revealCard(cardId);
    const after2 = useGameStore.getState().cards.find((c) => c.id === cardId);
    // 物件參考相同（no-op → map 回傳原物件）
    expect(after2).toBe(after1);
  });

  it("revealCard 後多張卡片全部完成時 phase 應仍為 scratching（需手動 nextCard）", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().revealCard(cards[0]!.id);
    expect(useGameStore.getState().phase).toBe("scratching");
    useGameStore.getState().revealCard(cards[1]!.id);
    // 多張時不自動跳 results
    expect(useGameStore.getState().phase).toBe("scratching");
  });

  it("revealCard 單張卡片完成時 phase 應自動跳 results", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().revealCard(cards[0]!.id);
    expect(useGameStore.getState().phase).toBe("results");
  });
});

// ── returnToPile ──────────────────────────────────────────

describe("returnToPile", () => {
  it("returnToPile 後 phase 應為 pile", () => {
    useGameStore.getState().initGame(config);
    useGameStore.getState().selectCard(useGameStore.getState().cards[0]!.id);
    useGameStore.getState().startScratching();
    useGameStore.getState().setPhase("results");
    useGameStore.getState().returnToPile();
    expect(useGameStore.getState().phase).toBe("pile");
  });

  it("returnToPile 後 selectedCardIds 應為空陣列", () => {
    useGameStore.getState().initGame(config);
    useGameStore.getState().selectCard(useGameStore.getState().cards[0]!.id);
    useGameStore.getState().returnToPile();
    expect(useGameStore.getState().selectedCardIds).toEqual([]);
  });

  it("returnToPile 後 cards 應為全新牌堆（所有卡片狀態為 in-pile）", () => {
    useGameStore.getState().initGame(config);
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    useGameStore.getState().returnToPile();
    const cards = useGameStore.getState().cards;
    expect(cards.every((c) => c.status === "in-pile")).toBe(true);
  });
});

// ── updateCellProgress (bingo) ────────────────────────────

const BINGO_GRID_SIZE = 3;
const BINGO_DRAWN_COUNT = 6;
const BINGO_PRIZE_PER_LINE = 100;

const bingoConfig: GameConfig = {
  sessionTitle: "賓果測試",
  cardTypes: [
    {
      mechanic: "bingo",
      prizes: [
        {
          id: "p-lose",
          label: "謝謝",
          amount: 0,
          probability: 1,
          isWin: false,
        },
      ],
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: {
        gridSize: BINGO_GRID_SIZE,
        drawnCount: BINGO_DRAWN_COUNT,
        prizePerLine: BINGO_PRIZE_PER_LINE,
      } satisfies BingoOptions,
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

describe("updateCellProgress (bingo)", () => {
  it("zone[0] 開獎號碼在建牌時初始為未揭曉（isRevealed=false，UI 中永遠可見不需刮除）", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones[0]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(false);
      expect(cell.scratchProgress).toBe(0);
    });
  });

  it("zone[1] 格子在建牌時 isRevealed=false", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones[1]!.cells.forEach((cell) => {
      expect(cell.isRevealed).toBe(false);
    });
  });

  it("zone[0] 有 drawnCount 格、zone[1] 有 gridSize² 格", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    expect(card.zones[0]!.cells).toHaveLength(BINGO_DRAWN_COUNT);
    expect(card.zones[1]!.cells).toHaveLength(
      BINGO_GRID_SIZE * BINGO_GRID_SIZE,
    );
  });

  it("揭曉部分 zone[1] 格子時 totalWinnings 應維持 0", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    const firstCell = card.zones[1]!.cells[0]!;
    useGameStore
      .getState()
      .updateCellProgress(card.id, firstCell.id, REVEAL_THRESHOLD);
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(0);
    expect(updated?.status).not.toBe("completed");
  });

  it("只揭曉 zone[1] 即完成，zone[0] 不影響結算", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    // 只刮 zone[1]（不碰 zone[0]）
    card.zones[1]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.status).toBe("completed");
  });

  it("只揭曉 zone[0] 不應完成（zone[1] 未刮）", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.status).not.toBe("completed");
  });

  it("zone[0] + zone[1] 全部揭曉後 totalWinnings 應等於完成線數 × prizePerLine", () => {
    useGameStore.getState().initGame(bingoConfig);
    const card = useGameStore.getState().cards[0]!;
    const g = BINGO_GRID_SIZE;

    // 從建牌結果計算預期獎金（全部 zone[0] 號碼均為 drawnSet）
    const drawnSet = new Set(card.zones[0]!.cells.map((c) => c.bingoNumber!));
    const gridCells = card.zones[1]!.cells;
    const matched = gridCells.map((c) => drawnSet.has(c.bingoNumber!));

    let lines = 0;
    for (let r = 0; r < g; r++) {
      if (
        Array.from({ length: g }, (_, c) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    for (let c = 0; c < g; c++) {
      if (
        Array.from({ length: g }, (_, r) => matched[r * g + c]).every(Boolean)
      )
        lines++;
    }
    if (Array.from({ length: g }, (_, i) => matched[i * g + i]).every(Boolean))
      lines++;
    if (
      Array.from({ length: g }, (_, i) => matched[i * g + (g - 1 - i)]).every(
        Boolean,
      )
    )
      lines++;

    const expectedWinnings = lines * BINGO_PRIZE_PER_LINE;

    // 揭曉 zone[0] 和 zone[1] 全部格
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    card.zones[1]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    const updated = useGameStore.getState().cards.find((c) => c.id === card.id);
    expect(updated?.totalWinnings).toBe(expectedWinnings);
  });
});
