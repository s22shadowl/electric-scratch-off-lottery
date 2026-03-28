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
- **Phase commit**：每個 Phase（邏輯獨立功能單元）完成後立即 commit；commit 前自檢：「這次改動是否使 README 或其他文檔描述過時？」若有，提出修改建議與用戶討論確認後一併 commit
- **暫存規格檔**：建立時告知用戶；刪除前必須與用戶確認
- **Post-implementation 流程**：code-reviewer subagent → 修 HIGH/CRITICAL/MEDIUM → commit + push → 結束 session
- **Subagent 模式**：實作 + code-review 交給 Task subagent（worktree 隔離）；主 session 只負責需求討論與計畫確認
- **Worktree subagent commit**：subagent prompt 末尾必須明確要求執行 `git add <files> && git commit`，否則變更只停留在 working directory，merge 時會出現 "Already up to date"（分支無新 commit）
- **Session 結束前**：主動回顧對話，檢查是否產生新決策或偏好變更需更新 memory/文檔，列出項目與用戶確認後執行

## 視覺設計參考

進行任何 UI／視覺修改（元件樣式、顏色、排版、格子設計）前，**必須先讀取** `.claude/plans/design-style-guide.md`，對照設計規範再決定修改方向。僅在新增參考圖至 `.claude/design-refs/` 時才需重新讀取圖片並更新 style guide。

## 文檔與 Memory 管理

- **文檔修改需確認**：任何對 README.md、規格文件、CLAUDE.md 的修改，必須先與用戶討論內容再執行
- **Memory 寫入守則**（auto memory 由 Claude 管理，遵守以下規則）：
  - MEMORY.md 是索引，不放詳細內容
  - 禁止寫入：可從程式碼/git 推導的資訊（架構細節、CSS 定位、import 路徑）、暫時性狀態（當前分支、測試數量、待辦清單）、工具操作細節
  - 每筆 memory 自問：「下個 session 讀程式碼或跑 git 能得到嗎？」→ 能就不存

