# RTP 中獎率重構 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改用「膨脹 $0 weight」取代「縮小金額」來維持 RTP，新增 `calculateWinRate`，在主持人 UI 及玩家 UI 顯示中獎率，並將 rescale banner 改為在 dirty 時切換 preset 觸發。

**Architecture:** `scalePrizesToTicketPrice` 保持金額不變，改為解方程式算出 $0 weight 使 per-card RTP = targetRtp。新增 `calculateWinRate(prizes)` 回傳中獎機率（winWeight / totalWeight）。`useHostForm` 的 banner 從 cellCount 變更觸發改為 preset 切換觸發（dirty 時顯示確認，pristine 時靜默套用）。

**Tech Stack:** TypeScript, React hooks, Vitest

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
| Modify | `src/components/host/EVDisplay.tsx` |
| Modify | `src/pages/HostPage.tsx` |
| Modify | `src/components/common/PrizePoolModal.tsx` |

---

## Task 1: calculateWinRate + 更新 calculateRTP JSDoc

**Files:**
- Modify: `src/utils/game-math.ts`
- Modify: `src/utils/game-math.test.ts`

- [ ] **Step 1: 在 game-math.test.ts 加入 calculateWinRate 測試**

在檔案頂部的 import 加入 `calculateWinRate`：

```ts
import { calcBingoLineProbabilities, calculateRTP, calculateWinRate } from "./game-math";
```

在檔案末尾加入：

```ts
// ── calculateWinRate ──────────────────────────────────────

describe("calculateWinRate", () => {
  it("standard prizes (cellCount=1): 55/100 = 0.55", () => {
    const prizes = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "45" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
    ];
    expect(calculateWinRate(prizes)).toBeCloseTo(0.55, 5);
  });

  it("inflated $0 weight (cellCount=4): 55/400 = 0.1375", () => {
    const prizes = [
      { uid: "a", label: "謝謝參與", amount: "0", weight: "345" },
      { uid: "b", label: "$100", amount: "100", weight: "45" },
      { uid: "c", label: "$500", amount: "500", weight: "10" },
    ];
    expect(calculateWinRate(prizes)).toBeCloseTo(0.1375, 5);
  });

  it("全部中獎 → 1.0", () => {
    const prizes = [
      { uid: "a", label: "$100", amount: "100", weight: "50" },
      { uid: "b", label: "$500", amount: "500", weight: "50" },
    ];
    expect(calculateWinRate(prizes)).toBeCloseTo(1.0, 5);
  });

  it("全部不中獎 → 0", () => {
    const prizes = [
      { uid: "a", label: "謝謝", amount: "0", weight: "100" },
    ];
    expect(calculateWinRate(prizes)).toBeCloseTo(0, 5);
  });

  it("空 prizes → null", () => {
    expect(calculateWinRate([])).toBeNull();
  });

  it("全部 weight=0 → null", () => {
    const prizes = [
      { uid: "a", label: "謝謝", amount: "0", weight: "0" },
    ];
    expect(calculateWinRate(prizes)).toBeNull();
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npm test -- game-math --silent
```

預期：FAIL（`calculateWinRate` 不存在）

- [ ] **Step 3: 在 game-math.ts 加入 calculateWinRate + 更新 calculateRTP JSDoc**

在 `calculateRTP` 函式之後加入：

```ts
/**
 * 計算中獎率：weight > 0 且 amount > 0 的權重佔總權重比例。
 * 回傳 0–1 的小數（0.1375 = 13.75%）。
 * 無有效 prizes 時回傳 null。
 */
export function calculateWinRate(
  prizes: PrizeDraft[],
): number | null {
  const valid = prizes.filter((p) => parseFloat(p.weight) > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((sum, p) => sum + parseFloat(p.weight), 0);
  if (totalWeight <= 0) return null;

  const winWeight = valid
    .filter((p) => (parseFloat(p.amount) || 0) > 0)
    .reduce((sum, p) => sum + parseFloat(p.weight), 0);

  return winWeight / totalWeight;
}
```

同時更新 `calculateRTP` 的 JSDoc，移除 `⚠️ 已知 Bug` 段落，替換為：

