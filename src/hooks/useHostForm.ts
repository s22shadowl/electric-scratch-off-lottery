import { useState, useEffect, useCallback, useMemo } from "react";
import {
  buildPlayUrl,
  generateQRCode,
  encodeConfig,
} from "@/utils/config-codec";
import { scalePrizesToTicketPrice, calculateRTP } from "@/utils/prize-presets";
import { calcBingoLineProbabilities } from "@/utils/game-math";
import type {
  GameConfig,
  Prize,
  DifficultyPreset,
  Mechanic,
  CompareOptions,
  BingoOptions,
} from "@/types";

// ── 表單內部用的草稿型別（字串便於 input 綁定）─────────────────

export interface PrizeDraft {
  uid: string; // React key，本地使用
  label: string;
  amount: string; // input 字串，提交時轉 number
  weight: string; // 相對權重，提交時轉 number
}

export interface HostFormState {
  sessionTitle: string;
  prizes: PrizeDraft[];
  cardCount: string;
  cellsPerZone: string;
  effectsEnabled: boolean;
  allowReturnToPile: boolean;
  difficultyPreset: DifficultyPreset;
  ticketPrice: string; // input 字串，提交時轉 number
  mechanic: Mechanic;
  rowsPerCard: string; // triple / compare 玩法列/局數，提交時轉 number
  gridSize: string; // bingo 玩法格數（3–6）
  prizePerLine: string; // bingo 玩法每線獎金（元）
}

// ── 草稿 → GameConfig 轉換（失敗時回傳 null）─────────────────

export function draftToConfig(form: HostFormState): GameConfig | null {
  if (!form.sessionTitle.trim()) return null;

  const cardCount = parseInt(form.cardCount, 10);
  const ticketPrice = parseInt(form.ticketPrice, 10);
  if (!cardCount || cardCount < 1) return null;
  if (!ticketPrice || ticketPrice < 1) return null;

  let mechanicOptions: GameConfig["cardTypes"][number]["mechanicOptions"];
  if (form.mechanic === "triple") {
    const rowsPerCard = parseInt(form.rowsPerCard, 10);
    if (!rowsPerCard || rowsPerCard < 1 || rowsPerCard > 9) return null;
    mechanicOptions = { rowsPerCard };
  } else if (form.mechanic === "compare") {
    const roundsPerCard = parseInt(form.rowsPerCard, 10);
    if (!roundsPerCard || roundsPerCard < 1 || roundsPerCard > 9) return null;
    mechanicOptions = { roundsPerCard } satisfies CompareOptions;
  } else if (form.mechanic === "bingo") {
    const gridSize = parseInt(form.gridSize, 10);
    const prizePerLine = parseInt(form.prizePerLine, 10);
    if (!gridSize || gridSize < 3 || gridSize > 6) return null;
    if (isNaN(prizePerLine) || prizePerLine < 0) return null;
    const drawnCount = Math.ceil(gridSize * gridSize * 0.6);
    mechanicOptions = {
      gridSize,
      drawnCount,
      prizePerLine,
    } satisfies BingoOptions;
  } else {
    const cellsPerZone = parseInt(form.cellsPerZone, 10);
    if (!cellsPerZone || cellsPerZone < 1 || cellsPerZone > 9) return null;
    mechanicOptions = { cellsPerZone };
  }

  const prizes: Prize[] = form.prizes
    .map((p, i) => ({
      id: `prize-${i}`,
      label: p.label.trim(),
      amount: Math.max(0, parseInt(p.amount, 10) || 0),
      probability: Math.max(0, parseFloat(p.weight) || 0),
      isWin: (parseInt(p.amount, 10) || 0) > 0,
    }))
    .filter((p) => p.label && p.probability > 0);

  if (prizes.length === 0) return null;

  return {
    sessionTitle: form.sessionTitle.trim(),
    cardTypes: [
      {
        mechanic: form.mechanic,
        prizes,
        count: cardCount,
        themeId: "wealth-god",
        difficultyPreset: form.difficultyPreset,
        mechanicOptions,
        ticketPrice,
      },
    ],
    effectsEnabled: form.effectsEnabled,
    allowReturnToPile: form.allowReturnToPile,
  };
}

// ── 預設初始表單 ──────────────────────────────────────────────

function newPrize(
  uid: string,
  label: string,
  amount: string,
  weight: string,
): PrizeDraft {
  return { uid, label, amount, weight };
}

