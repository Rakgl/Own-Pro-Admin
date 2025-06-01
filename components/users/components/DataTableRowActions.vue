<script setup lang="ts">
import type { Row } from '@tanstack/vue-table';
import type { User } from '../data/schema';
import { ref, computed, watch, defineEmits } from 'vue'; // Added defineEmits

// Shadcn-vue components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast/use-toast';

// Assume useApi is a composable providing an API client instance
// e.g., import { useApi } from '@/composables/useApi';

interface UserRowActionsProps {
  row: Row<User>;
}

const props = defineProps<UserRowActionsProps>();
const emit = defineEmits(['refreshData']); // Define emit for refreshing data

const { hasPermission } = useAuthPermission();

const { toast } = useToast();
const apiInstance = useApi(); // Make sure useApi() is correctly set up
const user = computed(() => props.row.original);

// Edit Dialog States
const isEditDialogOpen = ref(false);
const isLoadingUser = ref(false); // Shared loading state for edit and delete
const editError = ref<string | null>(null);
const userToEdit = ref<EditableUserData | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const avatarFileInput = ref<HTMLInputElement | null>(null);
const availableRoles = ref<RoleData[]>([]);
const isLoadingRoles = ref(false);

// Delete Alert Dialog State
const isDeleteDialogOpen = ref(false);

interface RoleData {
  id: string | number;
  name: string;
}

interface EditableUserData {
  id: string | number;
  name: string;
  username: string;
  email?: string;
  status: boolean;
  role_id?: string | number | null;
  password?: string;
  confirm_password?: string;
  avatar_url?: string | null;
  avatar_file?: File | null;
  [key: string]: any;
}

interface GetUserApiResponseData {
  id: string | number;
  name: string;
  username: string;
  email?: string;
  status: string | boolean;
  role_id?: string | number;
  avatar_url?: string; // Ensure backend uses 'avatar_url' or map 'image' to it
  image?: string; // Potentially from backend
  [key: string]: any;
}

interface GetUserApiResponse {
  data: GetUserApiResponseData;
}

interface UpdateUserApiResponse {
  success: boolean;
  data: Partial<GetUserApiResponseData>;
  message?: string;
}

// --- (fetchAvailableRoles, openEditDialog, triggerAvatarFileInput, handleImageFileChange, clearOrRevertAvatarChange, isSaveDisabled, handleSaveChanges remain the same) ---
const fetchAvailableRoles = async () => {
  isLoadingRoles.value = true;
  try {
    const response = await apiInstance<RoleData[]>('/roles/active', { method: 'GET' });
    if (response && Array.isArray(response)) {
      availableRoles.value = response;
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      availableRoles.value = (response as any).data;
    } else {
      console.error('Failed to load roles: Invalid response structure.', response);
      availableRoles.value = [];
    }
  } catch (error) {
    console.error('Error fetching roles:', error);
    toast({ title: 'Error', description: 'Could not load roles.', variant: 'destructive' });
    availableRoles.value = [];
  } finally {
    isLoadingRoles.value = false;
  }
};

const openEditDialog = async () => {
  if (!user.value || typeof user.value.id === 'undefined') {
    editError.value = 'User ID is missing.';
    isEditDialogOpen.value = true;
    return;
  }
  isEditDialogOpen.value = true;
  isLoadingUser.value = true;
  editError.value = null;
  userToEdit.value = null;
  imagePreviewUrl.value = null;
  if (avatarFileInput.value) avatarFileInput.value.value = '';

  await fetchAvailableRoles();

  try {
    const response = await apiInstance<GetUserApiResponse>(`/users/edit/${user.value.id}`, {
      method: 'GET',
    });
    if (response && response.data) {
      const fetchedData = response.data;
      userToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name,
        username: fetchedData.username || '',
        email: fetchedData.email || '',
        status:
          typeof fetchedData.status === 'string'
            ? fetchedData.status.toUpperCase() === 'ACTIVE'
            : Boolean(fetchedData.status),
        role_id: fetchedData.role_id || null,
        avatar_url: fetchedData.avatar_url || fetchedData.image || null,
        avatar_file: null,
        password: '',
        confirm_password: '',
      };
      imagePreviewUrl.value = fetchedData.avatar_url || fetchedData.image || null;
    } else {
      editError.value = 'Failed to load user details: Invalid response structure.';
    }
  } catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.';
  } finally {
    isLoadingUser.value = false;
  }
};

const triggerAvatarFileInput = () => {
  avatarFileInput.value?.click();
};

const handleImageFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && userToEdit.value) {
    userToEdit.value.avatar_file = file;
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};

const clearOrRevertAvatarChange = () => {
  if (userToEdit.value) {
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }
    userToEdit.value.avatar_file = null;
    imagePreviewUrl.value = userToEdit.value.avatar_url || null;
    if (avatarFileInput.value) {
      avatarFileInput.value.value = '';
    }
  }
};