```ts
/**
 * 依目前獎項草稿 + 票面計算 RTP（期望值 × cellCount / ticketPrice）。
 * cellCount 為每張卡的格數（預設 1）。
 * 無效輸入（ticketPrice <= 0 或無有效 prizes）回傳 null。
 *
 * 搭配 scalePrizesToTicketPrice 使用時，該函式已透過膨脹 $0 weight
 * 來壓低 per-cell EV，使 per-card RTP = targetRtp。
 */
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test -- game-math --silent
```

預期：所有測試通過

- [ ] **Step 5: Commit**

```bash
git add src/utils/game-math.ts src/utils/game-math.test.ts
git commit -m "feat: add calculateWinRate + update calculateRTP JSDoc"
```

---

## Task 2: scalePrizesToTicketPrice 改為膨脹 $0 weight

**Files:**
- Modify: `src/utils/prize-presets.ts`
- Modify: `src/utils/prize-presets.test.ts`

> ⚠️ 本 task 完成後，部分 useHostForm 測試會暫時失敗（Task 3 修正）。Task 2 只需確認 `npm test -- prize-presets` 通過。

- [ ] **Step 1: 更新 prize-presets.test.ts**

找到並刪除此測試（舊行為：金額縮小）：

```ts
  it("cellCount=4 時 standard $100 獎項縮小為 $25", () => {
    const prizes = scalePrizesToTicketPrice("standard", 100, 4);
    expect(prizes.find((p) => p.amount === "25")).toBeTruthy();
    expect(prizes.find((p) => p.amount === "125")).toBeTruthy();
  });
```

替換為（新行為：金額不變，weight 膨脹）：

```ts
  it("cellCount=4 時 standard 金額不變（$100/$500），$0 weight 膨脹為 345", () => {
    const prizes = scalePrizesToTicketPrice("standard", 100, 4);
    expect(prizes.find((p) => p.amount === "100")?.weight).toBe("45");
    expect(prizes.find((p) => p.amount === "500")?.weight).toBe("10");
    expect(prizes.find((p) => p.amount === "0")?.weight).toBe("345");
  });

  it("cellCount=4 時中獎率 = 55/400 = 13.75%", () => {
    const prizes = scalePrizesToTicketPrice("standard", 100, 4);
    const totalWeight = prizes.reduce((s, p) => s + parseFloat(p.weight), 0);
    const winWeight = prizes
      .filter((p) => parseFloat(p.amount) > 0)
      .reduce((s, p) => s + parseFloat(p.weight), 0);
    expect(winWeight / totalWeight).toBeCloseTo(0.1375, 4);
  });
```

在 DIFFICULTY_PRESETS describe 之後加入跨 cellCount 驗證：

```ts
describe("scalePrizesToTicketPrice — 跨 cellCount RTP 恆等", () => {
  const CELL_COUNTS = [1, 2, 3, 4, 6, 9];
  for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
    for (const cc of CELL_COUNTS) {
      it(`${key} cellCount=${cc} → RTP ≈ ${preset.targetRtp}`, () => {
        const prizes = scalePrizesToTicketPrice(key as DifficultyPreset, 100, cc);
        const rtp = calculateRTP(prizes, 100, cc);
        expect(rtp).toBeCloseTo(preset.targetRtp, 2);
      });
    }
  }
});
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npm test -- prize-presets --silent
```

預期：FAIL（新測試斷言 weight="345" 但實際拿到 weight="45"，金額仍被縮小）

- [ ] **Step 3: 修改 prize-presets.ts — scalePrizesToTicketPrice**

將整個 `scalePrizesToTicketPrice` 函式替換為：

