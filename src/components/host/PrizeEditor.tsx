import type { PrizeDraft } from "@/hooks/useHostForm";

interface Props {
  prizes: PrizeDraft[];
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
          className="px-3 py-1 text-sm bg-yellow-400 text-red-900 font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          ＋ 新增獎項
        </button>
      </div>

      {/* 欄位標題 */}
      <div className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-2 mb-1 px-1">
        <span className="text-xs text-red-200">獎項名稱</span>
        <span className="text-xs text-red-200 text-center">金額（元）</span>
        <span className="text-xs text-red-200 text-center">相對權重</span>
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
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white placeholder-red-400 text-sm focus:outline-none focus:border-yellow-400"
            />
            <input
              type="number"
              value={prize.amount}
              onChange={(e) => onUpdate(prize.uid, "amount", e.target.value)}
              min="0"
              aria-label="獎項金額"
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm text-center focus:outline-none focus:border-yellow-400"
            />
            <input
              type="number"
              value={prize.weight}
              onChange={(e) => onUpdate(prize.uid, "weight", e.target.value)}
              min="0"
              aria-label="相對權重"
              className="px-2 py-1 rounded bg-red-900 border border-red-700 text-white text-sm text-center focus:outline-none focus:border-yellow-400"
            />
            <button
              type="button"
              onClick={() => onRemove(prize.uid)}
              aria-label={`刪除獎項 ${prize.label}`}
              disabled={prizes.length <= 1}
              className="text-red-300 hover:text-white disabled:opacity-30 text-lg leading-none transition-colors"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
