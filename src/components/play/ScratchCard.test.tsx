import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore } from "@/stores/gameStore";
import ScratchCard from "./ScratchCard";
import type { GameConfig } from "@/types";

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
} as unknown as CanvasRenderingContext2D);

const config: GameConfig = {
  sessionTitle: "測試",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes: [
        { id: "p-lose", label: "謝謝", amount: 0, probability: 0.5, isWin: false },
        { id: "p-win", label: "$200", amount: 200, probability: 0.5, isWin: true },
      ],
      count: 1,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 4 },
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
});
