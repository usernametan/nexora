import { useCallback, useMemo, useRef, useState } from 'react'
import { CloseIcon } from '../components/ui/Icons'
import { ToastContext } from './toast'

const DEFAULT_DURATION = 7000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const showToast = useCallback((message, options = {}) => {
    const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const toast = {
      id,
      message,
      actionLabel: options.actionLabel ?? null,
      onAction: options.onAction ?? null,
      tone: options.tone ?? 'default',
    }
    setToasts((current) => [...current.slice(-2), toast])
    const timer = window.setTimeout(() => dismiss(id), options.duration ?? DEFAULT_DURATION)
    timers.current.set(id, timer)
    return id
  }, [dismiss])

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.tone}`} key={toast.id} role="status">
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                className="toast-action"
                type="button"
                onClick={() => {
                  toast.onAction?.()
                  dismiss(toast.id)
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button className="toast-close" type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              <CloseIcon size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
