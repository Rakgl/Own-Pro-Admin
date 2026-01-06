<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Role } from '../data/schema' // This should ideally match the structure of RoleIndexResource
import { computed, ref, watch } from 'vue'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog' // ✨ Import Alert Dialog components
// Shadcn-vue components (ensure paths are correct for your project)
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'

interface RoleRowActionsProps {
  row: Row<Role>
}

const props = defineProps<RoleRowActionsProps>()
const { toast } = useToast()
const apiInstance = useApi()
const role = computed(() => props.row.original)

// Edit Dialog States
const isEditDialogOpen = ref(false)
const isLoadingRole = ref(false)
const editError = ref<string | null>(null)
const roleToEdit = ref<EditableRoleData | null>(null)

// Permissions Dialog States
const isPermissionsDialogOpen = ref(false)
const isLoadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const allPermissions = ref<PermissionGroup[]>([])
const currentRolePermissions = ref<PermissionItem[]>([])
const selectedPermissionSlugs = ref<Set<string>>(new Set())

// ✨ Delete Alert Dialog State
const isDeleteDialogOpen = ref(false) // ✨ New state for delete alert

interface EditableRoleData {
  id: string | number
  name: string
  description: string | null
  status: boolean
  [key: string]: any
}

interface GetRoleApiResponse {
  data: EditableRoleData
}

interface UpdateRoleApiResponse {
  success: boolean
  data: EditableRoleData
  message?: string
}

interface PermissionItem {
  id: number
  module: string
  name: string
  slug: string
}

interface PermissionGroup {
  module: string
  name: string
  slug: string
  permissions: PermissionItem[]
}

interface RolePermissionResponse {
  success: boolean
  data: PermissionItem[]
  message?: string
}

async function openEditDialog() {
  // ... (your existing openEditDialog logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    editError.value = 'Role ID is missing.'
    return
  }
  isEditDialogOpen.value = true
  isLoadingRole.value = true
  editError.value = null
  roleToEdit.value = null
  try {
    const response = await apiInstance<GetRoleApiResponse>(`/roles/${role.value.id}`, {
      method: 'GET',
    })
    if (response && response.data) {
      const fetchedData = response.data
      roleToEdit.value = {
        id: fetchedData.id,
        name: fetchedData.name,
        description: fetchedData.description || '',
        status: fetchedData.status === 'ACTIVE',
      }
    }
    else {
      editError.value = 'Failed to load role details: Invalid response structure.'
    }
  }
  catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.'
  }
  finally {
    isLoadingRole.value = false
  }
}

async function handleSaveChanges() {
  // ... (your existing handleSaveChanges logic)
  if (!roleToEdit.value || roleToEdit.value.id === undefined) {
    editError.value = 'No role data to save.'
    return
  }
  if (!roleToEdit.value.name.trim()) {
    editError.value = 'Role name cannot be empty.'
    return
  }
  isLoadingRole.value = true
  editError.value = null
  try {
    const payload = {
      name: roleToEdit.value.name,
      description: roleToEdit.value.description,
      status: roleToEdit.value.status ? 'ACTIVE' : 'INACTIVE',
    }
    const response = await apiInstance<UpdateRoleApiResponse>(`/roles/${roleToEdit.value.id}`, {
      method: 'PUT',
      body: payload,
    })
    if (response.success && response.data) {
      // eslint-disable-next-line vue/no-mutating-props
      Object.assign(props.row.original, response.data)
      isEditDialogOpen.value = false
      roleToEdit.value = null
      toast({
        title: 'Role Updated Successfully!',
        description: `The role "${response.data.name}" has been updated.`,
      })
    }
    else {
      editError.value = response.message || 'Failed to save changes.'
    }
  }
  catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.'
  }
  finally {
    isLoadingRole.value = false
  }
}

async function openPermissionsDialog() {
  // ... (your existing openPermissionsDialog logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    console.error('Role ID is missing for manage permissions action', role.value)
    permissionsError.value = 'Role ID is missing.'
    return
  }
  isPermissionsDialogOpen.value = true
  isLoadingPermissions.value = true
  permissionsError.value = null
  allPermissions.value = []
  currentRolePermissions.value = []
  selectedPermissionSlugs.value = new Set()
  try {
    const allPermsResponse = await apiInstance<PermissionGroup[]>('/role-permissions', {
      method: 'GET',
    })
    if (allPermsResponse && Array.isArray(allPermsResponse)) {
      allPermissions.value = allPermsResponse
    }
    else {
      console.error(
        'Failed to fetch all permissions: Invalid response structure',
        allPermsResponse,
      )
      permissionsError.value = 'Could not load available permissions.'
      isLoadingPermissions.value = false
      return
    }
    const currentPermsResponse = await apiInstance<RolePermissionResponse>(
      `role-permissions/role/${role.value.id}`,
      {
        method: 'GET',
      },
    )
    if (
      currentPermsResponse
      && currentPermsResponse.success
      && Array.isArray(currentPermsResponse.data)
    ) {
      currentRolePermissions.value = currentPermsResponse.data
      const currentSlugs = currentPermsResponse.data.map(permission => permission.slug)
      selectedPermissionSlugs.value = new Set(currentSlugs)
    }
    else {
      console.warn('No current permissions found or invalid response.', currentPermsResponse)
      currentRolePermissions.value = []
      selectedPermissionSlugs.value = new Set()
    }
  }
  catch (error: any) {
    console.error('Error in permissions dialog setup:', error)
    permissionsError.value = error.data?.message || error.message || 'An error occurred.'
  }
  finally {
    isLoadingPermissions.value = false
  }
}

