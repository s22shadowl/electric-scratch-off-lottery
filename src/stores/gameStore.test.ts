import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, REVEAL_THRESHOLD } from "./gameStore";
import type { GameConfig } from "@/types";

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

  it("所有選取卡片刮完後 phase 應自動切換為 results", () => {
    useGameStore.getState().initGame(config);
    const cards = useGameStore.getState().cards;
    // 選前兩張牌並開始刮
    useGameStore.getState().selectCard(cards[0]!.id);
    useGameStore.getState().selectCard(cards[1]!.id);
    useGameStore.getState().startScratching();
    // 刮完第一張
    cards[0]!.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(cards[0]!.id, cell.id, REVEAL_THRESHOLD);
    });
    // 尚未全部完成，phase 仍為 scratching
    expect(useGameStore.getState().phase).toBe("scratching");
    // 刮完第二張
    cards[1]!.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(cards[1]!.id, cell.id, REVEAL_THRESHOLD);
    });
    // 所有選取卡片完成，phase 應切換為 results
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
