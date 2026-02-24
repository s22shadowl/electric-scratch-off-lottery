# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**電子刮刮樂**（Electric Scratch-Off Lottery）

> 可自訂獎項的網頁刮刮樂：主持人配置牌局，玩家從牌堆選牌刮開，結果可截圖分享。

### 核心功能範圍

- **主持人設定頁** `/host`：設定玩法、難度預設、獎項、卡片數量、外觀
- **玩家遊玩頁** `/play`：從牌堆挑選編號卡片，刮開揭曉，全部完成後跳轉結果頁
- **無後端**：設定以 base64url URL query params 編碼傳遞，同時生成 QR Code
- **預先決定結果**：仿真實彩券，先決定整批獎項分布，再逆向生成圖案
- **結果分享**：`html-to-image` 截圖分享（結果頁 + 單張卡片）

## 技術棧

- **語言**：TypeScript（strict 模式）
- **框架**：React 19 + Vite 6（純前端 SPA）
- **套件管理**：npm
- **樣式**：TailwindCSS 4
- **狀態管理**：Zustand 5
- **刮除效果**：原生 `<canvas>` API（`destination-out` composite operation）
- **截圖**：`html-to-image`
- **QR Code**：`qrcode`

## 常用指令

```bash
npm install
npm run dev           # 開發伺服器 http://localhost:5173
npm run build
npm run preview
npm run typecheck     # npx tsc --noEmit
npm run lint
npm test              # vitest
npx vitest run src/path/to/file.test.ts   # 單一測試檔
npx vitest run --coverage
```

## 架構概覽

```
src/
├── types/index.ts           # 全專案型別定義（SDD 規格錨點）
├── utils/
│   ├── lottery.ts           # 抽獎邏輯、buildDeck（predetermined outcome 架構）
│   ├── canvas-utils.ts      # drawErase / drawSilverMask / calculateRevealedRatio
│   ├── config-codec.ts      # encodeConfig / decodeConfig / buildPlayUrl / generateQRCode
│   ├── symbol-pool.ts       # 10 種符號常數、assignSymbolsToPrizes
│   └── prize-presets.ts     # DIFFICULTY_PRESETS, scalePrizesToTicketPrice, calculateRTP, classifyDifficulty
├── stores/gameStore.ts      # Zustand 狀態機（REVEAL_THRESHOLD = 0.7）
├── hooks/
│   ├── useScratch.ts        # Canvas 刮除事件（willReadFrequently: true）
│   └── useHostForm.ts       # 主持人表單邏輯
├── pages/
│   ├── HostPage.tsx         # /host
│   └── PlayPage.tsx         # /play?config=
├── components/play/
│   ├── CardPile.tsx
│   ├── CardThumbnail.tsx
│   ├── ScratchCard.tsx
│   └── ScratchCellCanvas.tsx
└── components/host/
    ├── DifficultySelector.tsx
    ├── EVDisplay.tsx
    ├── PrizeEditor.tsx
    └── SharePanel.tsx
```

### 核心刮除機制

- Canvas 覆蓋銀色遮罩層，`pointermove` 以 `destination-out` 清除
- `getImageData` 取樣計算已刮比例，達 **70%（REVEAL_THRESHOLD）** 自動揭曉
- `getContext('2d', { willReadFrequently: true })` 避免瀏覽器效能警告

### Predetermined Outcome 架構（v1 簡化版，v2 完整）

```
buildDeck(config)
  → 每張卡先 drawPrize() 決定獎項結果
  → 再 buildCard(result) 產生符合結果的圖案
```

v2 已實作：`buildDeck` 依 `mechanic` 分支 — symbol 走 `buildZone`，triple 走 `buildTripleZones`（3 zones × rowsPerCard cells）

### GamePhase 狀態流

```
pile → scratching → results
```

### v2 架構（已實作）