function handlePermissionToggle(slug: string, checked: boolean) {
  // ... (your existing handlePermissionToggle logic)
  if (checked) {
    selectedPermissionSlugs.value.add(slug)
  }
  else {
    selectedPermissionSlugs.value.delete(slug)
  }
}

async function handleSavePermissions() {
  // ... (your existing handleSavePermissions logic)
  if (!role.value || typeof role.value.id === 'undefined') {
    permissionsError.value = 'Role ID is missing.'
    return
  }
  isLoadingPermissions.value = true
  permissionsError.value = null
  try {
    const selectedPermissions = Array.from(selectedPermissionSlugs.value)
    const permissionIds: number[] = []
    allPermissions.value.forEach((group) => {
      group.permissions.forEach((permission) => {
        if (selectedPermissions.includes(permission.slug)) {
          permissionIds.push(permission.id)
        }
      })
    })
    const payload = {
      role_id: role.value.id,
      permission_ids: permissionIds,
    }
    const response = await apiInstance<{ success: boolean, message?: string, data?: any }>(
      `/role-permissions/update`,
      {
        method: 'POST',
        body: payload,
      },
    )
    if (response.success) {
      isPermissionsDialogOpen.value = false
      toast({
        title: 'Permissions Updated!',
        description: `Permissions for role "${role.value.name}" have been saved.`,
      })
    }
    else {
      permissionsError.value = response.message || 'Failed to save permissions.'
    }
  }
  catch (error: any) {
    console.error('Error saving permissions:', error)
    permissionsError.value
      = error.data?.message
        || error.message
        || 'An unexpected error occurred while saving permissions.'
  }
  finally {
    isLoadingPermissions.value = false
  }
}

function isPermissionSelected(slug: string): boolean {
  return selectedPermissionSlugs.value.has(slug)
}

function getSelectedPermissionsCount(group: PermissionGroup): string {
  const selectedCount = group.permissions.filter(p =>
    selectedPermissionSlugs.value.has(p.slug),
  ).length
  const totalCount = group.permissions.length
  return `${selectedCount}/${totalCount}`
}

