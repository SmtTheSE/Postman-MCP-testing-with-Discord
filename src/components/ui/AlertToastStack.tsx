import { CustomAlert } from './Alert'
import { useAlerts } from '../../context/AlertContext'

export function AlertToastStack() {
  const { toasts, dismissToast } = useAlerts()

  if (!toasts.length) return null

  return (
    <div className="alert-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <CustomAlert
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          operation={toast.operation}
          onDismiss={() => dismissToast(toast.id)}
          className="alert-toast"
        />
      ))}
    </div>
  )
}
