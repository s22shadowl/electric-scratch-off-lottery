import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useGameStore, REVEAL_THRESHOLD } from "@/stores/gameStore";
import { useToastStore } from "@/stores/toastStore";
import ResultsPage from "./ResultsPage";
import type { GameConfig } from "@/types";

// mock captureAndShare（避免 html2canvas 在 jsdom 報錯）
vi.mock("@/utils/screenshot", () => ({
  captureAndShare: vi.fn().mockResolvedValue(undefined),
}));

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
  sessionTitle: "測試活動",
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
          label: "$500",
          amount: 500,
          probability: 0.5,
          isWin: true,
        },
      ],
      count: 3,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 2 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

/** 初始化遊戲並讓前 n 張牌進入 results 階段 */
function setupResultsPhase(winCardCount = 1) {
  useGameStore.getState().initGame(config);
  const cards = useGameStore.getState().cards;
  const [card0, card1] = cards;
  useGameStore.getState().selectCard(card0!.id);
  useGameStore.getState().selectCard(card1!.id);
  useGameStore.getState().startScratching();

  // 讓所有格子揭曉（直接用 store 操作）
  [card0!, card1!].forEach((card, idx) => {
    card.zones[0]!.cells.forEach((cell) => {
      useGameStore
        .getState()
        .updateCellProgress(card.id, cell.id, REVEAL_THRESHOLD);
    });
    // 每張卡都強制設定 totalWinnings，避免隨機 prize 影響結果
    const shouldWin = idx < winCardCount;
    const updatedCards = useGameStore.getState().cards.map((c) =>
      c.id === card.id
        ? {
            ...c,
            totalWinnings: shouldWin ? 500 : 0,
            zones: shouldWin
              ? [
                  {
                    ...c.zones[0]!,
                    cells: c.zones[0]!.cells.map((cell, i) =>
                      i === 0
                        ? {
                            ...cell,
                            isRevealed: true,
                            prize: {
                              ...cell.prize,
                              isWin: true,
                              amount: 500,
                            },
                          }
                        : cell,
                    ),
                  },
                  ...c.zones.slice(1),
                ]
              : c.zones,
          }
        : c,
    );
    useGameStore.setState({ cards: updatedCards });
  });
  // 手動設 phase = results（模擬自動切換後）
  useGameStore.getState().setPhase("results");
}

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
  useToastStore.setState({ message: null, type: "info" });
});

