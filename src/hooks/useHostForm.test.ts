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
  allowReturnToPile: false,
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

  it("allowReturnToPile=false 時輸出應包含 allowReturnToPile: false", () => {
    const config = draftToConfig({ ...validForm, allowReturnToPile: false });
    expect(config?.allowReturnToPile).toBe(false);
  });

  it("allowReturnToPile=true 時輸出應包含 allowReturnToPile: true", () => {
    const config = draftToConfig({ ...validForm, allowReturnToPile: true });
    expect(config?.allowReturnToPile).toBe(true);
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

  // ── 初始狀態 ──────────────────────────────────────────────

  it("初始 prizes 金額應為 $100/$500，權重加總=100（standard, cellCount=4）", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.form.prizes.some((p) => p.amount === "100")).toBe(true);
    expect(result.current.form.prizes.some((p) => p.amount === "500")).toBe(true);
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("86.25");
    const totalWeight = result.current.form.prizes.reduce(
      (s, p) => s + parseFloat(p.weight),
      0,
    );
    expect(totalWeight).toBeCloseTo(100, 1);
  });

  it("winRate 初始值 = 55/400 = 0.1375", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.winRate).not.toBeNull();
    expect(result.current.winRate!).toBeCloseTo(0.1375, 3);
  });

  // ── setCellsPerZone（永不出 banner）────────────────────

  it("pristine 時 setCellsPerZone 靜默調整 weight，不出 banner", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setCellsPerZone("6"));
    expect(result.current.showRescalePrompt).toBe(false);
    // cellCount=6 → 正規化後 $0 weight ≈ 90.83
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("90.83");
    // 金額不變
    expect(result.current.form.prizes.some((p) => p.amount === "100")).toBe(true);
  });

  it("dirty 時 setCellsPerZone 只更新格數值，不出 banner，不動 prizes", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動改"));
    const weightsBefore = result.current.form.prizes.map((p) => p.weight);
    act(() => result.current.setCellsPerZone("6"));
    expect(result.current.showRescalePrompt).toBe(false);
    expect(result.current.form.cellsPerZone).toBe("6");
    expect(result.current.form.prizes.map((p) => p.weight)).toEqual(weightsBefore);
  });

  // ── setDifficultyPreset（dirty 時出 banner）───────────

  it("pristine 時 setDifficultyPreset 靜默套用", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(false);
    expect(result.current.form.difficultyPreset).toBe("generous");
  });

  it("dirty 時 setDifficultyPreset 觸發 showRescalePrompt，不更新 preset", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動改"));
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(true);
    // preset 尚未更新（等待確認）
    expect(result.current.form.difficultyPreset).toBe("standard");
  });

  it("confirmRescale(true) 套用 pending preset，關閉 banner，重置 dirty", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動改"));
    act(() => result.current.setDifficultyPreset("generous"));
    act(() => result.current.confirmRescale(true));
    expect(result.current.showRescalePrompt).toBe(false);
    expect(result.current.form.difficultyPreset).toBe("generous");
    // generous template 有 $500 獎項
    expect(result.current.form.prizes.some((p) => p.amount === "500")).toBe(true);
  });

  it("confirmRescale(false) 保留現有 prizes，關閉 banner", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動改"));
    const prizesBefore = result.current.form.prizes.map((p) => p.amount);
    act(() => result.current.setDifficultyPreset("generous"));
    act(() => result.current.confirmRescale(false));
    expect(result.current.showRescalePrompt).toBe(false);
    expect(result.current.form.prizes.map((p) => p.amount)).toEqual(prizesBefore);
    // preset 不更新
    expect(result.current.form.difficultyPreset).toBe("standard");
  });

  it("confirmRescale(true) 後再改格數不出 banner（dirty 已重置）", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動改"));
    act(() => result.current.setDifficultyPreset("generous"));
    act(() => result.current.confirmRescale(true));
    act(() => result.current.setCellsPerZone("6"));
    expect(result.current.showRescalePrompt).toBe(false);
  });

  // ── sortPrizesByAmount ──────────────────────────────────

  it("sortPrizesByAmount 按金額小到大排序", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    // 預設順序：$0, $100, $500
    const uid0 = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid0, "amount", "999"));
    // 排序前：$999, $100, $500
    act(() => result.current.sortPrizesByAmount());
    const amounts = result.current.form.prizes.map((p) => p.amount);
    expect(amounts).toEqual(["100", "500", "999"]);
  });

  it("sortPrizesByAmount 金額相同時維持原順序", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.addPrize());
    const newUid = result.current.form.prizes[3]!.uid;
    act(() => result.current.updatePrize(newUid, "amount", "0"));
    act(() => result.current.updatePrize(newUid, "label", "再接再厲"));
    // 排序前：$0(謝謝參與), $100, $500, $0(再接再厲)
    act(() => result.current.sortPrizesByAmount());
    const labels = result.current.form.prizes
      .filter((p) => p.amount === "0")
      .map((p) => p.label);
    expect(labels).toEqual(["謝謝參與", "再接再厲"]);
  });

  // ── confirmRescale 保留額外獎項 ─────────────────────────

  it("dirty + 有額外獎項時 confirmRescale(true) 保留額外獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    // 新增一筆額外獎項
    act(() => result.current.addPrize());
    const extraUid = result.current.form.prizes[3]!.uid;
    act(() => result.current.updatePrize(extraUid, "label", "$1000"));
    act(() => result.current.updatePrize(extraUid, "amount", "1000"));
    // dirty=true，切 preset
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(true);
    act(() => result.current.confirmRescale(true));
    // 額外獎項應保留
    expect(result.current.form.prizes.some((p) => p.amount === "1000")).toBe(true);
    expect(result.current.form.prizes.length).toBe(4);
  });

  it("dirty + 額外獎項金額極低時 confirmRescale(true) fallback 為全取代", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.addPrize());
    const extraUid = result.current.form.prizes[3]!.uid;
    act(() => result.current.updatePrize(extraUid, "label", "$1"));
    act(() => result.current.updatePrize(extraUid, "amount", "1"));
    act(() => result.current.setDifficultyPreset("generous"));
    act(() => result.current.confirmRescale(true));
    // fallback：用全取代（模板 3 筆）
    expect(result.current.form.prizes.length).toBe(3);
    expect(result.current.form.difficultyPreset).toBe("generous");
  });

  // ── setDifficultyPreset non-dirty 路徑保留額外獎項 ─────

  it("not dirty + 有額外獎項時切 preset 仍保留額外獎項", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    // 新增 + 編輯 → dirty=true
    act(() => result.current.addPrize());
    const extraUid = result.current.form.prizes[3]!.uid;
    act(() => result.current.updatePrize(extraUid, "label", "$1000"));
    act(() => result.current.updatePrize(extraUid, "amount", "1000"));
    // confirm 一次 preset → dirty 被重設為 false
    act(() => result.current.setDifficultyPreset("generous"));
    act(() => result.current.confirmRescale(true));
    expect(result.current.form.prizes.length).toBe(4);
    // 記錄所有金額
    const amountsBefore = result.current.form.prizes.map((p) => p.amount);
    // 再切 preset（此時 dirty=false 但有額外獎項）
    act(() => result.current.setDifficultyPreset("conservative"));
    // 應直接保留額外獎項，不出 prompt
    expect(result.current.showRescalePrompt).toBe(false);
    expect(result.current.form.prizes.length).toBe(4);
    // 所有金額不變
    expect(result.current.form.prizes.map((p) => p.amount)).toEqual(amountsBefore);
  });

  it("addPrize 應設定 prizesDirty，切 preset 時顯示 prompt", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.addPrize());
    // addPrize 本身就該標記 dirty
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(true);
  });

  // ── weightTotal + normalizeWeights ────────────────────

  it("weightTotal 初始 = 100", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.weightTotal).toBeCloseTo(100, 1);
  });

  it("addPrize 後 weightTotal > 100", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.addPrize());
    expect(result.current.weightTotal).toBeGreaterThan(100);
  });

  it("removePrize 後 weightTotal < 100", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[2]!.uid; // $500, weight=2.5
    act(() => result.current.removePrize(uid));
    expect(result.current.weightTotal).toBeLessThan(100);
  });

  it("normalizeWeights 將所有 weight 正規化為加總=100", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.addPrize()); // weight="10" → total=110
    act(() => result.current.normalizeWeights());
    expect(result.current.weightTotal).toBeCloseTo(100, 1);
  });

  it("normalizeWeights 保持各項比例不變", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid0 = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid0, "weight", "50"));
    act(() => result.current.normalizeWeights());
    const p0 = result.current.form.prizes.find((p) => p.uid === uid0)!;
    expect(parseFloat(p0.weight)).toBeCloseTo((50 / 63.75) * 100, 0);
    expect(result.current.weightTotal).toBeCloseTo(100, 1);
  });

  it("全部 weight=0 時 normalizeWeights 不動作", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const prizes = result.current.form.prizes;
    for (const p of prizes) {
      act(() => result.current.updatePrize(p.uid, "weight", "0"));
    }
    const before = result.current.form.prizes.map((p) => p.weight);
    act(() => result.current.normalizeWeights());
    expect(result.current.form.prizes.map((p) => p.weight)).toEqual(before);
  });

  it("normalizeWeights 後 prizesDirty 重置為 false", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "weight", "50"));
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(true);
    act(() => result.current.confirmRescale(false));
    act(() => result.current.normalizeWeights());
    act(() => result.current.setDifficultyPreset("generous"));
    expect(result.current.showRescalePrompt).toBe(false);
  });

  // ── triple / compare / other ──────────────────────────

  it("triple 玩法 setRowsPerCard pristine 時靜默調整 weight", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("triple"));
    act(() => result.current.setRowsPerCard("5"));
    expect(result.current.showRescalePrompt).toBe(false);
    // cellCount=5 → 正規化後 $0 weight = 89
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("89");
  });

  it("triple 玩法 dirty 時 setRowsPerCard 不出 banner", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("triple"));
    const uid = result.current.form.prizes[0]!.uid;
    act(() => result.current.updatePrize(uid, "label", "手動"));
    act(() => result.current.setRowsPerCard("5"));
    expect(result.current.showRescalePrompt).toBe(false);
  });

  it("compare 玩法 setRowsPerCard 不觸發任何 rescale", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("compare"));
    act(() => result.current.setRowsPerCard("5"));
    expect(result.current.showRescalePrompt).toBe(false);
  });

});
