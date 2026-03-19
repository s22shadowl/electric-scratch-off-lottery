# 電子刮刮樂

> 可自訂獎項的網頁刮刮樂：主持人配置牌局，玩家從牌堆選牌刮開，結果可截圖分享。

純前端 SPA，無需後端、無需帳號。主持人設定完成後產生連結與 QR Code，玩家掃碼即可開始遊玩。

---

## 功能特色

- **主持人設定頁** `/host`：自訂獎項名稱、金額、中獎機率、卡片數量
- **QR Code 分享**：設定完成即產生遊玩連結與 QR Code，無需傳送任何後端資料
- **牌堆選牌**：玩家自由挑選卡片，每張卡顯示唯一序號（`XXXX-NN` 格式）仿彩券迷信體驗
- **Canvas 刮除效果**：手指 / 滑鼠滑過刮開，70% 刮除自動揭曉；刮除時觸發金色粒子特效
- **預先決定結果**：仿真實彩券「先決定獎項、再生成圖案」架構，確保獎項分布精確
- **開獎動畫**：依獎項金額佔本場最高獎比例自動分級（0–3 級閃光動畫）
- **結果總覽**：所有卡片刮完後自動跳轉，支援展開單張詳情
- **截圖分享**：結果頁與單張卡片皆可截圖；行動裝置使用原生分享介面，桌面直接下載
- **財神主題**：台灣彩券風格視覺（紅金漸層、銀色刮除層）
- **行動裝置優化**：觸控筆刷加大、防頁面誤滾動、安全區域適配

---

## 快速開始

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

## 使用流程

**主持人**

1. 開啟 `/host`
2. 填入牌局標題、選擇玩法與難度預設（或自訂獎項機率）、設定卡片張數
3. 複製遊玩連結，或讓玩家掃描 QR Code

**玩家**

1. 開啟主持人提供的連結
2. 從牌堆中點選想要的卡片（可挑選喜歡的編號，支援複選）
3. 按「開始刮！」，用滑鼠或手指刮開獎項區
4. 全部刮完後自動跳轉結果總覽，可截圖分享

---

## 技術堆疊

| 分類     | 技術                                 |
| -------- | ------------------------------------ |
| 前端框架 | React 19 + Vite 6                    |
| 語言     | TypeScript（strict）                 |
| 樣式     | TailwindCSS 4                        |
| 狀態管理 | Zustand 5                            |
| 刮除效果 | 原生 Canvas API（`destination-out`） |
| 設定傳遞 | base64url URL 參數                   |
| QR Code  | `qrcode`                             |
| 截圖     | `html-to-image`                      |
| 測試     | Vitest + Testing Library             |

---

## Roadmap

### v1.0 — 完成核心流程 ✅

- [x] 結果總覽頁（所有卡片刮完後自動跳轉，可展開單張詳情）
- [x] 開獎動畫（依獎項大小分四個等級：無 / 小閃光 / 雙層閃光 / 三層閃光+彈跳）
- [x] 截圖分享（`html-to-image`，結果頁與單張卡片；行動端 Web Share API）
- [x] 粒子特效（刮除過程金色粒子飛散，可關閉）
- [x] 卡片編號（`XXXX-NN` 格式序號，同場牌局共用 session code）
- [x] 行動裝置優化（iOS / Android，觸控筆刷調整、防頁面誤滾動）

### v2.0 — 玩法擴充

架構重構：`GameConfig` 改為支援多卡型（`cardTypes: CardTypeConfig[]`），同一場可混搭不同玩法與外觀。

**難度預設**（四種，於主持人介面選擇）

| 預設     | 賺錢率           | 說明                       |
| -------- | ---------------- | -------------------------- |
| 慷慨     | 高（期望值正）   | 兒童活動、暖場             |
| 標準     | 約持平           | 一般聚會                   |
| 保守     | 小負             | 競爭感更強                 |
| 真實難度 | 負（仿台灣彩券） | 賺錢率 3–18%，貼近真實體驗 |

**新玩法**

