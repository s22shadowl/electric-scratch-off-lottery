# RTP 數學修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正 symbol / triple 玩法的 RTP 計算，由錯誤的 per-cell EV 改為正確的 per-card EV，並在主持人設定格數時動態縮放獎項金額。

**Architecture:** `calculateRTP` 加 `cellCount` 選用參數（預設 1，compare/bingo 無須改動）；`scalePrizesToTicketPrice` 加必要的 `cellCount` 參數，除以格數縮放金額；`useHostForm` 追蹤 `prizesDirty` flag，格數變更時靜默縮放或顯示確認 banner。

**Tech Stack:** TypeScript, React hooks (useState/useMemo/useCallback), Vitest

---

## 檔案地圖

| 動作 | 路徑 |
|------|------|
| Modify | `src/utils/game-math.ts` |
| Modify | `src/utils/game-math.test.ts` |
| Modify | `src/utils/prize-presets.ts` |
| Modify | `src/utils/prize-presets.test.ts` |
| Modify | `src/hooks/useHostForm.ts` |
| Modify | `src/hooks/useHostForm.test.ts` |
| Modify | `src/pages/HostPage.tsx` |

---

## Task 1: calculateRTP 加 cellCount 參數 + 修正說明註解

**Files:**
- Modify: `src/utils/game-math.ts`
- Modify: `src/utils/game-math.test.ts`

- [ ] **Step 1: 在 game-math.test.ts 補 calculateRTP 測試（先寫失敗測試）**

在 `game-math.test.ts` 末尾加入：

```ts
import { describe, it, expect } from "vitest";
import { calcBingoLineProbabilities, calculateRTP } from "./game-math";
```

> 注意：`calculateRTP` 目前只從 `prize-presets` re-export，需確認 `game-math.ts` 有直接 export（它有，見第 44 行）。

在 `game-math.test.ts` 末尾加入新的 describe 區塊：

```ts
// ── calculateRTP ───────────────────────────────────────────

describe("calculateRTP", () => {
  const stdPrizes = [
    { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
    { uid: "b", label: "$100", amount: "100", weight: "45" },
    { uid: "c", label: "$500", amount: "500", weight: "10" },
  ];

  it("cellCount 預設 1 時等同舊行為，per-cell EV / ticketPrice", () => {
    // per-cell EV = 0*0.45 + 100*0.45 + 500*0.10 = 95
    // RTP = 95 / 100 = 0.95
    expect(calculateRTP(stdPrizes, 100)).toBeCloseTo(0.95, 5);
  });

  it("cellCount=4 時回傳 per-card RTP = 0.95 * 4 = 3.80", () => {
    expect(calculateRTP(stdPrizes, 100, 4)).toBeCloseTo(3.8, 5);
  });

  it("cellCount=1 明確傳入時與預設相同", () => {
    expect(calculateRTP(stdPrizes, 100, 1)).toBeCloseTo(0.95, 5);
  });

  it("ticketPrice <= 0 → null（cellCount 不影響）", () => {
    expect(calculateRTP(stdPrizes, 0, 4)).toBeNull();
  });

  it("空 prizes → null", () => {
    expect(calculateRTP([], 100, 4)).toBeNull();
  });
});
```

- [ ] **Step 2: 執行測試確認新測試失敗**

```bash
npm test -- game-math --silent
```

預期：`calculateRTP` tests FAIL（import 可能成功，但 cellCount=4 的 test 會拿到 0.95 而非 3.80）

- [ ] **Step 3: 修改 game-math.ts — 加 cellCount 參數 + 修正說明註解**

將 `calculateRTP` 函式及上方說明完整替換：

