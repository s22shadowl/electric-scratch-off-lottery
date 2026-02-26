import QRCode from "qrcode";
import type { GameConfig, Prize, CardTypeConfig } from "@/types";

// ── base64url 編解碼（URL 安全，不含 + / =） ──────────────────

function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(base64)));
}

// ── 驗證邏輯 ──────────────────────────────────────────────

function isValidPrize(p: unknown): p is Prize {
  if (typeof p !== "object" || p === null) return false;
  const prize = p as Record<string, unknown>;
  return (
    typeof prize["id"] === "string" &&
    typeof prize["label"] === "string" &&
    typeof prize["amount"] === "number" &&
    typeof prize["probability"] === "number" &&
    typeof prize["isWin"] === "boolean"
  );
}

function isValidCardTypeConfig(ct: unknown): ct is CardTypeConfig {
  if (typeof ct !== "object" || ct === null) return false;
  const obj = ct as Record<string, unknown>;
  if (typeof obj["mechanic"] !== "string") return false;
  if (typeof obj["count"] !== "number" || obj["count"] < 1) return false;
  if (!Array.isArray(obj["prizes"]) || obj["prizes"].length === 0) return false;
  if (!(obj["prizes"] as unknown[]).every(isValidPrize)) return false;
  if (typeof obj["themeId"] !== "string") return false;
  if (typeof obj["difficultyPreset"] !== "string") return false;
  const opts = obj["mechanicOptions"];
  if (typeof opts !== "object" || opts === null) return false;
  const mechanicOptions = opts as Record<string, unknown>;
  if (obj["mechanic"] === "triple") {
    if (
      typeof mechanicOptions["rowsPerCard"] !== "number" ||
      mechanicOptions["rowsPerCard"] < 1
    )
      return false;
  } else if (obj["mechanic"] === "compare") {
    if (
      typeof mechanicOptions["roundsPerCard"] !== "number" ||
      mechanicOptions["roundsPerCard"] < 1
    )
      return false;
  } else if (obj["mechanic"] === "bingo") {
    if (
      typeof mechanicOptions["gridSize"] !== "number" ||
      mechanicOptions["gridSize"] < 3
    )
      return false;
    if (
      typeof mechanicOptions["drawnCount"] !== "number" ||
      mechanicOptions["drawnCount"] < 1
    )
      return false;
    if (typeof mechanicOptions["prizePerLine"] !== "number") return false;
  } else {
    if (
      typeof mechanicOptions["cellsPerZone"] !== "number" ||
      mechanicOptions["cellsPerZone"] < 1
    )
      return false;
  }
  // ticketPrice 若存在，必須為正整數
  if (obj["ticketPrice"] !== undefined) {
    if (typeof obj["ticketPrice"] !== "number" || obj["ticketPrice"] < 1)
      return false;
  }
  return true;
}

function validateConfig(raw: unknown): GameConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("config 格式無效");
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj["sessionTitle"] !== "string" || !obj["sessionTitle"]) {
    throw new Error("sessionTitle 為必填字串");
  }
  if (!Array.isArray(obj["cardTypes"]) || obj["cardTypes"].length === 0) {
    throw new Error("cardTypes 不得為空陣列");
  }
  for (const ct of obj["cardTypes"] as unknown[]) {
    if (!isValidCardTypeConfig(ct)) {
      const ctObj = ct as Record<string, unknown>;
      // 提供具體的欄位錯誤訊息
      if (typeof ctObj["count"] !== "number" || ctObj["count"] < 1) {
        throw new Error("cardTypes[].count 必須為正整數");
      }
      if (!Array.isArray(ctObj["prizes"]) || ctObj["prizes"].length === 0) {
        throw new Error("cardTypes[].prizes 不得為空陣列");
      }
      const opts = ctObj["mechanicOptions"] as
        | Record<string, unknown>
        | undefined;
      const mechanic = ctObj["mechanic"];
      const isTriple = mechanic === "triple";
      const isCompare = mechanic === "compare";
      const isBingo = mechanic === "bingo";
      if (!opts) {
        throw new Error("cardTypes[].mechanicOptions 為必填");
      }
      if (isBingo) {
        if (typeof opts["gridSize"] !== "number" || opts["gridSize"] < 3)
          throw new Error(
            "cardTypes[].mechanicOptions.gridSize 必須為 >= 3 的整數",
          );
        if (typeof opts["drawnCount"] !== "number" || opts["drawnCount"] < 1)
          throw new Error(
            "cardTypes[].mechanicOptions.drawnCount 必須為正整數",
          );
        if (typeof opts["prizePerLine"] !== "number")
          throw new Error(
            "cardTypes[].mechanicOptions.prizePerLine 必須為數字",
          );
      } else if (
        isTriple
          ? typeof opts["rowsPerCard"] !== "number" || opts["rowsPerCard"] < 1
          : isCompare
            ? typeof opts["roundsPerCard"] !== "number" ||
              opts["roundsPerCard"] < 1
            : typeof opts["cellsPerZone"] !== "number" ||
              opts["cellsPerZone"] < 1
      ) {
        throw new Error(
          isTriple
            ? "cardTypes[].mechanicOptions.rowsPerCard 必須為正整數"
            : isCompare
              ? "cardTypes[].mechanicOptions.roundsPerCard 必須為正整數"
              : "cardTypes[].mechanicOptions.cellsPerZone 必須為正整數",
        );
      }
      if (
        ctObj["ticketPrice"] !== undefined &&
        (typeof ctObj["ticketPrice"] !== "number" || ctObj["ticketPrice"] < 1)
      ) {
        throw new Error("cardTypes[].ticketPrice 必須為正整數");
      }
      throw new Error("cardTypes 內含無效的卡型設定");
    }
  }
  if (typeof obj["effectsEnabled"] !== "boolean") {
    throw new Error("effectsEnabled 必須為布林值");
  }

  // migration：舊格式缺少 ticketPrice 時補預設值 100
  const migratedCardTypes = (obj["cardTypes"] as CardTypeConfig[]).map((ct) =>
    ct.ticketPrice === undefined ? { ...ct, ticketPrice: 100 } : ct,
  );

  return { ...(obj as unknown as GameConfig), cardTypes: migratedCardTypes };
}

// ── 公開 API ──────────────────────────────────────────────

export function encodeConfig(config: GameConfig): string {
  return toBase64Url(JSON.stringify(config));
}

export function decodeConfig(encoded: string): GameConfig {
  if (!encoded) throw new Error("encoded 字串不得為空");
  let json: string;
  try {
    json = fromBase64Url(encoded);
  } catch {
    throw new Error("base64 解碼失敗：字串格式無效");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("JSON 解析失敗");
  }
  return validateConfig(raw);
}

export function buildPlayUrl(config: GameConfig, baseUrl: string): string {
  const url = new URL("/play", baseUrl);
  url.searchParams.set("config", encodeConfig(config));
  return url.toString();
}

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 300 });
}
