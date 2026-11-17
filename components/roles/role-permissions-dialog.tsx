"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Loader, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api/errors"
import {
  fetchPermissionGroups,
  fetchRolePermissions,
  permissionsQueryKey,
  rolePermissionsQueryKey,
  rolesQueryKey,
  setRolePermissions,
} from "@/lib/api/rbac"
import type { Role } from "@/lib/types/rbac"
import { humanizeSlug } from "@/lib/format"

interface Props {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolePermissionsDialog({ role, open, onOpenChange }: Props) {
  if (!open || !role) return null
  return (
    <RolePermissionsForm role={role} onOpenChange={onOpenChange} />
  )
}

function RolePermissionsForm({
  role,
  onOpenChange,
}: {
  role: Role
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const groups = useQuery({
    queryKey: permissionsQueryKey,
    queryFn: fetchPermissionGroups,
  })
  const current = useQuery({
    queryKey: rolePermissionsQueryKey(role.name),
    queryFn: () => fetchRolePermissions(role.name),
  })

  const selected =
    draft ?? current.data?.map((permission) => permission.permission_id) ?? []

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (groups.data ?? [])
      .map((group) => ({
        module: group.module,
        permissions: group.permissions.filter(
          (permission) =>
            !term ||
            permission.slug.toLowerCase().includes(term) ||
            (permission.description ?? "").toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groups.data, search])

  function toggle(id: string, checked: boolean) {
    setDraft(
      checked
        ? selected.includes(id)
          ? selected
          : [...selected, id]
        : selected.filter((permissionId) => permissionId !== id)
    )
  }

  const mutation = useMutation({
    mutationFn: () => setRolePermissions(role.name, selected),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      await queryClient.invalidateQueries({
        queryKey: rolePermissionsQueryKey(role.name),
      })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't save these permissions."))
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role.label} permissions</DialogTitle>
          <DialogDescription>
            Choose what this role can do. Users with several roles receive the
            union of every selected permission.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions"
            className="pl-9"
          />
        </div>

        {groups.isPending || current.isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading permissions…
          </p>
        ) : groups.isError || current.isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            We couldn&apos;t load permissions.
          </p>
        ) : (
          <div className="grid gap-4">
            {filtered.map((group) => {
              const allSelected = group.permissions.every((permission) =>
                selected.includes(permission.permission_id)
              )
              return (
                <section key={group.module} className="rounded-xl border">
                  <header className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5">
                    <h3 className="text-sm font-bold">
                      {humanizeSlug(group.module)}
                    </h3>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      onClick={() => {
                        const ids = group.permissions.map(
                          (permission) => permission.permission_id
                        )
                        setDraft(
                          allSelected
                            ? selected.filter((id) => !ids.includes(id))
                            : [...new Set([...selected, ...ids])]
                        )
                      }}
                    >
                      {allSelected ? "Clear module" : "Select all"}
                    </button>
                  </header>
                  <div>
                    {group.permissions.map((permission) => {
                      const checked = selected.includes(permission.permission_id)
                      return (
                        <label
                          key={permission.permission_id}
                          className="flex cursor-pointer items-start gap-3 border-b px-3.5 py-2.5 last:border-b-0 hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={(event) =>
                              toggle(
                                permission.permission_id,
                                event.target.checked
                              )
                            }
                          />
                          <span
                            aria-hidden="true"
                            className={
                              checked
                                ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground"
                                : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border"
                            }
                          >
                            {checked ? <Check className="size-3.5" /> : null}
                          </span>
                          <span className="grid gap-0.5">
                            <span className="text-sm font-medium">
                              {permission.description ?? permission.slug}
                            </span>
                            <code className="text-[11px] text-muted-foreground">
                              {permission.slug}
                            </code>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {error ? (
          <p className="rounded-xl bg-destructive-muted px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending || groups.isPending || current.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Saving
              </span>
            ) : (
              "Save permissions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