```typescript
interface CardTypeConfig {
  mechanic: 'symbol' | 'triple'  // compare / bingo 尚未實作
  prizes: Prize[]
  count: number
  themeId: string
  difficultyPreset: 'generous' | 'standard' | 'conservative' | 'realistic'
  mechanicOptions: SymbolOptions | TripleOptions
  ticketPrice: number
}
interface GameConfig {
  sessionTitle: string
  cardTypes: CardTypeConfig[]
  effectsEnabled: boolean
}
```

## 玩法規格

### v1（已實作 ✅）：刮出特定符號
- 單一刮除區，刮開對照中獎表
- 符號池 10 種（symbol-pool.ts）

### v2a（已實作 ✅）：三同（Triple Match）
- 3 個刮除區，全同即中
- Win invariant 在 buildTripleZones 建構期保證；符號池 10 種

### v2b：比大小（High-Low）
- 結果預先決定，平手算輸

### v2c：賓果（Bingo）
- 3×3 ～ 6×6 正方形可設定
- 可重複中獎（多條線多重獎）

## 難度預設（主持人介面選擇）

| 預設 | 賺錢率 | 適用 |
|---|---|---|
| 慷慨 | 高（期望值正）| 兒童活動 |
| 標準 | 約持平 | 一般聚會 |
| 保守 | 小負 | 競爭感 |
| 真實難度 | 負（仿台灣彩券 3–18% 賺錢率）| 最貼近真實 |

## 開獎動畫等級

以「佔本場最高獎金比例」自動分級：

| 等級 | 條件 | 動畫 |
|---|---|---|
| 0 | 未中獎 | 灰暗淡出 |
| 1 | 小獎 ＜ 10% | 閃光 + 少量金幣 |
| 2 | 中獎 10–50% | 爆炸金幣 + 光束 |
| 3 | 大獎 ＞ 50% | 全螢幕爆炸 + 煙火 |

## 卡片編號

- 主持人選擇：**序列號**（`A001`、`A002`...，可設起始）或**隨機碼**（6 碼英數）
- 顯示在牌堆卡片正面（讓玩家挑「幸運號碼」，仿真實彩券迷信心理）
- 純顯示，無遊戲機制連動

## 視覺設計語言（參考台灣彩券實體刮刮樂）

| 用途 | 描述 |
|---|---|
| 背景 | 漸層紅橘（`#CC0000 → #FF6600`）+ 放射狀金色光暈 |
| 標題字 | 金色漸層（`#FFD700 → #FFA500`）+ 黑色描邊 |
| 刮除層 | 銀灰金屬質感（`#C0C0C0`，高光模擬） |
| 刮後顯示 | 深色底 + 金/白 Serif 字體 |
| v1 主題 | 財神（粉紅洋紅輔色）|

- 卡片一律**橫式**（landscape）
- 粒子特效於刮除過程觸發，提供全域開關（`effectsEnabled`）

## 開發慣例

- **不可變資料**：所有 store action、utility 函式一律回傳新物件
- **SDD 主導**：`types/index.ts` 是規格錨點，介面確認後再實作
- **TDD 輔助**：每個 utility / hook / store action 均有對應測試，覆蓋率維持 80%+
- **元件大小**：單一檔案不超過 400 行，Canvas 邏輯抽離至 hook
- **卡片旋轉**：已移除（需求取消），勿重新加入

## Session 工作流程

- **設計與實作同一 session**：討論決策後立刻進入實作，不跨 session；如需離開先 commit
- **計畫工具**：使用 `everything-claude-code:plan`（Task subagent）；不使用內建 Plan Mode（`EnterPlanMode` 會寫入 `~/.claude/plans/` 並在每個新 session 自動全文掛載）
- **Annotation cycle**：`/plan` 產出後可多輪標注修正並說「不要動手」，確認後再實作
- **Plan 輕量化**：計畫只記決策結果，不記實作細節；完成後決策結果移入 MEMORY.md，計畫本身丟棄