```ts
/**
 * 依目前獎項草稿 + 票面計算 RTP（期望值 / ticketPrice）。
 * 無效輸入（ticketPrice <= 0 或無有效 prizes）回傳 null。
 *
 * @param cellCount 每張卡的有效抽獎格數（symbol = cellsPerZone，triple = rowsPerCard，其他 = 1）
 *
 * 範例（standard 預設，ticketPrice=100，cellsPerZone=4）：
 *   per-cell EV = 0×0.45 + 25×0.45 + 125×0.10 = $23.75
 *   此函式回傳：23.75 × 4 / 100 = 0.95（95%）← 正確
 *
 *   舊版錯誤：未乘以 cellCount，回傳 per-cell EV / ticketPrice = 0.2375（23.75%）
 */
export function calculateRTP(
  prizes: PrizeDraft[],
  ticketPrice: number,
  cellCount = 1,
): number | null {
  if (ticketPrice <= 0) return null;

  const valid = prizes.filter((p) => parseFloat(p.weight) > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, p) => sum + parseFloat(p.weight), 0);
  if (totalWeight <= 0) return null;

  const ev = valid.reduce((sum, p) => {
    const amount = parseFloat(p.amount) || 0;
    const weight = parseFloat(p.weight);
    return sum + (amount * weight) / totalWeight;
  }, 0);

  return (ev * cellCount) / ticketPrice;
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test -- game-math --silent
```

預期：所有 game-math.test.ts 測試通過

- [ ] **Step 5: Commit**

```bash
git add src/utils/game-math.ts src/utils/game-math.test.ts
git commit -m "feat: calculateRTP accepts cellCount param (default 1, backwards compatible)"
```

---

## Task 2: scalePrizesToTicketPrice 加 cellCount 參數

**Files:**
- Modify: `src/utils/prize-presets.ts`
- Modify: `src/utils/prize-presets.test.ts`

- [ ] **Step 1: 更新 prize-presets.test.ts 的現有測試**

所有呼叫 `scalePrizesToTicketPrice(preset, price)` 的地方加上 `cellCount`。

找出並更新以下 5 個測試（全部加 `, 1` 作為第三個參數，保持現有行為不變）：

```ts
// 更新前：scalePrizesToTicketPrice("standard", 100)
// 更新後：scalePrizesToTicketPrice("standard", 100, 1)

it("ticketPrice=100 時獎項金額不變", () => {
  const result = scalePrizesToTicketPrice("standard", 100, 1);
  expect(result.find((p) => p.label === "$100")?.amount).toBe("100");
  expect(result.find((p) => p.label === "$500")?.amount).toBe("500");
});

it("ticketPrice=200 時金額加倍", () => {
  const result = scalePrizesToTicketPrice("standard", 200, 1);
  expect(result.find((p) => p.amount === "200")).toBeTruthy();
  expect(result.find((p) => p.amount === "1000")).toBeTruthy();
});

it("ticketPrice=50 時金額減半", () => {
  const result = scalePrizesToTicketPrice("standard", 50, 1);
  expect(result.find((p) => p.amount === "50")).toBeTruthy();
  expect(result.find((p) => p.amount === "250")).toBeTruthy();
});

it("$0 的獎項 label 固定「謝謝參與」，金額仍為 0", () => {
  const result = scalePrizesToTicketPrice("standard", 200, 1);
  const loseItem = result.find((p) => p.amount === "0");
  expect(loseItem?.label).toBe("謝謝參與");
});

it("回傳新陣列（不可變）", () => {
  const result1 = scalePrizesToTicketPrice("standard", 100, 1);
  const result2 = scalePrizesToTicketPrice("standard", 100, 1);
  expect(result1).not.toBe(result2);
});
```

更新 RTP 驗證測試（cellCount=1，scalePrizesToTicketPrice 和 calculateRTP 皆傳入）：

```ts
it("generous 模板 RTP 接近 1.20（cellCount=1）", () => {
  const prizes = scalePrizesToTicketPrice("generous", 100, 1);
  const rtp = calculateRTP(prizes, 100, 1);
  expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.generous.targetRtp, 1);
});

it("conservative 模板 RTP 接近 0.80（cellCount=1）", () => {
  const prizes = scalePrizesToTicketPrice("conservative", 100, 1);
  const rtp = calculateRTP(prizes, 100, 1);
  expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.conservative.targetRtp, 1);
});

it("realistic 模板 RTP 接近 0.63（cellCount=1）", () => {
  const prizes = scalePrizesToTicketPrice("realistic", 100, 1);
  const rtp = calculateRTP(prizes, 100, 1);
  expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.realistic.targetRtp, 1);
});
```

