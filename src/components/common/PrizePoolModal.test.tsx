import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrizePoolModal from "./PrizePoolModal";
import type { CardTypeConfig } from "@/types";

const symbolCardType: CardTypeConfig = {
  mechanic: "symbol",
  prizes: [
    { id: "p1", label: "謝謝", amount: 0, probability: 70, isWin: false },
    { id: "p2", label: "$100", amount: 100, probability: 20, isWin: true },
    { id: "p3", label: "$500", amount: 500, probability: 10, isWin: true },
  ],
  count: 10,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { cellsPerZone: 3 },
  ticketPrice: 100,
};

const bingoCardType: CardTypeConfig = {
  mechanic: "bingo",
  prizes: [],
  count: 5,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { gridSize: 3, drawnCount: 6, prizePerLine: 200 },
  ticketPrice: 100,
};

const tripleCardType: CardTypeConfig = {
  mechanic: "triple",
  prizes: [
    { id: "t1", label: "謝謝", amount: 0, probability: 60, isWin: false },
    { id: "t2", label: "$200", amount: 200, probability: 40, isWin: true },
  ],
  count: 8,
  themeId: "wealth-god",
  difficultyPreset: "standard",
  mechanicOptions: { rowsPerCard: 3 },
  ticketPrice: 100,
};

describe("PrizePoolModal", () => {
  describe("symbol 玩法", () => {
    it("應渲染獎池資訊標題", () => {
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("獎池資訊")).toBeInTheDocument();
    });

    it("應顯示所有獎項名稱", () => {
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("謝謝")).toBeInTheDocument();
      // $100 出現在名稱欄與金額欄，各一次
      expect(screen.getAllByText("$100")).toHaveLength(2);
      expect(screen.getAllByText("$500")).toHaveLength(2);
    });

    it("應正確計算正規化機率（總和為 100%）", () => {
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={vi.fn()} />);
      // totalWeight = 70 + 20 + 10 = 100
      // 謝謝: 70/100*100 = 70.0%
      // $100: 20/100*100 = 20.0%
      // $500: 10/100*100 = 10.0%
      expect(screen.getByText("70.0%")).toBeInTheDocument();
      expect(screen.getByText("20.0%")).toBeInTheDocument();
      expect(screen.getByText("10.0%")).toBeInTheDocument();
    });

    it("非等比例時應正規化機率", () => {
      const unevenCardType: CardTypeConfig = {
        ...symbolCardType,
        prizes: [
          { id: "u1", label: "A", amount: 0, probability: 3, isWin: false },
          { id: "u2", label: "B", amount: 100, probability: 1, isWin: true },
        ],
      };
      render(<PrizePoolModal cardTypes={[unevenCardType]} onClose={vi.fn()} />);
      // 3/(3+1)*100 = 75.0%
      expect(screen.getByText("75.0%")).toBeInTheDocument();
      // 1/(3+1)*100 = 25.0%
      expect(screen.getByText("25.0%")).toBeInTheDocument();
    });
  });

  describe("bingo 玩法", () => {
    it("應渲染統計面板（非標準獎項表格）", () => {
      render(<PrizePoolModal cardTypes={[bingoCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("格子大小")).toBeInTheDocument();
      expect(screen.getByText("3 × 3")).toBeInTheDocument();
    });

    it("應顯示開獎號碼顆數", () => {
      render(<PrizePoolModal cardTypes={[bingoCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("開獎號碼顆數")).toBeInTheDocument();
      expect(screen.getByText("6 顆")).toBeInTheDocument();
    });

    it("應顯示每條連線獎金", () => {
      render(<PrizePoolModal cardTypes={[bingoCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("每條連線獎金")).toBeInTheDocument();
      expect(screen.getByText("$200")).toBeInTheDocument();
    });

    it("應顯示預期連線數", () => {
      render(<PrizePoolModal cardTypes={[bingoCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("預期連線數")).toBeInTheDocument();
      // 只驗證欄位存在，不驗證確切數值（數學結果依賴 calcBingoLineProbabilities）
      expect(screen.getByText(/條$/)).toBeInTheDocument();
    });

    it("應顯示預期報酬率", () => {
      render(<PrizePoolModal cardTypes={[bingoCardType]} onClose={vi.fn()} />);
      expect(screen.getByText("預期報酬率")).toBeInTheDocument();
      expect(screen.getByText(/%$/)).toBeInTheDocument();
    });

    it("ticketPrice 缺失時應 fallback 用 100", () => {
      const noPrice: CardTypeConfig = {
        ...bingoCardType,
        ticketPrice: undefined,
      };
      // 不應拋出錯誤
      expect(() =>
        render(<PrizePoolModal cardTypes={[noPrice]} onClose={vi.fn()} />),
      ).not.toThrow();
    });
  });

  describe("多 cardType", () => {
    it("cardTypes.length > 1 時應顯示 Tab bar", () => {
      render(
        <PrizePoolModal
          cardTypes={[symbolCardType, bingoCardType]}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "符號" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "賓果" })).toBeInTheDocument();
    });

    it("應預設顯示 initialIndex 對應的 tab 內容", () => {
      render(
        <PrizePoolModal
          cardTypes={[symbolCardType, bingoCardType]}
          initialIndex={1}
          onClose={vi.fn()}
        />,
      );
      // initialIndex=1 是 bingo，應顯示 bingo 統計面板
      expect(screen.getByText("格子大小")).toBeInTheDocument();
    });

    it("點擊 Tab 應切換內容", async () => {
      render(
        <PrizePoolModal
          cardTypes={[symbolCardType, tripleCardType]}
          onClose={vi.fn()}
        />,
      );
      // 預設顯示 symbol 獎項表格
      expect(screen.getByText("謝謝")).toBeInTheDocument();

      // 點擊三同 tab
      await userEvent.click(screen.getByRole("button", { name: "三同" }));

      // 應顯示 triple 獎項（$200 出現在名稱欄與金額欄各一次）
      expect(screen.getAllByText("$200")).toHaveLength(2);
    });
  });

  describe("單一 cardType", () => {
    it("cardTypes.length === 1 時不應顯示 Tab bar", () => {
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={vi.fn()} />);
      // Tab bar 不顯示，不應有符號/三同等 tab 按鈕
      expect(
        screen.queryByRole("button", { name: "符號" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("關閉互動", () => {
    it("點擊背景遮罩應觸發 onClose", async () => {
      const onClose = vi.fn();
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={onClose} />);
      // 點擊遮罩（aria-hidden 元素，直接找背景層）
      const overlay = document.querySelector(".absolute.inset-0");
      await userEvent.click(overlay!);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("點擊關閉按鈕（×）應觸發 onClose", async () => {
      const onClose = vi.fn();
      render(<PrizePoolModal cardTypes={[symbolCardType]} onClose={onClose} />);
      await userEvent.click(screen.getByRole("button", { name: "關閉" }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
