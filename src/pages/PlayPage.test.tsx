import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useGameStore, REVEAL_THRESHOLD } from "@/stores/gameStore";
import { encodeConfig } from "@/utils/config-codec";
import PlayPage from "./PlayPage";
import type { GameConfig } from "@/types";

const config: GameConfig = {
  sessionTitle: "年終抽獎活動",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes: [
        { id: "p1", label: "謝謝", amount: 0, probability: 0.7, isWin: false },
        { id: "p2", label: "$100", amount: 100, probability: 0.3, isWin: true },
      ],
      count: 5,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 6 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

const totalCardCount = config.cardTypes.reduce((s, ct) => s + ct.count, 0);

function completeCard(cardId: string) {
  const card = useGameStore.getState().cards.find((c) => c.id === cardId)!;
  for (const zone of card.zones) {
    for (const cell of zone.cells) {
      useGameStore.getState().updateCellProgress(cardId, cell.id, REVEAL_THRESHOLD);
    }
  }
}

const renderWithRoute = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/play${search}`]}>
      <Routes>
        <Route path="/play" element={<PlayPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PlayPage", () => {
  it("有效 config 參數時應渲染遊玩頁", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(screen.getByTestId("play-page")).toBeInTheDocument();
    });
  });

  it("有效 config 時應顯示活動名稱", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "年終抽獎活動" }),
      ).toBeInTheDocument();
    });
  });

  it("有效 config 時應初始化 store（cards 數量正確）", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
  });

  it("缺少 config 參數時應顯示錯誤訊息", async () => {
    renderWithRoute("");
    await waitFor(() => {
      expect(screen.getByTestId("play-page-error")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("config 參數無效時應顯示錯誤訊息", async () => {
    renderWithRoute("?config=invalid-garbage");
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("scratching 階段應只顯示當前 index 的卡片（多張時）", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    // 選 3 張牌
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().selectCard(cards[2]!.id);
      useGameStore.getState().startScratching();
    });
    // 應只渲染 1 張 scratch-card
    const scratchCards = screen.getAllByTestId(/^scratch-card-/);
    expect(scratchCards).toHaveLength(1);
  });

  it("scratching 多張時應顯示進度資訊", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().startScratching();
    });
    expect(screen.getByTestId("scratch-progress")).toBeInTheDocument();
    expect(screen.getByText(/第 1\/2 張/)).toBeInTheDocument();
  });

  it("scratching 單張時不顯示進度資訊", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().startScratching();
    });
    expect(screen.queryByTestId("scratch-progress")).not.toBeInTheDocument();
  });

  it("phase 為 results 時應先渲染 SplashOverlay", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    await act(async () => {
      useGameStore.getState().setPhase("results");
    });
    expect(screen.getByTestId("splash-overlay")).toBeInTheDocument();
    expect(screen.queryByTestId("results-page")).not.toBeInTheDocument();
  });

  it("點擊 SplashOverlay 後應顯示 ResultsPage", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    await act(async () => {
      useGameStore.getState().setPhase("results");
    });
    const splash = screen.getByTestId("splash-overlay");
    await act(async () => {
      fireEvent.click(splash);
    });
    expect(screen.queryByTestId("splash-overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("results-page")).toBeInTheDocument();
  });

  it("phase 為 results 時 SplashOverlay 應在 1500ms 後自動消失並顯示 ResultsPage", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      useGameStore.getState().setPhase("results");
    });
    expect(screen.getByTestId("splash-overlay")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId("splash-overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("results-page")).toBeInTheDocument();
  });

  it("scratching 多張時應渲染右側未刮卡堆", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().selectCard(cards[2]!.id);
      useGameStore.getState().startScratching();
    });
    // 第 1 張：左邊 0 張已刮，右邊 2 張未刮
    const upcoming = screen.getAllByTestId(/^upcoming-card-/);
    expect(upcoming).toHaveLength(2);
    expect(screen.queryByTestId(/^done-card-/)).not.toBeInTheDocument();
  });

  it("scratching 時頁面 header 應隱藏", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().startScratching();
    });
    expect(
      screen.queryByRole("heading", { name: "年終抽獎活動" }),
    ).not.toBeInTheDocument();
  });

  it("scratching 右側未刮卡片在當前卡未完成時不可點擊（有遮罩）", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().startScratching();
    });
    const upcoming = screen.getByTestId(`upcoming-card-${cards[1]!.id}`);
    // 點擊不應改變 currentScratchIndex
    await act(async () => {
      fireEvent.click(upcoming);
    });
    expect(useGameStore.getState().currentScratchIndex).toBe(0);
  });

  it("scratching 卡片完成後右側卡堆可點擊並前進到下一張", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().startScratching();
    });
    // 完成當前卡片
    await act(async () => {
      completeCard(cards[0]!.id);
    });
    const upcoming = screen.getByTestId(`upcoming-card-${cards[1]!.id}`);
    await act(async () => {
      fireEvent.click(upcoming);
    });
    expect(useGameStore.getState().currentScratchIndex).toBe(1);
  });

  it("scratching 前進後左側應出現已刮卡堆", async () => {
    const encoded = encodeConfig(config);
    renderWithRoute(`?config=${encoded}`);
    await waitFor(() => {
      expect(useGameStore.getState().cards).toHaveLength(totalCardCount);
    });
    const cards = useGameStore.getState().cards;
    await act(async () => {
      useGameStore.getState().selectCard(cards[0]!.id);
      useGameStore.getState().selectCard(cards[1]!.id);
      useGameStore.getState().selectCard(cards[2]!.id);
      useGameStore.getState().startScratching();
    });
    // 完成第 1 張並前進
    await act(async () => {
      completeCard(cards[0]!.id);
      useGameStore.getState().nextCard();
    });
    // 第 2 張：左邊 1 張已刮，右邊 1 張未刮
    expect(screen.getByTestId(`done-card-${cards[0]!.id}`)).toBeInTheDocument();
    expect(
      screen.getByTestId(`upcoming-card-${cards[2]!.id}`),
    ).toBeInTheDocument();
  });
});
