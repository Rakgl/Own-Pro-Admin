<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { Role } from '../data/schema'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n' // Import i18n
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
const { t } = useI18n() // Use the i18n translation function
const apiInstance = useApi()
const role = computed(() => props.row.original)

// Edit Dialog States
const isEditDialogOpen = ref(false)
const isLoadingRole = ref(false)
const editError = ref<string | null>(null)
const roleToEdit = ref<any | null>(null)

// Permissions Dialog States
const isPermissionsDialogOpen = ref(false)
const isLoadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const allPermissions = ref<any[]>([])
const selectedPermissionSlugs = ref<Set<string>>(new Set())

// Delete Alert State
const isDeleteDialogOpen = ref(false)

async function openEditDialog() {
  if (!role.value?.id) return
  isEditDialogOpen.value = true
  isLoadingRole.value = true
  editError.value = null
  try {
    const response = await apiInstance<any>(`/roles/${role.value.id}`, { method: 'GET' })
    if (response?.data) {
      roleToEdit.value = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || '',
        status: response.data.status === 'ACTIVE',
      }
    }
  } catch (error: any) {
    editError.value = error.message || t('common.error')
  } finally {
    isLoadingRole.value = false
  }
}

async function handleSaveChanges() {
  if (!roleToEdit.value?.name.trim()) return
  isLoadingRole.value = true
  try {
    const payload = {
      name: roleToEdit.value.name,
      description: roleToEdit.value.description,
      status: roleToEdit.value.status ? 'ACTIVE' : 'INACTIVE',
    }
    const response = await apiInstance<any>(`/roles/${roleToEdit.value.id}`, {
      method: 'PUT',
      body: payload,
    })
    if (response.success) {
      Object.assign(props.row.original, response.data)
      isEditDialogOpen.value = false
      toast({ title: t('success'), description: t('common.update_success') })
    }
  } catch (error: any) {
    editError.value = error.message
  } finally {
    isLoadingRole.value = false
  }
}

async function openPermissionsDialog() {
  if (!role.value?.id) return
  isPermissionsDialogOpen.value = true
  isLoadingPermissions.value = true
  try {
    const allPerms = await apiInstance<any[]>('/role-permissions', { method: 'GET' })
    const currentPerms = await apiInstance<any>(`role-permissions/role/${role.value.id}`, { method: 'GET' })
    
    allPermissions.value = allPerms || []
    if (currentPerms?.success) {
      selectedPermissionSlugs.value = new Set(currentPerms.data.map((p: any) => p.slug))
    }
  } catch (error: any) {
    permissionsError.value = error.message
  } finally {
    isLoadingPermissions.value = false
  }
}

async function handleSavePermissions() {
  isLoadingPermissions.value = true
  try {
    const permissionIds: number[] = []
    allPermissions.value.forEach(group => {
      group.permissions.forEach((p: any) => {
        if (selectedPermissionSlugs.value.has(p.slug)) permissionIds.push(p.id)
      })
    })
    const response = await apiInstance<any>('/role-permissions/update', {
      method: 'POST',
      body: { role_id: role.value.id, permission_ids: permissionIds }
    })
    if (response.success) {
      isPermissionsDialogOpen.value = false
      toast({ title: t('success'), description: t('common.permissions_updated') })
    }
  } catch (error: any) {
    permissionsError.value = error.message
  } finally {
    isLoadingPermissions.value = false
  }
}

async function confirmDeleteRole() {
  try {
    const response = await apiInstance<any>(`/roles/${role.value.id}`, { method: 'DELETE' })
    if (response.success) {
      toast({ title: t('success'), description: t('common.delete_success') })
      isDeleteDialogOpen.value = false
      // Trigger a refresh of the table data here
    }
  } catch (error: any) {
    toast({ title: t('error'), description: error.message, variant: 'destructive' })
  }
}

function handlePermissionToggle(slug: string, checked: boolean) {
  if (checked) selectedPermissionSlugs.value.add(slug)
  else selectedPermissionSlugs.value.delete(slug)
}
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 w-8 p-0">
          <Icon name="i-lucide-more-horizontal" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-[180px]">
        <DropdownMenuItem @click="openEditDialog">{{ $t('actions.edit') }}</DropdownMenuItem>
        <DropdownMenuItem @click="openPermissionsDialog">{{ $t('nav.role_permission') }}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-red-600" @click="isDeleteDialogOpen = true">
          {{ $t('actions.delete') }}
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('actions.edit') }}</DialogTitle>
          <DialogDescription>{{ $t('common.edit_description') }}</DialogDescription>
        </DialogHeader>
        <div v-if="roleToEdit" class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ $t('common.name') }}</Label>
            <Input v-model="roleToEdit.name" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ $t('common.description') }}</Label>
            <Textarea v-model="roleToEdit.description" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">{{ $t('common.status') }}</Label>
            <div class="col-span-3 flex items-center gap-2">
              <Switch :checked="roleToEdit.status" @update:checked="(v) => roleToEdit!.status = v" />
              <span class="text-sm">{{ roleToEdit.status ? $t('common.active') : $t('common.inactive') }}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="handleSaveChanges">{{ $t('actions.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('common.are_you_sure') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ $t('common.delete_warning', { name: role?.name }) }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">{{ $t('actions.cancel') }}</AlertDialogCancel>
          <AlertDialogAction class="bg-red-600" @click="confirmDeleteRole">{{ $t('actions.delete') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="isPermissionsDialogOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ $t('nav.role_permission') }}: {{ role?.name }}</DialogTitle>
        </DialogHeader>
        <div v-if="!isLoadingPermissions" class="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          <div v-for="group in allPermissions" :key="group.module">
            <h4 class="font-bold border-b pb-2 mb-4">{{ group.name }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="perm in group.permissions" :key="perm.slug" class="flex items-center gap-2">
                <Checkbox :id="perm.slug" :checked="selectedPermissionSlugs.has(perm.slug)" @update:checked="(v) => handlePermissionToggle(perm.slug, !!v)" />
                <Label :for="perm.slug" class="text-sm">{{ perm.name }}</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="handleSavePermissions">{{ $t('actions.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>