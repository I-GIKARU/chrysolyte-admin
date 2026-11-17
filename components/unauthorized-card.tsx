"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getHomeNavItem } from "@/lib/navigation"
import { useAuth } from "@/providers/auth-provider"

/** Shown in place of a page the signed-in user may not open. */
export function UnauthorizedCard({ area }: { area: string }) {
  const { permissions } = useAuth()
  const home = getHomeNavItem(permissions)

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-md items-center text-center">
        <CardHeader className="w-full items-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-destructive-muted text-destructive">
            <ShieldAlert aria-hidden="true" className="size-7" />
          </div>
          <CardTitle className="font-heading text-xl font-bold">
            Unauthorized access
          </CardTitle>
          <CardDescription className="text-balance">
            Your account does not have permission to view {area}. Ask a director
            to update your role or project access.
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href={home.href}>Back to {home.title.toLowerCase()}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