const isSaveDisabled = computed(() => {
  if (isLoadingUser.value || isLoadingRoles.value || !userToEdit.value) {
    return true;
  }
  if (
    !userToEdit.value.name.trim() ||
    !userToEdit.value.username.trim() ||
    userToEdit.value.role_id === null ||
    userToEdit.value.role_id === undefined
  ) {
    return true;
  }
  if (
    userToEdit.value.password &&
    userToEdit.value.password !== userToEdit.value.confirm_password
  ) {
    return true;
  }
  if (userToEdit.value.password && userToEdit.value.password.length < 6) {
    return true;
  }
  return false;
});

const handleSaveChanges = async () => {
  if (!userToEdit.value || userToEdit.value.id === undefined) {
    editError.value = 'No user data to save.';
    return;
  }
  // ... (rest of validation logic remains the same)
  if (!userToEdit.value.name.trim()) {
    editError.value = 'Name is required.';
    return;
  }
  if (!userToEdit.value.username.trim()) {
    editError.value = 'Username is required.';
    return;
  }
  if (userToEdit.value.role_id === null || userToEdit.value.role_id === undefined) {
    editError.value = 'Role is required.';
    return;
  }
  if (userToEdit.value.password) {
    if (userToEdit.value.password.length < 6) {
      editError.value = 'Password must be at least 6 characters long.';
      return;
    }
    if (userToEdit.value.password !== userToEdit.value.confirm_password) {
      editError.value = 'Passwords do not match.';
      return;
    }
  }
  editError.value = null;
  isLoadingUser.value = true;

  const formData = new FormData();
  formData.append('name', userToEdit.value.name);
  formData.append('username', userToEdit.value.username);
  if (userToEdit.value.email) {
    formData.append('email', userToEdit.value.email);
  }
  formData.append('status', userToEdit.value.status ? 'ACTIVE' : 'INACTIVE');
  formData.append('role_id', String(userToEdit.value.role_id));

  if (userToEdit.value.password) {
    formData.append('password', userToEdit.value.password);
  }

  if (userToEdit.value.avatar_file) {
    formData.append('image', userToEdit.value.avatar_file);
  } else if (userToEdit.value.avatar_url === null) {
    // If avatar_url was explicitly cleared (not just reverted)
    formData.append('image', ''); // Send empty string to indicate removal if backend supports
  }
  // If avatar_file is null and avatar_url exists, don't send 'image' field to keep existing image

  try {
    const response = await apiInstance<UpdateUserApiResponse>(
      `/users/update-user/${userToEdit.value.id}`, // Ensure this route expects POST and handles FormData
      {
        method: 'POST', // Laravel typically uses POST with _method: 'PUT' or a dedicated PUT route for updates with FormData
        body: formData,
      }
    );

    if (response.success && response.data) {
      // Ensure response.data.avatar_url is used if available
      const newAvatarUrl =
        response.data.avatar_url ||
        (userToEdit.value.avatar_file ? imagePreviewUrl.value : userToEdit.value.avatar_url);

      const updatedUserData = {
        ...props.row.original,
        ...response.data,
        avatar_url: newAvatarUrl,
        status: userToEdit.value.status, // Ensure local status aligns with what was sent
      };

      // If backend returns status as string, ensure it's correctly mapped for local state
      if (typeof response.data.status === 'string') {
        updatedUserData.status = response.data.status.toUpperCase() === 'ACTIVE';
      }

      Object.assign(props.row.original, updatedUserData); // Update the row data directly

      if (response.data.avatar_url) {
        // If backend returned a new avatar URL (e.g., after upload)
        userToEdit.value.avatar_url = response.data.avatar_url;
        imagePreviewUrl.value = response.data.avatar_url; // update preview to new persisted URL
        userToEdit.value.avatar_file = null; // clear staged file
        if (avatarFileInput.value) avatarFileInput.value.value = ''; // reset file input
      } else if (userToEdit.value.avatar_file) {
        // If a new file was uploaded but backend didn't return a new URL (e.g. error or direct storage)
        // We might need to refresh the user data or assume the local preview (blob) is okay for now
        // For simplicity, if `response.data.avatar_url` is not there, we keep the current `imagePreviewUrl`
        // which could be a blob if a new file was selected.
      }

      isEditDialogOpen.value = false;
      toast({
        title: 'User Updated Successfully!',
        description: `The user ${userToEdit.value.name} has been updated.`,
      });
      emit('refreshData'); // Also emit refresh on edit if necessary, or rely on Object.assign
    } else {
      editError.value = response.message || 'Failed to save changes.';
    }
  } catch (error: any) {
    editError.value =
      error.data?.message || error.message || 'An unexpected error occurred while saving.';
  } finally {
    isLoadingUser.value = false;
  }
};

