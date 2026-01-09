<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { theme, radius } = useCustomize()

useHead({
  bodyAttrs: {
    class: computed(() => `theme-${theme.value}`),
    style: computed(() => `--radius: ${radius.value}rem;`),
  },
})

const handleError = () => clearError({ redirect: '/' })
const handleBack = () => useRouter().back()
</script>

<template>
  <div class="h-svh">
    <div class="m-auto h-full w-full flex flex-col items-center justify-center gap-2">
      <h1 class="text-[7rem] font-bold leading-tight">
        {{ error.statusCode }}
      </h1>
      <span class="font-medium">{{ error.statusMessage || 'Oops! Something went wrong!' }}</span>
      <p class="text-center text-muted-foreground">
        It seems like the page you're looking for <br>
        does not exist or might have been removed.
      </p>
      <div class="mt-6 flex gap-4">
        <Button variant="outline" @click="handleBack">
          Go Back
        </Button>
        <Button @click="handleError">
          Back to Home
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
