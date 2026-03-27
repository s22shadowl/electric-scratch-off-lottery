import { describe, it, expect } from "vitest";
import {
  SYMBOL_POOL,
  getSymbolByCode,
  assignSymbolsToPrizes,
} from "./symbol-pool";
import type { Prize } from "@/types";

const makePrize = (id: string, amount: number): Prize => ({
  id,
  label: amount > 0 ? `$${amount}` : "謝謝參與",
  amount,
  probability: 1,
  isWin: amount > 0,
});

describe("SYMBOL_POOL", () => {
  it("應有 10 種符號", () => {
    expect(SYMBOL_POOL).toHaveLength(10);
  });

  it("每個符號的 code 應唯一", () => {
    const codes = SYMBOL_POOL.map((s) => s.code);
    expect(new Set(codes).size).toBe(10);
  });

  it("每個符號應有 code、emoji、label 三個欄位", () => {
    SYMBOL_POOL.forEach((s) => {
      expect(typeof s.code).toBe("string");
      expect(typeof s.emoji).toBe("string");
      expect(typeof s.label).toBe("string");
    });
  });

  it("應有 6 個符號有 spriteFile", () => {
    const withSprite = SYMBOL_POOL.filter((s) => s.spriteFile !== undefined);
    expect(withSprite).toHaveLength(6);
  });

  it("有 spriteFile 的符號應有 spriteLabel", () => {
    SYMBOL_POOL.filter((s) => s.spriteFile !== undefined).forEach((s) => {
      expect(typeof s.spriteLabel).toBe("string");
    });
  });
});

describe("getSymbolByCode", () => {
  it("有效 code 應回傳對應符號", () => {
    const first = SYMBOL_POOL[0]!;
    expect(getSymbolByCode(first.code)).toEqual(first);
  });

  it("無效 code 應回傳 undefined", () => {
    expect(getSymbolByCode("INVALID")).toBeUndefined();
  });
});

describe("assignSymbolsToPrizes", () => {
  it("應為每個 prize 分配不同的 symbolCode", () => {
    const prizes: Prize[] = [
      makePrize("p0", 0),
      makePrize("p1", 100),
      makePrize("p2", 500),
    ];
    const result = assignSymbolsToPrizes(prizes);
    const codes = result.map((p) => p.symbolCode);
    expect(new Set(codes).size).toBe(3);
  });

  it("回傳新陣列（不可變）", () => {
    const prizes: Prize[] = [makePrize("p0", 0), makePrize("p1", 100)];
    const result = assignSymbolsToPrizes(prizes);
    expect(result).not.toBe(prizes);
    expect(prizes[0]!.symbolCode).toBeUndefined();
  });

  it("超過 10 個非零獎項時，應循環使用符號池", () => {
    const prizes: Prize[] = Array.from({ length: 12 }, (_, i) =>
      makePrize(`p${i}`, (i + 1) * 10), // 全部 amount > 0
    );
    const result = assignSymbolsToPrizes(prizes);
    expect(result).toHaveLength(12);
    result.forEach((p) => {
      expect(p.symbolCode).toBeDefined();
    });
  });

  it("各非零 prize 的 symbolCode 應對應 SYMBOL_POOL 中的有效 code；$0 prize 不分配符號", () => {
    const prizes: Prize[] = [makePrize("p0", 0), makePrize("p1", 100)];
    const result = assignSymbolsToPrizes(prizes);
    const validCodes = new Set(SYMBOL_POOL.map((s) => s.code));
    expect(result[0]!.symbolCode).toBeUndefined(); // $0 prize 不分配符號
    expect(validCodes.has(result[1]!.symbolCode!)).toBe(true);
  });
});