async function confirmDeleteRole() {
  if (!role.value || typeof role.value.id === 'undefined') {
    toast({
      title: 'Error',
      description: 'Role ID is missing, cannot delete.',
      variant: 'destructive',
    })
    return
  }
  try {
    const response = await apiInstance(`/roles/${role.value.id}`, {
      method: 'DELETE',
    })

    if (response.success) {
      toast({
        title: 'Role Deleted Successfully!',
        description: `The role "${role.value.name}" has been deleted.`,
      })
      isDeleteDialogOpen.value = false
      // TODO: You'll likely want to refresh your table data here
      // e.g., by emitting an event or calling a method passed as a prop
    }
    else {
      toast({
        title: 'Deletion Failed',
        description: response.message || 'Could not delete the role.',
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    toast({
      title: 'Deletion Error',
      description: error.data?.message || error.message || 'An unexpected error occurred.',
      variant: 'destructive',
    })
  }
  finally {
    // Reset loading state if you added one
    isDeleteDialogOpen.value = false // Ensure dialog closes even on error
  }
}

watch(isEditDialogOpen, (newValue) => {
  if (!newValue) {
    roleToEdit.value = null
    editError.value = null
    isLoadingRole.value = false
  }
})

watch(isPermissionsDialogOpen, (newValue) => {
  if (!newValue) {
    allPermissions.value = []
    currentRolePermissions.value = []
    selectedPermissionSlugs.value = new Set()
    permissionsError.value = null
    isLoadingPermissions.value = false
  }
})

// ✨ Watcher for delete dialog (optional, for cleanup)
watch(isDeleteDialogOpen, (newValue) => {
  if (!newValue) {
    // You can add cleanup logic here if needed when the dialog is closed
  }
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 flex p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M5 10c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m14 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2m-7 0c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2"
            />
          </svg>
          <span class="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-[160px]">
        <DropdownMenuItem @click="openEditDialog">
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem @click="openPermissionsDialog">
          Manage Permissions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="text-red-600 focus:text-red-600 hover:!text-red-600 dark:hover:!text-red-500"
          @click="isDeleteDialogOpen = true"
        >
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="rounded-lg shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-lg text-gray-900 font-medium dark:text-gray-100">
            Edit
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Make changes to the role details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div
          v-if="isLoadingRole"
          class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>
        <div
          v-else-if="editError"
          class="m-4 rounded-md px-6 py-4 text-sm text-red-600 dark:text-red-400"
        >
          <strong>Error:</strong> {{ editError }}
        </div>
        <div v-if="roleToEdit && !isLoadingRole" class="grid gap-6 p-6">
          <div class="grid grid-cols-4 items-center gap-x-4 gap-y-2">
            <Label
              for="roleName"
              class="col-span-1 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Name</Label>
            <Input
              id="roleName"
              v-model="roleToEdit.name"
              class="col-span-3"
              placeholder="Enter role name"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="grid grid-cols-4 items-start gap-x-4 gap-y-2">
            <Label
              for="roleDescription"
              class="col-span-1 pt-2 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Description</Label>
            <Textarea
              id="roleDescription"
              v-model="roleToEdit.description"
              class="col-span-3 min-h-[80px]"
              placeholder="Enter role description (optional)"
              :disabled="isLoadingRole"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-x-4 gap-y-2">
            <Label
              for="roleStatus"
              class="col-span-1 text-right text-sm text-gray-700 font-medium dark:text-gray-300"
            >Status</Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch
                id="roleStatus"
                :checked="roleToEdit.status"
                :disabled="isLoadingRole"
                @update:checked="(newVal: boolean) => (roleToEdit!.status = newVal)"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">{{
                roleToEdit.status ? 'ACTIVE' : 'INACTIVE'
              }}</span>
            </div>
          </div>
        </div>
        <DialogFooter class="rounded-b-lg px-6 py-4 sm:flex sm:flex-row-reverse">
          <Button
            type="button"
            :disabled="isLoadingRole || !roleToEdit || !roleToEdit.name"
            @click="handleSaveChanges"
          >
            {{ isLoadingRole ? 'Saving...' : 'Save changes' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isLoadingRole"
            @click="isEditDialogOpen = false"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isPermissionsDialogOpen">
      <DialogContent class="rounded-lg shadow-xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle class="text-lg text-gray-900 font-medium dark:text-gray-100">
            Manage Permissions for {{ role?.name }}
          </DialogTitle>
          <DialogDescription class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Select the permissions to assign to this role. Currently selected:
            {{ selectedPermissionSlugs.size }} permissions.
          </DialogDescription>
        </DialogHeader>
        <div
          v-if="isLoadingPermissions"
          class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <svg
            class="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-600"
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
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading permissions...
        </div>
        <div
          v-else-if="permissionsError"
          class="m-4 border border-red-200 rounded-md bg-red-50 px-6 py-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          <strong>Error:</strong> {{ permissionsError }}
        </div>
        <div
          v-if="allPermissions.length > 0 && !isLoadingPermissions"
          class="max-h-[60vh] overflow-y-auto p-6"
        >
          <div v-for="group in allPermissions" :key="group.module" class="mb-6">
            <div class="mb-3 flex items-center justify-between">
              <h3
                class="text-md border-b pb-2 text-gray-700 font-semibold dark:border-gray-600 dark:text-gray-300"
              >
                {{ group.name }}
              </h3>
              <span
                class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                {{ getSelectedPermissionsCount(group) }}
              </span>
            </div>
            <div class="grid grid-cols-1 gap-x-4 gap-y-3 lg:grid-cols-3 sm:grid-cols-2">
              <div
                v-for="permission in group.permissions"
                :key="permission.slug"
                class="flex items-center rounded p-2 space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <Checkbox
                  :id="`perm-${permission.slug}`"
                  :checked="isPermissionSelected(permission.slug)"
                  class="form-checkbox h-5 w-5 rounded text-indigo-600 transition duration-150 ease-in-out dark:border-gray-600"
                  @update:checked="
                    (checked) => handlePermissionToggle(permission.slug, Boolean(checked))
                  "
                />
                <Label
                  :for="`perm-${permission.slug}`"
                  class="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ permission.name }}
                </Label>
                <!-- <span class="text-xs text-gray-400 dark:text-gray-500">
                  {{ permission.slug }}
                </span> -->
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="!isLoadingPermissions && !permissionsError"
          class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No permissions available to assign.
        </div>
        <DialogFooter
          class="border-t rounded-b-lg px-6 py-4 sm:flex sm:flex-row-reverse dark:border-gray-700"
        >
          <Button
            type="button"
            class="w-full inline-flex justify-center border border-transparent rounded-md px-4 py-2 text-base text-white font-medium shadow-sm sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoadingPermissions"
            @click="handleSavePermissions"
          >
            <svg
              v-if="isLoadingPermissions"
              class="mr-3 h-5 w-5 animate-spin text-white -ml-1"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ isLoadingPermissions ? 'Saving...' : 'Save Permissions' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            class="mt-3 w-full inline-flex justify-center border border-gray-300 rounded-md px-4 py-2 text-base text-gray-700 font-medium shadow-sm sm:ml-3 sm:mt-0 sm:w-auto dark:border-gray-500 sm:text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoadingPermissions"
            @click="isPermissionsDialogOpen = false"
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
            This action cannot be undone. This will permanently delete the role "<strong>{{
              role?.name
            }}</strong>" and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
            @click="confirmDeleteRole"
          >
            Yes, delete role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
