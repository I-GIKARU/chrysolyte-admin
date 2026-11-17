import { axiosInstance } from "@/lib/axios"
import type {
  MyPermissions,
  Permission,
  PermissionGroup,
  Role,
} from "@/lib/types/rbac"

export const myPermissionsQueryKey = ["auth", "permissions", "me"] as const
export const rolesQueryKey = ["auth", "roles"] as const
export const permissionsQueryKey = ["auth", "permissions"] as const
export const rolePermissionsQueryKey = (name: string) =>
  ["auth", "roles", name, "permissions"] as const

export async function fetchMyPermissions() {
  const response = await axiosInstance.get<MyPermissions>(
    "/auth/permissions/me"
  )
  return response.data
}

export async function fetchRoles() {
  const response = await axiosInstance.get<Role[]>("/auth/roles")
  return response.data
}

export async function fetchPermissionGroups() {
  const response =
    await axiosInstance.get<PermissionGroup[]>("/auth/permissions")
  return response.data
}

export async function fetchPermissions() {
  const response = await axiosInstance.get<Permission[]>(
    "/auth/permissions?grouped=false"
  )
  return response.data
}

export async function fetchRolePermissions(name: string) {
  const response = await axiosInstance.get<Permission[]>(
    `/auth/roles/${encodeURIComponent(name)}/permissions`
  )
  return response.data
}

export async function setRolePermissions(
  name: string,
  permissionIds: string[]
) {
  const response = await axiosInstance.patch<Permission[]>(
    `/auth/roles/${encodeURIComponent(name)}/permissions`,
    { permission_ids: permissionIds }
  )
  return response.data
}

export async function createRole(payload: {
  name: string
  label: string
  description?: string
  is_project_scoped?: boolean
}) {
  const response = await axiosInstance.post<Role>("/auth/roles", payload)
  return response.data
}

export async function updateRole(
  name: string,
  payload: {
    label?: string
    description?: string
    is_project_scoped?: boolean
    is_active?: boolean
  }
) {
  const response = await axiosInstance.patch<Role>(
    `/auth/roles/${encodeURIComponent(name)}`,
    payload
  )
  return response.data
}

export async function deleteRole(name: string) {
  await axiosInstance.delete(`/auth/roles/${encodeURIComponent(name)}`)
}

export async function fetchUserPermissions(userId: string) {
  const response = await axiosInstance.get<MyPermissions>(
    `/auth/permissions/users/${encodeURIComponent(userId)}`
  )
  return response.data
}

export async function fetchUserRoles(userId: string) {
  const response = await axiosInstance.get<Role[]>(
    `/auth/permissions/users/${encodeURIComponent(userId)}/roles`
  )
  return response.data
}

export async function setUserRoles(userId: string, roles: string[]) {
  const response = await axiosInstance.patch<Role[]>(
    `/auth/permissions/users/${encodeURIComponent(userId)}/roles`,
    { roles }
  )
  return response.data
}

export async function addUserRole(userId: string, role: string) {
  const response = await axiosInstance.post<Role[]>(
    `/auth/permissions/users/${encodeURIComponent(userId)}/roles`,
    { role }
  )
  return response.data
}

export async function removeUserRole(userId: string, role: string) {
  const response = await axiosInstance.delete<Role[]>(
    `/auth/permissions/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(role)}`
  )
  return response.data
}

export async function fetchUserOverrides(userId: string) {
  const response = await axiosInstance.get<
    Array<{
      permission_id: string
      slug: string
      module: string
      grant_type: "ALLOW" | "DENY"
    }>
  >(`/auth/permissions/users/${encodeURIComponent(userId)}/overrides`)
  return response.data
}

export async function setUserOverride(
  userId: string,
  permissionId: string,
  grantType: "ALLOW" | "DENY"
) {
  await axiosInstance.post(
    `/auth/permissions/users/${encodeURIComponent(userId)}/overrides`,
    { permission_id: permissionId, grant_type: grantType }
  )
}

export async function removeUserOverride(userId: string, permissionId: string) {
  await axiosInstance.delete(
    `/auth/permissions/users/${encodeURIComponent(userId)}/overrides/${encodeURIComponent(permissionId)}`
  )
}
