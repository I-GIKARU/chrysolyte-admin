"use client"

import { useState, type PropsWithChildren } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader, RefreshCw } from "lucide-react"

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
import { fetchProjectOptions, projectOptionsQueryKey } from "@/lib/api/projects"
import { fetchRoles, rolesQueryKey } from "@/lib/api/rbac"
import { createUser, usersQueryKey } from "@/lib/api/users"
import { RoleMultiSelect } from "@/components/users/role-multiselect"
import { ProjectMultiSelect } from "@/components/users/project-multiselect"

function generatePassword() {
  return `Cel-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}!`
}

export function CreateUserDialog({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState(generatePassword)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const roles = useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
    enabled: open,
  })
  const projects = useQuery({
    queryKey: projectOptionsQueryKey,
    queryFn: fetchProjectOptions,
    enabled: open,
  })

  const needsProjects = Boolean(
    roles.data?.some(
      (role) => selectedRoles.includes(role.name) && role.is_project_scoped
    )
  )

  const mutation = useMutation({
    mutationFn: () =>
      createUser({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        full_name: fullName.trim() || undefined,
        password,
        role: selectedRoles[0],
        roles: selectedRoles,
        project_ids: needsProjects ? selectedProjects : [],
        must_change_password: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      reset()
      setOpen(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't create this account."))
    },
  })

  function reset() {
    setFullName("")
    setUsername("")
    setEmail("")
    setPhone("")
    setPassword(generatePassword())
    setSelectedRoles([])
    setSelectedProjects([])
    setError(null)
    mutation.reset()
  }

  function submit() {
    setError(null)
    if (!username.trim() || !email.trim() || !password) {
      setError("Username, email and password are required.")
      return
    }
    if (selectedRoles.length === 0) {
      setError("Choose at least one role.")
      return
    }
    if (needsProjects && selectedProjects.length === 0) {
      setError("Choose at least one project for the project-scoped role.")
      return
    }
    mutation.mutate()
  }

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create staff account</DialogTitle>
          <DialogDescription>
            The account can hold several roles. Access is the union of every
            selected role&apos;s permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">Full name</Label>
              <Input
                id="new-user-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-username">Username</Label>
              <Input
                id="new-user-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="jane"
                autoCapitalize="none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@chrysolyt.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-phone">Phone (optional)</Label>
              <Input
                id="new-user-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254..."
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-user-password">Temporary password</Label>
            <div className="flex gap-2">
              <Input
                id="new-user-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Generate password"
                onClick={() => setPassword(generatePassword())}
              >
                <RefreshCw aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this with the user. They will be asked to change it on
              first sign-in.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Roles</Label>
            {roles.isPending ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : roles.isError ? (
              <p className="text-sm text-destructive">Could not load roles.</p>
            ) : (
              <RoleMultiSelect
                roles={roles.data ?? []}
                value={selectedRoles}
                onChange={setSelectedRoles}
                disabled={mutation.isPending}
                idPrefix="new-user-role"
              />
            )}
          </div>

          {needsProjects ? (
            <div className="grid gap-2">
              <Label>Project access</Label>
              {projects.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading projects…
                </p>
              ) : (
                <ProjectMultiSelect
                  projects={projects.data ?? []}
                  value={selectedProjects}
                  onChange={setSelectedProjects}
                  disabled={mutation.isPending}
                />
              )}
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
              onClick={() => setOpen(false)}
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
                  Creating
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
