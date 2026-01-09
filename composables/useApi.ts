export function useApi() {
  const config = useRuntimeConfig()
  const adminApiBase = config.public.apiBase
  const { token } = useAuth()

  return $fetch.create({
    baseURL: adminApiBase,
    async onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `${token.value}`,
        }
      }
    },
  })
}
