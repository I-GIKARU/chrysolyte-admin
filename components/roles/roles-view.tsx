"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { KeyRound, Plus, Search } from "lucide-react"

import { Can } from "@/components/auth/can"
import { CreateRoleDialog } from "@/components/roles/create-role-dialog"
import { EditRoleDialog } from "@/components/roles/edit-role-dialog"
import { RolePermissionsDialog } from "@/components/roles/role-permissions-dialog"
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
import { fetchRoles, rolesQueryKey } from "@/lib/api/rbac"
import type { Role } from "@/lib/types/rbac"

const headClassName =
  "h-10 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
const cellClassName = "px-3 py-3.5 align-middle whitespace-normal"

export function RolesView() {
  const [search, setSearch] = useState("")
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = roles.data ?? []
    if (!term) return list
    return list.filter((role) =>
      [role.name, role.label, role.description ?? ""].some((value) =>
        value.toLowerCase().includes(term)
      )
    )
  }, [roles.data, search])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold text-heading">
            Roles & permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Roles are editable permission bundles. Accounts can hold several
            roles at once.
          </p>
        </div>
        <Can permission="auth:roles:manage">
          <CreateRoleDialog>
            <Button className="h-10 rounded-full px-4 font-semibold">
              <Plus aria-hidden="true" />
              Create role
            </Button>
          </CreateRoleDialog>
        </Can>
      </div>

      <div className="flex max-w-md items-center gap-2 rounded-xl border bg-card px-3">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search role or description"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headClassName}>Role</TableHead>
              <TableHead className={headClassName}>Description</TableHead>
              <TableHead className={headClassName}>Scope</TableHead>
              <TableHead className={headClassName}>Permissions</TableHead>
              <TableHead className={headClassName}>Users</TableHead>
              <TableHead className={headClassName}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.isPending ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading roles…
                </TableCell>
              </TableRow>
            ) : roles.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  We couldn&apos;t load roles.
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No roles match.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((role) => (
                <TableRow key={role.name}>
                  <TableCell className={cellClassName}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{role.label}</span>
                      <code className="text-xs text-muted-foreground">
                        {role.name}
                      </code>
                      {role.is_system_default ? (
                        <Badge variant="outline">built-in</Badge>
                      ) : null}
                      {!role.is_active ? (
                        <Badge variant="destructive">inactive</Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className={cellClassName}>
                    {role.description || "—"}
                  </TableCell>
                  <TableCell className={cellClassName}>
                    {role.is_project_scoped ? "Project-scoped" : "Firm-wide"}
                  </TableCell>
                  <TableCell className={cellClassName}>
                    <span className="inline-flex items-center gap-1.5">
                      <KeyRound aria-hidden="true" className="size-3.5" />
                      {role.permission_count}
                    </span>
                  </TableCell>
                  <TableCell className={cellClassName}>{role.user_count}</TableCell>
                  <TableCell className={cellClassName}>
                    <span className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPermissionsRole(role)}
                      >
                        Permissions
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                      >
                        Edit
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <RolePermissionsDialog
        role={permissionsRole}
        open={Boolean(permissionsRole)}
        onOpenChange={(open) => {
          if (!open) setPermissionsRole(null)
        }}
      />
      <EditRoleDialog
        role={editingRole}
        open={Boolean(editingRole)}
        onOpenChange={(open) => {
          if (!open) setEditingRole(null)
        }}
      />
    </section>
  )
}
