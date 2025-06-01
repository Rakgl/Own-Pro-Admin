<script setup lang="ts">
import { cn } from '@/lib/utils';
// import { Switch } from '@/components/ui/switch'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toTypedSchema } from '@vee-validate/zod';
import { ref, onMounted } from 'vue';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

import { toast } from '~/components/ui/toast';
import { useApi } from '@/composables/useApi';

const username = ref('Loading...');
const userId = ref<string | null>(null);

const isLoading = ref(false);
const apiError = ref<string | null>(null);

// --- New refs for password visibility ---
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);

const accountFormSchema = toTypedSchema(
  z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters.' })
      .optional()
      .or(z.literal('')),
  })
);

// --- New functions to toggle password visibility ---
function toggleCurrentPasswordVisibility() {
  showCurrentPassword.value = !showCurrentPassword.value;
}

function toggleNewPasswordVisibility() {
  showNewPassword.value = !showNewPassword.value;
}

onMounted(async () => {
  isLoading.value = true;
  apiError.value = null;
  try {
    const api = useApi();
    const response = await api('auth/get-user');

    if (response && response.success && response.data) {
      const userData = response.data;
      username.value = userData.username || 'N/A';
      userId.value = userData.id;
    } else {
      const errorMessage =
        response?.message ||
        'Failed to load user data. API response was not successful or data was missing.';
      apiError.value = errorMessage;
      username.value = 'Error loading username';
      userId.value = null;
      toast({
        title: 'Load Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  } catch (err: any) {
    console.error('API call to auth/get-user failed:', err);
    let errorMessage = 'An unexpected error occurred while fetching user data.';

    if (err && err.response && err.response.data && err.response.data.message) {
      errorMessage = err.response.data.message;
    } else if (err && err.message) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    apiError.value = errorMessage;
    username.value = 'Error loading username';
    userId.value = null;
    toast({
      title: 'API Error',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    isLoading.value = false;
  }
});

async function onSubmit(values: z.infer<typeof accountFormSchema>) {
  if (!userId.value) {
    toast({
      title: 'Error',
      description: 'User ID is missing. Cannot update password. Please refresh.',
      variant: 'destructive',
    });
    return;
  }

  isLoading.value = true;

  const passwordPayload = {
    current_password: values.currentPassword,
    new_password: values.newPassword,
  };

  try {
    const api = useApi();
    const response = await api(`/users/change-password/${userId.value}`, {
      method: 'PUT',
      body: passwordPayload,
    });

    if (response && response.data && response.success) {
      toast({
        title: 'Success!',
        description: response.data.message || 'Password updated successfully.',
      });
      // Optionally reset form or clear password fields after successful update
      // For example, by resetting vee-validate form if you have a handle to it
      // or manually clearing componentField.value if needed, though often not required
      // for password change forms.
    } else {
      let errorMessage = 'Could not update password.';
      if (response && response.data && typeof response.data.message === 'string') {
        errorMessage = response.data.message;
      } else if (response && typeof response.message === 'string') {
        errorMessage = response.message;
      }
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  } catch (error: any) {
    console.error('Password update failed:', error);

    let toastTitle = 'Error';
    let toastMessage = 'An unexpected error occurred during password update.';

    if (error && error.data && typeof error.data.message === 'string') {
      toastMessage = error.data.message;
      toastTitle = 'Update Failed';
    } else if (
      error &&
      error.response &&
      error.response.data &&
      typeof error.response.data.message === 'string'
    ) {
      const errorData = error.response.data;
      toastMessage = errorData.message;
      toastTitle = 'Update Failed';
    } else if (error && typeof error.message === 'string') {
      toastMessage = error.message;
      if (error.statusCode) {
        toastTitle = `Error ${error.statusCode}`;
      }
    } else if (typeof error === 'string') {
      toastMessage = error;
    }

    toast({
      title: toastTitle,
      description: toastMessage,
      variant: 'destructive',
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-lg font-medium">Account</h3>
        <p class="text-sm text-muted-foreground">Change the details of your profile here.</p>
      </div>
    </div>
    <Separator />
    <Form :validation-schema="accountFormSchema" class="space-y-8 mt-6" @submit="onSubmit">
      <FormField name="username_display">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input
              type="text"
              :model-value="username"
              readonly
              placeholder="Your username"
              class="bg-muted/50"
            />
          </FormControl>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="currentPassword">
        <FormItem>
          <FormLabel>Current Password</FormLabel>
          <div class="relative w-full">
            <FormControl>
              <Input
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="Current Password"
                v-bind="componentField"
                class="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground"
              @click="toggleCurrentPasswordVisibility"
              :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'"
              tabindex="-1"
            >
              <svg
                v-if="!showCurrentPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="newPassword">
        <FormItem>
          <FormLabel>New Password</FormLabel>
          <div class="relative w-full">
            <FormControl>
              <Input
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="New Password"
                v-bind="componentField"
                class="pr-10"
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground"
              @click="toggleNewPasswordVisibility"
              :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
              tabindex="-1"
            >
              <svg
                v-if="!showNewPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex justify-start">
        <Button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Updating Account...' : 'Update Account' }}
        </Button>
      </div>
    </Form>
  </div>
</template>

<style scoped>
/* Style for the read-only input to better match the image */
.bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.5); /* Using HSL variables from ShadCN */
}
.dark .bg-muted\/50 {
  background-color: hsl(var(--muted) / 0.2); /* Adjust opacity for dark mode if needed */
}

/*
  Removed custom checkbox styles (.form-checkbox) as they were not used in the template.
  Removed explicit dark mode styles for input[type="text"] and input[type="password"]
  as ShadCN/Vue's Input component should handle dark mode styling intrinsically
  when the dark theme is active globally (e.g. <html class="dark">).
  If your inputs are not styled correctly in dark mode,
  please ensure your TailwindCSS and ShadCN theme configuration is set up properly.
*/
</style>
