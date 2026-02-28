import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EVDisplay from "./EVDisplay";
import type { CardTypeConfig } from "@/types";

const symbolCardTypes: CardTypeConfig[] = [
  {
    mechanic: "symbol",
    prizes: [
      { id: "p1", label: "謝謝", amount: 0, probability: 70, isWin: false },
      { id: "p2", label: "$100", amount: 100, probability: 30, isWin: true },
    ],
    count: 10,
    themeId: "wealth-god",
    difficultyPreset: "standard",
    mechanicOptions: { cellsPerZone: 3 },
    ticketPrice: 100,
  },
];

describe("EVDisplay", () => {
  describe("rtp === null", () => {
    it("應顯示無效票面價格的提示", () => {
      render(<EVDisplay rtp={null} />);
      expect(screen.getByText(/票面價格無效/)).toBeInTheDocument();
    });

    it("不應顯示 ⓘ 按鈕", () => {
      render(<EVDisplay rtp={null} cardTypes={symbolCardTypes} />);
      expect(
        screen.queryByRole("button", { name: /查看獎池/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("rtp 有效", () => {
    it("應顯示返還率", () => {
      render(<EVDisplay rtp={0.9} />);
      expect(screen.getByText("90%")).toBeInTheDocument();
    });

    it("應顯示賺錢率", () => {
      render(<EVDisplay rtp={0.9} />);
      expect(screen.getByText("10%")).toBeInTheDocument();
    });

    it("返還率 >= 1 時應顯示主持人倒貼", () => {
      render(<EVDisplay rtp={1.1} />);
      expect(screen.getByText(/主持人倒貼/)).toBeInTheDocument();
    });

    it("應顯示難度分類", () => {
      render(<EVDisplay rtp={0.9} />);
      // rtp=0.9 → standard → 難度標籤
      expect(screen.getByText("難度")).toBeInTheDocument();
    });
  });

  describe("cardTypes prop", () => {
    it("傳入 cardTypes 時應顯示 ⓘ 按鈕", () => {
      render(<EVDisplay rtp={0.9} cardTypes={symbolCardTypes} />);
      expect(
        screen.getByRole("button", { name: /查看獎池/ }),
      ).toBeInTheDocument();
    });

    it("未傳入 cardTypes 時不應顯示 ⓘ 按鈕", () => {
      render(<EVDisplay rtp={0.9} />);
      expect(
        screen.queryByRole("button", { name: /查看獎池/ }),
      ).not.toBeInTheDocument();
    });

    it("傳入空陣列時不應顯示 ⓘ 按鈕", () => {
      render(<EVDisplay rtp={0.9} cardTypes={[]} />);
      expect(
        screen.queryByRole("button", { name: /查看獎池/ }),
      ).not.toBeInTheDocument();
    });

    it("點擊 ⓘ 後應開啟獎池 Modal", async () => {
      render(<EVDisplay rtp={0.9} cardTypes={symbolCardTypes} />);
      await userEvent.click(screen.getByRole("button", { name: /查看獎池/ }));
      expect(
        screen.getByRole("dialog", { name: /獎池資訊/ }),
      ).toBeInTheDocument();
    });

    it("Modal 關閉後應消失", async () => {
      render(<EVDisplay rtp={0.9} cardTypes={symbolCardTypes} />);
      await userEvent.click(screen.getByRole("button", { name: /查看獎池/ }));
      expect(
        screen.getByRole("dialog", { name: /獎池資訊/ }),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: /關閉/ }));
      expect(
        screen.queryByRole("dialog", { name: /獎池資訊/ }),
      ).not.toBeInTheDocument();
    });

    it("點擊 Modal 遮罩後應關閉", async () => {
      render(<EVDisplay rtp={0.9} cardTypes={symbolCardTypes} />);
      await userEvent.click(screen.getByRole("button", { name: /查看獎池/ }));
      const overlay = document.querySelector(".absolute.inset-0");
      await userEvent.click(overlay!);
      expect(
        screen.queryByRole("dialog", { name: /獎池資訊/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("totalExpectedPayout prop", () => {
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
});

// suppress unused import warning
void vi;
