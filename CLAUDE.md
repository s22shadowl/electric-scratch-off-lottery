# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 常用指令、實作機制架構、專案概述、技術棧、玩法說明、視覺規格、Roadmap 見 README.md

## 開發慣例

- **不可變資料**：所有 store action、utility 函式一律回傳新物件
- **SDD 主導**：`types/index.ts` 是規格錨點，介面確認後再實作
- **TDD 輔助**：每個 utility / hook / store action 均有對應測試；`src/utils/**` 和 `src/stores/**` 覆蓋率維持 90%+
- **測試責任分界**：
  - 單元測試負責：props → 渲染輸出、state 變化、event callback、條件渲染
  - 手動驗證負責：Canvas 繪製、CSS 動畫、touch 事件、Web API（截圖、分享）— 這類行為 jsdom 無法有效模擬，強行覆蓋只會產生無意義的 mock
- **元件大小**：單一檔案不超過 400 行，Canvas 邏輯抽離至 hook

## Session 工作流程

- **每個 feature 一個 session**：討論決策後立刻進入實作；push 後結束 session，下個 feature 開新 session
- **計畫工具**：使用 `everything-claude-code:plan`（Task subagent）；不使用內建 Plan Mode（`EnterPlanMode` 會寫入 `~/.claude/plans/` 並在每個新 session 自動全文掛載）
- **Annotation cycle**：`/plan` 產出後可多輪標注修正並說「不要動手」，確認後再實作
- **Plan 格式**：每個 Step 必須列出影響的檔案清單 + 修改方式（新增欄位/重構函式/加條件判斷等）
- **Phase commit**：每個 Phase（邏輯獨立功能單元）完成後立即 commit
- **Plan 輕量化**：計畫只記決策結果，不記實作細節；完成後決策結果移入 MEMORY.md，計畫本身丟棄
- **暫存規格檔**：建立時告知用戶；刪除前必須與用戶確認
- **Post-implementation 流程**：code-reviewer subagent → 修 HIGH/CRITICAL/MEDIUM → commit + push → 結束 session
- **Subagent 模式**：實作 + code-review 交給 Task subagent（worktree 隔離）；主 session 只負責需求討論與計畫確認
- **Worktree subagent commit**：subagent prompt 末尾必須明確要求執行 `git add <files> && git commit`，否則變更只停留在 working directory，merge 時會出現 "Already up to date"（分支無新 commit）

## 視覺設計參考

進行任何 UI／視覺修改（元件樣式、顏色、排版、格子設計）前，**必須先讀取** `.claude/design-refs/` 內的所有圖片，對照真實彩券的材質感、排版密度、Typography 風格，再決定修改方向。

## Skill 使用規範

調用任何 skill 後，**必須實際改變工作流程**，不能只是讀過指引就繼續用原本的方式工作。具體要求：
- 調用 skill 後，先列出因為該 skill 而新增的具體工作步驟，確認後再開始產出
- 每次產出前，以 skill 指引 + MEMORY.md 已確認決策 作為 checklist 自檢，不通過不產出
