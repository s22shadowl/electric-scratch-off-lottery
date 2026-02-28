import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EVDisplay from "./EVDisplay";

describe("EVDisplay", () => {
  it("rtp 為 null 時應顯示錯誤提示", () => {
    render(<EVDisplay rtp={null} />);
    expect(screen.getByTestId("ev-display")).toBeInTheDocument();
    expect(screen.getByText(/票面價格無效/)).toBeInTheDocument();
  });

  it("rtp 合法時應顯示返還率百分比", () => {
    render(<EVDisplay rtp={0.95} />);
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("rtp 合法時應顯示主持人抽成百分比", () => {
    render(<EVDisplay rtp={0.9} />);
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("rtp >= 1.0 時主持人應顯示倒貼", () => {
    render(<EVDisplay rtp={1.05} />);
    expect(screen.getByText("主持人倒貼")).toBeInTheDocument();
  });

  it("不傳 totalExpectedPayout 時不應顯示整場預期支出列", () => {
    render(<EVDisplay rtp={0.9} />);
    expect(screen.queryByText("整場預期支出")).not.toBeInTheDocument();
  });

  it("totalExpectedPayout 為 null 時不應顯示整場預期支出列", () => {
    render(<EVDisplay rtp={0.9} totalExpectedPayout={null} />);
    expect(screen.queryByText("整場預期支出")).not.toBeInTheDocument();
  });

  it("傳入 totalExpectedPayout={500} 時應顯示整場預期支出與 $500", () => {
    render(<EVDisplay rtp={0.9} totalExpectedPayout={500} />);
    expect(screen.getByText("整場預期支出")).toBeInTheDocument();
    expect(screen.getByText("$500")).toBeInTheDocument();
  });

  it("totalExpectedPayout 應四捨五入顯示", () => {
    render(<EVDisplay rtp={0.9} totalExpectedPayout={499.7} />);
    expect(screen.getByText("$500")).toBeInTheDocument();
  });
});