describe("ResultsPage", () => {
  it("應渲染結果頁容器", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    expect(screen.getByTestId("results-page")).toBeInTheDocument();
  });

  it("應渲染結果匯總區", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    expect(screen.getByTestId("results-summary")).toBeInTheDocument();
  });

  it("應渲染 total-winnings", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    expect(screen.getByTestId("total-winnings")).toBeInTheDocument();
  });

  it("應渲染與選取卡片數量相同的摘要按鈕", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const selectedIds = useGameStore.getState().selectedCardIds;
    selectedIds.forEach((id) => {
      expect(screen.getByTestId(`result-card-${id}`)).toBeInTheDocument();
    });
  });

  it("點擊卡片摘要後應顯示 Modal", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const selectedIds = useGameStore.getState().selectedCardIds;
    fireEvent.click(screen.getByTestId(`result-card-${selectedIds[0]}`));
    expect(screen.getByTestId("card-detail-modal")).toBeInTheDocument();
  });

  it("點擊 Modal 關閉按鈕後 Modal 應消失", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const selectedIds = useGameStore.getState().selectedCardIds;
    fireEvent.click(screen.getByTestId(`result-card-${selectedIds[0]}`));
    expect(screen.getByTestId("card-detail-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(screen.queryByTestId("card-detail-modal")).not.toBeInTheDocument();
  });

  it("點擊 Modal 背景遮罩後 Modal 應消失", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const selectedIds = useGameStore.getState().selectedCardIds;
    fireEvent.click(screen.getByTestId(`result-card-${selectedIds[0]}`));
    const modal = screen.getByTestId("card-detail-modal");
    // 點擊 modal 的父層（遮罩層）
    fireEvent.click(modal.parentElement!);
    expect(screen.queryByTestId("card-detail-modal")).not.toBeInTheDocument();
  });

  it("有中獎時 total-winnings 應顯示金額", () => {
    setupResultsPhase(1);
    render(<ResultsPage />);
    const winnings = screen.getByTestId("total-winnings");
    expect(winnings.textContent).toContain("500");
  });

  it("應顯示「截圖結果」按鈕且可點擊", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const btn = screen.getByTestId("capture-summary-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("點擊「截圖結果」應呼叫 captureAndShare", async () => {
    const { captureAndShare } = await import("@/utils/screenshot");
    setupResultsPhase(0);
    render(<ResultsPage />);
    fireEvent.click(screen.getByTestId("capture-summary-btn"));
    // 非同步，等 microtask
    await Promise.resolve();
    expect(captureAndShare).toHaveBeenCalled();
  });

  it("Modal 中應顯示「截圖此張」按鈕", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    const selectedIds = useGameStore.getState().selectedCardIds;
    fireEvent.click(screen.getByTestId(`result-card-${selectedIds[0]}`));
    expect(screen.getByTestId("capture-card-btn")).toBeInTheDocument();
  });

  it("截圖失敗時應呼叫 showToast 並記錄 console.error", async () => {
    const { captureAndShare } = await import("@/utils/screenshot");
    vi.mocked(captureAndShare).mockRejectedValueOnce(new Error("截圖錯誤"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    setupResultsPhase(0);
    render(<ResultsPage />);
    fireEvent.click(screen.getByTestId("capture-summary-btn"));
    await waitFor(() => {
      expect(useToastStore.getState().message).toBe("截圖失敗，請再試一次");
      expect(useToastStore.getState().type).toBe("error");
      expect(console.error).toHaveBeenCalledWith(
        "[截圖 summary 失敗]",
        expect.any(Error),
      );
    });
  });

  it("結果頁應顯示統計資訊", () => {
    setupResultsPhase(1);
    render(<ResultsPage />);
    const stats = screen.getByTestId("results-stats");
    expect(stats).toBeInTheDocument();
    expect(stats.textContent).toContain("共 2 張");
    expect(stats.textContent).toContain("中獎 1 張");
    expect(stats.textContent).toContain("總投入");
    expect(stats.textContent).toContain("報酬率");
  });

  it("結果頁應有分享按鈕", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    expect(screen.getByTestId("share-btn")).toBeInTheDocument();
  });

  it("allowReturnToPile=true 時應顯示「返回牌堆」按鈕", () => {
    useGameStore.getState().initGame({ ...config, allowReturnToPile: true });
    setupResultsPhase(0);
    useGameStore.setState({
      config: { ...useGameStore.getState().config, allowReturnToPile: true },
    });
    render(<ResultsPage />);
    expect(screen.getByTestId("return-to-pile-btn")).toBeInTheDocument();
  });

  it("allowReturnToPile=false 時不應顯示「返回牌堆」按鈕", () => {
    setupResultsPhase(0);
    render(<ResultsPage />);
    expect(screen.queryByTestId("return-to-pile-btn")).not.toBeInTheDocument();
  });

  it("allowReturnToPile=undefined 時不應顯示「返回牌堆」按鈕", () => {
    setupResultsPhase(0);
    const currentConfig = useGameStore.getState().config;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allowReturnToPile: _arp, ...configWithout } = currentConfig;
    useGameStore.setState({ config: configWithout as typeof currentConfig });
    render(<ResultsPage />);
    expect(screen.queryByTestId("return-to-pile-btn")).not.toBeInTheDocument();
  });

  it("點擊「返回牌堆」按鈕應呼叫 returnToPile（phase 變回 pile）", () => {
    setupResultsPhase(0);
    useGameStore.setState({
      config: { ...useGameStore.getState().config, allowReturnToPile: true },
    });
    render(<ResultsPage />);
    fireEvent.click(screen.getByTestId("return-to-pile-btn"));
    expect(useGameStore.getState().phase).toBe("pile");
  });
});