再在這三個測試後加入 cellCount=4 的驗證：

```ts
it("standard 模板 cellCount=4 時 RTP 仍接近 targetRtp（金額已縮小 4 倍）", () => {
  const prizes = scalePrizesToTicketPrice("standard", 100, 4);
  const rtp = calculateRTP(prizes, 100, 4);
  expect(rtp).toBeCloseTo(DIFFICULTY_PRESETS.standard.targetRtp, 1);
});

it("cellCount=4 時 standard $100 獎項縮小為 $25", () => {
  const prizes = scalePrizesToTicketPrice("standard", 100, 4);
  // template $100 / cellCount 4 = $25
  expect(prizes.find((p) => p.amount === "25")).toBeTruthy();
  // template $500 / cellCount 4 = $125
  expect(prizes.find((p) => p.amount === "125")).toBeTruthy();
});
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npm test -- prize-presets --silent
```

預期：FAIL（`scalePrizesToTicketPrice` 缺少第三個參數 → TypeScript 編譯錯誤或測試失敗）

- [ ] **Step 3: 修改 prize-presets.ts**

將 `scalePrizesToTicketPrice` 函式替換為：

```ts
export function scalePrizesToTicketPrice(
  preset: DifficultyPreset,
  ticketPrice: number,
  cellCount: number,
): PrizeDraft[] {
  const template = DIFFICULTY_PRESETS[preset];
  return template.prizes.map((p) => {
    const scaled = Math.round((p.amount * ticketPrice) / 100 / cellCount);
    const label = scaled === 0 ? "謝謝參與" : `$${scaled}`;
    return {
      uid: `preset-uid-${++uidCounter}`,
      label,
      amount: String(scaled),
      weight: String(p.weight),
    };
  });
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test -- prize-presets --silent
```

預期：所有 prize-presets.test.ts 測試通過

- [ ] **Step 5: Commit**

```bash
git add src/utils/prize-presets.ts src/utils/prize-presets.test.ts
git commit -m "feat: scalePrizesToTicketPrice accepts cellCount, divides amounts accordingly"
```

---

## Task 3: useHostForm — dirty flag + cellCount wiring + rescale 邏輯

**Files:**
- Modify: `src/hooks/useHostForm.ts`
- Modify: `src/hooks/useHostForm.test.ts`

- [ ] **Step 1: 在 useHostForm.test.ts 補新測試**

在 `describe("useHostForm", ...)` 區塊末尾加入：

