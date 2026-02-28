import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SplashOverlay from "./SplashOverlay";

const defaultProps = {
  totalWinnings: 0,
  winningCount: 0,
  totalCount: 3,
  effectsEnabled: true,
  onDismiss: vi.fn(),
};

describe("SplashOverlay", () => {
  it("應渲染 overlay 容器", () => {
    render(<SplashOverlay {...defaultProps} />);
    expect(screen.getByTestId("splash-overlay")).toBeInTheDocument();
  });

  it("應顯示標題「刮刮結果揭曉！」", () => {
    render(<SplashOverlay {...defaultProps} />);
    expect(screen.getByText(/刮刮結果揭曉！/)).toBeInTheDocument();
  });

  it("應顯示「點擊任何地方繼續」提示", () => {
    render(<SplashOverlay {...defaultProps} />);
    expect(screen.getByText("點擊任何地方繼續")).toBeInTheDocument();
  });

  it("totalWinnings 為 0 時應顯示「謝謝參與」", () => {
    render(<SplashOverlay {...defaultProps} totalWinnings={0} />);
    expect(screen.getByText("謝謝參與")).toBeInTheDocument();
    expect(screen.getByText(`共刮了 ${defaultProps.totalCount} 張`)).toBeInTheDocument();
  });

  it("totalWinnings > 0 時應顯示金額", () => {
    render(
      <SplashOverlay
        {...defaultProps}
        totalWinnings={500}
        winningCount={1}
        totalCount={3}
      />,
    );
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText("中獎 1 / 3 張")).toBeInTheDocument();
  });

  it("點擊 overlay 應呼叫 onDismiss", () => {
    const onDismiss = vi.fn();
    render(<SplashOverlay {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("splash-overlay"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("effectsEnabled=true 且 totalWinnings>0 時應渲染 confetti", () => {
    const { container } = render(
      <SplashOverlay
        {...defaultProps}
        totalWinnings={500}
        effectsEnabled={true}
      />,
    );
    const confettis = container.querySelectorAll(".animate-confetti-fall");
    expect(confettis).toHaveLength(25);
  });

  it("effectsEnabled=false 時不應渲染 confetti", () => {
    const { container } = render(
      <SplashOverlay
        {...defaultProps}
        totalWinnings={500}
        effectsEnabled={false}
      />,
    );
    const confettis = container.querySelectorAll(".animate-confetti-fall");
    expect(confettis).toHaveLength(0);
  });

  it("totalWinnings=0 時即使 effectsEnabled=true 也不渲染 confetti", () => {
    const { container } = render(
      <SplashOverlay
        {...defaultProps}
        totalWinnings={0}
        effectsEnabled={true}
      />,
    );
    const confettis = container.querySelectorAll(".animate-confetti-fall");
    expect(confettis).toHaveLength(0);
  });

  it("confetti 應使用確定性分佈的 animationDelay 和 left", () => {
    const { container } = render(
      <SplashOverlay
        {...defaultProps}
        totalWinnings={500}
        effectsEnabled={true}
      />,
    );
    const confettis = container.querySelectorAll(".animate-confetti-fall");
    // 第一個 confetti: left = (0*37+11)%100 = 11%, delay = 0ms
    expect((confettis[0] as HTMLElement).style.left).toBe("11%");
    expect((confettis[0] as HTMLElement).style.animationDelay).toBe("0ms");
    // 第二個: left = (1*37+11)%100 = 48%, delay = 60ms
    expect((confettis[1] as HTMLElement).style.left).toBe("48%");
    expect((confettis[1] as HTMLElement).style.animationDelay).toBe("60ms");
  });
});
