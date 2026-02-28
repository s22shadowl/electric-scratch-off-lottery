import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip", () => {
  it("render 後 tooltip 文字不顯示", () => {
    render(<InfoTooltip content="說明文字" />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.queryByText("說明文字")).not.toBeInTheDocument();
  });

  it("點擊按鈕後 tooltip 出現", async () => {
    render(<InfoTooltip content="說明文字" />);
    await userEvent.click(screen.getByRole("button", { name: "說明" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("說明文字")).toBeInTheDocument();
  });

  it("再次點擊後 tooltip 消失", async () => {
    render(<InfoTooltip content="說明文字" />);
    const btn = screen.getByRole("button", { name: "說明" });
    await userEvent.click(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("點擊外部後 tooltip 消失", async () => {
    render(
      <div>
        <InfoTooltip content="說明文字" />
        <button type="button">外部按鈕</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "說明" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "外部按鈕" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("aria-expanded 狀態正確", async () => {
    render(<InfoTooltip content="說明文字" />);
    const btn = screen.getByRole("button", { name: "說明" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});
