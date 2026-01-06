<script setup lang="ts">
import { useAuth } from '#imports'
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'blank',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
})

const { signIn } = useAuth()
const router = useRouter() // Make sure this is available
const route = useRoute() // Make sure this is availables

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
      { callbackUrl: (route.query.callbackUrl as string) || '/' },
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
  <LayoutAuth>
    <div class="h-full w-full flex flex-col items-center justify-center p-4 lg:p-8 sm:p-6">
      <div
        class="max-w-md w-full rounded-xl bg-card p-6 text-card-foreground shadow-2xl space-y-6 md:p-10"
      >
        <div class="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold tracking-tight">
            Login!!!
          </h1>
          <p class="text-balance text-sm text-muted-foreground">
            Welcome back! Please enter your credentials.
          </p>
        </div>

        <form class="grid gap-6" @submit.prevent="handleAdminLogin">
          <div>
            <label for="username" class="mb-1.5 block text-sm text-muted-foreground font-medium">
              Username
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="text"
              placeholder="e.g., adminuser"
              required
              class="block w-full border border-input rounded-lg bg-background px-4 py-2.5 text-sm shadow-sm disabled:cursor-not-allowed focus:border-ring disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
            >
          </div>

          <div class="relative">
            <input
              id="password"
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="block w-full border border-input rounded-lg bg-background px-4 py-2.5 pr-12 text-sm shadow-sm disabled:cursor-not-allowed focus:border-ring disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Toggle password visibility"
              @click="togglePasswordVisibility"
            >
              <svg
                v-if="showPassword"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="h-5 w-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="mt-2 h-11 w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground font-semibold ring-offset-background transition-colors disabled:pointer-events-none hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
          >
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>

          <p v-if="error" class="pt-1 text-center text-sm text-destructive">
            {{ error }}
          </p>
        </form>
      </div>
    </div>
  </LayoutAuth>
</template>

<style scoped>
/* The <style scoped> section remains the same as the previous version. */
.bg-card {
  background-color: hsl(var(--card, 0 0% 100%));
}
.text-card-foreground {
  color: hsl(var(--card-foreground, 222.2 47.4% 11.2%));
}
.border-input {
  border-color: hsl(var(--input));
}
.bg-background {
  background-color: hsl(var(--background));
}
.text-muted-foreground {
  color: hsl(var(--muted-foreground));
}
.ring-ring {
  box-shadow:
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--ring));
}
.bg-primary {
  background-color: hsl(var(--primary));
}
.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
/* .hover\:bg-primary\/90:hover {
  background-color: hsla(var(--primary), 0.9);
} */
.text-destructive {
  color: hsl(var(--destructive, 0 84.2% 60.2%));
}
</style>
