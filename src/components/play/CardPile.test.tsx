import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGameStore } from "@/stores/gameStore";
import CardPile from "./CardPile";
import type { GameConfig } from "@/types";

const config: GameConfig = {
  sessionTitle: "測試活動",
  cardTypes: [
    {
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
    },
  ],
  effectsEnabled: true,
};

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
  useGameStore.getState().initGame(config);
});

describe("CardPile", () => {
  it("應渲染所有卡片", () => {
    render(<CardPile />);
    expect(screen.getAllByRole("button", { name: /刮刮樂/ })).toHaveLength(
      config.cardTypes[0]!.count,
    );
  });

  it("應顯示 ⓘ 查看獎池按鈕", () => {
    render(<CardPile />);
    expect(
      screen.getByRole("button", { name: /查看獎池/ }),
    ).toBeInTheDocument();
  });

  it("點擊 ⓘ 按鈕應開啟獎池 Modal", async () => {
    render(<CardPile />);
    await userEvent.click(screen.getByRole("button", { name: /查看獎池/ }));
    expect(
      screen.getByRole("dialog", { name: /獎池資訊/ }),
    ).toBeInTheDocument();
  });

  it("點擊卡片應選取該卡", async () => {
    render(<CardPile />);
    const buttons = screen.getAllByRole("button", { name: /刮刮樂/ });
    await userEvent.click(buttons[0]!);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("再次點擊已選取的卡片應取消選取", async () => {
    render(<CardPile />);
    const btn = screen.getAllByRole("button", { name: /刮刮樂/ })[0]!;
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("未選任何卡片時不應顯示「開始刮」按鈕", () => {
    render(<CardPile />);
    expect(
      screen.queryByRole("button", { name: /開始刮/ }),
    ).not.toBeInTheDocument();
  });

  it("選取卡片後應顯示「開始刮」按鈕", async () => {
    render(<CardPile />);
    await userEvent.click(
      screen.getAllByRole("button", { name: /刮刮樂/ })[0]!,
    );
    expect(screen.getByRole("button", { name: /開始刮/ })).toBeInTheDocument();
  });

  it("應顯示目前選取數量", async () => {
    render(<CardPile />);
    await userEvent.click(
      screen.getAllByRole("button", { name: /刮刮樂/ })[0]!,
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: /刮刮樂/ })[1]!,
    );
    expect(screen.getByText(/已選 2 張/)).toBeInTheDocument();
  });

  it("點擊「開始刮」後 phase 應切換為 scratching", async () => {
    render(<CardPile />);
    await userEvent.click(
      screen.getAllByRole("button", { name: /刮刮樂/ })[0]!,
    );
    await userEvent.click(screen.getByRole("button", { name: /開始刮/ }));
    expect(useGameStore.getState().phase).toBe("scratching");
  });

  it("點擊 ⓘ 按鈕後應開啟獎池 Modal", async () => {
    render(<CardPile />);
    await userEvent.click(screen.getByRole("button", { name: /查看獎池/ }));
    expect(
      screen.getByRole("dialog", { name: /獎池資訊/ }),
    ).toBeInTheDocument();
  });

  it("應顯示「玩法說明」按鈕", () => {
    render(<CardPile />);
    expect(
      screen.getByRole("button", { name: "玩法說明" }),
    ).toBeInTheDocument();
  });

  it("點擊「玩法說明」按鈕後應開啟 RulesModal", async () => {
    render(<CardPile />);
    await userEvent.click(screen.getByRole("button", { name: "玩法說明" }));
    expect(
      screen.getByRole("dialog", { name: "玩法說明" }),
    ).toBeInTheDocument();
  });

  it("關閉 RulesModal 後 dialog 應消失", async () => {
    render(<CardPile />);
    await userEvent.click(screen.getByRole("button", { name: "玩法說明" }));
    expect(
      screen.getByRole("dialog", { name: "玩法說明" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(
      screen.queryByRole("dialog", { name: "玩法說明" }),
    ).not.toBeInTheDocument();
  });
});
