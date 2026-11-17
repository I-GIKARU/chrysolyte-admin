"use client"

import { useState, type PropsWithChildren } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/api/errors"
import { createRole, rolesQueryKey } from "@/lib/api/rbac"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function CreateRoleDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [projectScoped, setProjectScoped] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      createRole({
        name: slugify(name || label),
        label: label.trim(),
        description: description.trim() || undefined,
        is_project_scoped: projectScoped,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      reset()
      setOpen(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't create this role."))
    },
  })

  function reset() {
    setLabel("")
    setName("")
    setDescription("")
    setProjectScoped(false)
    setNameTouched(false)
    setError(null)
    mutation.reset()
  }

  const slug = slugify(name || label)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return
        if (!next) reset()
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>
            Roles are permission bundles. You can assign several roles to one
            account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role-label">Display name</Label>
            <Input
              id="role-label"
              value={label}
              placeholder="Night Manager"
              onChange={(event) => {
                setLabel(event.target.value)
                if (!nameTouched) setName(slugify(event.target.value))
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-name">Role key</Label>
            <Input
              id="role-name"
              value={name}
              placeholder="night_manager"
              className="font-mono"
              onChange={(event) => {
                setNameTouched(true)
                setName(slugify(event.target.value))
              }}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers and underscores.
              {slug ? ` Saves as “${slug}”.` : ""}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={description}
              placeholder="What this role is responsible for"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={projectScoped}
              onChange={(event) => setProjectScoped(event.target.checked)}
            />
            Project-scoped — accounts must be assigned to projects
          </label>

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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending || !label.trim() || !slug}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader aria-hidden="true" className="animate-spin" />
                  Creating
                </span>
              ) : (
                "Create role"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
