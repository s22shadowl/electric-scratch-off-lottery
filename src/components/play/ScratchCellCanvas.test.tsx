import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useGameStore } from "@/stores/gameStore";
import ScratchCellCanvas from "./ScratchCellCanvas";
import type { ScratchCell } from "@/types";

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

// 測試用 cell factory
function makeCell(overrides: Partial<ScratchCell> = {}): ScratchCell {
  return {
    id: "cell-1",
    prize: {
      id: "p-lose",
      label: "謝謝",
      amount: 0,
      probability: 1,
      isWin: false,
    },
    scratchProgress: 0,
    isRevealed: false,
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
});

describe("ScratchCellCanvas", () => {
  it("未揭曉時應渲染 canvas 遮罩", () => {
    const cell = makeCell();
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByLabelText("刮除格 cell-1")).toBeInTheDocument();
  });

  it("已揭曉時不應渲染 canvas", () => {
    const cell = makeCell({ isRevealed: true });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.queryByLabelText("刮除格 cell-1")).not.toBeInTheDocument();
  });

  it("level 0：未中獎揭曉後不應有 win-flash", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-lose",
        label: "謝謝",
        amount: 0,
        probability: 1,
        isWin: false,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.queryByTestId("win-flash")).not.toBeInTheDocument();
  });

  it("level 1：小獎（< 10% max）應有 win-flash", () => {
    // amount=50, maxPrize=1000 → ratio=0.05 → level 1
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-small",
        label: "$50",
        amount: 50,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByTestId("win-flash")).toBeInTheDocument();
  });

  it("level 2：中獎（10–50% max）應有 win-flash", () => {
    // amount=200, maxPrize=1000 → ratio=0.2 → level 2
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-mid",
        label: "$200",
        amount: 200,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByTestId("win-flash")).toBeInTheDocument();
  });

  it("level 3：大獎（> 50% max）應有 win-flash", () => {
    // amount=800, maxPrize=1000 → ratio=0.8 → level 3
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-big",
        label: "$800",
        amount: 800,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByTestId("win-flash")).toBeInTheDocument();
  });

  it("maxPrize 為 0 時，中獎格 level 應為 0（無 win-flash）", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-win",
        label: "$100",
        amount: 100,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={0} />);
    expect(screen.queryByTestId("win-flash")).not.toBeInTheDocument();
  });

  it("應渲染粒子 canvas overlay", () => {
    const cell = makeCell();
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(
      screen.getByTestId(`particle-canvas-${cell.id}`),
    ).toBeInTheDocument();
  });

  it("symbolCode 有 sprite 且已揭曉時應渲染 img（alt 為 spriteLabel）", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-star",
        label: "星星",
        amount: 0,
        probability: 1,
        isWin: false,
        symbolCode: "STAR",
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    // STAR 的 spriteLabel 為「金幣」（圖片實際內容）
    expect(screen.getByRole("img", { name: "金幣" })).toBeInTheDocument();
  });

  it("中獎格揭曉後應顯示 $XXX 格式金額", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "p-win",
        label: "大獎",
        amount: 1000,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("未中獎格揭曉後應顯示 label 文字而非 $0", () => {
    const cell = makeCell({ isRevealed: true });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByText("謝謝")).toBeInTheDocument();
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
  });

  it("symbolCode 有 sprite 且未揭曉時 img 應 aria-hidden 且 alt 為空", () => {
    const cell = makeCell({
      isRevealed: false,
      prize: {
        id: "p-star",
        label: "星星",
        amount: 0,
        probability: 1,
        isWin: false,
        symbolCode: "STAR",
      },
    });
    const { container } = render(
      <ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("alt", "");
  });
});
