import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore } from "@/stores/gameStore";
import ScratchCard from "./ScratchCard";
import type { GameConfig, BingoOptions } from "@/types";

// canvas mock
HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
  globalCompositeOperation: "source-over",
  globalAlpha: 1,
  strokeStyle: "",
  lineWidth: 1,
  fillStyle: "",
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
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

  it("應顯示玩法規則提示文字", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const els = screen.getAllByText(/刮出相同符號即中獎/);
    expect(els.length).toBeGreaterThanOrEqual(1);
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

  it("scratching 中應顯示累計金額計數器", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    const cells = useGameStore.getState().cards[0]!.zones[0]!.cells;
    // 揭曉部分格子（模擬 scratching 中）
    useGameStore.getState().updateCellProgress(cardId, cells[0]!.id, 1.0);
    render(<ScratchCard cardId={cardId} />);
    expect(screen.getByTestId("running-total")).toBeInTheDocument();
  });

  it("completed 時不應顯示累計金額計數器", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    useGameStore.getState().selectCard(cardId);
    useGameStore.getState().startScratching();
    const cells = useGameStore.getState().cards[0]!.zones[0]!.cells;
    cells.forEach((cell) => {
      useGameStore.getState().updateCellProgress(cardId, cell.id, 1.0);
    });
    render(<ScratchCard cardId={cardId} />);
    expect(screen.queryByTestId("running-total")).not.toBeInTheDocument();
  });

  it("in-pile 狀態不應顯示累計金額計數器", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    expect(screen.queryByTestId("running-total")).not.toBeInTheDocument();
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

  it("zone[0] 開獎號碼應永遠可見（靜態文字，無 BingoCellCanvas）", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const card = useGameStore.getState().cards[0]!;
    // zone[0] 改為靜態顯示，data-testid=zone0-num-{id}
    card.zones[0]!.cells.forEach((cell) => {
      expect(screen.getByTestId(`zone0-num-${cell.id}`)).toBeInTheDocument();
    });
    // zone[0] 不再用 BingoCellCanvas，其 testid 不應存在
    card.zones[0]!.cells.forEach((cell) => {
      expect(
        screen.queryByTestId(`bingo-cell-${cell.id}`),
      ).not.toBeInTheDocument();
    });
  });

  it("zone[0] 號碼全部可見，zone[1] 對應格初始即高亮", () => {
    const cardId = useGameStore.getState().cards[0]!.id;
    render(<ScratchCard cardId={cardId} />);
    const card = useGameStore.getState().cards[0]!;
    const drawnNums = new Set(card.zones[0]!.cells.map((c) => c.bingoNumber!));
    card.zones[1]!.cells.forEach((cell) => {
      const el = screen.getByTestId(`bingo-cell-${cell.id}`);
      const expected = drawnNums.has(cell.bingoNumber!);
      expect(el.getAttribute("data-matched")).toBe(String(expected));
    });
  });
});
