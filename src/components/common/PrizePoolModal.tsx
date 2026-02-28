import type { GameConfig, CardTypeConfig } from "@/types";

const MECHANIC_LABELS: Record<string, string> = {
  symbol: "符號",
  triple: "三同",
  compare: "比大小",
  bingo: "賓果",
};

interface PrizePoolModalProps {
  config: GameConfig;
  onClose: () => void;
}

function PrizeTable({ cardType }: { cardType: CardTypeConfig }) {
  const total = cardType.prizes.reduce((sum, p) => sum + p.probability, 0);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-red-700 text-red-300 text-xs">
          <th className="text-left py-1 pr-2">獎項</th>
          <th className="text-right py-1 pr-2">金額</th>
          <th className="text-right py-1">機率</th>
        </tr>
      </thead>
      <tbody>
        {cardType.prizes.map((p) => (
          <tr key={p.id} className="border-b border-red-800/50">
            <td className="py-1 pr-2 text-white">{p.label}</td>
            <td className="py-1 pr-2 text-right text-yellow-300">
              {p.amount > 0 ? `$${p.amount}` : "—"}
            </td>
            <td className="py-1 text-right text-red-200">
              {total > 0
                ? ((p.probability / total) * 100).toFixed(1)
                : "0.0"}
              %
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PrizePoolModal({ config, onClose }: PrizePoolModalProps) {
  const cardTypes = config.cardTypes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="獎池資訊"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-red-950 border border-red-700 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-yellow-400">獎池資訊</h2>
          <button
            type="button"
            aria-label="關閉"
            onClick={onClose}
            className="text-red-300 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        {cardTypes.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {cardTypes.map((ct) => (
              <span
                key={ct.mechanic}
                className="px-3 py-1 rounded-full bg-red-800 text-red-200 text-xs font-bold"
              >
                {MECHANIC_LABELS[ct.mechanic] ?? ct.mechanic}（{ct.count}張）
              </span>
            ))}
          </div>
        )}

        {cardTypes.map((ct) => (
          <div key={ct.mechanic} className="mb-6 last:mb-0">
            {cardTypes.length > 1 && (
              <h3 className="text-sm font-bold text-yellow-300 mb-2">
                {MECHANIC_LABELS[ct.mechanic] ?? ct.mechanic} ×{ct.count}
              </h3>
            )}
            <PrizeTable cardType={ct} />
          </div>
        ))}
      </div>
    </div>
  );
}
