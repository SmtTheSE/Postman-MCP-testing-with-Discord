import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import type { AlertVariant, CrudOperation } from '../../lib/alertMessages'

type AlertVariantExtended = AlertVariant

const ICONS: Record<AlertVariantExtended, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const CRUD_ICONS: Record<CrudOperation, typeof Plus> = {
  create: Plus,
  read: FolderOpen,
  update: Pencil,
  delete: Trash2,
}

export function CustomAlert({
  variant,
  title,
  message,
  children,
  action,
  onDismiss,
  operation,
  className = '',
}: {
  variant: AlertVariantExtended
  title?: string
  message?: ReactNode
  children?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  operation?: CrudOperation
  className?: string
}) {
  const Icon = ICONS[variant]
  const CrudIcon = operation ? CRUD_ICONS[operation] : null

  return (
    <div
      className={`custom-alert custom-alert-${variant} ${className}`.trim()}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <div className="custom-alert-icon-wrap" aria-hidden>
        <Icon className="custom-alert-icon" strokeWidth={2} />
      </div>
      <div className="custom-alert-body">
        <div className="custom-alert-head">
          {operation && CrudIcon && (
            <span className={`custom-alert-crud custom-alert-crud-${operation}`}>
              <CrudIcon className="w-3 h-3" strokeWidth={2.5} />
              {operation}
            </span>
          )}
          {title && <p className="custom-alert-title">{title}</p>}
        </div>
        {message && <p className="custom-alert-message">{message}</p>}
        {children && <div className="custom-alert-content">{children}</div>}
        {action && <div className="custom-alert-action">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="custom-alert-dismiss" onClick={onDismiss} aria-label="Dismiss">
          <X className="w-4 h-4" strokeWidth={2.25} />
        </button>
      )}
    </div>
  )
}

/** Backward-compatible inline alert */
export function Alert({
  variant,
  children,
  action,
  title,
  message,
  operation,
  onDismiss,
}: {
  variant: AlertVariantExtended
  children?: ReactNode
  action?: ReactNode
  title?: string
  message?: ReactNode
  operation?: CrudOperation
  onDismiss?: () => void
}) {
  return (
    <CustomAlert
      variant={variant}
      title={title}
      message={message ?? (typeof children === 'string' ? children : undefined)}
      action={action}
      operation={operation}
      onDismiss={onDismiss}
    >
      {children && typeof children !== 'string' ? children : undefined}
    </CustomAlert>
  )
}