```ts
/**
 * 依票面價格與格數縮放模板獎項，回傳新的 PrizeDraft 陣列。
 *
 * 金額：依 ticketPrice/100 等比縮放（不除以 cellCount）。
 * 中獎率：透過膨脹 $0 的 weight 來壓低 per-cell EV，使
 *   per-card RTP = targetRtp（金額 × cellCount / ticketPrice）。
 *
 * 數學推導：
 *   S = Σ(scaledAmount_i × weight_i)  // 中獎項的加權金額和
 *   W = Σ(weight_i)                    // 中獎項的權重和
 *   requiredTotalWeight = S × cellCount / (targetRtp × ticketPrice)
 *   loseWeight = requiredTotalWeight − W
 */
export function scalePrizesToTicketPrice(
  preset: DifficultyPreset,
  ticketPrice: number,
  cellCount: number,
): PrizeDraft[] {
  const template = DIFFICULTY_PRESETS[preset];

  // 1. 縮放金額（只依 ticketPrice，不除以 cellCount）
  const scaled = template.prizes.map((p) => ({
    ...p,
    scaledAmount: Math.round((p.amount * ticketPrice) / 100),
  }));

  // 2. 計算中獎項的加權金額和 & 權重和
  const winPrizes = scaled.filter((p) => p.scaledAmount > 0);
  const S = winPrizes.reduce((sum, p) => sum + p.scaledAmount * p.weight, 0);
  const W = winPrizes.reduce((sum, p) => sum + p.weight, 0);

  // 3. 解出不中獎總 weight
  const targetEV = template.targetRtp * ticketPrice / cellCount;
  const requiredTotalWeight = targetEV > 0 ? S / targetEV : W;
  const totalLoseWeight = Math.max(0, Math.round(requiredTotalWeight - W));

  // 4. 原始不中獎 weight 總和（用於按比例分配）
  const originalLoseWeightSum = template.prizes
    .filter((p) => p.amount === 0)
    .reduce((sum, p) => sum + p.weight, 0);

  // 5. 組裝結果
  return scaled.map((p) => {
    const isLose = p.scaledAmount === 0;
    const weight = isLose
      ? originalLoseWeightSum > 0
        ? Math.round((p.weight / originalLoseWeightSum) * totalLoseWeight)
        : totalLoseWeight
      : p.weight;

    return {
      uid: `preset-uid-${++uidCounter}`,
      label: isLose ? "謝謝參與" : `$${p.scaledAmount}`,
      amount: String(p.scaledAmount),
      weight: String(weight),
    };
  });
}
```

同時更新 re-export 加入 `calculateWinRate`：

```ts
export { calculateRTP, classifyDifficulty, calculateWinRate } from "./game-math";
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test -- prize-presets --silent
```

預期：所有 prize-presets 測試通過

- [ ] **Step 5: Commit**

```bash
git add src/utils/prize-presets.ts src/utils/prize-presets.test.ts
git commit -m "feat: scalePrizesToTicketPrice inflates lose-weight instead of shrinking amounts"
```

---

## Task 3: useHostForm — 還原預設金額、banner 改為 preset 觸發、暴露 winRate

**Files:**
- Modify: `src/hooks/useHostForm.ts`
- Modify: `src/hooks/useHostForm.test.ts`

- [ ] **Step 1: 刪除舊的 rescale 測試（10 個），加入新測試（13 個）**

刪除 `useHostForm.test.ts` 中從 `it("初始 prizes 應已按 cellsPerZone=4 縮放` 開始到檔案末尾 `});` 之前的所有 10 個 `it(...)` 測試（約 line 451–533），替換為以下測試：

```ts
  // ── 初始狀態 ──────────────────────────────────────────

  it("初始 prizes 金額應為 $100/$500，$0 weight=345（standard, cellCount=4）", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    expect(result.current.form.prizes.some((p) => p.amount === "100")).toBe(true);
    expect(result.current.form.prizes.some((p) => p.amount === "500")).toBe(true);
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("345");
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
    // cellCount=6 → $0 weight = 100*6-55 = 545
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("545");
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

  // ── triple / compare / other ──────────────────────────

  it("triple 玩法 setRowsPerCard pristine 時靜默調整 weight", () => {
    const { result } = renderHook(() => useHostForm(BASE));
    act(() => result.current.setMechanic("triple"));
    act(() => result.current.setRowsPerCard("5"));
    expect(result.current.showRescalePrompt).toBe(false);
    // cellCount=5 → $0 weight = 100*5-55 = 445
    const losePrize = result.current.form.prizes.find((p) => p.amount === "0");
    expect(losePrize?.weight).toBe("445");
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
```

- [ ] **Step 2: 執行測試確認新測試失敗**

```bash
npm test -- useHostForm --silent
```

預期：多個新測試 FAIL（winRate 不存在、defaultForm 仍為 $25/$125、banner 邏輯不對）

