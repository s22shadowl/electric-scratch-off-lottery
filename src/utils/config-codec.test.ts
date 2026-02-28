import { describe, it, expect } from "vitest";
import {
  encodeConfig,
  decodeConfig,
  buildPlayUrl,
  generateQRCode,
} from "./config-codec";
import type { GameConfig } from "@/types";

// ── 測試資料 ──────────────────────────────────────────────

const config: GameConfig = {
  sessionTitle: "年終抽獎",
  cardTypes: [
    {
      mechanic: "symbol",
      prizes: [
        { id: "p1", label: "謝謝", amount: 0, probability: 0.6, isWin: false },
        { id: "p2", label: "$100", amount: 100, probability: 0.3, isWin: true },
        { id: "p3", label: "$500", amount: 500, probability: 0.1, isWin: true },
      ],
      count: 10,
      themeId: "wealth-god",
      difficultyPreset: "standard",
      mechanicOptions: { cellsPerZone: 6 },
      ticketPrice: 100,
    },
  ],
  effectsEnabled: true,
};

const BASE_URL = "https://example.com";

// ── encodeConfig ──────────────────────────────────────────

describe("encodeConfig", () => {
  it("應回傳非空字串", () => {
    expect(encodeConfig(config)).toBeTruthy();
  });

  it("編碼結果應只包含 URL 安全字元（base64url）", () => {
    const encoded = encodeConfig(config);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+=*$/);
  });

  it("同一份 config 多次編碼應得相同結果（確定性）", () => {
    expect(encodeConfig(config)).toBe(encodeConfig(config));
  });
});

// ── decodeConfig ──────────────────────────────────────────

describe("decodeConfig", () => {
  it("encode → decode 應還原原始 config（round-trip）", () => {
    const encoded = encodeConfig(config);
    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(config);
  });

  it("傳入空字串應拋出錯誤", () => {
    expect(() => decodeConfig("")).toThrow();
  });

  it("傳入非 base64 字串應拋出錯誤", () => {
    expect(() => decodeConfig("!!!not-valid!!!")).toThrow();
  });

  it("傳入結構不符的 JSON 應拋出錯誤（缺少 sessionTitle）", () => {
    const broken = encodeConfig({
      ...config,
      sessionTitle: undefined as unknown as string,
    });
    expect(() => decodeConfig(broken)).toThrow(/sessionTitle/);
  });

  it("cardTypes 為空陣列應拋出錯誤", () => {
    const broken = encodeConfig({ ...config, cardTypes: [] });
    expect(() => decodeConfig(broken)).toThrow(/cardTypes/);
  });

  it("cardType.prizes 為空陣列應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [{ ...config.cardTypes[0]!, prizes: [] }],
    });
    expect(() => decodeConfig(broken)).toThrow(/prizes/);
  });

  it("cardType.count 為 0 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [{ ...config.cardTypes[0]!, count: 0 }],
    });
    expect(() => decodeConfig(broken)).toThrow(/count/);
  });

  it("cardType.mechanicOptions.cellsPerZone 小於 1 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [
        {
          ...config.cardTypes[0]!,
          mechanicOptions: { cellsPerZone: 0 },
        },
      ],
    });
    expect(() => decodeConfig(broken)).toThrow(/cellsPerZone/);
  });

  it("cardType.ticketPrice 為 0 應拋出錯誤（含 ticketPrice）", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [{ ...config.cardTypes[0]!, ticketPrice: 0 }],
    });
    expect(() => decodeConfig(broken)).toThrow(/ticketPrice/);
  });

  it("triple 玩法 config 應能 encode/decode（round-trip）", () => {
    const tripleConfig: GameConfig = {
      ...config,
      cardTypes: [
        {
          mechanic: "triple",
          prizes: config.cardTypes[0]!.prizes,
          count: 5,
          themeId: "wealth-god",
          difficultyPreset: "standard",
          mechanicOptions: { rowsPerCard: 3 },
          ticketPrice: 100,
        },
      ],
    };
    const decoded = decodeConfig(encodeConfig(tripleConfig));
    expect(decoded).toEqual(tripleConfig);
  });

  it("triple cardType 缺少 rowsPerCard 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [
        {
          ...config.cardTypes[0]!,
          mechanic: "triple" as const,
          mechanicOptions: {} as never,
        },
      ],
    });
    expect(() => decodeConfig(broken)).toThrow(/rowsPerCard/);
  });

  it("compare 玩法 config 應能 encode/decode（round-trip）", () => {
    const compareConfig: GameConfig = {
      ...config,
      cardTypes: [
        {
          mechanic: "compare",
          prizes: config.cardTypes[0]!.prizes,
          count: 5,
          themeId: "wealth-god",
          difficultyPreset: "standard",
          mechanicOptions: { roundsPerCard: 3 },
          ticketPrice: 100,
        },
      ],
    };
    const decoded = decodeConfig(encodeConfig(compareConfig));
    expect(decoded).toEqual(compareConfig);
  });

  it("compare cardType 缺少 roundsPerCard 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [
        {
          ...config.cardTypes[0]!,
          mechanic: "compare" as const,
          mechanicOptions: {} as never,
        },
      ],
    });
    expect(() => decodeConfig(broken)).toThrow(/roundsPerCard/);
  });

  it("bingo 玩法 config 應能 encode/decode（round-trip）", () => {
    const bingoConfig: GameConfig = {
      ...config,
      cardTypes: [
        {
          mechanic: "bingo",
          prizes: config.cardTypes[0]!.prizes,
          count: 5,
          themeId: "wealth-god",
          difficultyPreset: "standard",
          mechanicOptions: { gridSize: 3, drawnCount: 6, prizePerLine: 100 },
          ticketPrice: 100,
        },
      ],
    };
    const decoded = decodeConfig(encodeConfig(bingoConfig));
    expect(decoded).toEqual(bingoConfig);
  });

  it("bingo cardType 缺少 gridSize 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [
        {
          ...config.cardTypes[0]!,
          mechanic: "bingo" as const,
          mechanicOptions: { drawnCount: 6, prizePerLine: 100 } as never,
        },
      ],
    });
    expect(() => decodeConfig(broken)).toThrow(/gridSize/);
  });

  it("bingo cardType 缺少 prizePerLine 應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      cardTypes: [
        {
          ...config.cardTypes[0]!,
          mechanic: "bingo" as const,
          mechanicOptions: { gridSize: 3, drawnCount: 6 } as never,
        },
      ],
    });
    expect(() => decodeConfig(broken)).toThrow(/prizePerLine/);
  });

  it("缺少 ticketPrice 的舊格式應自動補值 100（向下相容）", () => {
    // 建立一個沒有 ticketPrice 的舊格式 config
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ticketPrice: _tp, ...cardTypeWithout } = config.cardTypes[0]!;
    const oldConfig = { ...config, cardTypes: [cardTypeWithout] };
    const encoded = btoa(
      unescape(encodeURIComponent(JSON.stringify(oldConfig))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const decoded = decodeConfig(encoded);
    expect(decoded.cardTypes[0]?.ticketPrice).toBe(100);
  });

  it("含 allowReturnToPile: true 的 config 應能 encode/decode（round-trip）", () => {
    const configWithReturn: GameConfig = {
      ...config,
      allowReturnToPile: true,
    };
    const decoded = decodeConfig(encodeConfig(configWithReturn));
    expect(decoded.allowReturnToPile).toBe(true);
  });

  it("缺少 allowReturnToPile 的舊格式應能正常解碼（向下相容）", () => {
    // 建立沒有 allowReturnToPile 的舊格式（現有 config 本身沒有這個欄位）
    const encoded = encodeConfig(config);
    const decoded = decodeConfig(encoded);
    // allowReturnToPile 可以是 undefined 或缺少，不應拋出錯誤
    expect(decoded.allowReturnToPile).toBeUndefined();
  });

  it("allowReturnToPile 為非布林值時應拋出錯誤", () => {
    const broken = encodeConfig({
      ...config,
      allowReturnToPile: "yes" as unknown as boolean,
    });
    expect(() => decodeConfig(broken)).toThrow(/allowReturnToPile/);
  });
});