const defaultForm: HostFormState = {
  sessionTitle: "",
  prizes: [
    newPrize("uid-0", "謝謝參與", "0", "45"),
    newPrize("uid-1", "$25", "25", "45"),
    newPrize("uid-2", "$125", "125", "10"),
  ],
  cardCount: "10",
  cellsPerZone: "4",
  effectsEnabled: true,
  allowReturnToPile: false,
  difficultyPreset: "standard",
  ticketPrice: "100",
  mechanic: "symbol",
  rowsPerCard: "3",
  gridSize: "5",
  prizePerLine: "100",
};

// ── Hook ─────────────────────────────────────────────────────

let uidCounter = 10;

export function useHostForm(baseUrl: string) {
  const [form, setForm] = useState<HostFormState>(defaultForm);
  const [playUrl, setPlayUrl] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [prizesDirty, setPrizesDirty] = useState(false);
  const [showRescalePrompt, setShowRescalePrompt] = useState(false);

  // cellCount：symbol/triple 玩法從對應欄位取格數
  const cellCount = useMemo<number>(() => {
    if (form.mechanic === "triple") {
      return parseInt(form.rowsPerCard, 10) || 1;
    }
    if (form.mechanic === "symbol") {
      return parseInt(form.cellsPerZone, 10) || 1;
    }
    return 1;
  }, [form.mechanic, form.cellsPerZone, form.rowsPerCard]);

  // 即時 RTP（依賴 prizes + ticketPrice + cellCount）
  const currentRTP = useMemo<number | null>(() => {
    const price = parseInt(form.ticketPrice, 10);
    if (!price || price < 1) return null;
    return calculateRTP(form.prizes, price, cellCount);
  }, [form.prizes, form.ticketPrice, cellCount]);

  // bingo 專用 RTP（prizePerLine × 期望連線數 / ticketPrice）
  const bingoRTP = useMemo<number | null>(() => {
    if (form.mechanic !== "bingo") return null;
    const price = parseInt(form.ticketPrice, 10);
    const gridSize = parseInt(form.gridSize, 10);
    const prizePerLine = parseInt(form.prizePerLine, 10);
    if (!price || price < 1 || !gridSize || isNaN(prizePerLine)) return null;
    const drawnCount = Math.ceil(gridSize * gridSize * 0.6);
    const probs = calcBingoLineProbabilities(gridSize, drawnCount);
    const expectedLines = Object.entries(probs).reduce(
      (sum, [k, p]) => sum + Number(k) * p,
      0,
    );
    return (expectedLines * prizePerLine) / price;
  }, [form.mechanic, form.ticketPrice, form.gridSize, form.prizePerLine]);

  // 整場預期支出（RTP × 票面價格 × 牌數）
  const totalExpectedPayout = useMemo<number | null>(() => {
    const rtp = bingoRTP ?? currentRTP;
    if (rtp === null) return null;
    const price = parseInt(form.ticketPrice, 10);
    const count = parseInt(form.cardCount, 10);
    if (!price || price < 1 || !count || count < 1) return null;
    return rtp * price * count;
  }, [bingoRTP, currentRTP, form.ticketPrice, form.cardCount]);

  // 表單合法時自動更新 URL 與 QR Code
  useEffect(() => {
    const config = draftToConfig(form);
    if (!config) {
      setPlayUrl("");
      setQrCode("");
      return;
    }
    const url = buildPlayUrl(config, baseUrl);
    setPlayUrl(url);
    let cancelled = false;
    generateQRCode(url)
      .then((data) => {
        if (!cancelled) setQrCode(data);
      })
      .catch(() => {
        if (!cancelled) setQrCode("");
      });
    return () => {
      cancelled = true;
    };
  }, [form, baseUrl]);

  const setTitle = useCallback((title: string) => {
    setForm((f) => ({ ...f, sessionTitle: title }));
  }, []);

  const updatePrize = useCallback(
    (uid: string, field: keyof Omit<PrizeDraft, "uid">, value: string) => {
      setPrizesDirty(true);
      setForm((f) => ({
        ...f,
        prizes: f.prizes.map((p) =>
          p.uid === uid ? { ...p, [field]: value } : p,
        ),
      }));
    },
    [],
  );

  const addPrize = useCallback(() => {
    const uid = `uid-${++uidCounter}`;
    setPrizesDirty(true);
    setForm((f) => ({
      ...f,
      prizes: [...f.prizes, newPrize(uid, "", "0", "10")],
    }));
  }, []);

  const removePrize = useCallback((uid: string) => {
    setPrizesDirty(true);
    setForm((f) => ({ ...f, prizes: f.prizes.filter((p) => p.uid !== uid) }));
  }, []);

  const setCardCount = useCallback((v: string) => {
    setForm((f) => ({ ...f, cardCount: v }));
  }, []);

  const setCellsPerZone = useCallback(
    (v: string) => {
      const newCellCount = parseInt(v, 10) || 1;
      if (prizesDirty) {
        setForm((f) => ({ ...f, cellsPerZone: v }));
        setShowRescalePrompt(true);
      } else {
        const price = parseInt(form.ticketPrice, 10) || 100;
        const newPrizes = scalePrizesToTicketPrice(
          form.difficultyPreset,
          price,
          newCellCount,
        );
        setForm((f) => ({ ...f, cellsPerZone: v, prizes: newPrizes }));
      }
    },
    [prizesDirty, form.ticketPrice, form.difficultyPreset],
  );

  const toggleEffects = useCallback(() => {
    setForm((f) => ({ ...f, effectsEnabled: !f.effectsEnabled }));
  }, []);

  const toggleAllowReturnToPile = useCallback(() => {
    setForm((f) => ({ ...f, allowReturnToPile: !f.allowReturnToPile }));
  }, []);

  const setDifficultyPreset = useCallback(
    (preset: DifficultyPreset) => {
      const price = parseInt(form.ticketPrice, 10) || 100;
      const newPrizes = scalePrizesToTicketPrice(preset, price, cellCount);
      setPrizesDirty(false);
      setShowRescalePrompt(false);
      setForm((f) => ({ ...f, difficultyPreset: preset, prizes: newPrizes }));
    },
    [form.ticketPrice, cellCount],
  );

  const setTicketPrice = useCallback((v: string) => {
    setForm((f) => ({ ...f, ticketPrice: v }));
  }, []);

  const setMechanic = useCallback((mechanic: Mechanic) => {
    setForm((f) => ({ ...f, mechanic }));
  }, []);

  const setRowsPerCard = useCallback(
    (v: string) => {
      const isTripleOrSymbol =
        form.mechanic === "triple" || form.mechanic === "symbol";
      if (!isTripleOrSymbol) {
        setForm((f) => ({ ...f, rowsPerCard: v }));
        return;
      }
      const newCellCount = parseInt(v, 10) || 1;
      if (prizesDirty) {
        setForm((f) => ({ ...f, rowsPerCard: v }));
        setShowRescalePrompt(true);
      } else {
        const price = parseInt(form.ticketPrice, 10) || 100;
        const newPrizes = scalePrizesToTicketPrice(
          form.difficultyPreset,
          price,
          newCellCount,
        );
        setForm((f) => ({ ...f, rowsPerCard: v, prizes: newPrizes }));
      }
    },
    [prizesDirty, form.mechanic, form.ticketPrice, form.difficultyPreset],
  );

  const setGridSize = useCallback((v: string) => {
    setForm((f) => ({ ...f, gridSize: v }));
  }, []);

  const setPrizePerLine = useCallback((v: string) => {
    setForm((f) => ({ ...f, prizePerLine: v }));
  }, []);

  const copyUrl = useCallback(async () => {
    if (!playUrl) return;
    await navigator.clipboard.writeText(playUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [playUrl]);

  const confirmRescale = useCallback(
    (doRescale: boolean) => {
      if (doRescale) {
        const price = parseInt(form.ticketPrice, 10) || 100;
        const newPrizes = scalePrizesToTicketPrice(
          form.difficultyPreset,
          price,
          cellCount,
        );
        setForm((f) => ({ ...f, prizes: newPrizes }));
      }
      setShowRescalePrompt(false);
    },
    [form.ticketPrice, form.difficultyPreset, cellCount],
  );

  const config = draftToConfig(form);
  const isValid = config !== null;

  return {
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
    setTitle,
    updatePrize,
    addPrize,
    removePrize,
    setCardCount,
    setCellsPerZone,
    toggleEffects,
    toggleAllowReturnToPile,
    setDifficultyPreset,
    setTicketPrice,
    setMechanic,
    setRowsPerCard,
    setGridSize,
    setPrizePerLine,
    copyUrl,
    confirmRescale,
  };
}

export { encodeConfig };
