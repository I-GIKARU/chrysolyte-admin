"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ProjectMultiSelect } from "@/components/users/project-multiselect"
import { RoleMultiSelect } from "@/components/users/role-multiselect"
import { getErrorMessage } from "@/lib/api/errors"
import { fetchProjectOptions, projectOptionsQueryKey } from "@/lib/api/projects"
import { fetchRoles, rolesQueryKey } from "@/lib/api/rbac"
import { updateUser, usersQueryKey } from "@/lib/api/users"
import type { AuthUser } from "@/lib/types/auth"

interface Props {
  user: AuthUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserRolesDialog({ user, open, onOpenChange }: Props) {
  if (!open) return null
  return <EditUserRolesForm user={user} onOpenChange={onOpenChange} />
}

function EditUserRolesForm({ user, onOpenChange }: Omit<Props, "open">) {
  const [roles, setRoles] = useState<string[]>(
    user.roles?.length ? user.roles : [user.role]
  )
  const [projectIds, setProjectIds] = useState<string[]>(
    user.project_ids ?? (user.project_id ? [user.project_id] : [])
  )
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const allRoles = useQuery({ queryKey: rolesQueryKey, queryFn: fetchRoles })
  const projects = useQuery({
    queryKey: projectOptionsQueryKey,
    queryFn: fetchProjectOptions,
  })

  const needsProjects = Boolean(
    allRoles.data?.some(
      (role) => roles.includes(role.name) && role.is_project_scoped
    )
  )

  const mutation = useMutation({
    mutationFn: () =>
      updateUser(user.user_id, {
        role: roles[0],
        roles,
        project_ids: needsProjects ? projectIds : [],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't update these roles."))
    },
  })

  function submit() {
    setError(null)
    if (roles.length === 0) {
      setError("Keep at least one role on the account.")
      return
    }
    if (needsProjects && projectIds.length === 0) {
      setError("Choose at least one project for the project-scoped role.")
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {user.full_name || user.username}&apos;s roles</DialogTitle>
          <DialogDescription>
            Access is the union of every selected role. The change applies on
            this user&apos;s next request after their token refreshes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Roles</Label>
            {allRoles.isPending ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : allRoles.isError ? (
              <p className="text-sm text-destructive">Could not load roles.</p>
            ) : (
              <RoleMultiSelect
                roles={allRoles.data ?? []}
                value={roles}
                onChange={setRoles}
                disabled={mutation.isPending}
                idPrefix="edit-user-role"
              />
            )}
          </div>

          {needsProjects ? (
            <div className="grid gap-2">
              <Label>Project access</Label>
              <ProjectMultiSelect
                projects={projects.data ?? []}
                value={projectIds}
                onChange={setProjectIds}
                disabled={mutation.isPending}
              />
            </div>
          ) : null}

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
              disabled={mutation.isPending}
              onClick={submit}
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader aria-hidden="true" className="animate-spin" />
                  Saving
                </span>
              ) : (
                "Save roles"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
