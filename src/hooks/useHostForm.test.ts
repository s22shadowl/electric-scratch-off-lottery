import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { draftToConfig, useHostForm } from "./useHostForm";
import type { HostFormState } from "./useHostForm";

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
};

// ── draftToConfig ─────────────────────────────────────────

describe("draftToConfig", () => {
  it("合法表單應回傳 GameConfig（包含 cardTypes[0]）", () => {
    const config = draftToConfig(validForm);
    expect(config).not.toBeNull();
    expect(config?.sessionTitle).toBe("年終抽獎");
    expect(config?.cardTypes[0]?.count).toBe(10);
    expect(config?.cardTypes[0]?.mechanicOptions.cellsPerZone).toBe(6);
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
});
