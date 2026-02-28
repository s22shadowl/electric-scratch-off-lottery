import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { draftToConfig, useHostForm } from "./useHostForm";
import type { HostFormState } from "./useHostForm";
import type {
  SymbolOptions,
  TripleOptions,
  CompareOptions,
  BingoOptions,
} from "@/types";

// ── 測試資料 ──────────────────────────────────────────────

const validForm: HostFormState = {
  sessionTitle: "年終抽獎",
  prizes: [
    { uid: "a", label: "謝謝", amount: "0", weight: "60" },
    { uid: "b", label: "$100", amount: "100", weight: "30" },
    { uid: "c", label: "$500", amount: "500", weight: "10" },
  ],
  cardCount: "10",
  cellsPerZone: "6",
  effectsEnabled: true,
  difficultyPreset: "standard",
  ticketPrice: "100",
  mechanic: "symbol",
  rowsPerCard: "3",
  gridSize: "3",
  prizePerLine: "100",
};

// ── draftToConfig ─────────────────────────────────────────

describe("draftToConfig", () => {
  it("合法表單應回傳 GameConfig（包含 cardTypes[0]）", () => {
    const config = draftToConfig(validForm);
    expect(config).not.toBeNull();
    expect(config?.sessionTitle).toBe("年終抽獎");
    expect(config?.cardTypes[0]?.count).toBe(10);
    expect(
      (config?.cardTypes[0]?.mechanicOptions as SymbolOptions).cellsPerZone,
    ).toBe(6);
    expect(config?.cardTypes[0]?.prizes).toHaveLength(3);
  });

  it("sessionTitle 為空應回傳 null", () => {
    expect(draftToConfig({ ...validForm, sessionTitle: "" })).toBeNull();
  });

  it("cardCount 為 0 應回傳 null", () => {
    expect(draftToConfig({ ...validForm, cardCount: "0" })).toBeNull();
  });

  it("cellsPerZone 超過 9 應回傳 null", () => {
    expect(draftToConfig({ ...validForm, cellsPerZone: "10" })).toBeNull();
  });

  it("所有 prizes 過濾後為空應回傳 null", () => {
    const form: HostFormState = {
      ...validForm,
      prizes: [{ uid: "x", label: "", amount: "0", weight: "0" }],
    };
    expect(draftToConfig(form)).toBeNull();
  });

  it("weight 為 0 的獎項應被過濾掉", () => {
    const form: HostFormState = {
      ...validForm,
      prizes: [
        { uid: "a", label: "謝謝", amount: "0", weight: "0" }, // 過濾
        { uid: "b", label: "$100", amount: "100", weight: "30" },
      ],
    };
    const config = draftToConfig(form);
    expect(config?.cardTypes[0]?.prizes).toHaveLength(1);
    expect(config?.cardTypes[0]?.prizes[0]?.label).toBe("$100");
  });

  it("amount > 0 的獎項 isWin 應為 true", () => {
    const config = draftToConfig(validForm);
    const winPrize = config?.cardTypes[0]?.prizes.find((p) => p.amount > 0);
    expect(winPrize?.isWin).toBe(true);
  });

  it("amount 為 0 的獎項 isWin 應為 false", () => {
    const config = draftToConfig(validForm);
    const losePrize = config?.cardTypes[0]?.prizes.find((p) => p.amount === 0);
    expect(losePrize?.isWin).toBe(false);
  });

  it("cardTypes[0].mechanic 應為 symbol", () => {
    const config = draftToConfig(validForm);
    expect(config?.cardTypes[0]?.mechanic).toBe("symbol");
  });

  it("cardTypes[0].difficultyPreset 應為 standard", () => {
    const config = draftToConfig(validForm);
    expect(config?.cardTypes[0]?.difficultyPreset).toBe("standard");
  });

  it("ticketPrice: 0 時應回傳 null", () => {
    expect(draftToConfig({ ...validForm, ticketPrice: "0" })).toBeNull();
  });

  it("ticketPrice 無效（非數字）時應回傳 null", () => {
    expect(draftToConfig({ ...validForm, ticketPrice: "abc" })).toBeNull();
  });

  it("輸出應包含正確 difficultyPreset（非硬編碼 standard）", () => {
    const config = draftToConfig({
      ...validForm,
      difficultyPreset: "generous",
    });
    expect(config?.cardTypes[0]?.difficultyPreset).toBe("generous");
  });

  it("輸出應包含正確 ticketPrice", () => {
    const config = draftToConfig({ ...validForm, ticketPrice: "200" });
    expect(config?.cardTypes[0]?.ticketPrice).toBe(200);
  });

  it("mechanic=triple 時輸出 rowsPerCard 而非 cellsPerZone", () => {
    const config = draftToConfig({
      ...validForm,
      mechanic: "triple",
      rowsPerCard: "4",
    });
    expect(config?.cardTypes[0]?.mechanic).toBe("triple");
    expect(
      (config?.cardTypes[0]?.mechanicOptions as TripleOptions).rowsPerCard,
    ).toBe(4);
  });

  it("mechanic=triple 且 rowsPerCard 超過 9 應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "triple", rowsPerCard: "10" }),
    ).toBeNull();
  });

  it("mechanic=triple 且 rowsPerCard=0 應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "triple", rowsPerCard: "0" }),
    ).toBeNull();
  });

  it("mechanic=compare 時輸出 roundsPerCard 而非 cellsPerZone", () => {
    const config = draftToConfig({
      ...validForm,
      mechanic: "compare",
      rowsPerCard: "4",
    });
    expect(config?.cardTypes[0]?.mechanic).toBe("compare");
    expect(
      (config?.cardTypes[0]?.mechanicOptions as CompareOptions).roundsPerCard,
    ).toBe(4);
  });

  it("mechanic=compare 且 rowsPerCard 超過 9 應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "compare", rowsPerCard: "10" }),
    ).toBeNull();
  });

  it("mechanic=compare 且 rowsPerCard=0 應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "compare", rowsPerCard: "0" }),
    ).toBeNull();
  });

  it("mechanic=bingo 時輸出 gridSize / drawnCount / prizePerLine", () => {
    const config = draftToConfig({
      ...validForm,
      mechanic: "bingo",
      gridSize: "4",
      prizePerLine: "200",
    });
    expect(config?.cardTypes[0]?.mechanic).toBe("bingo");
    const opts = config?.cardTypes[0]?.mechanicOptions as BingoOptions;
    expect(opts.gridSize).toBe(4);
    expect(opts.drawnCount).toBe(Math.ceil(4 * 4 * 0.6)); // 10
    expect(opts.prizePerLine).toBe(200);
  });

  it("mechanic=bingo 且 gridSize 小於 3 應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "bingo", gridSize: "2" }),
    ).toBeNull();
  });

  it("mechanic=bingo 且 prizePerLine 為負數應回傳 null", () => {
    expect(
      draftToConfig({ ...validForm, mechanic: "bingo", prizePerLine: "-1" }),
    ).toBeNull();
  });
});

