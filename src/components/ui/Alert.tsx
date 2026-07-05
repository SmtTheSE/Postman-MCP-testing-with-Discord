import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'warning' | 'info'

const variantClass: Record<AlertVariant, string> = {
  error: 'alert alert-error',
  warning: 'alert alert-warning',
  info: 'alert alert-info',
}

export function Alert({
  variant,
  children,
  action,
}: {
  variant: AlertVariant
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={`${variantClass[variant]} space-y-3`}>
      <div>{children}</div>
      {action}
    </div>
  )
}
