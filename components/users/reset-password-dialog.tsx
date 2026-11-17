"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader, RefreshCw } from "lucide-react"

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
import { resetUserPassword, usersQueryKey } from "@/lib/api/users"
import type { AuthUser } from "@/lib/types/auth"

function generatePassword() {
  return `Cel-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}!`
}

interface Props {
  user: AuthUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({ user, open, onOpenChange }: Props) {
  if (!open) return null
  return <ResetPasswordForm user={user} onOpenChange={onOpenChange} />
}

function ResetPasswordForm({ user, onOpenChange }: Omit<Props, "open">) {
  const [password, setPassword] = useState(generatePassword)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => resetUserPassword(user.user_id, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKey })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(getErrorMessage(err, "We couldn't reset this password."))
    },
  })

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reset {user.full_name || user.username}&apos;s password
          </DialogTitle>
          <DialogDescription>
            The user will be asked to change this password on their next
            sign-in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="reset-user-password">New temporary password</Label>
          <div className="flex gap-2">
            <Input
              id="reset-user-password"
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
        </div>

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
            disabled={mutation.isPending || password.length < 8}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader aria-hidden="true" className="animate-spin" />
                Resetting
              </span>
            ) : (
              "Reset password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
