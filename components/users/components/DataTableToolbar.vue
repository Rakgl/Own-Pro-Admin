<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { roleStatuses as importedRoleStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'
import ImageUploader from '@/components/ImageUploader.vue';

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

interface RoleData {
  id: string | number
  name: string
}

interface CreateUserData {
  name: string
  username: string
  email?: string
  status: boolean
  role_id?: string | number | null
  password?: string
  confirm_password?: string
  avatar_file?: File | null
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const api = useApi()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>((props.table.getColumn('name')?.getFilterValue() as string) ?? '')
let debounceTimer: number | undefined

watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
})

watch(
  () => props.table.getColumn('name')?.getFilterValue(),
  (filterValue) => {
    if (typeof filterValue === 'string' && localSearchValue.value !== filterValue) {
      localSearchValue.value = filterValue
    }
    else if (filterValue === undefined && localSearchValue.value !== '') {
      localSearchValue.value = ''
    }
  },
)

const isNewRoleDialogOpen = ref(false)
const newRoleData = ref({ name: '', status: 'ACTIVE', description: '' })
const isLoadingSaveRole = ref(false)
const createRoleError = ref<string | null>(null)

watch(isNewRoleDialogOpen, (isOpen) => {
  if (isOpen) {
    newRoleData.value = { name: '', status: 'ACTIVE', description: '' }
    createRoleError.value = null
  }
})

const isSaveRoleDisabled = computed(() => {
  if (isLoadingSaveRole.value) return true
  if (!newRoleData.value.name.trim()) return true
  if (!newRoleData.value.status) return true
  return false
})

async function handleCreateRole() {
  createRoleError.value = null
  isLoadingSaveRole.value = true
  try {
    const response = await api<{ success: boolean, message?: string, data?: any }>('/roles', {
      method: 'POST',
      body: newRoleData.value,
    })

    if (!response.success) {
      createRoleError.value = response.message || `Failed to create role.`
      toast({ title: 'Error', description: createRoleError.value, variant: 'destructive' })
    }
    else {
      isNewRoleDialogOpen.value = false
      toast({ title: 'Success', description: 'Role created.' })
      props.onDataChanged?.()
    }
  }
  catch (error: any) {
    createRoleError.value = error.data?.message || error.message
    toast({ title: 'Error', description: createRoleError.value, variant: 'destructive' })
  }
  finally {
    isLoadingSaveRole.value = false
  }
}

const isCreateUserDialogOpen = ref(false)
const isLoadingCreateUser = ref(false)
const createUserError = ref<string | null>(null)
const avatarFiles = ref<File[]>([])
const newUserData = ref<CreateUserData>({
  name: '',
  username: '',
  email: '',
  status: true,
  role_id: null,
  password: '',
  confirm_password: '',
  avatar_file: null,
})
const createUserAvailableRoles = ref<RoleData[]>([])
const isLoadingCreateUserRoles = ref(false)

watch(avatarFiles, (files) => {
  newUserData.value.avatar_file = files.length > 0 ? files[0] : null
})

async function fetchCreateUserRoles() {
  isLoadingCreateUserRoles.value = true
  try {
    const response = await api<RoleData[]>('/roles/active', { method: 'GET' })
    if (response && Array.isArray(response)) {
      createUserAvailableRoles.value = response
    }
    else if (response && (response as any).data && Array.isArray((response as any).data)) {
      createUserAvailableRoles.value = (response as any).data
    }
  }
  catch (error) {
    toast({ title: 'Error', description: 'Failed to load roles.', variant: 'destructive' })
  }
  finally {
    isLoadingCreateUserRoles.value = false
  }
}

async function openCreateUserDialog() {
  isCreateUserDialogOpen.value = true
  avatarFiles.value = []
  await fetchCreateUserRoles()
}

const isCreateUserSaveDisabled = computed(() => {
  if (isLoadingCreateUser.value || isLoadingCreateUserRoles.value) return true
  if (!newUserData.value.name.trim() || !newUserData.value.username.trim() || !newUserData.value.role_id) return true
  if (newUserData.value.password && newUserData.value.password !== newUserData.value.confirm_password) return true
  if (newUserData.value.password && newUserData.value.password.length < 6) return true
  return false
})

async function handleCreateUser() {
  createUserError.value = null
  isLoadingCreateUser.value = true

  const formData = new FormData()
  formData.append('name', newUserData.value.name)
  formData.append('username', newUserData.value.username)
  if (newUserData.value.email) formData.append('email', newUserData.value.email)
  formData.append('status', newUserData.value.status ? 'ACTIVE' : 'INACTIVE')
  formData.append('role_id', String(newUserData.value.role_id))
  if (newUserData.value.password) formData.append('password', newUserData.value.password)
  if (newUserData.value.avatar_file) formData.append('image', newUserData.value.avatar_file)

  try {
    const response = await api<{ success: boolean, data?: any, message?: string }>('/users', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isCreateUserDialogOpen.value = false
      toast({ title: 'Success', description: 'User created.' })
      props.onDataChanged?.()
    }
    else {
      createUserError.value = response.message || 'Failed to create user.'
    }
  }
  catch (error: any) {
    createUserError.value = error.data?.message || error.message
  }
  finally {
    isLoadingCreateUser.value = false
  }
}

