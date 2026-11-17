"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { Role } from "@/lib/types/rbac"

interface RoleMultiSelectProps {
  roles: Role[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  idPrefix?: string
}

/** Check-list of every role in the database. A user may hold several. */
export function RoleMultiSelect({
  roles,
  value,
  onChange,
  disabled,
  idPrefix = "role",
}: RoleMultiSelectProps) {
  function toggle(name: string, checked: boolean) {
    onChange(
      checked
        ? value.includes(name)
          ? value
          : [...value, name]
        : value.filter((role) => role !== name)
    )
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border bg-card">
      {roles.map((role) => {
        const id = `${idPrefix}-${role.name}`
        const checked = value.includes(role.name)
        return (
          <label
            key={role.name}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 border-b px-3.5 py-3 last:border-b-0",
              checked ? "bg-primary/5" : "hover:bg-muted/50",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input
              id={id}
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={(event) => toggle(role.name, event.target.checked)}
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              )}
            >
              {checked ? <Check className="size-3.5" /> : null}
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold">{role.label}</span>
              <span className="text-xs text-muted-foreground">
                {role.description || role.name}
                {role.is_project_scoped ? " · project-scoped" : ""}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