- [x] **三同（Triple Match）**：刮開 3 區，全同即中，10 種符號池
- [x] **比大小（High-Low）**：3 欄（你的號碼 / 莊家號碼 / 獎金），你大於莊即中，平手算輸，結果預先決定
- [x] **賓果（Bingo）**：3×3 ～ 6×6 可設定；2 個區域（開獎號碼逐格刮開 + 賓果格刮除）；可重複中獎（多條線多重獎）；獎金以 prizePerLine × 連線數計算

**工具與 UX**

- [x] **game-math.ts 集中**：calculateRTP、classifyDifficulty、calcBingoLineProbabilities 集中至 game-math.ts
- [x] **獎池查看**：玩家可在刮刮樂中點 ⓘ 圖示查看本張獎池；主持人亦可在設定後點 ⓘ 預覽獎池分布；EVDisplay 新增整場預期支出（隨牌數即時更新）
- [x] **Bingo UX 優化**：RTP 正確計算（prizePerLine × 連線期望值）、一鍵刮開、版型手機優先、開獎號碼配對特效
- [x] **結果頁 UX**：刮完後顯示 Splash overlay（含 confetti 特效）再進入結果頁；結果卡片 stagger 動畫入場
- [x] **返回牌堆按鈕**：結果頁加入「返回牌堆」按鈕（可開關），讓玩家繼續選牌；主持人可在設定時關閉此功能（單次遊玩模式）
- [x] **Bingo 後續優化**：開獎號碼區改為逐格刮開；刮開後即時高亮賓果格對應號碼；全部揭曉才結算

**視覺升級**

- [x] 美術素材準備：LLM 生成財神、元寶等裝飾圖（確認 prompt 方向、篩選並整理 PNG 資源）
- [x] 版型精緻化實作：套用素材 + CSS 升級仿真實紙本刮刮樂質感（金屬紋理、浮雕邊框、Serif 字體、安全紋底）
- [x] 玩法說明 UI（主持人設定說明 tooltip + 玩家端規則卡）
- [x] **二次精緻化版型**（完成 ✅ Phase 1–5）：Zone 有機 blob 外形（SVG clip-path polygon）、防偽底紋（對角線波浪紋）、銀色水平漸層刮除層、ScratchCard 標題欄（NT$｜標題｜序號）、Noto Serif TC + 財神圖、內容擾動特效、固定玩法尺寸
- [x] **三次視覺優化 v3**（邏輯層完成）：參考真實彩券重設計——CSS 印刷斜線底紋、格子淺粉底 + 粗紅框 + 大字金額、Symbol 格子 seeded 尺寸差異、Bingo Zone[0] 預先印刷
- [x] **SymbolLayout 全卡重寫**：absolute 定位 + 手機版 344×440 / 桌面版 520×665 雙尺寸、手工格子座標+clip-path、Dela Gothic One 標題字體、裝飾/財神/一鍵刮開完整渲染、ThemeLayoutEntry fullCard 架構
- [ ] **獎金邏輯改寫**（含標題區 formatMaxPrize 溢出防護）— 等視覺精緻化完成後處理

### v2.5 — 視覺精緻化

- [ ] 視覺差距檢視：對照設計參考盤點現狀不足處，補充參考圖至 `.claude/design-refs/`，產出具體優化清單
- [ ] SymbolLayout 持續優化
- [ ] Triple ThemeLayout（同 SymbolLayout 等級：absolute 定位、雙尺寸、手工座標）
- [ ] Compare ThemeLayout
- [ ] Bingo ThemeLayout
- [ ] PlayPage 全螢幕 overlay + 單卡片切換（行動端 UX）
- [ ] 多款式選擇（節慶、生肖等主題）

### v3.0 — 收尾與穩定化（nice-to-have）

- [ ] 列印支援（`@media print`）
- [ ] 鍵盤無障礙（空白鍵 / Enter 直接揭曉）
- [ ] CI/CD Pipeline + pre-commit hooks（GitHub Actions + husky/lint-staged：lint、typecheck、test 全自動化，PR 合併前強制通過）

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
