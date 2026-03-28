# RTP 數學修正設計文件

**日期：** 2026-03-28
**分支：** feat/v2.5-symbol-visual-refinement
**範圍：** symbol + triple 玩法

---

## 問題描述

`calculateRTP` 目前計算的是「每格」EV / ticketPrice，而非「每張卡」EV / ticketPrice。symbol / triple 玩法每格獨立抽獎，導致顯示的 RTP 被嚴重低估：

- standard preset，ticketPrice=100，cellsPerZone=4
- per-cell EV = $95，per-card EV = $95 × 4 = $380
- 實際 RTP = 380%，但畫面顯示 95%

---

## 設計決策

### 範圍
- **修正**：symbol、triple
- **不修**：compare、bingo（有效抽獎次數語意不同，另開 session）

### cellCount 定義
| 玩法 | cellCount |
|------|-----------|
| symbol | `cellsPerZone` |
| triple | `rowsPerCard` |
| compare / bingo | `1`（不傳，預設值） |

### prizesDirty flag
追蹤使用者是否手動修改過獎項金額：
- 套用 preset → `false`
- 使用者手動改任何獎項 → `true`

cellsPerZone / rowsPerCard 變更時：
- `prizesDirty = false` → 靜默以新 cellCount 重算金額
- `prizesDirty = true` → 顯示 rescale 確認 banner

---

## 變更清單

### 1. `calculateRTP`（game-math.ts）

```ts
// Before
calculateRTP(prizes, ticketPrice): number | null

// After
calculateRTP(prizes, ticketPrice, cellCount = 1): number | null
// 回傳 (ev × cellCount) / ticketPrice
```

### 2. `scalePrizesToTicketPrice`（prize-presets.ts）

```ts
// Before
scalePrizesToTicketPrice(preset, ticketPrice): PrizeDraft[]

// After
scalePrizesToTicketPrice(preset, ticketPrice, cellCount: number): PrizeDraft[]
// 金額縮放：Math.round(p.amount × ticketPrice / 100 / cellCount)
```

DIFFICULTY_PRESETS 模板金額不變（已按 ticketPrice=100、1 格校準）。

### 3. `useHostForm`（hooks/useHostForm.ts）

新增 form state：
```ts
prizesDirty: boolean   // 初始 false
showRescalePrompt: boolean  // 初始 false
```

- **`currentRTP` memo**：改傳 cellCount（依 mechanic 決定）
- **`applyPreset`**：呼叫 `scalePrizesToTicketPrice(preset, ticketPrice, cellCount)`，reset `prizesDirty = false`
- **`setPrize` 等手動獎項修改**：set `prizesDirty = true`
- **`setCellsPerZone` / `setRowsPerCard`**：
  - `prizesDirty = false` → 重算金額（靜默）
  - `prizesDirty = true` → `showRescalePrompt = true`
- **`confirmRescale(rescale: boolean)`**：
  - `rescale = true` → 重算金額 + `prizesDirty = false`
  - `rescale = false` → 只關 banner，金額不動
  - 兩者都 `showRescalePrompt = false`

### 4. Banner UI（HostPage.tsx）

位置：獎項區上方，條件渲染 `showRescalePrompt`。
樣式與措辭交 `/impeccable` 處理。
兩個操作：「重套預設金額」/ 「保留現有設定」。

### 5. 修正 game-math.ts 說明註解

錯誤示例中的 `cellsPerZone=6` 改為 `cellsPerZone=4`，更新計算數字。

---

## Commit 拆分

| # | 內容 | 檔案 |
|---|------|------|
| 1 | `calculateRTP` 加 cellCount + 測試更新 | `game-math.ts`, `game-math.test.ts` |
| 2 | `scalePrizesToTicketPrice` 加 cellCount + 測試更新 | `prize-presets.ts`, `prize-presets.test.ts` |
| 3 | `useHostForm` dirty flag + cellCount wiring + rescale 邏輯 | `useHostForm.ts`, `useHostForm.test.ts` |
| 4 | Banner UI + HostPage 整合 | `HostPage.tsx`，新元件或 inline |
| 5 | 修正 game-math.ts 錯誤範例 | `game-math.ts` |

---

## 測試策略

- `calculateRTP`：補 cellCount=4 的測試；驗證 standard preset 回傳 0.95
- `scalePrizesToTicketPrice`：補 cellCount 參數測試；驗證金額正確縮小
- `useHostForm`：
  - dirty flag 行為（手動改 → true，套 preset → false）
  - cellsPerZone 改變 + dirty=false → 金額更新
  - cellsPerZone 改變 + dirty=true → showRescalePrompt=true
  - confirmRescale(true/false) 行為
