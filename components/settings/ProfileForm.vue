<script setup lang="ts">
import { cn } from '@/lib/utils'; // Assuming this utility exists
import { toTypedSchema } from '@vee-validate/zod';
// import { FieldArray, useForm } from 'vee-validate'; // FieldArray not used in this snippet
import { useForm } from 'vee-validate';
import { h, ref, onMounted, computed } from 'vue'; // h not used directly
import * as z from 'zod';
import { toast } from '~/components/ui/toast'; // Assuming this composable exists
import { useApi } from '~/composables/useApi'; // Import your useApi composable

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
    image: z.string().optional(), // Avatar image URL or base64 data URL
    avatarFallbackColor: z.string().optional(), // Stores the selected Tailwind CSS background class for fallback
    language: z.string().optional(), // Added language field
  })
);

const defaultFormValues = {
  userId: '',
  name: '',
  username: '',
  email: '',
  bio: 'I own a computer.',
  urls: [{ value: 'https://shadcn.com' }, { value: 'http://twitter.com/shadcn' }],
  image: '',
  avatarFallbackColor: '', // e.g., 'bg-blue-500' or empty for default gray
  language: 'en', // Default language to English
};

// Define language options
const languageOptions = ref([
  { value: 'en', label: 'English' },
  { value: 'km', label: 'ភាសាខ្មែរ (Khmer)' }, // Added Khmer
]);

// Predefined fallback colors for initials
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
  {
    name: 'Cyan to Blue',
    bgClass: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    textClass: 'text-white',
  },
  {
    name: 'Pink to Purple',
    bgClass: 'bg-gradient-to-r from-pink-500 to-purple-600',
    textClass: 'text-white',
  },
  {
    name: 'Lime to Green',
    bgClass: 'bg-gradient-to-r from-lime-400 to-green-600',
    textClass: 'text-white',
  },
  {
    name: 'Orange to Red',
    bgClass: 'bg-gradient-to-r from-orange-400 to-red-600',
    textClass: 'text-white',
  },
  {
    name: 'Teal to Sky',
    bgClass: 'bg-gradient-to-br from-teal-400 to-sky-600',
    textClass: 'text-white',
  },
  {
    name: 'Amber to Orange',
    bgClass: 'bg-gradient-to-br from-amber-400 to-orange-500',
    textClass: 'text-neutral-800',
  },
]);

const { handleSubmit, resetForm, setValues, values, setFieldValue } = useForm({
  validationSchema: profileFormSchema,
  initialValues: { ...defaultFormValues },
});

const isLoading = ref(true);
const apiError = ref<string | null>(null);
const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const showAvatarOptions = ref(false);

const avatarPreview = computed(() => {
  const imageValue = values.image;
  if (typeof imageValue === 'string' && imageValue.trim() !== '') {
    return { type: 'image', src: imageValue };
  }
  return null;
});

