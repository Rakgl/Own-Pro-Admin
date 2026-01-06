export default defineNuxtRouteMiddleware((to, from) => {
  const { hasRole } = useAuthPermission()

  if (!hasRole('Admin') && !hasRole('Developer')) {
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You do not have the required "Admin" or "Developer" role.',
    }))
  }
})
