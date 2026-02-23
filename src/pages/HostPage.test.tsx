import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HostPage from "./HostPage";

// clipboard mock
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: writeTextMock },
  configurable: true,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <HostPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  writeTextMock.mockClear();
});

describe("HostPage", () => {
  it("應渲染頁面與基本元素", () => {
    renderPage();
    expect(screen.getByTestId("host-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /電子刮刮樂/ }),
    ).toBeInTheDocument();
  });

  it("應有活動名稱輸入框", () => {
    renderPage();
    expect(screen.getByLabelText("活動名稱")).toBeInTheDocument();
  });

  it("應有預設獎項列表", () => {
    renderPage();
    const labels = screen.getAllByLabelText("獎項名稱");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("輸入活動名稱後表單應合法並產生分享面板", async () => {
    renderPage();
    const input = screen.getByLabelText("活動名稱");
    await userEvent.clear(input);
    await userEvent.type(input, "年終晚會");
    await waitFor(() => {
      expect(screen.getByTestId("share-panel")).toBeInTheDocument();
    });
  });

  it("活動名稱為空時應顯示提示文字", async () => {
    renderPage();
    const input = screen.getByLabelText("活動名稱");
    await userEvent.clear(input);
    await waitFor(() => {
      expect(screen.getByTestId("share-panel-placeholder")).toBeInTheDocument();
    });
  });

  it("點擊新增獎項應增加一列", async () => {
    renderPage();
    const before = screen.getAllByLabelText("獎項名稱").length;
    await userEvent.click(screen.getByRole("button", { name: "新增獎項" }));
    expect(screen.getAllByLabelText("獎項名稱").length).toBe(before + 1);
  });

  it("點擊刪除獎項應移除該列", async () => {
    renderPage();
    const before = screen.getAllByLabelText("獎項名稱").length;
    const deleteButtons = screen.getAllByRole("button", { name: /刪除獎項/ });
    await userEvent.click(deleteButtons[0]!);
    expect(screen.getAllByLabelText("獎項名稱").length).toBe(before - 1);
  });

  it("表單合法時應顯示 QR Code 圖片", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("活動名稱"), "測試活動");
    await waitFor(
      () => {
        expect(screen.getByAltText("遊玩頁 QR Code")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("點擊複製按鈕應呼叫 clipboard.writeText", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("活動名稱"), "測試活動");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "複製連結" }),
      ).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: "複製連結" }));
    expect(writeTextMock).toHaveBeenCalledOnce();
  });

  it("特效開關應可切換", async () => {
    renderPage();
    const toggle = screen.getByRole("switch");
    const before = toggle.getAttribute("aria-checked");
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).not.toBe(before);
  });

  it("分享面板的 URL 應可解析為合法 URL", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText("活動名稱"), "解析測試");
    await waitFor(() => {
      const urlInput = screen.getByLabelText("遊玩連結") as HTMLInputElement;
      expect(() => new URL(urlInput.value)).not.toThrow();
    });
  });
});
