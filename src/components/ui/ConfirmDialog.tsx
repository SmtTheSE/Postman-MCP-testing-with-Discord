import { useAlerts } from '../../context/AlertContext'

export function ConfirmDialog() {
  const { confirmState, resolveConfirm } = useAlerts()

  if (!confirmState) return null

  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive,
  } = confirmState

  return (
    <div className="confirm-overlay" role="presentation" onClick={() => resolveConfirm(false)}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-title" className="confirm-title">
          {title}
        </p>
        <p id="confirm-message" className="confirm-message">
          {message}
        </p>
        <div className="confirm-actions">
          <button type="button" className="ios-btn-secondary" onClick={() => resolveConfirm(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? 'ios-btn-danger' : 'ios-btn-primary'}
            onClick={() => resolveConfirm(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