```ts
it("初始 prizes 應已按 cellsPerZone=4 縮放（standard, ticketPrice=100）", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  // scalePrizesToTicketPrice("standard", 100, 4) → $25 和 $125
  expect(result.current.form.prizes.some((p) => p.amount === "25")).toBe(true);
  expect(result.current.form.prizes.some((p) => p.amount === "125")).toBe(true);
});

it("currentRTP 初始值應接近 0.95（standard 模板，cellsPerZone=4，已縮放）", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  // prizes: $0(45%), $25(45%), $125(10%), cellCount=4
  // per-cell EV = 23.75, per-card RTP = 0.95
  expect(result.current.currentRTP).not.toBeNull();
  expect(result.current.currentRTP!).toBeCloseTo(0.95, 1);
});

it("updatePrize 後 setCellsPerZone 應觸發 showRescalePrompt", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動改"));
  act(() => result.current.setCellsPerZone("6"));
  expect(result.current.showRescalePrompt).toBe(true);
});

it("pristine 時 setCellsPerZone 應靜默更新 prizes，不觸發 showRescalePrompt", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  act(() => result.current.setCellsPerZone("6"));
  expect(result.current.showRescalePrompt).toBe(false);
  // cellCount=6 → scalePrizesToTicketPrice("standard", 100, 6) → $17, $83
  expect(result.current.form.prizes.some((p) => p.amount === "17")).toBe(true);
});

it("setDifficultyPreset 後 prizesDirty 應重置，之後 setCellsPerZone 不出現 banner", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  // 先弄 dirty
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動"));
  // 重套 preset
  act(() => result.current.setDifficultyPreset("standard"));
  // 改格數 → 不應出現 banner
  act(() => result.current.setCellsPerZone("6"));
  expect(result.current.showRescalePrompt).toBe(false);
});

it("confirmRescale(true) 應更新 prizes 並關閉 banner", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動"));
  act(() => result.current.setCellsPerZone("6"));
  expect(result.current.showRescalePrompt).toBe(true);
  act(() => result.current.confirmRescale(true));
  expect(result.current.showRescalePrompt).toBe(false);
  // 重套後金額應按 cellCount=6 縮放
  expect(result.current.form.prizes.some((p) => p.amount === "17")).toBe(true);
});

it("confirmRescale(false) 應關閉 banner 但保留現有 prizes", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動"));
  const prizesBefore = result.current.form.prizes.map((p) => p.amount);
  act(() => result.current.setCellsPerZone("6"));
  act(() => result.current.confirmRescale(false));
  expect(result.current.showRescalePrompt).toBe(false);
  expect(result.current.form.prizes.map((p) => p.amount)).toEqual(prizesBefore);
});

it("triple 玩法 setRowsPerCard 在 pristine 時應靜默更新 prizes", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  act(() => result.current.setMechanic("triple"));
  act(() => result.current.setRowsPerCard("5"));
  expect(result.current.showRescalePrompt).toBe(false);
  // cellCount=5 → scalePrizesToTicketPrice("standard", 100, 5) → $20, $100
  expect(result.current.form.prizes.some((p) => p.amount === "20")).toBe(true);
});

it("triple 玩法 setRowsPerCard 在 dirty 時應觸發 showRescalePrompt", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  act(() => result.current.setMechanic("triple"));
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動"));
  act(() => result.current.setRowsPerCard("5"));
  expect(result.current.showRescalePrompt).toBe(true);
});

it("非 symbol/triple 玩法時 setRowsPerCard 不觸發 showRescalePrompt", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  act(() => result.current.setMechanic("compare"));
  const uid = result.current.form.prizes[0]!.uid;
  act(() => result.current.updatePrize(uid, "label", "手動"));
  // compare 玩法改 rowsPerCard 不應出現 banner
  act(() => result.current.setRowsPerCard("5"));
  expect(result.current.showRescalePrompt).toBe(false);
});
```

- [ ] **Step 2: 更新既有測試（舊行為已改變的項目）**

找到並修改：

```ts
// 舊版（line ~293）
it("currentRTP 初始值應接近 0.95（standard 模板）", () => {
  const { result } = renderHook(() => useHostForm(BASE));
  expect(result.current.currentRTP).not.toBeNull();
  expect(result.current.currentRTP!).toBeCloseTo(0.95, 1);
});
```

保留這個測試不動（新行為下仍為 0.95，因為初始 prizes 已正確縮放）。

找到並刪除或更新：任何舊版 "currentRTP 接近 0.95" 但使用舊 prizes（$100/$500）的測試。

- [ ] **Step 3: 執行測試確認新測試失敗**

```bash
npm test -- useHostForm --silent
```

預期：新加的 8 個測試 FAIL

- [ ] **Step 4: 修改 useHostForm.ts**

**4a. 更新 import**

```ts
import { scalePrizesToTicketPrice, calculateRTP } from "@/utils/prize-presets";
```

（已有，無需改動）

**4b. 更新 defaultForm，初始 prizes 改為縮放後的值**

將 `defaultForm` 的 `prizes` 替換：

```ts
const defaultForm: HostFormState = {
  sessionTitle: "",
  prizes: [
    newPrize("uid-0", "謝謝參與", "0", "45"),
    newPrize("uid-1", "$25", "25", "45"),   // standard, ticketPrice=100, cellCount=4
    newPrize("uid-2", "$125", "125", "10"), // standard, ticketPrice=100, cellCount=4
  ],
  cardCount: "10",
  cellsPerZone: "4",
  effectsEnabled: true,
  allowReturnToPile: false,
  difficultyPreset: "standard",
  ticketPrice: "100",
  mechanic: "symbol",
  rowsPerCard: "3",
  gridSize: "5",
  prizePerLine: "100",
};
```

