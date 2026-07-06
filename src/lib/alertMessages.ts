export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export type CrudOperation = 'create' | 'read' | 'update' | 'delete'

const CRUD_VERBS: Record<CrudOperation, { success: string; fail: string }> = {
  create: { success: 'Created', fail: "Couldn't create" },
  read: { success: 'Loaded', fail: "Couldn't load" },
  update: { success: 'Updated', fail: "Couldn't update" },
  delete: { success: 'Deleted', fail: "Couldn't delete" },
}

export function crudAlertCopy(
  operation: CrudOperation,
  entity: string,
  success: boolean,
  detail?: string,
) {
  const verbs = CRUD_VERBS[operation]
  const title = success ? verbs.success : verbs.fail
  const message = detail || (success ? `${entity} is ready.` : `${entity} action failed. Try again.`)
  return { title, message, variant: (success ? 'success' : 'error') as AlertVariant }
}
