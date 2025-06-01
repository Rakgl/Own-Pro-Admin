<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { computed, ref, watch } from 'vue';
import { roleStatuses as importedRoleStatuses } from '../data/data'; // Renamed to avoid conflict
import DataTableFacetedFilter from './DataTableFacetedFilter.vue';
import DataTableViewOptions from './DataTableViewOptions.vue';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast/use-toast';
import { Toaster } from '@/components/ui/toast';
// Assuming useApi is a composable like:
// import { useApi } from '@/composables/useApi'; // Adjust path as needed

interface DataTableToolbarProps {
  table: Table<TData>;
  onDataChanged?: () => void;
}

const props = defineProps<DataTableToolbarProps>();
const { toast } = useToast();
const api = useApi(); // Ensure useApi is correctly defined and imported/available

// ---- Existing Toolbar States and Logic ----
const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);
const localSearchValue = ref<string>(
  (props.table.getColumn('name')?.getFilterValue() as string) ?? ''
);
let debounceTimer: number | undefined;

watch(localSearchValue, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue);
  }, 300);
});

watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue;
    } else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = '';
    }
  }
);

// ---- Create New Role Dialog States & Logic ----
const isNewRoleDialogOpen = ref(false);
const newRoleData = ref({
  name: '',
  status: 'ACTIVE', // Default status
  description: '',
});
const isLoadingSaveRole = ref(false);
const createRoleError = ref<string | null>(null);

watch(isNewRoleDialogOpen, (isOpen) => {
  if (isOpen) {
    newRoleData.value = { name: '', status: 'ACTIVE', description: '' };
    createRoleError.value = null;
  }
});

const isSaveRoleDisabled = computed(() => {
  if (isLoadingSaveRole.value) return true;
  if (!newRoleData.value.name.trim()) return true;
  if (!newRoleData.value.status) return true;
  return false;
});

const handleCreateRole = async () => {
  createRoleError.value = null;
  isLoadingSaveRole.value = true;
  try {
    const response = await api<{ success: boolean; message?: string; data?: any }>('/roles', {
      // Assuming '/roles' is the endpoint for creating roles
      method: 'POST',
      body: newRoleData.value,
    });

    if (!response.success) {
      const errorMessage = response.message || `Failed to create role "${newRoleData.value.name}".`;
      createRoleError.value = errorMessage;
      toast({ title: 'Error Creating Role', description: errorMessage, variant: 'destructive' });
    } else {
      isNewRoleDialogOpen.value = false;
      toast({
        title: 'Role Created Successfully!',
        description: `The role "${newRoleData.value.name}" has been added.`,
      });
      props.onDataChanged?.();
    }
  } catch (error: any) {
    const message =
      error.data?.message || error.message || 'An unexpected network or server error occurred.';
    createRoleError.value = message;
    toast({ title: 'Error Creating Role', description: message, variant: 'destructive' });
  } finally {
    isLoadingSaveRole.value = false;
  }
};

// ---- ✨ Create New User Dialog States & Logic ----
interface RoleData {
  id: string | number;
  name: string;
}

interface CreateUserData {
  name: string;
  username: string;
  email?: string;
  status: boolean;
  role_id?: string | number | null;
  password?: string;
  confirm_password?: string;
  avatar_file?: File | null;
}

const isCreateUserDialogOpen = ref(false);
const isLoadingCreateUser = ref(false);
const createUserError = ref<string | null>(null);
const newUserData = ref<CreateUserData>({
  name: '',
  username: '',
  email: '',
  status: true, // Default to ACTIVE
  role_id: null,
  password: '',
  confirm_password: '',
  avatar_file: null,
});
const createUserImagePreviewUrl = ref<string | null>(null);
const createUserAvatarFileInput = ref<HTMLInputElement | null>(null);
const createUserAvailableRoles = ref<RoleData[]>([]);
const isLoadingCreateUserRoles = ref(false);

