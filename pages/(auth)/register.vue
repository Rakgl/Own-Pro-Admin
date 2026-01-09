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
        alt="Register Preview"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent p-12 flex flex-col justify-end">
         <div class="space-y-2">
            <h2 class="text-white text-2xl font-semibold">Join Our Community</h2>
            <p class="text-zinc-300 max-w-md">"Create an account today and start streamlining your business workflows with our advanced tools."</p>
         </div>
      </div>
    </div>

    <div class="flex items-center justify-center py-12 px-6 lg:px-12">
      <div class="mx-auto grid w-full max-w-[400px] gap-6">
        
        <div class="flex flex-col text-center lg:text-left space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p class="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>

        <AuthSignUp />

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
          
          <p class="px-8 text-center text-xs text-muted-foreground leading-relaxed">
            By clicking continue, you agree to our
            <a href="/terms" class="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>
            and
            <a href="/privacy" class="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>.
          </p>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Scoped styles can be added here if needed */
</style>