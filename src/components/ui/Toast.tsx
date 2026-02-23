import { useEffect } from 'react'
import { useToastStore } from '@/stores/toastStore'

const TOAST_DURATION = 3000

export default function Toast() {
  const { message, type, clearToast } = useToastStore()

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clearToast, TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [message, clearToast])

  if (!message) return null

  const colorClass =
    type === 'error'
      ? 'bg-red-900 border-red-500 text-red-200'
      : type === 'success'
        ? 'bg-green-900 border-green-500 text-green-200'
        : 'bg-gray-900 border-gray-600 text-gray-200'

  return (
    <div
      data-testid="toast"
      role="alert"
      aria-live="polite"
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'px-5 py-3 rounded-xl text-sm font-bold shadow-xl border whitespace-nowrap',
        colorClass,
      ].join(' ')}
    >
      {message}
    </div>
  )
}
