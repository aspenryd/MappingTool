import { useEffect, useState } from 'react'
import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type: ToastType) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

export function toast(message: string, type: ToastType = 'info') {
  useToastStore.getState().addToast(message, type)
}

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-amber-500',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onRemove, 200)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onRemove])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg
        transform transition-all duration-200
        ${typeStyles[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <span className="text-lg">{typeIcons[toast.type]}</span>
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onRemove, 200)
        }}
        className="ml-2 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  )
}