// ── buildPlayUrl ──────────────────────────────────────────

describe("buildPlayUrl", () => {
  it("應回傳包含 base URL 的字串", () => {
    const url = buildPlayUrl(config, BASE_URL);
    expect(url).toContain(BASE_URL);
  });

  it("URL 應包含 config query 參數", () => {
    const url = buildPlayUrl(config, BASE_URL);
    expect(url).toContain("config=");
  });

  it("從 URL 解析出的 config 應等於原始 config（end-to-end）", () => {
    const url = buildPlayUrl(config, BASE_URL);
    const { searchParams } = new URL(url);
    const encoded = searchParams.get("config")!;
    expect(decodeConfig(encoded)).toEqual(config);
  });

  it("不同 config 應產生不同 URL", () => {
    const url1 = buildPlayUrl(config, BASE_URL);
    const url2 = buildPlayUrl(
      { ...config, sessionTitle: "其他活動" },
      BASE_URL,
    );
    expect(url1).not.toBe(url2);
  });
});

// ── generateQRCode ────────────────────────────────────────

describe("generateQRCode", () => {
  it("應回傳 data URL 字串（以 data:image 開頭）", async () => {
    const url = buildPlayUrl(config, BASE_URL);
    const qr = await generateQRCode(url);
    expect(qr).toMatch(/^data:image\//);
  });

  it("不同 URL 應產生不同 QR Code", async () => {
    const url1 = buildPlayUrl(config, BASE_URL);
    const url2 = buildPlayUrl(
      { ...config, sessionTitle: "其他活動" },
      BASE_URL,
    );
    const [qr1, qr2] = await Promise.all([
      generateQRCode(url1),
      generateQRCode(url2),
    ]);
    expect(qr1).not.toBe(qr2);
  });
});
