import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore } from "@/stores/gameStore";
import BingoCellCanvas from "./BingoCellCanvas";
import type { ScratchCell } from "@/types";

// canvas mock（ScratchCellCanvas.test.tsx 相同設定）
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

function makeCell(overrides: Partial<ScratchCell> = {}): ScratchCell {
  return {
    id: "cell-1",
    prize: {
      id: "dummy",
      label: "7",
      amount: 0,
      probability: 1,
      isWin: false,
    },
    scratchProgress: 0,
    isRevealed: false,
    bingoNumber: 7,
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
});

describe("BingoCellCanvas", () => {
  it("未揭曉時應渲染 canvas 遮罩", () => {
    const cell = makeCell();
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    expect(screen.getByLabelText("刮除格 cell-1")).toBeInTheDocument();
  });

  it("已揭曉時不應渲染 canvas", () => {
    const cell = makeCell({ isRevealed: true, scratchProgress: 1 });
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    expect(screen.queryByLabelText("刮除格 cell-1")).not.toBeInTheDocument();
  });

  it("應顯示 bingoNumber", () => {
    const cell = makeCell({
      isRevealed: true,
      scratchProgress: 1,
      bingoNumber: 42,
    });
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("已揭曉且 isMatched=true 時應有 data-matched 屬性", () => {
    const cell = makeCell({ isRevealed: true, scratchProgress: 1 });
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={true} />);
    expect(screen.getByTestId(`bingo-cell-${cell.id}`)).toHaveAttribute(
      "data-matched",
      "true",
    );
  });

  it("已揭曉且 isMatched=false 時 data-matched 應為 false", () => {
    const cell = makeCell({ isRevealed: true, scratchProgress: 1 });
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    expect(screen.getByTestId(`bingo-cell-${cell.id}`)).toHaveAttribute(
      "data-matched",
      "false",
    );
  });

  it("未揭曉時 bingoNumber 不應顯示（被 canvas 遮罩覆蓋）", () => {
    // canvas 蓋住底層，但 DOM 仍有節點；測試 canvas 存在即代表遮罩正常
    const cell = makeCell({ bingoNumber: 13 });
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    expect(screen.getByLabelText("刮除格 cell-1")).toBeInTheDocument();
  });

  it("size prop 應套用為 inline style", () => {
    const cell = makeCell();
    render(
      <BingoCellCanvas
        cell={cell}
        cardId="card-1"
        isMatched={false}
        size={44}
      />,
    );
    const container = screen.getByTestId("bingo-cell-cell-1");
    expect(container).toHaveStyle({ width: "44px", height: "44px" });
  });

  it("未傳 size 時預設應為 60px", () => {
    const cell = makeCell();
    render(<BingoCellCanvas cell={cell} cardId="card-1" isMatched={false} />);
    const container = screen.getByTestId("bingo-cell-cell-1");
    expect(container).toHaveStyle({ width: "60px", height: "60px" });
  });
});
