# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

**電子刮刮樂**（Electric Scratch-Off Lottery）

> 可自訂獎項的網頁刮刮樂：主持人配置牌局，玩家從牌堆選牌刮開，結果可截圖分享。

### 核心功能範圍

- **主持人設定頁** `/host`：設定獎項名稱、機率、卡片數量與外觀
- **玩家遊玩頁** `/play`：從牌堆中挑選並刮開卡片，揭曉結果
- **無後端**：設定以 URL query params 編碼傳遞，同時生成 QR Code 供掃碼進入
- **結果分享**：支援截圖分享；長遠規劃保留列印支援空間（`@media print`）
- **視覺基準**：參考台灣彩券近年實體刮刮樂的版面、色彩與質感設計

## 技術棧

- **語言**：TypeScript（strict 模式）
- **框架**：React + Vite（純前端 SPA，無需 SSR）
- **套件管理**：npm（或 bun，以專案內 lockfile 為準）
- **樣式**：TailwindCSS
- **狀態管理**：Zustand
- **刮除效果**：原生 `<canvas>` API（`destination-out` composite operation）
- **截圖**：`html2canvas` 或 `dom-to-image`
- **QR Code**：`qrcode` 套件生成，嵌入主持人頁面

## 常用指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（熱重載）
npm run dev

# 建置正式版本
npm run build

# 預覽正式建置結果
npm run preview

# 執行型別檢查
npm run typecheck   # 或 npx tsc --noEmit

# 執行 Lint
npm run lint        # eslint

# 執行測試
npm test            # vitest（推薦）

# 執行單一測試檔案
npx vitest run src/components/ScratchCard.test.tsx

# 查看測試覆蓋率
npx vitest run --coverage
```

## 架構概覽

```
src/
├── components/          # UI 元件
│   ├── ScratchCard/     # 核心刮刮樂卡片（含 Canvas 刮除邏輯）
│   └── RewardDisplay/   # 獎項展示元件
├── hooks/               # 自訂 React hooks
│   └── useScratch.ts    # 刮除進度、完成判斷邏輯
├── stores/              # 狀態管理（Zustand 推薦）
│   └── gameStore.ts     # 遊戲狀態：獎項池、已刮張數等
├── utils/               # 純函式工具
│   └── lottery.ts       # 抽獎邏輯、獎項機率計算
├── types/               # TypeScript 型別定義
└── assets/              # 靜態資源（圖片、音效）
```

### 核心刮除機制

刮除效果以 HTML `<canvas>` 實作：
- 在 canvas 上繪製遮罩層（灰色或紋理圖）
- 監聽 `pointermove` 事件，使用 `destination-out` composite operation 清除遮罩
- 計算已清除像素比例（`getImageData` 取樣），達到門檻（如 70%）後判定刮完
- 刮完後顯示底層獎項（DOM 元素或圖片）

### 狀態流程

```
使用者刮卡 → useScratch hook 更新刮除進度
    → 進度 ≥ 門檻 → gameStore 記錄結果
    → RewardDisplay 動畫展示獎項
```

## 視覺設計語言（參考台灣彩券實體刮刮樂）

### 版面
- 卡片一律**橫式**（landscape）
- 每張卡 1–2 個**不規則有機形刮除區**（雲朵/生肖輪廓），不用方形格

### 色彩
| 用途 | 描述 |
|------|------|
| 背景 | 漸層紅橘（`#CC0000 → #FF6600`）+ 放射狀金色光暈 |
| 標題字 | 金色漸層（`#FFD700 → #FFA500`）+ 黑色描邊 |
| 刮除層（刮前） | 銀灰金屬質感（`#C0C0C0`，高光模擬） |
| 刮後顯示 | 深色底 + 金/白 Serif 字體金額 |
| 第一版主題 | 財神（粉紅洋紅輔色，財神爺角色） |

### 特效
- 粒子特效於**刮除過程中**持續觸發（星星、金幣飛散）
- 提供全域**特效開關**（`effectsEnabled`），可由主持人設定或玩家自行關閉
- 中獎揭曉時額外觸發爆發特效

## 開發慣例

- **不可變資料**：獎項池、抽獎結果一律回傳新物件，不修改原始陣列
- **元件大小**：單一元件檔案不超過 400 行；Canvas 邏輯抽離至 `useScratch` hook
- **機率設定**：獎項機率在 `utils/lottery.ts` 集中管理，方便調整
- **無障礙**：刮刮樂卡片提供鍵盤替代操作（空白鍵 / Enter 直接揭曉）
- **開發流程**：SDD 主導（TypeScript 介面即規格）+ TDD 輔助（介面確認後補測試）
