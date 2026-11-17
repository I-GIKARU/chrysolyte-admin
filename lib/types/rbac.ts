export interface Role {
  name: string
  label: string
  description: string | null
  is_project_scoped: boolean
  is_system_default: boolean
  is_active: boolean
  permission_count: number
  user_count: number
  created_at: string
}

export interface Permission {
  permission_id: string
  module: string
  slug: string
  description: string | null
}

export interface PermissionGroup {
  module: string
  permissions: Permission[]
}

export interface MyPermissions {
  permissions: string[]
  roles: Role[]
}
