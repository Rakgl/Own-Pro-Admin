<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { toast } from '~/components/ui/toast'
import { useApi } from '~/composables/useApi'

/**
 * 1. I18N SETUP
 * We use setLocale to trigger the global language change across the whole app.
 */
const { setLocale, locale: currentAppLocale } = useI18n()

const profileFormSchema = toTypedSchema(
  z.object({
    userId: z.string(),
    name: z
      .string()
      .min(2, { message: 'Display name must be at least 2 characters.' })
      .max(50, { message: 'Display name must not be longer than 50 characters.' }),
    username: z
      .string()
      .min(2, { message: 'Login username must be at least 2 characters.' })
      .max(30, { message: 'Login username must not be longer than 30 characters.' }),
    email: z
      .union([z.literal(''), z.string().email({ message: 'Please enter a valid email address.' })])
      .optional(),
    image: z.string().optional(),
    avatarFallbackColor: z.string().optional(),
    language: z.string().optional(),
  }),
)

const defaultFormValues = {
  userId: '',
  name: '',
  username: '',
  email: '',
  bio: 'I own a computer.',
  urls: [{ value: 'https://shadcn.com' }, { value: 'http://twitter.com/shadcn' }],
  image: '',
  avatarFallbackColor: '',
  language: 'en',
}

const languageOptions = ref([
  { value: 'en', label: 'English' },
  { value: 'kh', label: 'ភាសាខ្មែរ (Khmer)' },
])

