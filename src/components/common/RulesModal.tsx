import { useState } from "react";
import type { CardTypeConfig } from "@/types";

interface RulesModalProps {
  cardTypes: CardTypeConfig[];
  onClose: () => void;
}

const MECHANIC_LABELS: Record<string, string> = {
  symbol: "符號",
  triple: "三同",
  compare: "比大小",
  bingo: "賓果",
};

function Step({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-700 text-yellow-300 text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <span className="text-red-100 text-sm">{text}</span>
    </li>
  );
}

function DemoCell({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-gray-600 rounded px-2 py-1 text-center text-sm inline-block min-w-[3rem]">
      {children}
    </span>
  );
}

function AmberBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 text-amber-200 text-sm">
      {children}
    </div>
  );
}

function RedBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 text-red-200 text-sm">
      {children}
    </div>
  );
}

function SymbolRules() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-300">🎰 符號玩法</h3>
      <p className="text-red-100 text-sm">刮開格子，底下藏著符號，對到就贏！</p>

      <ol className="space-y-1 list-none">
        <Step number="1" text="刮開全部格子" />
        <Step number="2" text="任一格出現中獎符號 → 得獎！" />
        <Step number="3" text="獎金依符號面額計算" />
      </ol>

      <div>
        <p className="text-xs text-red-300 mb-2">獎項示意</p>
        <div className="flex gap-2 flex-wrap">
          <DemoCell>💰 $100</DemoCell>
          <DemoCell>🎁 $50</DemoCell>
          <DemoCell>⭐ $20</DemoCell>
        </div>
        <p className="text-xs text-red-400 mt-1">（實際獎項依設定而定）</p>
      </div>
    </div>
  );
}

function TripleRules() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-300">🎲 三同玩法</h3>
      <p className="text-red-100 text-sm">
        每列三格，三格顯示相同符號才算中獎。
      </p>

      <ol className="space-y-1 list-none">
        <Step number="1" text="刮開格子，每列有三個" />
        <Step number="2" text="三格符號完全相同 → 該列中獎！" />
        <Step number="3" text="可有多列，每列獨立結算" />
      </ol>

      <div>
        <p className="text-xs text-red-300 mb-2">示意</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <DemoCell>🌟</DemoCell>
              <DemoCell>🌟</DemoCell>
              <DemoCell>🌟</DemoCell>
            </div>
            <span className="text-green-400 text-sm font-bold">✅ 中獎！</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <DemoCell>🍀</DemoCell>
              <DemoCell>🌟</DemoCell>
              <DemoCell>🍀</DemoCell>
            </div>
            <span className="text-red-400 text-sm">✗ 未中</span>
          </div>
        </div>
      </div>

      <AmberBox>多列設定時，每一列各自判斷，獎金可累加。</AmberBox>
    </div>
  );
}

function CompareRules() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-300">🃏 比大小玩法</h3>
      <p className="text-red-100 text-sm">你的數字 vs 莊家數字，你大才贏！</p>

      <ol className="space-y-1 list-none">
        <Step number="1" text="刮開三格：你的數字 ／ 莊家數字 ／ 該回合獎金" />
        <Step number="2" text="你的數字 > 莊家數字 → 贏得獎金！" />
        <Step number="3" text="多回合設定時，每回合各自比較" />
      </ol>

      <div>
        <p className="text-xs text-red-300 mb-2">示意</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <DemoCell>你：45</DemoCell>
            <DemoCell>莊：32</DemoCell>
            <DemoCell>$200</DemoCell>
            <span className="text-green-400 text-sm font-bold">✅ 贏！</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DemoCell>你：28</DemoCell>
            <DemoCell>莊：51</DemoCell>
            <DemoCell>$100</DemoCell>
            <span className="text-red-400 text-sm">✗ 輸</span>
          </div>
        </div>
      </div>

      <RedBox>⚠️ 平手算輸，數字需嚴格大於莊家才算中獎。</RedBox>
    </div>
  );
}

function BingoRules() {
  const diag = [0, 4, 8];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-300">🎯 賓果玩法</h3>
      <p className="text-red-100 text-sm">
        刮開開獎號碼，在賓果格找連線，連越多獎越多！
      </p>

      <ol className="space-y-1 list-none">
        <Step number="1" text="刮開上方的開獎號碼區（逐格刮）" />
        <Step number="2" text="賓果格上對應號碼自動高亮" />
        <Step number="3" text="橫線 / 直線 / 對角線 = 一條連線" />
        <Step number="4" text="連線越多，獎金越高" />
      </ol>

      <div>
        <p className="text-xs text-red-300 mb-2">示意（3×3，對角線連線）</p>
        <div className="grid grid-cols-3 gap-1 w-fit">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`w-10 h-10 border rounded flex items-center justify-center text-sm ${
                diag.includes(i)
                  ? "border-yellow-500 bg-yellow-500/20 text-yellow-300"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              {diag.includes(i) ? "✦" : ""}
            </div>
          ))}
        </div>
        <p className="text-xs text-red-400 mt-1">對角線也算！</p>
      </div>

      <AmberBox>連線可重疊，同一格可同時貢獻多條連線。</AmberBox>
    </div>
  );
}

function RulesContent({ mechanic }: { mechanic: string }) {
  switch (mechanic) {
    case "symbol":
      return <SymbolRules />;
    case "triple":
      return <TripleRules />;
    case "compare":
      return <CompareRules />;
    case "bingo":
      return <BingoRules />;
    default:
      return null;
  }
}

export default function RulesModal({ cardTypes, onClose }: RulesModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCardType = cardTypes[activeIndex];
  if (!activeCardType) return null;

  const showTabs = cardTypes.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 面板 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-red-950 border border-red-700 shadow-2xl max-h-[90vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-700 flex-shrink-0">
          <h2
            id="rules-modal-title"
            className="text-lg font-bold text-yellow-300"
          >
            玩法說明
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="text-red-300 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab bar（多卡型才顯示） */}
        {showTabs && (
          <div className="flex border-b border-red-700 flex-shrink-0">
            {cardTypes.map((ct, i) => (
              <button
                key={ct.mechanic}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${
                  activeIndex === i
                    ? "text-yellow-300 border-b-2 border-yellow-400"
                    : "text-red-300 hover:text-white"
                }`}
              >
                {MECHANIC_LABELS[ct.mechanic] ?? ct.mechanic}
              </button>
            ))}
          </div>
        )}

        {/* 內容區 */}
        <div className="px-5 py-4 overflow-y-auto">
          <RulesContent mechanic={activeCardType.mechanic} />
        </div>
      </div>
    </div>
  );
}
