export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, hasPermission } = useAuthPermission()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }

  const requiredPermission = to.meta.requiredPermission as string | undefined

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: `Forbidden: Requires permission '${requiredPermission}'.`,
    }))
  }
})
