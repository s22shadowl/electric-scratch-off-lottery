import html2canvas from 'html2canvas'

/**
 * 截圖指定 DOM 元素並分享（優先 Web Share API，降級為下載）
 */
export async function captureAndShare(
  element: HTMLElement,
  filename = 'scratch-result.png',
): Promise<void> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    backgroundColor: '#7f1d1d', // 與卡片背景色相近的深紅
    scale: Math.min(window.devicePixelRatio || 2, 3),
    logging: false,
  })

  const dataUrl = canvas.toDataURL('image/png')

  // 優先使用 Web Share API（行動裝置原生分享）
  if (typeof navigator.share === 'function') {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '電子刮刮樂結果' })
        return
      }
    } catch {
      // 分享取消或失敗，降級為下載
    }
  }

  // Fallback：觸發瀏覽器下載
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
