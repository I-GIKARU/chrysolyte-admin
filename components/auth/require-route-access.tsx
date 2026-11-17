"use client"

import { type PropsWithChildren } from "react"
import { usePathname } from "next/navigation"
import { UnauthorizedCard } from "@/components/unauthorized-card"
import { canAccessPath, findNavItem } from "@/lib/navigation"
import { useAuth } from "@/providers/auth-provider"

/**
 * Blocks dashboard routes the signed-in user's permissions cannot open, using
 * the same nav rules that hide the sidebar links.
 */
export function RequireRouteAccess({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const { user, permissions, status } = useAuth()

  if (status === "loading" || !user) return null
  if (!canAccessPath(pathname, permissions)) {
    const page = findNavItem(pathname)
    return <UnauthorizedCard area={page?.title.toLowerCase() ?? "this page"} />
  }

  return children
}
