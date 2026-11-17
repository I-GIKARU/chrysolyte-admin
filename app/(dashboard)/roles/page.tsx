import type { Metadata } from "next"

import { RolesView } from "@/components/roles/roles-view"

export const metadata: Metadata = {
  title: "Roles · Chrysolyte FirmControl",
}

export default function RolesPage() {
  return <RolesView />
}
