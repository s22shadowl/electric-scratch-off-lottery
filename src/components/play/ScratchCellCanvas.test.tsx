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

  it("揭曉後不應有 win-flash 動畫", () => {
    // 中獎格揭曉後也不應出現 win-flash
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

  it("未中獎格揭曉後應顯示 $0 金額", () => {
    const cell = makeCell({ isRevealed: true });
    render(<ScratchCellCanvas cell={cell} cardId="card-1" maxPrize={1000} />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("已揭曉的中獎格應有 win-border", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "w",
        label: "$300",
        amount: 300,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="c1" maxPrize={1000} />);
    const el = screen.getByTestId(`scratch-cell-${cell.id}`);
    expect(el.className).toContain("ring-");
  });

  it("未中獎格不應有 win-border", () => {
    const cell = makeCell({
      isRevealed: true,
      prize: {
        id: "l",
        label: "謝謝",
        amount: 0,
        probability: 1,
        isWin: false,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="c1" maxPrize={1000} />);
    const el = screen.getByTestId(`scratch-cell-${cell.id}`);
    expect(el.className).not.toContain("ring-");
  });

  it("未揭曉的中獎格不應有 win-border", () => {
    const cell = makeCell({
      isRevealed: false,
      prize: {
        id: "w",
        label: "$300",
        amount: 300,
        probability: 1,
        isWin: true,
      },
    });
    render(<ScratchCellCanvas cell={cell} cardId="c1" maxPrize={1000} />);
    const el = screen.getByTestId(`scratch-cell-${cell.id}`);
    expect(el.className).not.toContain("ring-");
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