- [ ] **Step 3: 修改 useHostForm.ts**

**3a. 更新 import**

加入 `calculateWinRate`：

```ts
import { scalePrizesToTicketPrice, calculateRTP, calculateWinRate } from "@/utils/prize-presets";
```

**3b. 更新 defaultForm — 還原為 $100/$500，weight 345**

```ts
const defaultForm: HostFormState = {
  sessionTitle: "",
  prizes: [
    newPrize("uid-0", "謝謝參與", "0", "345"),
    newPrize("uid-1", "$100", "100", "45"),
    newPrize("uid-2", "$500", "500", "10"),
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

**3c. 加入 `pendingPreset` state（在 `showRescalePrompt` 之後）**

```ts
const [pendingPreset, setPendingPreset] = useState<DifficultyPreset | null>(null);
```

**3d. 加入 `winRate` memo（在 `currentRTP` memo 之後）**

```ts
const winRate = useMemo<number | null>(
  () => calculateWinRate(form.prizes),
  [form.prizes],
);
```

**3e. 替換 `setCellsPerZone`（永不出 banner）**

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
    }
  },
  [prizesDirty, form.ticketPrice, form.difficultyPreset],
);
```

**3f. 替換 `setDifficultyPreset`（dirty 時出 banner）**

```ts
const setDifficultyPreset = useCallback(
  (preset: DifficultyPreset) => {
    if (prizesDirty) {
      setPendingPreset(preset);
      setShowRescalePrompt(true);
    } else {
      const price = parseInt(form.ticketPrice, 10) || 100;
      const newPrizes = scalePrizesToTicketPrice(preset, price, cellCount);
      setForm((f) => ({ ...f, difficultyPreset: preset, prizes: newPrizes }));
    }
  },
  [prizesDirty, form.ticketPrice, cellCount],
);
```

**3g. 替換 `setRowsPerCard`（永不出 banner）**

```ts
const setRowsPerCard = useCallback(
  (v: string) => {
    const isTripleOrSymbol =
      form.mechanic === "triple" || form.mechanic === "symbol";
    if (isTripleOrSymbol && !prizesDirty) {
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
    }
  },
  [form.mechanic, prizesDirty, form.ticketPrice, form.difficultyPreset],
);
```

**3h. 替換 `confirmRescale`（套用 pendingPreset）**

```ts
const confirmRescale = useCallback(
  (doRescale: boolean) => {
    if (doRescale && pendingPreset) {
      const price = parseInt(form.ticketPrice, 10) || 100;
      const newPrizes = scalePrizesToTicketPrice(pendingPreset, price, cellCount);
      setForm((f) => ({ ...f, difficultyPreset: pendingPreset, prizes: newPrizes }));
      setPrizesDirty(false);
    }
    setPendingPreset(null);
    setShowRescalePrompt(false);
  },
  [pendingPreset, form.ticketPrice, cellCount],
);
```

**3i. 更新 return 物件加入 `winRate`**

在 return 物件中加入：

```ts
winRate,
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test --silent
```

