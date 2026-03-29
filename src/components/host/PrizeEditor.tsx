import type { PrizeDraft } from "@/hooks/useHostForm";

interface Props {
  prizes: PrizeDraft[];
  weightTotal: number;
  onUpdate: (
    uid: string,
    field: keyof Omit<PrizeDraft, "uid">,
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (uid: string) => void;
  disabled?: boolean;
}

export default function PrizeEditor({
  prizes,
  weightTotal,
  onUpdate,
  onAdd,
  onRemove,
  disabled,
}: Props) {
  return (
    <section aria-label="獎項設定" className="relative">
      {disabled && (
        <div className="absolute inset-0 bg-gray-900/60 rounded-lg z-10 flex items-center justify-center">
          <span className="text-gray-300 text-sm">賓果玩法不使用獎項設定</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-yellow-300">獎項設定</h2>
        <button
          type="button"
          onClick={onAdd}
          aria-label="新增獎項"
          disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          className="px-3 py-1 text-sm bg-yellow-400 text-red-900 font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          ＋ 新增獎項
        </button>
      </div>

      {/* 欄位標題 */}
      <div className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 mb-1">
        <span className="text-xs text-red-200">獎項名稱</span>
        <span className="text-xs text-red-200 text-center">金額（元）</span>
        <span className="text-xs text-red-200 text-center">權重</span>
        <span />
      </div>

      <ul className="space-y-2">
        {prizes.map((prize) => (
          <li
            key={prize.uid}
            className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 items-center"
          >
            <input
              type="text"
              value={prize.label}
              onChange={(e) => onUpdate(prize.uid, "label", e.target.value)}
              placeholder="如：$500、謝謝參與"
              aria-label="獎項名稱"
              disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white placeholder-red-400 text-sm focus:outline-none focus:border-yellow-400"
            />
            <input
              type="number"
              value={prize.amount}
              onChange={(e) => onUpdate(prize.uid, "amount", e.target.value)}
              min="0"
              aria-label="獎項金額"
              disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm text-center focus:outline-none focus:border-yellow-400"
            />
            <input
              type="number"
              value={prize.weight}
              onChange={(e) => onUpdate(prize.uid, "weight", e.target.value)}
              min="0"
              aria-label="相對權重"
              disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm text-center focus:outline-none focus:border-yellow-400"
            />
            <button
              type="button"
              onClick={() => onRemove(prize.uid)}
              aria-label={`刪除獎項 ${prize.label}`}
              disabled={disabled || prizes.length <= 1}
              tabIndex={disabled ? -1 : undefined}
              className="text-red-300 hover:text-white disabled:opacity-30 text-lg leading-none transition-colors"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* 加總行 */}
      <div className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 mt-2 border-t border-red-700 pt-2">
        <span className="text-xs text-red-300">合計</span>
        <span />
        <span
          className={`text-sm font-bold text-center ${
            Math.abs(weightTotal - 100) < 0.01
              ? "text-green-400"
              : "text-red-200"
          }`}
        >
          {weightTotal % 1 === 0
            ? String(weightTotal)
            : weightTotal.toFixed(1)}
        </span>
        <span />
      </div>
    </section>
  );
}