const fetchCreateUserRoles = async () => {
  isLoadingCreateUserRoles.value = true;
  try {
    const response = await api<RoleData[]>('/roles/active', { method: 'GET' }); // Assuming '/roles/active' fetches active roles
    if (response && Array.isArray(response)) {
      createUserAvailableRoles.value = response;
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      // Handle cases where data is nested under a 'data' key
      createUserAvailableRoles.value = (response as any).data;
    } else {
      console.error('Failed to load roles for create user: Invalid response structure.', response);
      createUserAvailableRoles.value = [];
    }
  } catch (error) {
    console.error('Error fetching roles for create user:', error);
    toast({
      title: 'Error',
      description: 'Could not load roles for user creation.',
      variant: 'destructive',
    });
    createUserAvailableRoles.value = [];
  } finally {
    isLoadingCreateUserRoles.value = false;
  }
};

const openCreateUserDialog = async () => {
  isCreateUserDialogOpen.value = true;
  isLoadingCreateUser.value = false;
  createUserError.value = null;
  newUserData.value = {
    name: '',
    username: '',
    email: '',
    status: true,
    role_id: null,
    password: '',
    confirm_password: '',
    avatar_file: null,
  };
  if (createUserImagePreviewUrl.value && createUserImagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(createUserImagePreviewUrl.value);
  }
  createUserImagePreviewUrl.value = null;
  if (createUserAvatarFileInput.value) createUserAvatarFileInput.value.value = '';

  await fetchCreateUserRoles();
};

const triggerCreateUserAvatarFileInput = () => {
  createUserAvatarFileInput.value?.click();
};

const handleCreateUserImageFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    newUserData.value.avatar_file = file;
    if (createUserImagePreviewUrl.value && createUserImagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(createUserImagePreviewUrl.value);
    }
    createUserImagePreviewUrl.value = URL.createObjectURL(file);
  }
};

const clearCreateUserAvatarChange = () => {
  if (createUserImagePreviewUrl.value && createUserImagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(createUserImagePreviewUrl.value);
  }
  newUserData.value.avatar_file = null;
  createUserImagePreviewUrl.value = null;
  if (createUserAvatarFileInput.value) {
    createUserAvatarFileInput.value.value = '';
  }
};

const isCreateUserSaveDisabled = computed(() => {
  if (isLoadingCreateUser.value || isLoadingCreateUserRoles.value) {
    return true;
  }
  if (
    !newUserData.value.name.trim() ||
    !newUserData.value.username.trim() ||
    newUserData.value.role_id === null ||
    newUserData.value.role_id === undefined
  ) {
    return true;
  }
  if (
    newUserData.value.password &&
    newUserData.value.password !== newUserData.value.confirm_password
  ) {
    return true;
  }
  if (newUserData.value.password && newUserData.value.password.length < 6) {
    return true;
  }
  return false;
});

const handleCreateUser = async () => {
  if (!newUserData.value.name.trim()) {
    createUserError.value = 'Name is required.';
    return;
  }
  if (!newUserData.value.username.trim()) {
    createUserError.value = 'Username is required.';
    return;
  }
  if (newUserData.value.role_id === null || newUserData.value.role_id === undefined) {
    createUserError.value = 'Role is required.';
    return;
  }
  if (newUserData.value.password) {
    if (newUserData.value.password.length < 6) {
      createUserError.value = 'Password must be at least 6 characters long.';
      return;
    }
    if (newUserData.value.password !== newUserData.value.confirm_password) {
      createUserError.value = 'Passwords do not match.';
      return;
    }
  }
  createUserError.value = null;
  isLoadingCreateUser.value = true;

  const formData = new FormData();
  formData.append('name', newUserData.value.name);
  formData.append('username', newUserData.value.username);
  if (newUserData.value.email) {
    formData.append('email', newUserData.value.email);
  }
  formData.append('status', newUserData.value.status ? 'ACTIVE' : 'INACTIVE');
  formData.append('role_id', String(newUserData.value.role_id));

  if (newUserData.value.password) {
    formData.append('password', newUserData.value.password);
  }

  if (newUserData.value.avatar_file) {
    formData.append('image', newUserData.value.avatar_file); // Ensure your API expects 'image'
  }

  try {
    const response = await api<{ success: boolean; data?: any; message?: string }>('/users', {
      method: 'POST',
      body: formData,
    });

    if (response.success) {
      isCreateUserDialogOpen.value = false;
      toast({
        title: 'User Created Successfully!',
        description: `The user ${newUserData.value.name} has been created.`,
      });
      props.onDataChanged?.(); // Refresh table data
    } else {
      createUserError.value = response.message || 'Failed to create user.';
    }
  } catch (error: any) {
    createUserError.value =
      error.data?.message ||
      error.message ||
      'An unexpected error occurred while creating the user.';
  } finally {
    isLoadingCreateUser.value = false;
  }
};