const predefinedFallbackColors = ref([
  { name: 'Default', bgClass: '', textClass: 'text-gray-600 dark:text-gray-300', isDefault: true },
  { name: 'Slate', bgClass: 'bg-slate-500', textClass: 'text-white' },
  { name: 'Red', bgClass: 'bg-red-500', textClass: 'text-white' },
  { name: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-white' },
  { name: 'Amber', bgClass: 'bg-amber-400', textClass: 'text-neutral-800' },
  { name: 'Lime', bgClass: 'bg-lime-400', textClass: 'text-neutral-800' },
  { name: 'Green', bgClass: 'bg-green-500', textClass: 'text-white' },
  { name: 'Teal', bgClass: 'bg-teal-500', textClass: 'text-white' },
  { name: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-white' },
  { name: 'Sky', bgClass: 'bg-sky-500', textClass: 'text-white' },
  { name: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-white' },
  { name: 'Indigo', bgClass: 'bg-indigo-500', textClass: 'text-white' },
  { name: 'Violet', bgClass: 'bg-violet-500', textClass: 'text-white' },
  { name: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-white' },
  { name: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-white' },
  { name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-white' },
  { name: 'Cyan to Blue', bgClass: 'bg-gradient-to-r from-cyan-500 to-blue-500', textClass: 'text-white' },
  { name: 'Pink to Purple', bgClass: 'bg-gradient-to-r from-pink-500 to-purple-600', textClass: 'text-white' },
  { name: 'Lime to Green', bgClass: 'bg-gradient-to-r from-lime-400 to-green-600', textClass: 'text-white' },
  { name: 'Orange to Red', bgClass: 'bg-gradient-to-r from-orange-400 to-red-600', textClass: 'text-white' },
  { name: 'Teal to Sky', bgClass: 'bg-gradient-to-br from-teal-400 to-sky-600', textClass: 'text-white' },
  { name: 'Amber to Orange', bgClass: 'bg-gradient-to-br from-amber-400 to-orange-500', textClass: 'text-neutral-800' },
])

const { handleSubmit, resetForm, setValues, values, setFieldValue } = useForm({
  validationSchema: profileFormSchema,
  initialValues: { ...defaultFormValues },
})

const isLoading = ref(true)
const apiError = ref<string | null>(null)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showAvatarOptions = ref(false)

const avatarPreview = computed(() => {
  const imageValue = values.image
  if (typeof imageValue === 'string' && imageValue.trim() !== '') {
    return { type: 'image', src: imageValue }
  }
  return null
})

const userInitials = computed(() => {
  const name = values.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const currentFallbackStyle = computed(() => {
  const selectedColor = predefinedFallbackColors.value.find(c => c.bgClass === values.avatarFallbackColor)
  if (selectedColor && !selectedColor.isDefault) {
    return { bg: selectedColor.bgClass, text: selectedColor.textClass }
  }
  return {
    bg: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
  }
})

/**
 * 2. SYNC ON LOAD
 * Fetches user data and ensures the app locale matches the DB preference.
 */
onMounted(async () => {
  isLoading.value = true
  apiError.value = null
  try {
    const api = useApi()
    const response = await api('auth/get-user')

    if (response && response.success && response.data) {
      const userData = response.data
      setValues({
        userId: userData.id,
        name: userData.name || defaultFormValues.name,
        username: userData.username || defaultFormValues.username,
        email: userData.email || defaultFormValues.email,
        bio: (userData as any).bio || defaultFormValues.bio,
        urls: (userData as any).urls || defaultFormValues.urls,
        image: (userData as any).image || defaultFormValues.image,
        avatarFallbackColor: (userData as any).avatar_fallback_color || defaultFormValues.avatarFallbackColor,
        language: (userData as any).language || defaultFormValues.language,
      })

      // Update global app language if it doesn't match the DB
      if (userData.language && currentAppLocale.value !== userData.language) {
        await setLocale(userData.language)
      }
    }
    else {
      apiError.value = response?.message || 'Failed to load user data.'
    }
  }
  catch (err: any) {
    apiError.value = err.message || 'An unexpected error occurred.'
  }
  finally {
    isLoading.value = false
  }
})

// --- FILE HELPERS ---
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return

  isUploading.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    setFieldValue('image', e.target?.result as string)
    showAvatarOptions.value = false
  }
  reader.readAsDataURL(file)
  isUploading.value = false
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch) throw new Error('Invalid data URL')
  const mime = mimeMatch[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

function selectFallbackColor(color: any) {
  setFieldValue('avatarFallbackColor', color.bgClass)
  setFieldValue('image', '')
}

function removeAvatar() {
  setFieldValue('image', '')
  showAvatarOptions.value = false
}

/**
 * 3. SUBMIT LOGIC
 * Updates Laravel and triggers the app-wide language change.
 */
const onSubmit = handleSubmit(async (formValues) => {
  if (!formValues.userId) {
    toast({ title: 'Error', description: 'User ID is missing.', variant: 'destructive' })
    return
  }
  isUploading.value = true
  
  try {
    const formData = new FormData()
    formData.append('name', formValues.name || '')
    formData.append('username', formValues.username || '')
    formData.append('email', formValues.email || '')
    formData.append('avatar_fallback_color', formValues.avatarFallbackColor || '')
    
    // Send selected language to Laravel
    formData.append('language', formValues.language || 'en') 

    // Handle Image
    if (typeof formValues.image === 'string' && formValues.image.startsWith('data:image')) {
      const imageBlob = dataURLtoBlob(formValues.image)
      formData.append('image', imageBlob, 'avatar.png')
    } else if (formValues.image) {
      formData.append('image', formValues.image)
    } else {
      formData.append('image', '')
    }

    const api = useApi()
    const response = await api(`/users/update-profile/${formValues.userId}`, {
      method: 'POST',
      body: formData,
    })

    if (response && response.success) {
      // ✅ CRITICAL FIX: Update Global Language immediately
      if (formValues.language) {
        await setLocale(formValues.language)
        
        // Ensure the cookie is updated so refresh/navigation works
        const i18nCookie = useCookie('i18n_redirected')
        i18nCookie.value = formValues.language
      }

      toast({ title: 'Success', description: 'Profile and language updated successfully!' })
      
      if (response.data) {
        if (response.data.image_url) setFieldValue('image', response.data.image_url)
        if (response.data.language) setFieldValue('language', response.data.language)
      }
    }
    else {
      throw new Error(response?.message || 'Failed to update profile.')
    }
  }
  catch (error: any) {
    toast({ title: 'Update Failed', description: error.message, variant: 'destructive' })
  }
  finally {
    isUploading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="py-8 text-center">
    <p>Loading profile data...</p>
    <div class="mt-2 inline-block h-8 w-8 animate-spin border-4 border-current border-t-transparent rounded-full text-blue-600" />
  </div>

  <div v-else-if="apiError" class="py-8 text-center text-red-500">
    <p>Error: {{ apiError }}</p>
    <Button variant="outline" class="mt-4" @click="onMounted">Retry</Button>
  </div>

  <form v-else class="space-y-8" @submit.prevent="onSubmit">
    
    <FormField v-slot="{ field }" name="image">
      <FormItem>
        <FormLabel>Profile Picture</FormLabel>
        <FormControl>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div v-if="!avatarPreview" :class="cn('w-20 h-20 rounded-full flex items-center justify-center font-semibold text-lg', currentFallbackStyle.bg, currentFallbackStyle.text)">
                {{ userInitials }}
              </div>
              <div v-else class="h-20 w-20 overflow-hidden rounded-full">
                <img :src="avatarPreview.src" class="h-full w-full object-cover">
              </div>
            </div>
            <div class="flex flex-col space-y-2">
              <Button type="button" variant="outline" size="sm" @click="showAvatarOptions = !showAvatarOptions">
                {{ values.image || values.avatarFallbackColor ? 'Change Appearance' : 'Set Appearance' }}
              </Button>
              <Button v-if="values.image" type="button" variant="ghost" size="sm" class="text-red-500" @click="removeAvatar">Remove Image</Button>
            </div>
          </div>
          <input ref="fileInputRef" type="file" class="hidden" @change="handleFileUpload">
        </FormControl>

        <div v-if="showAvatarOptions" class="mt-4 border rounded-xl p-4 shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div class="space-y-6">
            <Button type="button" variant="outline" size="sm" @click="fileInputRef?.click()">Choose Custom File</Button>
            <div class="grid grid-cols-7 gap-2 lg:grid-cols-10 md:grid-cols-9 sm:grid-cols-8">
              <button
                v-for="color in predefinedFallbackColors"
                :key="color.name"
                type="button"
                :class="cn('w-9 h-9 rounded-full border shadow-sm transition-all', color.bgClass || 'bg-gray-200', values.avatarFallbackColor === color.bgClass ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105')"
                @click="selectFallbackColor(color)"
              />
            </div>
          </div>
        </div>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>Display Name</FormLabel>
        <FormControl><Input v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl><Input v-bind="componentField" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="language">
      <FormItem>
        <FormLabel>Preferred Language</FormLabel>
        <Select :model-value="values.language" @update:model-value="(v) => setFieldValue('language', v)">
          <FormControl>
            <SelectTrigger :disabled="isUploading">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem v-for="lang in languageOptions" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>The app language will change immediately after you save.</FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex gap-2">
      <Button type="submit" :disabled="isUploading">
        {{ isUploading ? 'Updating...' : 'Update Profile' }}
      </Button>
      <Button type="button" variant="outline" @click="() => resetForm()">Reset Form</Button>
    </div>
  </form>
</template>