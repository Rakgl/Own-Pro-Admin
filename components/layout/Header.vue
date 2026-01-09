<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { locale, defaultLocale } = useI18n()

function setLinks() {
  // Always start with the localized Home
  const homeLink = { title: 'Home', href: localePath('/') }

  // Get the path without query params
  const currentPath = route.path
  
  // Split into segments
  let segments = currentPath.split('/').filter(item => item !== '')

  // Remove the locale segment if it's the current locale and not the default (assuming prefix strategy)
  // Or simply check if the first segment matches the current locale
  if (segments.length > 0 && segments[0] === locale.value) {
    segments.shift()
  }

  // If we are at root (or just locale root), return just Home
  if (segments.length === 0) {
    return [homeLink]
  }

  const breadcrumbs = segments.map((item, index) => {
    const str = item.replace(/-/g, ' ')
    const title = str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Reconstruct the logical path (without locale)
    const logicalPath = `/${segments.slice(0, index + 1).join('/')}`
    
    return {
      title,
      href: localePath(logicalPath),
    }
  })

  return [homeLink, ...breadcrumbs]
}

const links = ref<{
  title: string
  href: string
}[]>(setLinks())

// Watch both fullPath and locale to update breadcrumbs
watch(() => [route.fullPath, locale.value], () => {
  links.value = setLinks()
})
</script>

<template>
  <header class="sticky top-0 z-10 h-53px flex items-center gap-4 border-b bg-background px-4 md:px-6">
    <div class="w-full flex items-center gap-4">
      <SidebarTrigger />
      <Separator orientation="vertical" class="h-4" />
      <BaseBreadcrumbCustom :links="links" />
    </div>
    <div class="ml-auto flex items-center gap-2">
      <slot />
      <DarkToggle />
    </div>
  </header>
</template>

<style scoped>

</style>