watch(isCreateUserDialogOpen, (newValue) => {
  if (!newValue) {
    if (createUserImagePreviewUrl.value && createUserImagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(createUserImagePreviewUrl.value);
    }
    createUserImagePreviewUrl.value = null;
    newUserData.value = {
      // Reset form
      name: '',
      username: '',
      email: '',
      status: true,
      role_id: null,
      password: '',
      confirm_password: '',
      avatar_file: null,
    };
    createUserError.value = null;
    createUserAvailableRoles.value = [];
    if (createUserAvatarFileInput.value) {
      createUserAvatarFileInput.value.value = '';
    }
  }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by name..."
          v-model="localSearchValue"
          class="h-8 w-[150px] lg:w-[250px]"
        />

        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          title="Status"
          :options="importedRoleStatuses"
        />

        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-8 px-2 lg:px-3"
          @click="
            () => {
              table.resetColumnFilters();
              localSearchValue = '';
            }
          "
        >
          Reset
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 15 15"
            class="ml-2 h-4 w-4"
          >
            <path
              fill="currentColor"
              d="M3.64 2.27L7.5 6.13l3.84-3.84A.9.9 0 0 1 12.6 2a1 1 0 0 1 1 .96a.9.9 0 0 1-.27.64L8.84 7.5l3.89 3.89A.9.9 0 0 1 13.5 12a1 1 0 0 1-.96 1a.9.9 0 0 1-.64-.27L7.5 8.87l-3.85 3.85A.9.9 0 0 1 2.4 13a1 1 0 0 1-1-.96a.9.9 0 0 1 .27-.64L5.16 7.5L1.27 3.61A.9.9 0 0 1 1 3.01A1 1 0 0 1 2.04 2a.9.9 0 0 1 .6-.27Z"
            ></path>
          </svg>
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isNewRoleDialogOpen">
          <DialogContent class="sm:max-w-[480px] rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create New Role
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Fill in the details for the new role. Fields marked with
                <span class="text-red-500">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            <div
              v-if="createRoleError"
              class="my-3 px-4 py-3 text-sm text-red-700 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
            >
              <strong>Error:</strong> {{ createRoleError }}
            </div>
            <form @submit.prevent="handleCreateRole">
              <div class="grid gap-4 py-4 px-1">
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label
                    for="new-role-name"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300 text-right col-span-1"
                  >
                    Name <span class="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-role-name"
                    v-model="newRoleData.name"
                    class="col-span-3"
                    placeholder="e.g., Administrator"
                    :disabled="isLoadingSaveRole"
                  />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label
                    for="new-role-status"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300 text-right col-span-1"
                  >
                    Status <span class="text-red-500">*</span>
                  </Label>
                  <Select v-model="newRoleData.status" :disabled="isLoadingSaveRole">
                    <SelectTrigger class="col-span-3" id="new-role-status">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="statusOption in importedRoleStatuses"
                        :key="statusOption.value"
                        :value="statusOption.value"
                      >
                        {{ statusOption.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid grid-cols-4 items-start gap-4">
                  <Label
                    for="new-role-description"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300 text-right pt-1 col-span-1"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="new-role-description"
                    v-model="newRoleData.description"
                    class="col-span-3"
                    placeholder="Enter a brief description of the role (optional)"
                    :disabled="isLoadingSaveRole"
                  />
                </div>
              </div>
              <DialogFooter
                class="px-6 py-4 mt-2 sm:flex sm:flex-row-reverse rounded-b-lg bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700"
              >
                <Button type="submit" :disabled="isSaveRoleDisabled">
                  <svg
                    v-if="isLoadingSaveRole"
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
                  {{ isLoadingSaveRole ? 'Saving...' : 'Save Role' }}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  @click="isNewRoleDialogOpen = false"
                  :disabled="isLoadingSaveRole"
                  >Cancel</Button
                >
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog v-model:open="isCreateUserDialogOpen">
          <DialogTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-8 flex items-center"
              @click="openCreateUserDialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                class="mr-2 h-4 w-4"
              >
                <path
                  fill="currentColor"
                  d="M15 6a3 3 0 1 1-6 0a3 3 0 0 1 6 0Zm-3 5a5 5 0 1 0 0-10a5 5 0 0 0 0 10Zm6.006 4.003c.003 0 .003 0 0 0c-2.446-.76-4.445-2.376-5.775-4.642A6.981 6.981 0 0 0 9 9.506a7.012 7.012 0 0 0-6.087 3.557C1.173 16.199.002 19.689 0 22.5a.5.5 0 0 0 .5.5h17a.5.5 0 0 0 .5-.5c0-2.637-1.06-5.26-2.889-7.162l-.001-.002Zm-13.12 5.495A10.948 10.948 0 0 1 3.01 15.07a5.012 5.012 0 0 1 8.98 0a10.947 10.947 0 0 1 2.125 4.428H4.886ZM21 12.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5Zm0-2a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5Zm0 4a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5Z"
                />
              </svg>
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-3xl md:max-w-4xl rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create New User
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Enter the details for the new user. Fields marked with
                <span class="text-red-500">*</span> are required.
              </DialogDescription>
            </DialogHeader>

            <div
              v-if="isLoadingCreateUser && !newUserData.name"
              class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              Loading...
            </div>
            <div
              v-if="createUserError"
              class="m-6 px-4 py-3 text-sm text-red-700 dark:text-red-400 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
            >
              <strong>Error:</strong> {{ createUserError }}
            </div>

            <div class="p-6 max-h-[70vh] overflow-y-auto">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div class="md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                  <Label class="text-sm font-medium text-gray-700 dark:text-gray-300 self-start"
                    >User Avatar</Label
                  >
                  <div class="relative">
                    <img
                      v-if="createUserImagePreviewUrl"
                      :src="createUserImagePreviewUrl"
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
                      @click="triggerCreateUserAvatarFileInput"
                      :disabled="isLoadingCreateUser"
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
                    ref="createUserAvatarFileInput"
                    @change="handleCreateUserImageFileChange"
                    accept="image/*"
                    class="hidden"
                    :disabled="isLoadingCreateUser"
                  />
                  <div
                    class="flex flex-col sm:flex-row md:flex-col gap-2 w-full items-center md:items-stretch"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      @click="triggerCreateUserAvatarFileInput"
                      :disabled="isLoadingCreateUser"
                      class="w-full text-xs sm:text-sm"
                    >
                      {{ newUserData.avatar_file ? 'Change Selected' : 'Upload Avatar' }}
                    </Button>
                    <Button
                      v-if="newUserData.avatar_file || createUserImagePreviewUrl"
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="text-red-600 hover:!text-red-500 dark:hover:!text-red-400 w-full text-xs sm:text-sm"
                      @click="clearCreateUserAvatarChange"
                      :disabled="isLoadingCreateUser"
                    >
                      Clear Avatar
                    </Button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 text-center md:text-left">
                    Max file size: 2MB. JPG, PNG.
                  </p>
                </div>

                <div class="md:col-span-2 space-y-4">
                  <div>
                    <Label for="createUserName" class="block text-sm font-medium mb-1"
                      >Name <span class="text-red-500">*</span></Label
                    >
                    <Input
                      id="createUserName"
                      v-model="newUserData.name"
                      placeholder="Enter full name"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserUsername" class="block text-sm font-medium mb-1"
                      >Username <span class="text-red-500">*</span></Label
                    >
                    <Input
                      id="createUserUsername"
                      v-model="newUserData.username"
                      placeholder="Enter username"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserEmail" class="block text-sm font-medium mb-1"
                      >Email</Label
                    >
                    <Input
                      id="createUserEmail"
                      type="email"
                      v-model="newUserData.email"
                      placeholder="Enter email"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserRole" class="block text-sm font-medium mb-1"
                      >Role <span class="text-red-500">*</span></Label
                    >
                    <div
                      v-if="isLoadingCreateUserRoles"
                      class="text-sm text-gray-500 dark:text-gray-400 pt-2"
                    >
                      Loading roles...
                    </div>
                    <Select
                      v-else-if="createUserAvailableRoles.length > 0"
                      v-model="newUserData.role_id"
                      :disabled="isLoadingCreateUser || isLoadingCreateUserRoles"
                    >
                      <SelectTrigger
                        id="createUserRole"
                        :class="{
                          'border-red-500': !newUserData.role_id && !isLoadingCreateUserRoles,
                        }"
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Roles</SelectLabel>
                          <SelectItem
                            v-for="role in createUserAvailableRoles"
                            :key="role.id"
                            :value="String(role.id)"
                          >
                            {{ role.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p v-else class="text-sm text-red-500 dark:text-red-400 pt-2">
                      No roles available. A role is required.
                    </p>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <Label for="createUserStatus" class="text-sm font-medium">Status</Label>
                    <div class="flex items-center space-x-2">
                      <Switch
                        id="createUserStatus"
                        :checked="newUserData.status"
                        @update:checked="(newVal: boolean) => (newUserData.status = newVal)"
                        :disabled="isLoadingCreateUser"
                      />
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{
                        newUserData.status ? 'ACTIVE' : 'INACTIVE'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Set Password <span class="text-red-500">*</span>
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Label for="createUserPassword" class="block text-sm font-medium mb-1"
                      >Password
                      <span class="text-xs font-normal text-gray-500">(Min. 6 chars)</span></Label
                    >
                    <Input
                      id="createUserPassword"
                      type="password"
                      v-model="newUserData.password"
                      placeholder="Enter password"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                  <div>
                    <Label for="createUserConfirmPassword" class="block text-sm font-medium mb-1"
                      >Confirm Password</Label
                    >
                    <Input
                      id="createUserConfirmPassword"
                      type="password"
                      v-model="newUserData.confirm_password"
                      placeholder="Confirm password"
                      :disabled="isLoadingCreateUser"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter
              class="px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-lg bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700"
            >
              <Button
                type="button"
                @click="handleCreateUser"
                :disabled="
                  isCreateUserSaveDisabled || isLoadingCreateUser || isLoadingCreateUserRoles
                "
              >
                <svg
                  v-if="isLoadingCreateUser"
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
                {{ isLoadingCreateUser ? 'Creating User...' : 'Create User' }}
              </Button>
              <Button
                type="button"
                variant="outline"
                @click="isCreateUserDialogOpen = false"
                :disabled="isLoadingCreateUser || isLoadingCreateUserRoles"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DataTableViewOptions :table="table" />
      </div>
    </div>
    <Toaster />
  </div>
</template>
