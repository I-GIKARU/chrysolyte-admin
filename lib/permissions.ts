/**
 * Permission checks mirror the backend:
 * - `*` grants everything
 * - `module:*` grants every action in that module
 * - otherwise the exact slug must be present
 */
export function hasPermission(
  permissions: readonly string[] | undefined | null,
  required: string
) {
  if (!permissions?.length) return false
  if (permissions.includes("*") || permissions.includes(required)) return true
  const moduleName = required.split(":", 1)[0]
  return permissions.includes(`${moduleName}:*`)
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined | null,
  required: readonly string[]
) {
  return required.some((slug) => hasPermission(permissions, slug))
}
