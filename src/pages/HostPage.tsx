import { useHostForm } from '@/hooks/useHostForm'
import PrizeEditor from '@/components/host/PrizeEditor'
import SharePanel from '@/components/host/SharePanel'
import DifficultySelector from '@/components/host/DifficultySelector'
import EVDisplay from '@/components/host/EVDisplay'

const BASE_URL = window.location.origin

export default function HostPage() {
  const {
    form, isValid, playUrl, qrCode, copied, currentRTP,
    setTitle, updatePrize, addPrize, removePrize,
    setCardCount, setCellsPerZone, toggleEffects,
    setDifficultyPreset, setTicketPrice, copyUrl,
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
            <label htmlFor="session-title" className="block text-sm font-bold text-yellow-300 mb-1">
              活動名稱
            </label>
            <input
              id="session-title"
              type="text"
              value={form.sessionTitle}
              onChange={e => setTitle(e.target.value)}
              placeholder="如：2026 年終晚會抽獎"
              className="w-full px-4 py-2 rounded-lg bg-red-900 border border-red-700 text-white placeholder-red-400 focus:outline-none focus:border-yellow-400"
            />
          </section>

          {/* 獎項編輯 */}
          <PrizeEditor
            prizes={form.prizes}
            onUpdate={updatePrize}
            onAdd={addPrize}
            onRemove={removePrize}
          />

          {/* 難度預設 */}
          <DifficultySelector
            value={form.difficultyPreset}
            onChange={setDifficultyPreset}
          />

          {/* 牌局設定：總牌數 / 每張格數 / 票面價格 */}
          <section>
            <h2 className="text-lg font-bold text-yellow-300 mb-3">牌局設定</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="card-count" className="block text-xs text-red-200 mb-1">
                  總牌數
                </label>
                <input
                  id="card-count"
                  type="number"
                  value={form.cardCount}
                  onChange={e => setCardCount(e.target.value)}
                  min="1"
                  max="200"
                  aria-label="總牌數"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label htmlFor="cells-per-zone" className="block text-xs text-red-200 mb-1">
                  每張格數（1–9）
                </label>
                <input
                  id="cells-per-zone"
                  type="number"
                  value={form.cellsPerZone}
                  onChange={e => setCellsPerZone(e.target.value)}
                  min="1"
                  max="9"
                  aria-label="每張格數"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label htmlFor="ticket-price" className="block text-xs text-red-200 mb-1">
                  票面價格（元）
                </label>
                <input
                  id="ticket-price"
                  type="number"
                  value={form.ticketPrice}
                  onChange={e => setTicketPrice(e.target.value)}
                  min="1"
                  aria-label="票面價格"
                  className="w-full px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-center focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </section>

          {/* 即時 EV 顯示 */}
          <EVDisplay rtp={currentRTP} />

          {/* 特效開關 */}
          <section className="flex items-center justify-between">
            <span className="text-sm text-red-200">粒子特效（預設）</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.effectsEnabled}
              onClick={toggleEffects}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.effectsEnabled ? 'bg-yellow-400' : 'bg-red-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.effectsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </section>
        </div>

        {/* 右欄：分享面板 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-yellow-300">分享給玩家</h2>
          {!isValid && (
            <p className="text-sm text-red-300">請完整填寫活動名稱與至少一個有效獎項</p>
          )}
          <SharePanel
            playUrl={playUrl}
            qrCode={qrCode}
            copied={copied}
            onCopy={copyUrl}
          />
        </div>

      </div>
    </main>
  )
}
