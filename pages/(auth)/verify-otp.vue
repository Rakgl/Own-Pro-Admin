<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  PinInput,
  PinInputGroup,
  PinInputInput,
} from '@/components/ui/pin-input'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'blank',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/dashboard',
  },
})

const router = useRouter()
const route = useRoute()

// Logic
const email = (route.query.email as string) || 'your email'
const value = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const countdown = ref(0)
let timer: any = null

function startCountdown(seconds = 60) {
  countdown.value = seconds
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else if (timer) clearInterval(timer)
  }, 1000)
}

onMounted(() => startCountdown(30))
onUnmounted(() => { if (timer) clearInterval(timer) })

async function handleVerify() {
  const otpCode = value.value.join('')
  if (otpCode.length !== 6) {
    error.value = 'Please enter a valid 6-digit code.'
    return
  }
  loading.value = true
  error.value = null

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success('Verification successful!')
    router.push('/login')
  } catch (e: any) {
    error.value = e.message || 'Invalid code.'
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (countdown.value > 0 || loading.value) return
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Code resent!')
    startCountdown(60)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden bg-background">
    
    <div class="relative hidden lg:block bg-muted">
      <img
        src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=2000"
        alt="Security"
        class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent p-12 flex flex-col justify-end">
         <div class="space-y-2">
            <h2 class="text-white text-2xl font-semibold">{{ $t('nav.authentication') }}</h2>
            <p class="text-zinc-300 max-w-md">"We take security seriously. Verify your identity to access your dashboard."</p>
         </div>
      </div>
    </div>

    <div class="flex items-center justify-center py-12 px-6 lg:px-12">
      <div class="mx-auto grid w-full max-w-[400px] gap-6">
        
        <NuxtLink to="/" class="flex items-center gap-2 font-medium self-center lg:self-start">
          <div class="h-6 w-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon name="lucide:gallery-vertical-end" class="size-4" />
          </div>
          Management System
        </NuxtLink>

        <div class="flex flex-col text-center lg:text-left space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">Check your email</h1>
          <p class="text-sm text-muted-foreground">
            We sent a code to <span class="font-medium text-foreground">{{ email }}</span>
          </p>
        </div>

        <form @submit.prevent="handleVerify" class="grid gap-6">
          <div class="flex justify-center lg:justify-start">
            <PinInput
              id="otp-input"
              v-model="value"
              placeholder="○"
              class="flex gap-2 items-center"
              otp
              type="number"
              :disabled="loading"
            >
              <PinInputGroup class="gap-2">
                <PinInputInput
                  v-for="(id, index) in 6"
                  :key="id"
                  :index="index"
                  class="h-12 w-12 border rounded-md text-center text-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
                />
              </PinInputGroup>
            </PinInput>
          </div>

          <Button type="submit" class="w-full h-11 text-base" :disabled="loading || value.length < 6">
            <Icon v-if="loading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Verifying...' : 'Verify Code' }}
          </Button>

          <div v-if="error" class="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-center text-xs text-destructive font-medium flex items-center justify-center gap-2">
            <Icon name="lucide:alert-circle" class="h-4 w-4" />
            {{ error }}
          </div>

          <div class="text-center text-sm">
            <p class="text-muted-foreground">
              Didn't receive the code? 
              <button 
                type="button" 
                class="underline underline-offset-4 hover:text-primary font-medium disabled:opacity-50 transition-colors"
                :disabled="countdown > 0 || loading"
                @click="handleResend"
              >
                {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code' }}
              </button>
            </p>
          </div>
        </form>

        <div class="text-center text-sm text-muted-foreground">
          <NuxtLink to="/login" class="flex items-center justify-center gap-2 hover:text-foreground">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            Back to Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>