預期：**全部測試通過**（包含 game-math、prize-presets、useHostForm）

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHostForm.ts src/hooks/useHostForm.test.ts
git commit -m "feat: useHostForm — revert to $100/$500 defaults, banner on preset switch, expose winRate"
```

---

## Task 4: UI — EVDisplay 中獎率 + HostPage banner 文案 + PrizePoolModal 中獎率

**Files:**
- Modify: `src/components/host/EVDisplay.tsx`
- Modify: `src/pages/HostPage.tsx`
- Modify: `src/components/common/PrizePoolModal.tsx`

> ⚠️ 本 task 為純 UI 層修改，無法用 jsdom 有效測試。完成後需在瀏覽器手動驗證。

- [ ] **Step 1: EVDisplay 加入中獎率顯示**

讀取 `src/components/host/EVDisplay.tsx`。

更新 Props interface：

```ts
interface EVDisplayProps {
  rtp: number | null;
  winRate: number | null;
  cardTypes?: CardTypeConfig[];
  totalExpectedPayout?: number | null;
}
```

更新函式簽名加入 `winRate`：

```ts
export default function EVDisplay({
  rtp,
  winRate,
  cardTypes,
  totalExpectedPayout,
}: EVDisplayProps) {
```

在 `{/* 查看獎池 */}` 按鈕所在的 div 之後、`賺錢率` div 之前，加入中獎率顯示：

```tsx
          {winRate !== null && (
            <div>
              <span className="text-xs opacity-70 block">中獎率</span>
              <span className="text-lg font-bold">
                {(winRate * 100).toFixed(1)}%
              </span>
            </div>
          )}
```

- [ ] **Step 2: HostPage 傳入 winRate + 更新 banner 文案**

讀取 `src/pages/HostPage.tsx`。

在 useHostForm 解構中加入 `winRate`（如果尚未有的話）：

找到 `useHostForm(BASE_URL)` 的解構，在 `showRescalePrompt,` 之後加入：

```ts
    winRate,
```

更新 EVDisplay 元件傳入 winRate：

```tsx
          <EVDisplay
            rtp={bingoRTP ?? currentRTP}
            winRate={winRate}
            cardTypes={config?.cardTypes}
            totalExpectedPayout={totalExpectedPayout}
          />
```

更新 banner 文案（找到 `data-testid="rescale-prompt"` 的 div）：

將 `<span className="text-red-200">` 內的文字從 `格數已變更，獎項金額需重新對應調整。` 改為：

```
你已手動修改過獎項，套用預設將覆蓋現有設定。
```

將「重套預設金額」按鈕文字改為：

```
套用預設
```

- [ ] **Step 3: PrizePoolModal 加入中獎率摘要列**

讀取 `src/components/common/PrizePoolModal.tsx`。

在 `PrizeTable` 元件中，`<table>` 結束後加入中獎率摘要：

找到 `PrizeTable` 函式，在 `</table>` 之後、return 結尾之前加入：

```tsx
      {totalWeight > 0 && (
        <div className="mt-3 flex justify-between items-center border-t border-red-700 pt-3">
          <span className="text-sm text-yellow-300 font-bold">中獎率</span>
          <span className="text-sm text-white font-bold">
            {(
              (prizes
                .filter((p) => p.amount > 0)
                .reduce((s, p) => s + p.probability, 0) /
                totalWeight) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
      )}
```

需要將 `PrizeTable` 的 return 包在一個 `<div>` 或 fragment 中（目前只回傳 `<table>`）。改為：

```tsx
function PrizeTable({ cardType }: { cardType: CardTypeConfig }) {
  const { prizes } = cardType;
  const totalWeight = prizes.reduce((sum, p) => sum + p.probability, 0);
  const winWeight = prizes
    .filter((p) => p.amount > 0)
    .reduce((sum, p) => sum + p.probability, 0);

  return (
    <>
      <table className="w-full text-sm">
        {/* ... 既有 thead + tbody 不動 ... */}
      </table>
      {totalWeight > 0 && (
        <div className="mt-3 flex justify-between items-center border-t border-red-700 pt-3">
          <span className="text-sm text-yellow-300 font-bold">中獎率</span>
          <span className="text-sm text-white font-bold">
            {((winWeight / totalWeight) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: 執行全套測試確認無 regression**

```bash
npm test --silent
```

預期：全部通過

- [ ] **Step 5: Commit**

```bash
git add src/components/host/EVDisplay.tsx src/pages/HostPage.tsx src/components/common/PrizePoolModal.tsx
git commit -m "feat: show win rate in host EVDisplay and player PrizePoolModal, update banner text"
```

---

## 完成後驗證

- [ ] `npm test --silent` 全部通過
- [ ] 主持人頁載入，初始 prizes 顯示 $100/$500（金額不變）
- [ ] EVDisplay 顯示 RTP ≈ 95%、中獎率 ≈ 13.8%
- [ ] 手動改獎項後切 preset → 出現 banner「套用預設」/「保留現有」
- [ ] confirmRescale(true) → prizes 更新為 preset、banner 消失
- [ ] confirmRescale(false) → prizes 不變、banner 消失
- [ ] 改格數 → 無 banner，pristine 時 weight 靜默調整
- [ ] 玩家 PrizePoolModal 顯示中獎率
- [ ] triple 玩法行為同上
- [ ] compare / bingo 玩法不受影響

> ⚠️ 以上視覺項目需在瀏覽器手動驗證。
