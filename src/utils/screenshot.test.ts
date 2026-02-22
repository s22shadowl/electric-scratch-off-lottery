import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureAndShare } from "./screenshot";

// html2canvas module mock（hoisted，整個測試檔共用）
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue("data:image/png;base64,MOCK"),
  }),
}));

// ── 測試輔助 ──────────────────────────────────────────────

function makeElement(): HTMLElement {
  return document.createElement("div");
}

// ── captureAndShare ───────────────────────────────────────

describe("captureAndShare", () => {
  beforeEach(async () => {
    // 恢復所有 spy（不影響 vi.mock），避免跨測試污染
    vi.restoreAllMocks();

    // 確保 html2canvas mock 實作在每個測試都正確
    const html2canvas = (await import("html2canvas")).default as ReturnType<
      typeof vi.fn
    >;
    html2canvas.mockResolvedValue({
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,MOCK"),
    });

    // 重設 navigator API
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // mock fetch（Web Share path）
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([""], { type: "image/png" })),
    });

    // mock <a>.click（download fallback）
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("應呼叫 html2canvas 並傳入目標元素", async () => {
    const html2canvas = (await import("html2canvas")).default;
    const el = makeElement();
    await captureAndShare(el);
    expect(html2canvas).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ logging: false }),
    );
  });

  it("Web Share 不可用時應觸發 <a> 下載", async () => {
    // navigator.share = undefined（預設）
    const el = makeElement();
    await captureAndShare(el, "test.png");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("filename 參數應套用到下載連結", async () => {
    let savedDownload = "";
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag !== "a") return origCreate(tag);
      const a = origCreate("a") as HTMLAnchorElement;
      vi.spyOn(a, "click").mockImplementation(() => {});
      Object.defineProperty(a, "download", {
        set(v: string) {
          savedDownload = v;
        },
        get() {
          return savedDownload;
        },
        configurable: true,
      });
      return a;
    });
    await captureAndShare(makeElement(), "my-result.png");
    expect(savedDownload).toBe("my-result.png");
  });

  it("Web Share 可用且 canShare=true 時應呼叫 navigator.share", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      configurable: true,
    });
    await captureAndShare(makeElement());
    expect(mockShare).toHaveBeenCalledOnce();
    // 已 share，不應再 download
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it("Web Share 失敗（使用者取消）時應降級為下載", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("AbortError")),
      configurable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      configurable: true,
    });
    await captureAndShare(makeElement());
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