watch(isCreateUserDialogOpen, (newValue) => {
  if (!newValue) {
    avatarFiles.value = []
    newUserData.value = {
      name: '',
      username: '',
      email: '',
      status: true,
      role_id: null,
      password: '',
      confirm_password: '',
      avatar_file: null,
    }
    createUserError.value = null
  }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          v-model="localSearchValue"
          placeholder="Filter by name..."
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
          @click="() => { table.resetColumnFilters(); localSearchValue = ''; }"
        >
          Reset
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15" class="ml-2 h-4 w-4">
            <path fill="currentColor" d="M3.64 2.27L7.5 6.13l3.84-3.84A.9.9 0 0 1 12.6 2a1 1 0 0 1 1 .96a.9.9 0 0 1-.27.64L8.84 7.5l3.89 3.89A.9.9 0 0 1 13.5 12a1 1 0 0 1-.96 1a.9.9 0 0 1-.64-.27L7.5 8.87l-3.85 3.85A.9.9 0 0 1 2.4 13a1 1 0 0 1-1-.96a.9.9 0 0 1 .27-.64L5.16 7.5L1.27 3.61A.9.9 0 0 1 1 3.01A1 1 0 0 1 2.04 2a.9.9 0 0 1 .6-.27Z" />
          </svg>
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isNewRoleDialogOpen">
          <DialogContent class="rounded-lg shadow-xl sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Fields marked with <span class="text-red-500">*</span> are required.</DialogDescription>
            </DialogHeader>
            <div v-if="createRoleError" class="my-3 border border-red-300 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error:</strong> {{ createRoleError }}
            </div>
            <form @submit.prevent="handleCreateRole">
              <div class="grid gap-4 px-1 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label for="new-role-name" class="col-span-1 text-right">Name <span class="text-red-500">*</span></Label>
                  <Input id="new-role-name" v-model="newRoleData.name" class="col-span-3" :disabled="isLoadingSaveRole" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label for="new-role-status" class="col-span-1 text-right">Status <span class="text-red-500">*</span></Label>
                  <Select v-model="newRoleData.status" :disabled="isLoadingSaveRole">
                    <SelectTrigger id="new-role-status" class="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="status in importedRoleStatuses" :key="status.value" :value="status.value">
                        {{ status.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid grid-cols-4 items-start gap-4">
                  <Label for="new-role-description" class="col-span-1 pt-1 text-right">Description</Label>
                  <Textarea id="new-role-description" v-model="newRoleData.description" class="col-span-3" :disabled="isLoadingSaveRole" />
                </div>
              </div>
              <DialogFooter class="bg-gray-50 px-6 py-4 dark:bg-slate-800">
                <Button type="submit" :disabled="isSaveRoleDisabled">
                  {{ isLoadingSaveRole ? 'Saving...' : 'Save Role' }}
                </Button>
                <Button type="button" variant="outline" @click="isNewRoleDialogOpen = false">Cancel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog v-model:open="isCreateUserDialogOpen">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="h-8" @click="openCreateUserDialog">Add User</Button>
          </DialogTrigger>
          <DialogContent class="md:max-w-4xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>

            <div v-if="createUserError" class="m-6 border border-red-300 bg-red-50 px-4 py-3 text-red-700">
              {{ createUserError }}
            </div>

            <div class="max-h-[70vh] overflow-y-auto p-6">
              <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                <div class="flex flex-col items-center md:col-span-1 space-y-3">
                  <Label class="self-start font-medium">User Avatar</Label>
                  <ImageUploader 
                    v-model="avatarFiles"
                    :max-files="1"
                    :disabled="isLoadingCreateUser"
                  />
                  <p class="text-xs text-gray-500 text-center md:text-left">Max size: 2MB. JPG, PNG.</p>
                </div>

                <div class="md:col-span-2 space-y-4">
                  <div>
                    <Label class="mb-1 block">Name <span class="text-red-500">*</span></Label>
                    <Input v-model="newUserData.name" :disabled="isLoadingCreateUser" />
                  </div>
                  <div>
                    <Label class="mb-1 block">Username <span class="text-red-500">*</span></Label>
                    <Input v-model="newUserData.username" :disabled="isLoadingCreateUser" />
                  </div>
                  <div>
                    <Label class="mb-1 block">Email</Label>
                    <Input v-model="newUserData.email" type="email" :disabled="isLoadingCreateUser" />
                  </div>
                  <div>
                    <Label class="mb-1 block">Role <span class="text-red-500">*</span></Label>
                    <Select v-model="newUserData.role_id" :disabled="isLoadingCreateUser || isLoadingCreateUserRoles">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="role in createUserAvailableRoles" :key="role.id" :value="String(role.id)">
                          {{ role.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <Label>Status</Label>
                    <div class="flex items-center space-x-2">
                      <Switch :checked="newUserData.status" @update:checked="(v) => newUserData.status = v" />
                      <span class="text-sm">{{ newUserData.status ? 'ACTIVE' : 'INACTIVE' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 border-t pt-6">
                <h3 class="mb-3 font-semibold">Set Password <span class="text-red-500">*</span></h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input v-model="newUserData.password" type="password" placeholder="Password" />
                  <Input v-model="newUserData.confirm_password" type="password" placeholder="Confirm" />
                </div>
              </div>
            </div>

            <DialogFooter class="bg-gray-50 px-6 py-4 dark:bg-slate-800">
              <Button :disabled="isCreateUserSaveDisabled" @click="handleCreateUser">
                {{ isLoadingCreateUser ? 'Creating...' : 'Create User' }}
              </Button>
              <Button variant="outline" @click="isCreateUserDialogOpen = false">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DataTableViewOptions :table="table" />
      </div>
    </div>
    <Toaster />
  </div>
</template>