interface SplashOverlayProps {
  totalWinnings: number;
  winningCount: number;
  totalCount: number;
  effectsEnabled: boolean;
  onDismiss: () => void;
}

export default function SplashOverlay({
  totalWinnings,
  winningCount,
  totalCount,
  effectsEnabled,
  onDismiss,
}: SplashOverlayProps) {
  return (
    <div
      data-testid="splash-overlay"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
      onClick={onDismiss}
    >
      <div className="bg-white/10 backdrop-blur rounded-2xl px-10 py-8 text-center pointer-events-none">
        <p className="text-xl text-white/80 mb-4">🎊 刮刮結果揭曉！</p>

        {totalWinnings > 0 ? (
          <>
            <p className="text-5xl font-black text-yellow-400 drop-shadow-lg">
              💰 ${totalWinnings} 元
            </p>
            <p className="text-red-200 text-sm mt-2">
              中獎 {winningCount} / {totalCount} 張
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl font-black text-red-300">謝謝參與</p>
            <p className="text-red-400 text-sm mt-2">共刮了 {totalCount} 張</p>
          </>
        )}

        <p className="text-white/40 text-xs mt-6">點擊任何地方繼續</p>
      </div>

      {effectsEnabled && totalWinnings > 0 && (
        <div className="pointer-events-none">
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              className={`animate-confetti-fall ${
                ["bg-yellow-400", "bg-red-400", "bg-pink-400", "bg-orange-400", "bg-green-400"][i % 5]
              }`}
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
