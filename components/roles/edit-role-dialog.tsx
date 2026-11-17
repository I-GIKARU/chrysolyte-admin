"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
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
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/api/errors"
import { deleteRole, rolesQueryKey, updateRole } from "@/lib/api/rbac"
import type { Role } from "@/lib/types/rbac"

interface Props {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({ role, open, onOpenChange }: Props) {
  if (!open || !role) return null
  return <EditRoleForm role={role} onOpenChange={onOpenChange} />
}

function EditRoleForm({
  role,
  onOpenChange,
}: {
  role: Role
  onOpenChange: (open: boolean) => void
}) {
  const [label, setLabel] = useState(role.label)
  const [description, setDescription] = useState(role.description ?? "")
  const [projectScoped, setProjectScoped] = useState(role.is_project_scoped)
  const [active, setActive] = useState(role.is_active)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      updateRole(role.name, {
        label: label.trim(),
        description: description.trim(),
        is_project_scoped: projectScoped,
        is_active: active,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't update this role."))
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteRole(role.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      setConfirmDelete(false)
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't delete this role."))
    },
  })

  return (
    <>
      <Dialog
        open
        onOpenChange={(next) => {
          if (!mutation.isPending && !remove.isPending) onOpenChange(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {role.label}</DialogTitle>
            <DialogDescription>
              Role key <code className="font-mono">{role.name}</code> cannot be
              renamed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role-label">Display name</Label>
              <Input
                id="edit-role-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role-description">Description</Label>
              <Input
                id="edit-role-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={projectScoped}
                onChange={(event) => setProjectScoped(event.target.checked)}
              />
              Project-scoped
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Active
            </label>

            {error ? (
              <p className="rounded-xl bg-destructive-muted px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter className="justify-between sm:justify-between">
              <div>
                {!role.is_system_default ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={mutation.isPending || remove.isPending}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutation.isPending || remove.isPending}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={mutation.isPending || !label.trim()}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader aria-hidden="true" className="animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Save role"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${role.label}?`}
        description="The role is removed permanently. Accounts still holding it must be reassigned first."
        confirmLabel="Delete role"
        pendingLabel="Deleting"
        destructive
        isPending={remove.isPending}
        error={error}
        onConfirm={() => remove.mutate()}
      />
    </>
  )
}
