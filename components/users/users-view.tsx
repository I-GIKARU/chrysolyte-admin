"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search } from "lucide-react"

import { Can } from "@/components/auth/can"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { UserActions } from "@/components/users/user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, humanizeSlug } from "@/lib/format"
import { fetchRoles, rolesQueryKey } from "@/lib/api/rbac"
import { fetchUsers, usersQueryKey } from "@/lib/api/users"
import { useAuth } from "@/providers/auth-provider"

const headClassName =
  "h-10 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
const cellClassName = "px-3 py-3.5 align-middle whitespace-normal"

export function UsersView() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")

  const users = useQuery({ queryKey: usersQueryKey, queryFn: () => fetchUsers() })
  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const roleLabels = useMemo(() => {
    const map = new Map<string, string>()
    roles.data?.forEach((role) => map.set(role.name, role.label))
    return map
  }, [roles.data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = users.data ?? []
    if (!term) return list
    return list.filter((user) =>
      [user.full_name, user.username, user.email, ...(user.roles ?? [])].some(
        (value) => value?.toLowerCase().includes(term)
      )
    )
  }, [users.data, search])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold text-heading">
            Staff accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Create accounts, assign multiple roles and manage sign-in access.
          </p>
        </div>
        <Can permission="auth:users:create">
          <CreateUserDialog>
            <Button className="h-10 rounded-full px-4 font-semibold">
              <Plus aria-hidden="true" />
              Create account
            </Button>
          </CreateUserDialog>
        </Can>
      </div>

      <div className="flex max-w-md items-center gap-2 rounded-xl border bg-card px-3">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, username, email or role"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headClassName}>Name</TableHead>
              <TableHead className={headClassName}>Username</TableHead>
              <TableHead className={headClassName}>Email</TableHead>
              <TableHead className={headClassName}>Roles</TableHead>
              <TableHead className={headClassName}>Projects</TableHead>
              <TableHead className={headClassName}>Status</TableHead>
              <TableHead className={headClassName}>Last sign in</TableHead>
              <TableHead className={headClassName}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isPending ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Loading staff…
                </TableCell>
              </TableRow>
            ) : users.isError ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-destructive">
                  We couldn&apos;t load staff accounts.
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No staff accounts match.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((user) => {
                const userRoles = user.roles?.length ? user.roles : [user.role]
                return (
                  <TableRow key={user.user_id}>
                    <TableCell className={cellClassName}>
                      <span className="font-semibold">
                        {user.full_name || user.username}
                        {user.user_id === currentUser?.user_id ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            you
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className={cellClassName}>{user.username}</TableCell>
                    <TableCell className={cellClassName}>{user.email}</TableCell>
                    <TableCell className={cellClassName}>
                      <span className="flex flex-wrap gap-1">
                        {userRoles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {roleLabels.get(role) ?? humanizeSlug(role)}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className={cellClassName}>
                      {user.project_ids?.length
                        ? user.project_ids.join(", ")
                        : user.project_id || "—"}
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <span className="flex flex-wrap gap-1">
                        <Badge variant={user.active ? "success" : "destructive"}>
                          {user.active ? "Active" : "Disabled"}
                        </Badge>
                        {user.is_locked ? (
                          <Badge variant="warning">Locked</Badge>
                        ) : null}
                        {user.must_change_password ? (
                          <Badge variant="outline">Password change</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className={cellClassName}>
                      {user.last_login_at
                        ? formatDateTime(user.last_login_at)
                        : "Never"}
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <UserActions user={user} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}
