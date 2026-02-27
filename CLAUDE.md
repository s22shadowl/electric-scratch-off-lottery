# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 專案概述、技術棧、玩法說明、視覺規格、Roadmap 見 README.md

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
│   ├── prize-presets.ts     # DIFFICULTY_PRESETS, scalePrizesToTicketPrice, calculateRTP, classifyDifficulty
│   └── game-math.ts         # calculateRTP, classifyDifficulty, calcBingoLineProbabilities, computeWinnings(exported)
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
│   ├── ScratchCellCanvas.tsx
│   └── BingoCellCanvas.tsx
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

### Predetermined Outcome 架構

```
buildDeck(config)
  → 每張卡先 drawPrize() 決定獎項結果
  → 再 buildCard(result) 依 mechanic 分支產生符合結果的圖案
     symbol → buildZone
     triple → buildTripleZones（3 zones × rowsPerCard cells）
     compare → buildCompareZones（3 zones × roundsPerCard cells）
     bingo  → buildBingoZones（zone[0]=開獎號碼 auto-revealed, zone[1]=賓果格 scratch-off）
```

### GamePhase 狀態流

```
pile → scratching → results
```

### v2 型別架構（已實作）

```typescript
type Mechanic = "symbol" | "triple" | "compare" | "bingo"
interface CardTypeConfig {
  mechanic: Mechanic
  prizes: Prize[]
  count: number
  themeId: string
  difficultyPreset: "generous" | "standard" | "conservative" | "realistic"
  mechanicOptions: SymbolOptions | TripleOptions | CompareOptions
  ticketPrice: number
}
interface GameConfig {
  sessionTitle: string
  cardTypes: CardTypeConfig[]
  effectsEnabled: boolean
}
```

## 開發慣例

- **不可變資料**：所有 store action、utility 函式一律回傳新物件
- **SDD 主導**：`types/index.ts` 是規格錨點，介面確認後再實作
- **TDD 輔助**：每個 utility / hook / store action 均有對應測試，覆蓋率維持 80%+
- **元件大小**：單一檔案不超過 400 行，Canvas 邏輯抽離至 hook
- **卡片旋轉**：已移除（需求取消），勿重新加入

## Session 工作流程

- **每個 feature 一個 session**：討論決策後立刻進入實作；push 後結束 session，下個 feature 開新 session
- **計畫工具**：使用 `everything-claude-code:plan`（Task subagent）；不使用內建 Plan Mode（`EnterPlanMode` 會寫入 `~/.claude/plans/` 並在每個新 session 自動全文掛載）
- **Annotation cycle**：`/plan` 產出後可多輪標注修正並說「不要動手」，確認後再實作
- **Plan 格式**：每個 Step 必須列出影響的檔案清單 + 修改方式（新增欄位/重構函式/加條件判斷等）
- **Phase commit**：每個 Phase（邏輯獨立功能單元）完成後立即 commit
- **Plan 輕量化**：計畫只記決策結果，不記實作細節；完成後決策結果移入 MEMORY.md，計畫本身丟棄
- **暫存規格檔**：建立時告知用戶；刪除前必須與用戶確認
- **Post-implementation 流程**：code-reviewer subagent → 修 HIGH/CRITICAL → commit + push → 結束 session
- **Subagent 模式**：實作 + code-review 交給 Task subagent（worktree 隔離）；主 session 只負責需求討論與計畫確認