**4c. 在 `useHostForm` 函式內，`useState` 之後加入新 state**

```ts
const [prizesDirty, setPrizesDirty] = useState(false);
const [showRescalePrompt, setShowRescalePrompt] = useState(false);
```

**4d. 加入 cellCount derived value（在 currentRTP memo 之前）**

```ts
const cellCount = useMemo(() => {
  if (form.mechanic === "symbol") return parseInt(form.cellsPerZone, 10) || 1;
  if (form.mechanic === "triple") return parseInt(form.rowsPerCard, 10) || 1;
  return 1;
}, [form.mechanic, form.cellsPerZone, form.rowsPerCard]);
```

**4e. 更新 currentRTP memo**

```ts
const currentRTP = useMemo<number | null>(() => {
  const price = parseInt(form.ticketPrice, 10);
  if (!price || price < 1) return null;
  return calculateRTP(form.prizes, price, cellCount);
}, [form.prizes, form.ticketPrice, cellCount]);
```

**4f. 更新 updatePrize、addPrize、removePrize（標記 dirty）**

```ts
const updatePrize = useCallback(
  (uid: string, field: keyof Omit<PrizeDraft, "uid">, value: string) => {
    setForm((f) => ({
      ...f,
      prizes: f.prizes.map((p) =>
        p.uid === uid ? { ...p, [field]: value } : p,
      ),
    }));
    setPrizesDirty(true);
  },
  [],
);

const addPrize = useCallback(() => {
  const uid = `uid-${++uidCounter}`;
  setForm((f) => ({
    ...f,
    prizes: [...f.prizes, newPrize(uid, "", "0", "10")],
  }));
  setPrizesDirty(true);
}, []);

const removePrize = useCallback((uid: string) => {
  setForm((f) => ({ ...f, prizes: f.prizes.filter((p) => p.uid !== uid) }));
  setPrizesDirty(true);
}, []);
```

**4g. 更新 setCellsPerZone**

```ts
const setCellsPerZone = useCallback(
  (v: string) => {
    if (!prizesDirty) {
      const price = parseInt(form.ticketPrice, 10) || 100;
      const newCellCount = parseInt(v, 10) || 1;
      const newPrizes = scalePrizesToTicketPrice(
        form.difficultyPreset,
        price,
        newCellCount,
      );
      setForm((f) => ({ ...f, cellsPerZone: v, prizes: newPrizes }));
    } else {
      setForm((f) => ({ ...f, cellsPerZone: v }));
      setShowRescalePrompt(true);
    }
  },
  [prizesDirty, form.ticketPrice, form.difficultyPreset],
);
```

**4h. 更新 setDifficultyPreset（傳入 cellCount + reset dirty）**

```ts
const setDifficultyPreset = useCallback(
  (preset: DifficultyPreset) => {
    const price = parseInt(form.ticketPrice, 10) || 100;
    const newPrizes = scalePrizesToTicketPrice(preset, price, cellCount);
    setForm((f) => ({ ...f, difficultyPreset: preset, prizes: newPrizes }));
    setPrizesDirty(false);
  },
  [form.ticketPrice, cellCount],
);
```

**4i. 更新 setRowsPerCard（triple 玩法觸發 rescale 邏輯）**

```ts
const setRowsPerCard = useCallback(
  (v: string) => {
    if (form.mechanic === "triple") {
      if (!prizesDirty) {
        const price = parseInt(form.ticketPrice, 10) || 100;
        const newCellCount = parseInt(v, 10) || 1;
        const newPrizes = scalePrizesToTicketPrice(
          form.difficultyPreset,
          price,
          newCellCount,
        );
        setForm((f) => ({ ...f, rowsPerCard: v, prizes: newPrizes }));
      } else {
        setForm((f) => ({ ...f, rowsPerCard: v }));
        setShowRescalePrompt(true);
      }
    } else {
      setForm((f) => ({ ...f, rowsPerCard: v }));
    }
  },
  [form.mechanic, prizesDirty, form.ticketPrice, form.difficultyPreset],
);
```

