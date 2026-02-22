interface Props {
  playUrl: string
  qrCode: string
  copied: boolean
  onCopy: () => void
}

export default function SharePanel({ playUrl, qrCode, copied, onCopy }: Props) {
  if (!playUrl) {
    return (
      <div
        data-testid="share-panel-placeholder"
        className="flex items-center justify-center h-48 rounded-xl border-2 border-dashed border-red-600 text-red-400 text-sm"
      >
        填寫完整設定後產生連結
      </div>
    )
  }

  return (
    <div data-testid="share-panel" className="space-y-4">
      {/* QR Code */}
      {qrCode && (
        <div className="flex justify-center">
          <img
            src={qrCode}
            alt="遊玩頁 QR Code"
            className="w-48 h-48 rounded-xl border-4 border-yellow-400"
          />
        </div>
      )}

      {/* URL 顯示與複製 */}
      <div className="space-y-2">
        <p className="text-xs text-red-300">玩家掃描 QR Code 或開啟以下連結：</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={playUrl}
            aria-label="遊玩連結"
            className="flex-1 px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-white text-xs truncate focus:outline-none focus:border-yellow-400"
          />
          <button
            type="button"
            onClick={onCopy}
            aria-label="複製連結"
            className="px-4 py-2 bg-yellow-400 text-red-900 font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors whitespace-nowrap"
          >
            {copied ? '已複製！' : '複製'}
          </button>
        </div>
      </div>
    </div>
  )
}
