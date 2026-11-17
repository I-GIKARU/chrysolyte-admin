"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react"
import { useRouter } from "next/navigation"
import { WorkspaceLoader } from "@/components/workspace-loader"
import * as authApi from "@/lib/api/auth"
import * as rbacApi from "@/lib/api/rbac"
import {
  clearAccessToken,
  getAccessToken,
  subscribeAccessToken,
} from "@/lib/auth-token"
import { onUnauthorized, refreshAccessToken } from "@/lib/axios"
import { dashboardPages, getHomePath } from "@/lib/navigation"
import { hasAnyPermission, hasPermission } from "@/lib/permissions"
import type { LoginFormValues, AuthUser } from "@/lib/types/auth"
import type { Role } from "@/lib/types/rbac"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface AuthSnapshot {
  user: AuthUser
  permissions: string[]
  roles: Role[]
}

interface AuthContextValue {
  user: AuthUser | null
  permissions: string[]
  roles: Role[]
  accessToken: string | null
  status: AuthStatus
  isLoggedIn: boolean
  login: (values: LoginFormValues) => Promise<AuthSnapshot>
  logout: () => Promise<void>
  /** Re-fetches `/auth/me` and `/auth/permissions/me`. */
  refreshUser: () => Promise<AuthSnapshot>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: readonly string[]) => boolean
}

export const LOGIN_ROUTE = "/login"

/** Fallback landing page when a user has no module access yet. */
export const HOME_ROUTE = "/profile"

/** Screens under `app/(auth)`, reachable without a session. */
const PUBLIC_ROUTES = [LOGIN_ROUTE, "/forgot-password", "/reset-password"]

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function isPublicRoute(pathname: string) {
  return matchesRoute(pathname, PUBLIC_ROUTES)
}

/**
 * Screens under `app/(dashboard)` that need a session. These come from
 * `lib/navigation.ts`, so a page added there is protected automatically.
 */
const PROTECTED_ROUTES = dashboardPages.map((item) => item.href)

/**
 * Whether the path is a real route. Anything else is a 404, which renders its
 * own screen instead of bouncing a signed-out visitor to login.
 */
export function isAppRoute(pathname: string) {
  return (
    pathname === "/" ||
    isPublicRoute(pathname) ||
    matchesRoute(pathname, PROTECTED_ROUTES)
  )
}

/** Signed-out visitors are sent to login from real routes only, never from a 404. */
function shouldRedirectToLogin(pathname: string) {
  return isAppRoute(pathname) && !isPublicRoute(pathname)
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const getServerToken = () => null

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [status, setStatus] = useState<AuthStatus>("loading")
  const bootstrapped = useRef(false)
  const authenticated = useRef(false)
  const loadingIdentity = useRef(false)

  // Mirrors the module-level token, so consumers re-render when the axios
  // interceptor refreshes it behind the scenes.
  const accessToken = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken
  )

  const endSession = useCallback(() => {
    authenticated.current = false
    clearAccessToken()
    setUser(null)
    setPermissions([])
    setRoles([])
    setStatus("unauthenticated")
  }, [])

  const loadIdentity = useCallback(async (): Promise<AuthSnapshot> => {
    if (loadingIdentity.current) {
      // A refresh event and a login/bootstrap can overlap; return the
      // current state instead of firing duplicate identity requests.
      if (user) {
        return { user, permissions, roles }
      }
    }
    loadingIdentity.current = true
    try {
      const [profile, access] = await Promise.all([
        authApi.fetchMe(),
        rbacApi.fetchMyPermissions(),
      ])
      setUser(profile)
      setPermissions(access.permissions)
      setRoles(access.roles)
      setStatus("authenticated")
      authenticated.current = true
      return {
        user: profile,
        permissions: access.permissions,
        roles: access.roles,
      }
    } finally {
      loadingIdentity.current = false
    }
  }, [permissions, roles, user])

  // On load: trade the refresh cookie for an access token, load the profile
  // and effective permissions, then send the visitor to their first page.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const pathname = window.location.pathname

    async function bootstrap() {
      try {
        await refreshAccessToken()
        const identity = await loadIdentity()
        if (pathname === "/" || isPublicRoute(pathname)) {
          router.replace(
            identity.user.must_change_password
              ? "/profile"
              : getHomePath(identity.permissions)
          )
        }
      } catch {
        endSession()
        if (shouldRedirectToLogin(pathname)) router.replace(LOGIN_ROUTE)
      }
    }

    void bootstrap()
  }, [router, endSession, loadIdentity])

  // A refresh that fails mid-session (cookie expired or revoked) ends it.
  useEffect(() => {
    return onUnauthorized(() => {
      endSession()
      if (shouldRedirectToLogin(window.location.pathname)) {
        router.replace(LOGIN_ROUTE)
      }
    })
  }, [router, endSession])

  // The axios interceptor emits this after a successful refresh. Reload the
  // profile and permissions because a role/project change may have caused the
  // refresh in the first place.
  useEffect(() => {
    const onRefreshed = () => {
      if (!authenticated.current) return
      void loadIdentity().catch(() => endSession())
    }
    window.addEventListener("auth:refreshed", onRefreshed)
    return () => window.removeEventListener("auth:refreshed", onRefreshed)
  }, [loadIdentity, endSession])

  const login = useCallback(
    async (values: LoginFormValues) => {
      await authApi.login(values)
      return loadIdentity()
    },
    [loadIdentity]
  )

  const refreshUser = useCallback(async () => {
    return loadIdentity()
  }, [loadIdentity])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      endSession()
    }
  }, [endSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      roles,
      accessToken,
      status,
      isLoggedIn: status === "authenticated" && user !== null,
      login,
      logout,
      refreshUser,
      hasPermission: (permission: string) =>
        hasPermission(permissions, permission),
      hasAnyPermission: (required: readonly string[]) =>
        hasAnyPermission(permissions, required),
    }),
    [user, permissions, roles, accessToken, status, login, logout, refreshUser]
  )

  return (
    <AuthContext.Provider value={value}>
      {status === "loading" ? <WorkspaceLoader /> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