**4j. 加入 confirmRescale handler**

```ts
const confirmRescale = useCallback(
  (rescale: boolean) => {
    if (rescale) {
      const price = parseInt(form.ticketPrice, 10) || 100;
      const newPrizes = scalePrizesToTicketPrice(
        form.difficultyPreset,
        price,
        cellCount,
      );
      setForm((f) => ({ ...f, prizes: newPrizes }));
      setPrizesDirty(false);
    }
    setShowRescalePrompt(false);
  },
  [form.ticketPrice, form.difficultyPreset, cellCount],
);
```

**4k. 更新 return 物件加入新值**

```ts
return {
  // ... 所有既有 return 值保持不變，加入：
  showRescalePrompt,
  confirmRescale,
};
```

- [ ] **Step 5: 執行測試確認通過**

```bash
npm test -- useHostForm --silent
```

預期：全部通過

- [ ] **Step 6: 確認全套測試**

```bash
npm test --silent
```

預期：全部通過（注意 prize-presets.test.ts 也需要通過）

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useHostForm.ts src/hooks/useHostForm.test.ts
git commit -m "feat: useHostForm tracks prizesDirty, auto-rescales prizes on cellCount change"
```

---

## Task 4: HostPage — rescale 確認 Banner

> ⚠️ Banner 樣式由 `/impeccable` 決定。本 task 只實作功能骨架；視覺細節事後由 impeccable 調整。

**Files:**
- Modify: `src/pages/HostPage.tsx`

- [ ] **Step 1: 確認 useHostForm 回傳 showRescalePrompt 和 confirmRescale**

讀取 `src/hooks/useHostForm.ts` 的 return 確認兩個值已加入（Task 3 完成後自動滿足）。

- [ ] **Step 2: 在 HostPage.tsx 解構新值**

找到 `useHostForm` 的解構賦值，加入：

```ts
const {
  // ... 所有既有值
  showRescalePrompt,
  confirmRescale,
} = useHostForm(baseUrl);
```

- [ ] **Step 3: 在 PrizeEditor 上方加入 Banner**

在 `{/* 獎項編輯 */}` 的 `<PrizeEditor` 之前插入：

```tsx
{/* 格數變更提示 */}
{showRescalePrompt && (
  <div
    data-testid="rescale-prompt"
    className="border-l-4 border-yellow-400 bg-red-900/60 pl-3 pr-4 py-3 text-sm flex items-center justify-between gap-4 flex-wrap"
  >
    <span className="text-red-200">
      格數已變更，獎項金額需重新對應調整。
    </span>
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={() => confirmRescale(true)}
        className="px-3 py-1.5 bg-yellow-400 text-red-950 text-xs font-bold hover:bg-yellow-300 transition-colors"
      >
        重套預設金額
      </button>
      <button
        type="button"
        onClick={() => confirmRescale(false)}
        className="text-red-400 text-xs hover:text-red-200 transition-colors underline underline-offset-2"
      >
        保留現有設定
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: 執行全套測試確認無 regression**

```bash
npm test --silent
```

預期：全部通過

- [ ] **Step 5: Commit**

```bash
git add src/pages/HostPage.tsx
git commit -m "feat: show rescale prompt when cellCount changes with custom prizes"
```

---

## 完成後驗證

- [ ] `npm test --silent` 全部通過
- [ ] 主持人頁載入，初始 prizes 顯示 $25/$125（非舊的 $100/$500）
- [ ] EVDisplay 顯示 RTP ≈ 95%（非 380%）
- [ ] 手動改獎項後改格數 → 出現黃色 banner
- [ ] Pristine 改格數 → 靜默縮放，RTP 維持 95%
- [ ] confirmRescale(true) → 金額更新，banner 消失
- [ ] confirmRescale(false) → 金額不變，banner 消失
- [ ] triple 玩法 rowsPerCard 行為同上
- [ ] compare / bingo 玩法不受影響

> ⚠️ 以上視覺項目需在瀏覽器手動驗證（canvas / CSS 無法在 jsdom 測試）。