/**
 * Handles the user deletion confirmation.
 * Makes an API call to the backend to delete the user.
 */
const confirmDeleteUser = async () => {
  if (!user.value || typeof user.value.id === 'undefined') {
    toast({
      title: 'Error',
      description: 'User ID is missing. Cannot delete.',
      variant: 'destructive',
    });
    isDeleteDialogOpen.value = false; // Close dialog if ID is missing
    return;
  }

  isLoadingUser.value = true;
  try {
    // Your Laravel backend's `destroy` method is mapped via Route::resource,
    // so a DELETE request to /users/{id} will trigger it.
    // It expects { success: boolean, message: string } in response.
    const response = await apiInstance<{ success: boolean; message: string }>(
      `/users/${user.value.id}`,
      { method: 'DELETE' }
    );

    if (response.success) {
      toast({
        title: 'User Deleted',
        description: response.message || `User "${user.value.name}" has been successfully deleted.`,
      });
      isDeleteDialogOpen.value = false; // Close the dialog on successful deletion
      emit('refreshData'); // Notify the parent component to refresh its data list
    } else {
      toast({
        title: 'Deletion Failed',
        description: response.message || 'Could not delete the user. Please try again.',
        variant: 'destructive',
      });
      // Optionally, keep the dialog open if deletion failed but was handled by backend
      // isDeleteDialogOpen.value = false;
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    // Try to extract a meaningful error message
    let errorMessage = 'An unexpected error occurred during deletion.';
    if (error && error.data && error.data.message) {
      errorMessage = error.data.message;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    toast({
      title: 'Deletion Error',
      description: errorMessage,
      variant: 'destructive',
    });
    // Keep dialog open for network/unexpected errors, allowing user to retry or cancel.
  } finally {
    isLoadingUser.value = false; // Reset loading state
  }
};

watch(isEditDialogOpen, (newValue) => {
  if (!newValue) {
    // Cleanup for edit dialog
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }
    imagePreviewUrl.value = null;
    userToEdit.value = null;
    editError.value = null;
    availableRoles.value = [];
    if (avatarFileInput.value) {
      avatarFileInput.value.value = '';
    }
  }
});

// Watcher for delete dialog (can be used for cleanup if needed, but usually not necessary for a simple confirm)
watch(isDeleteDialogOpen, (newValue) => {
  if (!newValue) {
    // Optional: any cleanup if dialog is closed without action (e.g. by pressing ESC)
    // isLoadingUser.value = false; // Reset if an action could have left it true
  }
});
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
            />
          </svg>
          <span class="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openEditDialog"> Edit </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          @click="isDeleteDialogOpen = true"
          class="text-red-600 hover:!text-red-600 focus:text-red-600 dark:hover:!text-red-500"
        >
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-3xl md:max-w-4xl rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit User Profile
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update user details. Fields marked with <span class="text-red-500">*</span> are
            required.
          </DialogDescription>
        </DialogHeader>

        <div
          v-if="isLoadingUser && !userToEdit"
          class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading user data...
        </div>
        <div
          v-else-if="editError && !userToEdit"
          class="px-6 py-4 mx-4 my-2 text-sm text-red-700 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
        >
          <strong>Error:</strong> {{ editError }}
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto" v-if="userToEdit">
          <div
            v-if="editError"
            class="mb-4 px-4 py-3 text-sm text-red-700 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
          >
            <strong>Error:</strong> {{ editError }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            <div class="md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
              <Label class="text-sm font-medium text-gray-700 dark:text-gray-300 self-start"
                >User Avatar</Label
              >
              <div class="relative">
                <img
                  v-if="imagePreviewUrl"
                  :src="imagePreviewUrl"
                  alt="Avatar Preview"
                  class="h-32 w-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                />
                <div
                  v-else
                  class="h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600"
                >
                  <svg
                    class="h-16 w-16 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500"
                  @click="triggerAvatarFileInput"
                  :disabled="isLoadingUser"
                  aria-label="Change avatar"
                >
                  <svg
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
                    <path
                      d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v7"
                    />
                    <path d="M12 12a3 3 0 1 1 0-6a3 3 0 0 1 0 6Z" />
                    <path d="m19 16-2 3h4l-2-3Z" />
                  </svg>
                </Button>
              </div>
              <input
                type="file"
                ref="avatarFileInput"
                @change="handleImageFileChange"
                accept="image/*"
                class="hidden"
                :disabled="isLoadingUser"
              />
              <div
                class="flex flex-col sm:flex-row md:flex-col gap-2 w-full items-center md:items-stretch"
              >
                <Button
                  type="button"
                  variant="outline"
                  @click="triggerAvatarFileInput"
                  :disabled="isLoadingUser"
                  class="w-full text-xs sm:text-sm"
                >
                  {{
                    userToEdit.avatar_file
                      ? 'Change Selected'
                      : imagePreviewUrl
                        ? 'Change Avatar'
                        : 'Upload Avatar'
                  }}
                </Button>
                <Button
                  v-if="
                    userToEdit.avatar_file ||
                    (imagePreviewUrl && imagePreviewUrl !== userToEdit.avatar_url)
                  "
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-red-600 hover:!text-red-500 dark:hover:!text-red-400 w-full text-xs sm:text-sm"
                  @click="clearOrRevertAvatarChange"
                  :disabled="isLoadingUser"
                >
                  Revert / Cancel Change
                </Button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center md:text-left">
                Max file size: 2MB. JPG, PNG.
              </p>
            </div>

            <div class="md:col-span-2 space-y-4">
              <div>
                <Label for="userFullNameEdit" class="block text-sm font-medium mb-1">
                  Name <span class="text-red-500">*</span>
                </Label>
                <Input
                  id="userFullNameEdit"
                  v-model="userToEdit.name"
                  placeholder="Enter full name"
                  :disabled="isLoadingUser"
                />
              </div>

              <div>
                <Label for="userUsernameEdit" class="block text-sm font-medium mb-1">
                  Username <span class="text-red-500">*</span>
                </Label>
                <Input
                  id="userUsernameEdit"
                  v-model="userToEdit.username"
                  placeholder="Enter username"
                  :disabled="isLoadingUser"
                />
              </div>

              <div>
                <Label for="userEmailEdit" class="block text-sm font-medium mb-1">Email</Label>
                <Input
                  id="userEmailEdit"
                  type="email"
                  v-model="userToEdit.email"
                  placeholder="Enter email"
                  :disabled="isLoadingUser"
                />
              </div>

              <div>
                <Label for="userRoleEdit" class="block text-sm font-medium mb-1">
                  Role <span class="text-red-500">*</span>
                </Label>
                <div v-if="isLoadingRoles" class="text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Loading roles...
                </div>
                <Select
                  v-else-if="availableRoles.length > 0"
                  v-model="userToEdit.role_id"
                  :disabled="isLoadingUser || isLoadingRoles"
                >
                  <SelectTrigger
                    id="userRoleEdit"
                    :class="{ 'border-red-500': !userToEdit.role_id && !isLoadingRoles }"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Roles</SelectLabel>
                      <SelectItem
                        v-for="role in availableRoles"
                        :key="role.id"
                        :value="String(role.id)"
                      >
                        {{ role.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p v-else class="text-sm text-red-500 dark:text-red-400 pt-2">
                  No roles available. A role is required to save.
                </p>
              </div>

              <div class="flex items-center justify-between pt-2">
                <Label for="userStatusEdit" class="text-sm font-medium">Status</Label>
                <div class="flex items-center space-x-2">
                  <Switch
                    id="userStatusEdit"
                    :checked="userToEdit.status"
                    @update:checked="(newVal: boolean) => (userToEdit!.status = newVal)"
                    :disabled="isLoadingUser"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{
                    userToEdit.status ? 'ACTIVE' : 'INACTIVE'
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Update Password <span class="text-sm font-normal text-gray-500">(optional)</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label for="newPasswordEdit" class="block text-sm font-medium mb-1"
                  >New Password</Label
                >
                <Input
                  id="newPasswordEdit"
                  type="password"
                  v-model="userToEdit.password"
                  placeholder="Min. 6 characters"
                  :disabled="isLoadingUser"
                />
              </div>
              <div>
                <Label for="confirmNewPasswordEdit" class="block text-sm font-medium mb-1"
                  >Confirm New Password</Label
                >
                <Input
                  id="confirmNewPasswordEdit"
                  type="password"
                  v-model="userToEdit.confirm_password"
                  placeholder="Confirm password"
                  :disabled="isLoadingUser"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter
          class="px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-lg bg-gray-50 dark:bg-slate-800"
        >
          <Button
            type="button"
            @click="handleSaveChanges"
            :disabled="isSaveDisabled || isLoadingUser || isLoadingRoles"
          >
            <svg
              v-if="isLoadingUser"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isLoadingUser ? 'Saving...' : 'Save Changes' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            @click="isEditDialogOpen = false"
            :disabled="isLoadingUser || isLoadingRoles"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the user "{{ user.name }}" as deleted. This typically makes the
            user inactive and may restrict their access or visibility. This can usually be undone by
            an administrator.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLoadingUser">Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDeleteUser"
            class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            :disabled="isLoadingUser"
          >
            <svg
              v-if="isLoadingUser"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isLoadingUser ? 'Deleting...' : 'Yes, delete user' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
