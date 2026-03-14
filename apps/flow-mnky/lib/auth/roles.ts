export type DatabaseProfileRole =
  | 'admin'
  | 'moderator'
  | 'pending'
  | 'user'
  | 'workspace_admin'
  | 'tenant_admin'
  | 'platform_admin'

export type AppRole = 'admin' | 'moderator' | 'pending' | 'user'

export function normalizeProfileRole(role: string | null | undefined): AppRole {
  switch (role) {
    case 'platform_admin':
    case 'tenant_admin':
    case 'admin':
      return 'admin'
    case 'workspace_admin':
    case 'moderator':
      return 'moderator'
    case 'pending':
      return 'pending'
    default:
      return 'user'
  }
}

export function isAdminLikeRole(role: string | null | undefined, isAdminFlag?: boolean | null): boolean {
  if (isAdminFlag === true) return true
  return normalizeProfileRole(role) === 'admin'
}

export function toDatabaseRole(role: AppRole): DatabaseProfileRole {
  switch (role) {
    case 'admin':
      return 'platform_admin'
    case 'moderator':
      return 'workspace_admin'
    case 'pending':
      return 'user'
    default:
      return 'user'
  }
}
