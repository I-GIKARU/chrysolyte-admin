import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import type { LoginFormValues } from "@/lib/types/auth"
import { useAuth } from "@/providers/auth-provider"
import { getHomePath } from "@/lib/navigation"

interface LoginOptions {
  data: LoginFormValues
}

/** Signs the user in through the auth provider, then opens the dashboard. */
export function useLogin() {
  const { login } = useAuth()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ data }: LoginOptions) => login(data),
    onSuccess: (identity) => {
      router.replace(
        identity.user.must_change_password
          ? "/profile"
          : getHomePath(identity.permissions)
      )
    },
  })
}
