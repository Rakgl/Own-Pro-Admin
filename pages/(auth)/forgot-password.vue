<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/dashboard',
  },
})
</script>

<template>
  <div class="h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden bg-background">
    
    <div class="relative hidden lg:block bg-muted">
      <img
        src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=2000"
        alt="Reset Password Preview"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent p-12 flex flex-col justify-end">
         <div class="space-y-2">
            <h2 class="text-white text-2xl font-semibold">{{ $t('nav.items.account_recovery') }}</h2>
            <p class="text-zinc-300 max-w-md">"Don't worry, we'll help you get back into your account safely and quickly."</p>
         </div>
      </div>
    </div>

    <div class="flex items-center justify-center py-12 px-6 lg:px-12">
      <div class="mx-auto grid w-full max-w-[400px] gap-6">
        
        <NuxtLink to="/" class="flex items-center gap-2 font-medium self-center lg:self-start">
          <div class="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon name="lucide:gallery-vertical-end" class="size-4" />
          </div>
          BIJOU System
        </NuxtLink>

        <div class="flex flex-col text-center lg:text-left space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">
            {{ $t('nav.items.account_recovery') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            Enter your email below to reset your password
          </p>
        </div>

        <AuthForgotPassword />

        <div class="space-y-4">
          <p class="text-center text-sm text-muted-foreground">
            Already have an account?
            <NuxtLink
              to="/login"
              class="underline underline-offset-4 hover:text-primary font-medium"
            >
              Login
            </NuxtLink>
          </p>
        </div>

      </div>
    </div>

  </div>
</template>