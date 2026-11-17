"use client"

import { type PropsWithChildren, type ReactNode } from "react"
import { useAuth } from "@/providers/auth-provider"

interface CanProps extends PropsWithChildren {
  /** Permission required to render the children. */
  permission?: string
  /** Alternative: any one of these permissions is enough. */
  anyOf?: readonly string[]
  fallback?: ReactNode
}

/** Renders children only when the signed-in user holds the permission. */
export function Can({
  permission,
  anyOf,
  fallback = null,
  children,
}: CanProps) {
  const { hasPermission, hasAnyPermission } = useAuth()
  const allowed = anyOf
    ? hasAnyPermission(anyOf)
    : permission
      ? hasPermission(permission)
      : false

  return allowed ? children : fallback
}
