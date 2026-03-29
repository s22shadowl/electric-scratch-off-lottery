import { useHostForm } from "@/hooks/useHostForm"
import PrizeEditor from "@/components/host/PrizeEditor"
import SharePanel from "@/components/host/SharePanel"
import DifficultySelector from "@/components/host/DifficultySelector"
import EVDisplay from "@/components/host/EVDisplay"
import InfoTooltip from "@/components/ui/InfoTooltip"
import { HOST_HELP_TEXT } from "@/utils/host-help-text"

const BASE_URL = window.location.origin

export default function HostPage() {
  const {
    form,
    isValid,
    playUrl,
    qrCode,
    copied,
    config,
    currentRTP,
    bingoRTP,
    totalExpectedPayout,
    showRescalePrompt,
    winRate,
    weightTotal,
    setTitle,
    updatePrize,
    addPrize,
    removePrize,
    setCardCount,
    toggleEffects,
    toggleAllowReturnToPile,
    setDifficultyPreset,
    setTicketPrice,
    setMechanic,
    setPrizePerLine,
    copyUrl,
    confirmRescale,
    normalizeWeights,
  } = useHostForm(BASE_URL)

  return (
    <main
      data-testid="host-page"
      className="min-h-screen bg-gradient-to-br from-red-800 to-red-950 text-white p-6"
    >
      {/* 頁面標題 */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-black text-yellow-400 drop-shadow-lg tracking-wide">
          ✦ 電子刮刮樂 ✦
        </h1>
        <p className="text-red-300 text-sm mt-1">主持人設定</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左欄：設定表單 */}
        <div className="space-y-6">
          {/* 活動名稱 */}
          <section>
            <label
              htmlFor="session-title"
              className="block text-lg font-bold text-yellow-300 mb-3"
            >
              活動名稱
            </label>
            <input
              id="session-title"
              type="text"
              value={form.sessionTitle}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：2026 年終晚會抽獎"
              className="w-full px-4 py-2 rounded-lg bg-red-900 border border-red-700 text-white placeholder-red-400 focus:outline-none focus:border-yellow-400"
            />
          </section>

          {/* 提示 banner（preset 覆蓋 / 權重正規化，互斥顯示） */}
          {showRescalePrompt ? (
            <div
              data-testid="rescale-prompt"
              className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm"
            >
              <p className="text-red-200 mb-3">
                要套用新的難度預設嗎？目前的獎項設定會被覆蓋。
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => confirmRescale(true)}
                  className="px-3 py-1.5 bg-yellow-400 text-red-900 text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors"
                >
                  套用
                </button>
                <button
                  type="button"
                  onClick={() => confirmRescale(false)}
                  className="px-3 py-1.5 text-red-300 text-sm hover:text-white transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : Math.abs(weightTotal - 100) >= 0.01 ? (
            <div
              data-testid="normalize-prompt"
              className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm"
            >
              <p className="text-red-200 mb-3">
                將權重依百分比轉換
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={normalizeWeights}
                  className="px-3 py-1.5 bg-yellow-400 text-red-900 text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors"
                >
                  自動調整
                </button>
              </div>
            </div>
          ) : null}

          {/* 獎項編輯 */}
          <PrizeEditor
            prizes={form.prizes}
            weightTotal={weightTotal}
            onUpdate={updatePrize}
            onAdd={addPrize}
            onRemove={removePrize}
            disabled={form.mechanic === "bingo"}
          />

          {/* 難度預設 */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-red-200">難度預設</span>
              <InfoTooltip content={HOST_HELP_TEXT.difficultyPreset} />
            </div>
            <DifficultySelector
              value={form.difficultyPreset}
              onChange={setDifficultyPreset}
            />
          </div>

          {/* 牌局設定：玩法 / 總牌數 / 格數參數 / 票面價格 */}
          <section>
            <h2 className="text-lg font-bold text-yellow-300 mb-3">牌局設定</h2>

            {/* 玩法選擇 */}
            <div
              role="radiogroup"
              aria-label="玩法選擇"
              className="flex gap-2 mb-3"
            >
              {(
                [
                  { value: "symbol", label: "🎴 符號" },
                  { value: "triple", label: "🎯 三同" },
                  { value: "compare", label: "🃏 比大小" },
                  { value: "bingo", label: "🎱 賓果" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={form.mechanic === value}
                  onClick={() => setMechanic(value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                    form.mechanic === value
                      ? "bg-yellow-400 text-red-900 border-yellow-400"
                      : "bg-red-900 text-red-200 border-red-700 hover:border-yellow-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label htmlFor="card-count" className="text-xs text-red-200">
                    總牌數
                  </label>
                  <InfoTooltip content={HOST_HELP_TEXT.cardCount} />
                </div>
                <input
                  id="card-count"
                  type="number"
                  value={form.cardCount}
                  onChange={(e) => setCardCount(e.target.value)}
                  min="1"
                  max="200"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="ticket-price"
                    className="text-xs text-red-200"
                  >
                    票面價格（元）
                  </label>
                  <InfoTooltip content={HOST_HELP_TEXT.ticketPrice} />
                </div>
                <input
                  id="ticket-price"
                  type="number"
                  value={form.ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            {form.mechanic === "bingo" && (
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="prize-per-line"
                    className="text-xs text-red-200"
                  >
                    每線獎金（元）
                  </label>
                  <InfoTooltip content={HOST_HELP_TEXT.prizePerLine} />
                </div>
                <input
                  id="prize-per-line"
                  type="number"
                  value={form.prizePerLine}
                  onChange={(e) => setPrizePerLine(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
            )}
          </section>
        </div>

        {/* 右欄：分享 + 統計 + 開關 */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-yellow-300 mb-4">
              分享給玩家
            </h2>
            <SharePanel
              playUrl={playUrl}
              qrCode={qrCode}
              copied={copied}
              onCopy={copyUrl}
            />
          </div>

          {/* 即時 EV 顯示 */}
          <EVDisplay
            rtp={bingoRTP ?? currentRTP}
            winRate={winRate}
            cardTypes={config?.cardTypes}
            totalExpectedPayout={totalExpectedPayout}
          />

          {/* 開關群 */}
          <div className="space-y-3">
            <section className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-red-200">
                粒子特效（預設）
                <InfoTooltip content={HOST_HELP_TEXT.effectsEnabled} />
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.effectsEnabled}
                onClick={toggleEffects}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.effectsEnabled ? "bg-yellow-400" : "bg-red-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.effectsEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </section>

            <section className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-red-200">
                允許返回牌堆
                <InfoTooltip content={HOST_HELP_TEXT.allowReturnToPile} />
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.allowReturnToPile}
                onClick={toggleAllowReturnToPile}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.allowReturnToPile ? "bg-yellow-400" : "bg-red-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.allowReturnToPile ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
