import { axiosInstance } from "@/lib/axios"

export const projectOptionsQueryKey = ["projects", "options"] as const

export interface ProjectOption {
  project_id: string
  name: string
  status: string
}

export async function fetchProjectOptions() {
  const response =
    await axiosInstance.get<ProjectOption[]>("/projects/projects")
  return response.data
}
