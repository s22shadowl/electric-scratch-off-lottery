import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RulesModal from "./RulesModal";
import type { CardTypeConfig } from "@/types";

const symbolCardType: CardTypeConfig = {
  mechanic: "symbol",
  prizes: [
    { id: "p1", label: "謝謝", amount: 0, probability: 0.7, isWin: false },
    { id: "p2", label: "$100", amount: 100, probability: 0.3, isWin: true },
  ],
  count: 4,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { cellsPerZone: 3 },
  ticketPrice: 100,
};

const tripleCardType: CardTypeConfig = {
  mechanic: "triple",
  prizes: [
    { id: "p1", label: "謝謝", amount: 0, probability: 0.7, isWin: false },
    { id: "p2", label: "$100", amount: 100, probability: 0.3, isWin: true },
  ],
  count: 4,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { rowsPerCard: 3 },
  ticketPrice: 100,
};

const compareCardType: CardTypeConfig = {
  mechanic: "compare",
  prizes: [
    { id: "p1", label: "謝謝", amount: 0, probability: 0.7, isWin: false },
    { id: "p2", label: "$200", amount: 200, probability: 0.3, isWin: true },
  ],
  count: 4,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { rowsPerCard: 3 },
  ticketPrice: 100,
};

const bingoCardType: CardTypeConfig = {
  mechanic: "bingo",
  prizes: [],
  count: 4,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { gridSize: 3, drawnCount: 6, prizePerLine: 100 },
  ticketPrice: 100,
};

describe("RulesModal", () => {
  it("應渲染 dialog", () => {
    render(<RulesModal cardTypes={[symbolCardType]} onClose={() => {}} />);
    expect(
      screen.getByRole("dialog", { name: "玩法說明" }),
    ).toBeInTheDocument();
  });

  it("symbol 玩法應顯示符號玩法說明文字", () => {
    render(<RulesModal cardTypes={[symbolCardType]} onClose={() => {}} />);
    expect(screen.getByText(/符號玩法/)).toBeInTheDocument();
    expect(screen.getByText(/刮開格子，底下藏著符號/)).toBeInTheDocument();
  });

  it("triple 玩法應顯示三同玩法說明文字", () => {
    render(<RulesModal cardTypes={[tripleCardType]} onClose={() => {}} />);
    expect(screen.getByText(/三同玩法/)).toBeInTheDocument();
    expect(screen.getByText(/三格顯示相同符號才算中獎/)).toBeInTheDocument();
  });

  it("compare 玩法應顯示比大小玩法說明文字", () => {
    render(<RulesModal cardTypes={[compareCardType]} onClose={() => {}} />);
    expect(screen.getByText(/比大小玩法/)).toBeInTheDocument();
    expect(screen.getByText(/你大才贏/)).toBeInTheDocument();
  });

  it("bingo 玩法應顯示賓果玩法說明文字", () => {
    render(<RulesModal cardTypes={[bingoCardType]} onClose={() => {}} />);
    expect(screen.getByText(/賓果玩法/)).toBeInTheDocument();
    expect(screen.getByText(/刮開開獎號碼/)).toBeInTheDocument();
  });

  it("多 cardType 時應顯示 Tab bar", () => {
    render(
      <RulesModal
        cardTypes={[symbolCardType, tripleCardType]}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "符號" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "三同" })).toBeInTheDocument();
  });

  it("多 cardType 時切換 Tab 應顯示對應說明", async () => {
    render(
      <RulesModal
        cardTypes={[symbolCardType, tripleCardType]}
        onClose={() => {}}
      />,
    );
    // 預設顯示 symbol
    expect(screen.getByText(/符號玩法/)).toBeInTheDocument();
    // 切換到 triple
    await userEvent.click(screen.getByRole("button", { name: "三同" }));
    expect(screen.getByText(/三同玩法/)).toBeInTheDocument();
    expect(screen.queryByText(/符號玩法/)).not.toBeInTheDocument();
  });

  it("點擊背景遮罩應呼叫 onClose", async () => {
    const onClose = vi.fn();
    render(<RulesModal cardTypes={[symbolCardType]} onClose={onClose} />);
    const backdrop = screen
      .getByRole("dialog", { name: "玩法說明" })
      .querySelector('[aria-hidden="true"]') as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("點擊 × 按鈕應呼叫 onClose", async () => {
    const onClose = vi.fn();
    render(<RulesModal cardTypes={[symbolCardType]} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
