<script setup lang="ts">
import { useAuth } from '#imports'
import { reactive, ref } from 'vue'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

definePageMeta({
  layout: 'blank',
      auth: {
      unauthenticatedOnly: true,
      navigateAuthenticatedTo: '/dashboard',
    },
  })
  
  const { signIn } = useAuth()
  const router = useRouter()
  const route = useRoute()
  
  const credentials = reactive({
    username: '',
    password: '',
  })
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  async function handleAdminLogin() {
    loading.value = true
    error.value = null
  
    try {
      const result = await signIn(
        { ...credentials },
        { callbackUrl: (route.query.callbackUrl as string) || '/dashboard' },
      )
  
      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          error.value = 'Invalid username or password.'
        }
        else if (typeof result.error === 'string') {
          error.value = result.error
        }
        else {
          error.value = 'Login failed. Please check your credentials.'
        }
      } else {
        await router.push('/dashboard')
      }
  }
  catch (e: any) {
    console.error('Admin login exception:', e)
    if (e.data?.message) {
      error.value = e.data.message
    }
    else if (e.message) {
      error.value = e.message
    }
    else {
      error.value = 'Login failed due to a network or server issue.'
    }
  }
  finally {
    loading.value = false
  }
}

const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden bg-background">

    <div class="relative hidden lg:block bg-muted">
      <img
        src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=2000"
        alt="Dashboard Preview"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent p-12 flex flex-col justify-end">
         <div class="space-y-2">
            <h2 class="text-white text-2xl font-semibold">Management System</h2>
            <p class="text-zinc-300 max-w-md">"Streamlining your workflows with a modern administrative interface designed for efficiency."</p>
         </div>
      </div>
    </div>

    <div class="flex items-center justify-center py-12 px-6 lg:px-12">
      <div class="mx-auto grid w-full max-w-[400px] gap-6">

        <div class="grid gap-2 text-center lg:text-left">
          <h1 class="text-3xl font-bold tracking-tight text-center lg:text-left">Welcome back !!!</h1>
          <p class="text-muted-foreground text-sm">
            Welcome back! Please enter your credentials.
          </p>
        </div>

        <form class="grid gap-6" @submit.prevent="handleAdminLogin">
          <div class="grid gap-4">

            <div class="grid gap-2">
              <label for="username" class="text-sm font-medium leading-none">
                Username
              </label>
              <Input
                id="username"
                v-model="credentials.username"
                type="text"
                placeholder="e.g., adminuser"
                required
                class="h-11"
              />
            </div>

            <div class="grid gap-2">
              <div class="flex items-center">
                <label for="password" class="text-sm font-medium leading-none">
                  Password
                </label>
                <NuxtLink to="/forgot-password" class="ml-auto text-xs underline-offset-2 hover:underline text-primary">
                  Forgot password?
                </NuxtLink>
              </div>
              <div class="relative">
                <Input
                  id="password"
                  v-model="credentials.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  class="h-11 pr-12"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  @click="togglePasswordVisibility"
                >
                  <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-5 w-5" />
                </button>
              </div>
            </div>

            <Button type="submit" class="w-full h-11 text-base" :disabled="loading">
              <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </Button>

            <div v-if="error" class="p-3 rounded-md bg-destructive/10 border border-destructive/20">
               <p class="text-center text-xs text-destructive font-medium">
                {{ error }}
              </p>
            </div>

          </div>
        </form>

        <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span class="relative z-10 bg-background px-2 text-muted-foreground text-xs uppercase">
            Or continue with
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Button variant="outline" type="button" class="h-11">
            <Icon name="logos:google-icon" class="mr-2 size-4" />
            Google
          </Button>
          <Button variant="outline" type="button" class="h-11">
            <Icon name="logos:apple" class="mr-2 size-4" />
            Apple
          </Button>
        </div>

        <div class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink to="/register" class="underline underline-offset-4 hover:text-primary">Sign up</NuxtLink>
        </div>
      </div>
    </div>

  </div>
</template>