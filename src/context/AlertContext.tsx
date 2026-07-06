import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import type { AlertVariant, CrudOperation } from '../lib/alertMessages'
import { crudAlertCopy } from '../lib/alertMessages'

export interface ToastItem {
  id: string
  variant: AlertVariant
  title: string
  message?: string
  operation?: CrudOperation
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface AlertContextValue {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'> & { duration?: number }) => void
  dismissToast: (id: string) => void
  showCrud: (opts: {
    operation: CrudOperation
    entity: string
    success: boolean
    detail?: string
    duration?: number
  }) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  confirmState: (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  resolveConfirm: (value: boolean) => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

let toastId = 0

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'> & { duration?: number }) => {
      const id = `toast-${++toastId}`
      const { duration = 3200, ...rest } = toast
      setToasts((prev) => [...prev.slice(-4), { ...rest, id }])
      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration)
      }
    },
    [dismissToast],
  )

  const showCrud = useCallback(
    (opts: {
      operation: CrudOperation
      entity: string
      success: boolean
      detail?: string
      duration?: number
    }) => {
      const { title, message, variant } = crudAlertCopy(
        opts.operation,
        opts.entity,
        opts.success,
        opts.detail,
      )
      showToast({
        variant,
        title,
        message,
        operation: opts.operation,
        duration: opts.duration,
      })
    },
    [showToast],
  )

  const resolveConfirm = useCallback((value: boolean) => {
    setConfirmState((prev) => {
      prev?.resolve(value)
      return null
    })
  }, [])

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  return (
    <AlertContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        showCrud,
        confirm,
        confirmState,
        resolveConfirm,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider')
  return ctx
}
