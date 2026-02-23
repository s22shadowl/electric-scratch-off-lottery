import { toBlob } from 'html-to-image'

/**
 * 以 Blob URL 觸發瀏覽器下載
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 截圖指定 DOM 元素並分享（優先 Web Share API，降級為下載）
 * 使用 html-to-image（SVG foreignObject），支援 oklch 等現代 CSS 色彩函式
 */
export async function captureAndShare(
  element: HTMLElement,
  filename = 'scratch-result.png',
): Promise<void> {
  const blob = await toBlob(element, {
    backgroundColor: '#7f1d1d',
    pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
  })

  if (!blob) throw new Error('toBlob 回傳 null')

  // 優先使用 Web Share API（行動裝置原生分享）
  if (typeof navigator.share === 'function') {
    try {
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '電子刮刮樂結果' })
        return
      }
    } catch {
      // 分享取消或失敗，降級為下載
    }
  }

  // Fallback：以 Blob URL 下載
  downloadBlob(blob, filename)
}
