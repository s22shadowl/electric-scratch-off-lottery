import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore, REVEAL_THRESHOLD } from "@/stores/gameStore";
import ScratchCard from "./ScratchCard";
import type { GameConfig, BingoOptions } from "@/types";

// canvas mock
HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
  globalCompositeOperation: "source-over",
  fillStyle: "",
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(16 * 4).fill(255),
  })),
  putImageData: vi.fn(),
} as unknown as CanvasRenderingContext2D);

const config: GameConfig = {
  sessionTitle: "測試",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes: [
        {
          id: "p-lose",
          label: "謝謝",
          amount: 0,
          probability: 0.5,
          isWin: false,
        },
        {
          id: "p-win",
          label: "$200",
          amount: 200,
          probability: 0.5,
          isWin: true,
        },
      ],
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 4 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
  useGameStore.getState().initGame(config);
});

describe("ScratchCard", () => {
  it("應渲染卡片容器", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    expect(screen.getByTestId(`scratch-card-${cardId}`)).toBeInTheDocument();
  });

  it("應渲染所有刮除格", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const cells = useGameStore.getState().cards[0]!.zones[0]!.cells;
    cells.forEach((cell) => {
      expect(screen.getByTestId(`scratch-cell-${cell.id}`)).toBeInTheDocument();
    });
  });

  it("未完成時應顯示進度提示", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    expect(screen.getByText(/已刮開/)).toBeInTheDocument();
  });

  it("所有格揭曉後應顯示結果", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    const cells = useGameStore.getState().cards[0]!.zones[0]!.cells;
    // 模擬全部揭曉
    cells.forEach((cell) => {
      useGameStore.getState().updateCellProgress(cardId, cell.id, 1.0);
    });
    render(<ScratchCard cardId={cardId} />);
    expect(screen.getByTestId("card-result")).toBeInTheDocument();
  });

  it("cardId 不存在時應不渲染任何內容", () => {
    const { container } = render(<ScratchCard cardId="non-existent" />);
    expect(container.firstChild).toBeNull();
  });

  it("未完成時應顯示一鍵刮開按鈕", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    expect(
      screen.getByRole("button", { name: /一鍵刮開/ }),
    ).toBeInTheDocument();
  });

  it("完成後不應顯示一鍵刮開按鈕", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    const cells = useGameStore.getState().cards[0]!.zones[0]!.cells;
    cells.forEach((cell) => {
      useGameStore.getState().updateCellProgress(cardId, cell.id, 1.0);
    });
    render(<ScratchCard cardId={cardId} />);
    expect(
      screen.queryByRole("button", { name: /一鍵刮開/ }),
    ).not.toBeInTheDocument();
  });
});

// ── bingo 玩法 ─────────────────────────────────────────────

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
        gridSize: 3,
        drawnCount: 6,
        prizePerLine: 100,
      } satisfies BingoOptions,
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

describe("ScratchCard (bingo)", () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
    useGameStore.getState().initGame(bingoConfig);
  });

  it("應渲染 zone[1] 的賓果格（BingoCellCanvas）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const card = useGameStore.getState().cards[0]!;
    card.zones[1]!.cells.forEach((cell) => {
      expect(screen.getByTestId(`bingo-cell-${cell.id}`)).toBeInTheDocument();
    });
  });

  it("zone[0] 開獎號碼應以 BingoCellCanvas 渲染（scratch-off）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const card = useGameStore.getState().cards[0]!;
    // zone[0] 的每格應有 data-testid=bingo-cell-{id}（BingoCellCanvas 渲染）
    card.zones[0]!.cells.forEach((cell) => {
      expect(screen.getByTestId(`bingo-cell-${cell.id}`)).toBeInTheDocument();
    });
  });

  it("進度提示計算 zone[0] + zone[1] 格數（兩個 zone 均需刮開）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    // gridSize=3 → zone[0]=6格 + zone[1]=9格 = 15格
    expect(screen.getByText(/0 \/ 15/)).toBeInTheDocument();
  });

  it("zone[0] 格揭曉後，zone[1] 對應號碼的格子應有高亮（D1：drawnSet 即時更新）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    const card = useGameStore.getState().cards[0]!;
    // 找一個 zone[0] 格，其號碼也出現在 zone[1]
    const zone0Nums = new Set(card.zones[0]!.cells.map((c) => c.bingoNumber!));
    const matchedZone1Cell = card.zones[1]!.cells.find((c) =>
      zone0Nums.has(c.bingoNumber!),
    );
    if (!matchedZone1Cell) return; // 理論上必有配對
    const matchedNum = matchedZone1Cell.bingoNumber!;
    // 找 zone[0] 中含該號碼的格
    const zone0Cell = card.zones[0]!.cells.find(
      (c) => c.bingoNumber === matchedNum,
    )!;
    // 揭曉 zone[0] 的該格
    useGameStore
      .getState()
      .updateCellProgress(cardId, zone0Cell.id, REVEAL_THRESHOLD);
    render(<ScratchCard cardId={cardId} />);
    // zone[1] 中對應號碼的格子（BingoCellCanvas）應有 data-matched=true
    const zone1CellEl = screen.getByTestId(`bingo-cell-${matchedZone1Cell.id}`);
    expect(zone1CellEl.getAttribute("data-matched")).toBe("true");
  });

  it("zone[0] 格未揭曉時，zone[1] 中對應格子不應高亮（data-matched=false）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const card = useGameStore.getState().cards[0]!;
    // zone[0] 全未揭曉，所有 zone[1] 格應 data-matched=false
    card.zones[1]!.cells.forEach((cell) => {
      const el = screen.getByTestId(`bingo-cell-${cell.id}`);
      expect(el.getAttribute("data-matched")).toBe("false");
    });
  });
});
