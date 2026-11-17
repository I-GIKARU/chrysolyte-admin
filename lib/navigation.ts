import { hasAnyPermission, hasPermission } from "@/lib/permissions"

export interface NavItem {
  title: string
  href: string
  /** Permission required to see and open the page. */
  permission?: string
  /** Alternative: any one of these permissions opens the page. */
  anyPermission?: readonly string[]
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", permission: "dashboard:view" },
  { title: "Projects", href: "/projects", permission: "projects:view" },
  { title: "Site Reports", href: "/site-reports", permission: "reports:view" },
  {
    title: "Construction",
    href: "/construction",
    permission: "activities:view",
  },
  {
    title: "Project Consultants",
    href: "/project-consultants",
    permission: "instructions:view",
  },
  {
    title: "Design Portal",
    href: "/design-portal",
    permission: "design:view",
  },
  {
    title: "COO Operations",
    href: "/coo-operations",
    permission: "office:view",
  },
  { title: "Stores", href: "/stores", permission: "stores:view" },
  { title: "Financials", href: "/financials", permission: "finance:view" },
  { title: "Staff & KPI", href: "/staff-kpi", permission: "staff:view" },
  {
    title: "Board Analysis",
    href: "/board-analysis",
    permission: "dashboard:board",
  },
  {
    title: "Announcements",
    href: "/announcements",
    permission: "announcements:view",
  },
  {
    title: "Users",
    href: "/users",
    permission: "auth:users:view",
  },
  {
    title: "Roles & Permissions",
    href: "/roles",
    permission: "auth:roles:manage",
  },
]

/** Account pages inside the dashboard shell that aren't sidebar links. */
export const accountItems: NavItem[] = [{ title: "Profile", href: "/profile" }]

/**
 * Detail pages whose header title differs from their section's, e.g.
 * `/projects/[projectId]` shows "Project" rather than "Projects".
 */
export const detailPageTitles = [{ parentHref: "/projects", title: "Project" }]

/** Every page in the dashboard shell, used for header titles and route guards. */
export const dashboardPages = [...navItems, ...accountItems]

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function canSeeNavItem(
  item: NavItem,
  permissions: readonly string[] | undefined
) {
  if (item.anyPermission) {
    return hasAnyPermission(permissions, item.anyPermission)
  }
  if (item.permission) {
    return hasPermission(permissions, item.permission)
  }
  return true
}

export function findNavItem(pathname: string) {
  return [...navItems, ...accountItems].find((item) =>
    isNavItemActive(pathname, item.href)
  )
}

/** Whether the user may open `pathname`. Unknown routes fall through to 404. */
export function canAccessPath(
  pathname: string,
  permissions: readonly string[] | undefined
) {
  const item = findNavItem(pathname)
  return !item || canSeeNavItem(item, permissions)
}

/** First accessible page for the user. Profile is always available. */
export function getHomeNavItem(permissions: readonly string[] | undefined) {
  return (
    navItems.find((item) => canSeeNavItem(item, permissions)) ?? accountItems[0]
  )
}

export function getHomePath(permissions: readonly string[] | undefined) {
  return getHomeNavItem(permissions).href
}
