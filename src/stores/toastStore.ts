import { create } from 'zustand'

export type ToastType = 'error' | 'success' | 'info'

interface ToastState {
  message: string | null
  type: ToastType
  showToast: (message: string, type?: ToastType) => void
  clearToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type = 'info') => set({ message, type }),
  clearToast: () => set({ message: null }),
}))
