"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisVertical,
  KeyRound,
  LockOpen,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EditUserRolesDialog } from "@/components/users/edit-user-roles-dialog"
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getErrorMessage } from "@/lib/api/errors"
import {
  deleteUser,
  disableUser,
  enableUser,
  unlockUser,
  usersQueryKey,
} from "@/lib/api/users"
import type { AuthUser } from "@/lib/types/auth"
import { useAuth } from "@/providers/auth-provider"

type Action = "disable" | "enable" | "unlock" | "delete"

export function UserActions({ user }: { user: AuthUser }) {
  const { user: currentUser, hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [rolesOpen, setRolesOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSelf = currentUser?.user_id === user.user_id
  const canUpdate = hasPermission("auth:users:update")
  const canDelete = hasPermission("auth:users:delete")
  const canAssignRoles = hasPermission("auth:users:roles")
  // The API protects every account holding the `*` wildcard; no one can edit,
  // disable or delete a director account from this screen.
  const outranked = user.roles?.includes("director") || user.role === "director"

  const mutation = useMutation({
    mutationFn: (pending: Action) => {
      if (pending === "disable") return disableUser(user.user_id)
      if (pending === "enable") return enableUser(user.user_id)
      if (pending === "unlock") return unlockUser(user.user_id)
      return deleteUser(user.user_id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      setAction(null)
      setError(null)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't update this account."))
    },
  })

  function open(next: Action) {
    setError(null)
    mutation.reset()
    setAction(next)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${user.full_name || user.username}`}
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {canAssignRoles ? (
            <>
              <DropdownMenuItem
                disabled={outranked}
                onSelect={() => setRolesOpen(true)}
              >
                <ShieldCheck aria-hidden="true" />
                Edit roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem
            disabled={user.active}
            onSelect={() => open("enable")}
          >
            <UserRoundCheck aria-hidden="true" />
            Enable account
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.active || isSelf || outranked}
            onSelect={() => open("disable")}
          >
            <UserRoundX aria-hidden="true" />
            Disable account
          </DropdownMenuItem>
          {user.is_locked ? (
            <DropdownMenuItem onSelect={() => open("unlock")}>
              <LockOpen aria-hidden="true" />
              Unlock account
            </DropdownMenuItem>
          ) : null}
          {canUpdate ? (
            <DropdownMenuItem
              disabled={outranked}
              onSelect={() => setResetOpen(true)}
            >
              <KeyRound aria-hidden="true" />
              Reset password
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSelf || outranked}
                onSelect={() => open("delete")}
              >
                <Trash2 aria-hidden="true" />
                Delete account
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserRolesDialog
        user={user}
        open={rolesOpen}
        onOpenChange={setRolesOpen}
      />
      <ResetPasswordDialog
        user={user}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(next) => {
          if (!next && !mutation.isPending) {
            setAction(null)
            setError(null)
          }
        }}
        title={
          action === "delete"
            ? `Delete ${user.full_name || user.username}?`
            : action === "disable"
              ? `Disable ${user.full_name || user.username}?`
              : action === "enable"
                ? `Enable ${user.full_name || user.username}?`
                : "Unlock this account?"
        }
        description={
          action === "delete"
            ? "This permanently removes the account. Their audit history is kept."
            : action === "disable"
              ? "They will be signed out and cannot sign in until re-enabled."
              : action === "enable"
                ? "They will be able to sign in again."
                : "Clears the failed sign-in lock so they can try again."
        }
        confirmLabel={
          action === "delete"
            ? "Delete account"
            : action === "disable"
              ? "Disable account"
              : action === "enable"
                ? "Enable account"
                : "Unlock account"
        }
        pendingLabel="Saving"
        destructive={action === "delete" || action === "disable"}
        isPending={mutation.isPending}
        error={error}
        onConfirm={() => action && mutation.mutate(action)}
      />
    </>
  )
}
