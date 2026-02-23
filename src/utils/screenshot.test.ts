import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureAndShare } from "./screenshot";

// ── html-to-image mock ─────────────────────────────────────

const mockBlob = vi.hoisted(() => new Blob(["PNG"], { type: "image/png" }));

vi.mock("html-to-image", () => ({
  toBlob: vi.fn().mockResolvedValue(mockBlob),
}));

// ── 測試輔助 ──────────────────────────────────────────────

function makeElement(): HTMLElement {
  return document.createElement("div");
}

// ── captureAndShare ───────────────────────────────────────

describe("captureAndShare", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();

    // 確保 html-to-image mock 每次都正常回傳
    const { toBlob } = (await import("html-to-image")) as {
      toBlob: ReturnType<typeof vi.fn>;
    };
    toBlob.mockResolvedValue(mockBlob);

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

    // mock URL.createObjectURL / revokeObjectURL
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    // mock <a>.click（download fallback）
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    // mock document.body.appendChild / removeChild（避免 jsdom 副作用）
    vi.spyOn(document.body, "appendChild").mockImplementation(
      (node) => node as HTMLAnchorElement,
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      (node) => node as HTMLAnchorElement,
    );
  });

  it("應呼叫 toBlob 並傳入目標元素", async () => {
    const { toBlob } = await import("html-to-image");
    const el = makeElement();
    await captureAndShare(el);
    expect(toBlob).toHaveBeenCalledWith(
      el,
      expect.objectContaining({ backgroundColor: "#7f1d1d" }),
    );
  });

  it("Web Share 不可用時應觸發 Blob URL 下載", async () => {
    await captureAndShare(makeElement(), "test.png");
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("下載連結應附加到 body 再移除", async () => {
    await captureAndShare(makeElement());
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it("下載後應釋放 Blob URL", async () => {
    await captureAndShare(makeElement());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
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

  it("toBlob 回傳 null 時應 throw", async () => {
    const { toBlob } = (await import("html-to-image")) as {
      toBlob: ReturnType<typeof vi.fn>;
    };
    toBlob.mockResolvedValue(null);
    await expect(captureAndShare(makeElement())).rejects.toThrow(
      "toBlob 回傳 null",
    );
  });
});