const userInitials = computed(() => {
  const name = values.name || '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const currentFallbackStyle = computed(() => {
  const selectedColor = predefinedFallbackColors.value.find(
    (c) => c.bgClass === values.avatarFallbackColor
  );
  if (selectedColor && !selectedColor.isDefault) {
    return { bg: selectedColor.bgClass, text: selectedColor.textClass };
  }
  return {
    bg: 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
  };
});

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast({
      title: 'Invalid File',
      description: 'Please select an image file.',
      variant: 'destructive',
    });
    return;
  }
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    toast({
      title: 'File Too Large',
      description: 'Please select an image smaller than 5MB.',
      variant: 'destructive',
    });
    return;
  }

  isUploading.value = true;
  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setFieldValue('image', base64String);
      showAvatarOptions.value = false;
      toast({ title: 'Image Ready', description: 'Image selected and ready for profile update.' });
    };
    reader.onerror = () => {
      toast({
        title: 'Read Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  } catch (error: any) {
    toast({
      title: 'Processing Failed',
      description: error.message || 'Failed to process image.',
      variant: 'destructive',
    });
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
};

const selectFallbackColor = (color: {
  name: string;
  bgClass: string;
  textClass: string;
  isDefault?: boolean;
}) => {
  setFieldValue('avatarFallbackColor', color.bgClass);
  setFieldValue('image', ''); // Clear any image
  toast({
    title: 'Fallback Color Selected',
    description: `${color.name} color chosen for initials.`,
  });
};

const removeAvatar = () => {
  setFieldValue('image', '');
  showAvatarOptions.value = false;
  toast({
    title: 'Avatar Image Removed',
    description:
      'Avatar image has been removed. Fallback color or default will be used for initials.',
  });
};

onMounted(async () => {
  isLoading.value = true;
  apiError.value = null;
  try {
    const api = useApi();
    const response = await api('auth/get-user');

    if (response && response.success && response.data) {
      const userData = response.data;
      setValues({
        userId: userData.id,
        name: userData.name || defaultFormValues.name,
        username: userData.username || defaultFormValues.username,
        email:
          userData.email !== undefined && userData.email !== null
            ? userData.email
            : defaultFormValues.email,
        bio: (userData as any).bio || defaultFormValues.bio,
        urls: (userData as any).urls || defaultFormValues.urls,
        image: (userData as any).image || defaultFormValues.image,
        avatarFallbackColor:
          (userData as any).avatar_fallback_color || defaultFormValues.avatarFallbackColor,
        language: (userData as any).language || defaultFormValues.language, // Load user language
      });
    } else {
      const errorMessage = response?.message || 'Failed to load user data.';
      apiError.value = errorMessage;
      resetForm({ values: { ...defaultFormValues, userId: '' } });
      toast({ title: 'Load Error', description: errorMessage, variant: 'destructive' });
    }
  } catch (err: any) {
    console.error('API call to auth/get-user failed:', err);
    const errorMessage = err.message || 'An unexpected error occurred.';
    apiError.value = errorMessage;
    resetForm({ values: { ...defaultFormValues, userId: '' } });
    toast({ title: 'API Error', description: errorMessage, variant: 'destructive' });
  } finally {
    isLoading.value = false;
  }
});

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error('Invalid data URL: MIME type not found');
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const onSubmit = handleSubmit(async (formValues) => {
  if (!formValues.userId) {
    toast({ title: 'Error', description: 'User ID is missing.', variant: 'destructive' });
    return;
  }
  isUploading.value = true; // Use isUploading for the submit button as well
  const userId = formValues.userId;
  try {
    const formData = new FormData();
    formData.append('name', formValues.name || '');
    formData.append('username', formValues.username || '');
    formData.append('email', formValues.email || '');
    formData.append('bio', formValues.bio || '');
    (formValues.urls || []).forEach((url, index) => {
      if (url.value) {
        formData.append(`urls[${index}][value]`, url.value);
      }
    });
    formData.append('avatar_fallback_color', formValues.avatarFallbackColor || '');
    formData.append('language', formValues.language || defaultFormValues.language); // Add language to form data

    if (typeof formValues.image === 'string' && formValues.image.startsWith('data:image')) {
      const imageBlob = dataURLtoBlob(formValues.image);
      const extension = imageBlob.type.split('/')[1] || 'png';
      formData.append('image', imageBlob, `avatar.${extension}`);
    } else if (formValues.image) {
      // If it's a URL (already uploaded), send it as is or handle as per your API needs
      // For now, assuming if it's not a data URL and exists, it's a URL to be kept or re-sent.
      // If your backend expects an empty string or a specific signal for "no change" vs "remove", adjust here.
      // If `formValues.image` could be an existing URL that doesn't need to be re-uploaded with user profile update,
      // you might not need to append it unless it changed.
      // This example assumes you always send the current image value.
      formData.append('image', formValues.image);
    } else {
      formData.append('image', ''); // Explicitly send empty if no image
    }

    const api = useApi();
    const response = await api(`/users/update-profile/${userId}`, {
      method: 'POST',
      body: formData,
    });

    if (response && response.success) {
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      if (response.data) {
        if (response.data.image_url !== undefined) {
          setFieldValue('image', response.data.image_url);
        }
        if (response.data.avatar_fallback_color !== undefined) {
          setFieldValue('avatarFallbackColor', response.data.avatar_fallback_color);
        }
        if (response.data.language !== undefined) {
          // Update language from response
          setFieldValue('language', response.data.language);
        }
      }
    } else {
      throw new Error(response?.message || 'Failed to update profile.');
    }
  } catch (error: any) {
    toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
  } finally {
    isUploading.value = false;
  }
});
</script>

<template>
  <div v-if="isLoading" class="py-8 text-center">
    <p>Loading profile data...</p>
    <div
      class="mt-2 inline-block w-8 h-8 animate-spin rounded-full border-4 border-current border-t-transparent text-blue-600"
      role="status"
    >
      <span class="sr-only">Loading...</span>
    </div>
  </div>
  <div v-else-if="apiError" class="py-8 text-center text-red-500">
    <p>Error loading profile: {{ apiError }}</p>
    <Button @click="onMounted" variant="outline" class="mt-4">Retry</Button>
  </div>
  <form v-else class="space-y-8" @submit.prevent="onSubmit">
    <FormField v-slot="{ field }" name="image">
      <FormItem>
        <FormLabel>Profile Picture</FormLabel>
        <FormControl>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div
                v-if="!avatarPreview"
                :class="
                  cn(
                    'w-20 h-20 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 hover:scale-105',
                    currentFallbackStyle.bg,
                    currentFallbackStyle.text
                  )
                "
              >
                {{ userInitials }}
              </div>
              <div
                v-else-if="avatarPreview && avatarPreview.type === 'image'"
                class="w-20 h-20 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <img
                  :src="avatarPreview.src"
                  :alt="values.name || 'Profile picture'"
                  class="w-full h-full object-cover"
                  @error="
                    (e) => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/80x80/E0E0E0/B0B0B0?text=${userInitials}`;
                    }
                  "
                />
              </div>
            </div>

            <div class="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="showAvatarOptions = !showAvatarOptions"
                :disabled="isUploading"
                class="transition-all duration-200 hover:scale-105"
              >
                {{
                  values.image || values.avatarFallbackColor
                    ? 'Change Appearance'
                    : 'Set Appearance'
                }}
              </Button>
              <Button
                v-if="values.image"
                type="button"
                variant="ghost"
                size="sm"
                @click="removeAvatar"
                :disabled="isUploading"
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 hover:scale-105"
              >
                Remove Image
              </Button>
            </div>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            class="hidden"
            @change="handleFileUpload"
            :disabled="isUploading"
          />
        </FormControl>

        <div
          v-if="showAvatarOptions"
          class="mt-4 p-4 sm:p-6 border rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg"
        >
          <div class="space-y-6">
            <div class="space-y-3">
              <h4 class="font-semibold text-md sm:text-lg flex items-center gap-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Upload Custom Image
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="fileInputRef?.click()"
                :disabled="isUploading"
                class="transition-all duration-300 hover:scale-105 hover:shadow-md w-full sm:w-auto"
              >
                <svg
                  v-if="!isUploading"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-4 h-4 mr-2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <div
                  v-if="isUploading"
                  class="inline-block w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></div>
                {{ isUploading ? 'Processing...' : 'Choose File' }}
              </Button>
              <p class="text-xs text-muted-foreground">
                Supports JPG, PNG, GIF, WEBP. Max file size: 5MB.
              </p>
            </div>

            <div class="space-y-3">
              <h4 class="font-semibold text-md sm:text-lg flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Or Select an Initials Background Color
              </h4>
              <div class="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-10 gap-2">
                <button
                  v-for="color in predefinedFallbackColors"
                  :key="color.name"
                  type="button"
                  :class="
                    cn(
                      'w-9 h-9 rounded-full shadow-md transition-all duration-150 ease-in-out',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900',
                      color.bgClass ||
                        'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
                      values.avatarFallbackColor === color.bgClass
                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110 shadow-lg'
                        : 'ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:scale-105 hover:shadow-md'
                    )
                  "
                  @click="selectFallbackColor(color)"
                  :aria-label="`Select ${color.name} background`"
                  :disabled="isUploading"
                  :title="color.name"
                ></button>
              </div>
            </div>
          </div>
        </div>

        <FormDescription>
          Upload an image or choose a background color for your initials.
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>Display Name</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Your display name" v-bind="componentField" />
        </FormControl>
        <FormDescription>
          This is your public display name. (Used for initials if no image)
        </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="you@example.com" v-bind="componentField" />
        </FormControl>
        <FormDescription> Your primary email address. </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="language">
      <FormItem>
        <FormLabel>Preferred Language</FormLabel>
        <Select
          @update:modelValue="(value) => setFieldValue('language', value)"
          :defaultValue="values.language"
        >
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
        <FormDescription> Choose your preferred language for the interface. </FormDescription>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="flex justify-start gap-2 pt-4">
      <Button type="submit" :disabled="isUploading">
        <span
          v-if="isUploading"
          class="inline-block w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></span>
        {{ isUploading ? 'Updating...' : 'Update Profile' }}
      </Button>

      <Button
        type="button"
        variant="outline"
        @click="
          () =>
            resetForm({
              values: {
                ...defaultFormValues,
                userId: values.userId || '',
                language: values.language || defaultFormValues.language,
              },
            })
        "
        :disabled="isUploading"
      >
        Reset Form
      </Button>
    </div>
  </form>
</template>

<style scoped>
/* Tailwind CSS handles most styling. */
.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
