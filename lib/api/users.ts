import { axiosInstance } from "@/lib/axios"
import type { AuthUser } from "@/lib/types/auth"

export const usersQueryKey = ["auth", "users"] as const
export const userStatsQueryKey = ["auth", "users", "stats"] as const

export interface UserPayload {
  username: string
  email: string
  phone?: string | null
  full_name?: string | null
  password: string
  role: string
  roles?: string[]
  project_id?: string | null
  project_ids?: string[]
  must_change_password?: boolean
}

export interface UserUpdatePayload {
  email?: string
  phone?: string | null
  full_name?: string
  role?: string
  roles?: string[]
  project_id?: string | null
  project_ids?: string[]
  active?: boolean
}

export async function fetchUsers(params?: { role?: string; active?: boolean }) {
  const response = await axiosInstance.get<AuthUser[]>("/auth/users", {
    params,
  })
  return response.data
}

export async function fetchUserStats() {
  const response = await axiosInstance.get<{
    total_users: number
    active_users: number
    inactive_users: number
    by_role: Record<string, number>
  }>("/auth/users/stats")
  return response.data
}

export async function createUser(payload: UserPayload) {
  const response = await axiosInstance.post<AuthUser>("/auth/users", payload)
  return response.data
}

export async function updateUser(userId: string, payload: UserUpdatePayload) {
  const response = await axiosInstance.patch<AuthUser>(
    `/auth/users/${encodeURIComponent(userId)}`,
    payload
  )
  return response.data
}

export async function deleteUser(userId: string) {
  await axiosInstance.delete(`/auth/users/${encodeURIComponent(userId)}`)
}

export async function disableUser(userId: string) {
  await axiosInstance.post(`/auth/users/${encodeURIComponent(userId)}/disable`)
}

export async function enableUser(userId: string) {
  await axiosInstance.post(`/auth/users/${encodeURIComponent(userId)}/enable`)
}

export async function unlockUser(userId: string) {
  await axiosInstance.post(`/auth/users/${encodeURIComponent(userId)}/unlock`)
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await axiosInstance.post(
    `/auth/users/${encodeURIComponent(userId)}/reset-password`,
    { new_password: newPassword }
  )
}