// ── useHostForm hook ──────────────────────────────────────

describe("useHostForm", () => {
  const BASE = "https://example.com";

  it("初始狀態應有預設獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.form.prizes.length).toBeGreaterThan(0);
  });

  it("setTitle 應更新 sessionTitle", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setTitle("新活動"));
    expect(result.current.form.sessionTitle).toBe("新活動");
  });

  it("addPrize 應新增一個獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const before = result.current.form.prizes.length;
    act(() => result.current.addPrize());
    expect(result.current.form.prizes.length).toBe(before + 1);
  });

  it("removePrize 應移除對應獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    const before = result.current.form.prizes.length;
    act(() => result.current.removePrize(uid));
    expect(result.current.form.prizes.length).toBe(before - 1);
    expect(
      result.current.form.prizes.find((p) => p.uid === uid),
    ).toBeUndefined();
  });

  it("updatePrize 應更新指定欄位", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "大獎"));
    expect(result.current.form.prizes.find((p) => p.uid === uid)?.label).toBe(
      "大獎",
    );
  });

  it("toggleEffects 應切換 effectsEnabled", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const before = result.current.form.effectsEnabled;
    act(() => result.current.toggleEffects());
    expect(result.current.form.effectsEnabled).toBe(!before);
  });

  it("表單合法時 isValid 應為 true", async () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setTitle("測試活動"));
    expect(result.current.isValid).toBe(true);
  });

  it("setDifficultyPreset('generous') → form.prizes 應替換為 generous 模板", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.form.difficultyPreset).toBe("generous");
    // generous 模板下不中獎的 label 應為「謝謝參與」
    expect(result.current.form.prizes.some((p) => p.label === "謝謝參與")).toBe(
      true,
    );
  });

  it("setDifficultyPreset 後 updatePrize 仍可手動修改", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setDifficultyPreset("realistic"));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動修改"));
    expect(result.current.form.prizes.find((p) => p.uid === uid)?.label).toBe(
      "手動修改",
    );
  });

  it("setTicketPrice 應更新票面價格但不覆蓋獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const prizesBefore = result.current.form.prizes.map((p) => p.uid);
    act(() => result.current.setTicketPrice("200"));
    expect(result.current.form.ticketPrice).toBe("200");
    // prizes 的 uid 應不變（不重新生成）
    expect(result.current.form.prizes.map((p) => p.uid)).toEqual(prizesBefore);
  });

  it("currentRTP 初始值應接近 0.95（standard 模板）", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.currentRTP).not.toBeNull();
    expect(result.current.currentRTP!).toBeCloseTo(0.95, 1);
  });

  it("ticketPrice 無效時 currentRTP 應為 null", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setTicketPrice("0"));
    expect(result.current.currentRTP).toBeNull();
  });

  it("setMechanic('triple') 應更新 form.mechanic", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("triple"));
    expect(result.current.form.mechanic).toBe("triple");
  });

  it("setRowsPerCard 應更新 form.rowsPerCard", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setRowsPerCard("5"));
    expect(result.current.form.rowsPerCard).toBe("5");
  });

  it("setGridSize 應更新 form.gridSize", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setGridSize("5"));
    expect(result.current.form.gridSize).toBe("5");
  });

  it("setPrizePerLine 應更新 form.prizePerLine", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setPrizePerLine("500"));
    expect(result.current.form.prizePerLine).toBe("500");
  });

  it("非 bingo 玩法時 bingoRTP 應為 null", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.form.mechanic).toBe("symbol");
    expect(result.current.bingoRTP).toBeNull();
  });

  it("切換到 bingo 後 bingoRTP 應為正數", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("bingo"));
    expect(result.current.bingoRTP).not.toBeNull();
    expect(result.current.bingoRTP!).toBeGreaterThan(0);
  });

  it("bingo 時 ticketPrice 無效應讓 bingoRTP 為 null", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setMechanic("bingo");
      result.current.setTicketPrice("0");
    });
    expect(result.current.bingoRTP).toBeNull();
  });

  it("bingo 時 prizePerLine=0 應讓 bingoRTP 為 0", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setMechanic("bingo");
      result.current.setPrizePerLine("0");
    });
    expect(result.current.bingoRTP).toBe(0);
  });

  it("bingo 3x3 prizePerLine=100 ticketPrice=100 bingoRTP 應 > 0", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setMechanic("bingo");
      result.current.setGridSize("3");
      result.current.setPrizePerLine("100");
      result.current.setTicketPrice("100");
    });
    expect(result.current.bingoRTP!).toBeGreaterThan(0);
  });

  it("bingo gridSize 變更應更新 bingoRTP", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setMechanic("bingo");
      result.current.setGridSize("3");
      result.current.setPrizePerLine("100");
      result.current.setTicketPrice("100");
    });
    const rtp3 = result.current.bingoRTP;
    act(() => result.current.setGridSize("6"));
    const rtp6 = result.current.bingoRTP;
    expect(rtp3).not.toBeNull();
    expect(rtp6).not.toBeNull();
    expect(rtp3).not.toBeCloseTo(rtp6!, 3);
  });

  it("bingo prizePerLine 變更應更新 bingoRTP", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setMechanic("bingo");
      result.current.setPrizePerLine("100");
    });
    const rtp100 = result.current.bingoRTP;
    act(() => result.current.setPrizePerLine("200"));
    const rtp200 = result.current.bingoRTP;
    expect(rtp200).toBeCloseTo(rtp100! * 2, 5);
  });

  it("bingo cardCount 變更不影響 bingoRTP（per-card RTP 與牌數無關）", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("bingo"));
    const rtpBefore = result.current.bingoRTP;
    act(() => result.current.setCardCount("50"));
    expect(result.current.bingoRTP).toBe(rtpBefore);
  });

  it("totalExpectedPayout = RTP × ticketPrice × cardCount", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => {
      result.current.setTitle("測試");
      result.current.setCardCount("10");
      result.current.setTicketPrice("100");
    });
    const rtp = result.current.currentRTP;
    expect(result.current.totalExpectedPayout).toBeCloseTo(rtp! * 100 * 10, 2);
  });

  it("cardCount 變更應更新 totalExpectedPayout", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setCardCount("10"));
    const pay10 = result.current.totalExpectedPayout;
    act(() => result.current.setCardCount("20"));
    const pay20 = result.current.totalExpectedPayout;
    expect(pay20).toBeCloseTo(pay10! * 2, 2);
  });

  it("ticketPrice 無效時 totalExpectedPayout 應為 null", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setTicketPrice("0"));
    expect(result.current.totalExpectedPayout).toBeNull();
  });
});
