"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ProjectOption } from "@/lib/api/projects"

interface ProjectMultiSelectProps {
  projects: ProjectOption[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

/** Project access checklist for project-scoped staff. */
export function ProjectMultiSelect({
  projects,
  value,
  onChange,
  disabled,
}: ProjectMultiSelectProps) {
  function toggle(id: string, checked: boolean) {
    onChange(
      checked
        ? value.includes(id)
          ? value
          : [...value, id]
        : value.filter((project) => project !== id)
    )
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3.5 py-3 text-sm text-muted-foreground">
        No projects are available yet.
      </p>
    )
  }

  return (
    <div className="max-h-48 overflow-y-auto rounded-xl border bg-card">
      {projects.map((project) => {
        const checked = value.includes(project.project_id)
        return (
          <label
            key={project.project_id}
            className={cn(
              "flex cursor-pointer items-start gap-3 border-b px-3.5 py-2.5 last:border-b-0",
              checked ? "bg-primary/5" : "hover:bg-muted/50",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={(event) =>
                toggle(project.project_id, event.target.checked)
              }
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
              <span className="text-sm font-semibold">{project.name}</span>
              <span className="text-xs text-muted-foreground">
                {project.project_id} · {project.status}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
