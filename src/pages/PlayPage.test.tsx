import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
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
});
