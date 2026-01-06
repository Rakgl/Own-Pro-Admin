# columns.ts

```ts
import type { ColumnDef } from '@tanstack/vue-table'
import type { Role } from '../data/schema'
import { Badge } from '@/components/ui/badge'
import { h } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import RoleRowActions from './DataTableRowActions.vue'

interface CustomTableMeta {
  onDataChanged?: () => void
}

interface StatusDisplayConfig {
  label: string
  badgeClass: string
  dotClass: string
}

const statusConfigurations: Record<string, StatusDisplayConfig> = {
  ACTIVE: {
    label: 'ACTIVE',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'INACTIVE',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    label: 'UNKNOWN',
    badgeClass:
      'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
}

export const roleColumns: ColumnDef<Role>[] = [
  {
    id: 'index',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: '#' }),
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'image',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Avatar' }),
    cell: ({ row }) => {
      const image = row.getValue('image') as string | undefined
      const name = (row.getValue('name') as string) || 'User'

      if (image) {
        return h('img', {
          src: image,
          alt: `${name}'s avatar`,
          class: 'w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700',
        })
      }
      else {
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
        return h(
          'div',
          {
            class:
              'w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600', // Added border
          },
          initials || 'N/A',
        )
      }
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      cellClass: 'flex justify-center items-center',
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Role' }),
    cell: ({ row }) => h('div', {}, row.getValue('role') || 'N/A'),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const statusValue = String(row.getValue('status') || '').toUpperCase()
      const config = statusConfigurations[statusValue] || statusConfigurations.DEFAULT

      return h(
        Badge,
        {
          class: `px-2.5 py-0.5 text-xs rounded-full font-medium inline-flex items-center ${config.badgeClass}`,
        },
        () => [
          h('span', { class: `w-1.5 h-1.5 mr-1.5 rounded-full ${config.dotClass}` }),
          config.label,
        ],
      )
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Actions' }),
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta
      return h(RoleRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
]

```

# DataTable.vue

```vue
<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState, // Added for server-side pagination state
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ref } from 'vue' // Make sure ref is imported if not already

import { valueUpdater } from '@/lib/utils' // Assuming this utility exists
import DataTablePagination from './DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue' // Toolbar will need to be adapted for Role data

interface DataTableProps {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]

  // --- NEW Props for Server-Side Operations ---
  pageCount: number // Total number of pages from the API (meta.last_page)
  pagination: PaginationState // Controlled pagination state
  sorting?: SortingState // Controlled sorting state
  columnFilters?: ColumnFiltersState // Controlled column filters state

  // Event emitters for state changes to be handled by parent
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onSortingChange?: (updater: Updater<SortingState>) => void
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void

  // Flags to enable server-side processing
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
  // --- END NEW Props ---
}
const props = defineProps<DataTableProps>()

// Local states for features not (yet) server-controlled or always client-side
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({}) // Keep if you use row selection

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    // Controlled states from props
    get pagination() {
      return props.pagination
    },
    get sorting() {
      return props.sorting
    },
    get columnFilters() {
      return props.columnFilters
    },
    // Local states
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  // --- Configuration for Server-Side Operations ---
  // pageCount: props.pageCount, // <<< OLD LINE
  get pageCount() {
    // <<< MODIFIED LINE: Use a getter for reactivity
    return props.pageCount
  },
  manualPagination: props.manualPagination ?? true, // Default to true if not provided
  manualSorting: props.manualSorting ?? true,
  manualFiltering: props.manualFiltering ?? true,
  // --- END Server-Side Configuration ---

  enableRowSelection: true, // Or configure as needed

  // Event handlers for controlled states
  onPaginationChange: props.onPaginationChange,
  onSortingChange: props.onSortingChange,
  onColumnFiltersChange: props.onColumnFiltersChange,

  // Event handlers for local states
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),

  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar :table="table" />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <DataTablePagination :table="table" />
  </div>
</template>

```

# DataTableColumnHeader.vue

```vue
<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps {
  column: Column<Task, any>
  title: string
}

defineProps<DataTableColumnHeaderProps>()
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <div v-if="column.getCanSort()" :class="cn('flex items-center space-x-2', $attrs.class ?? '')">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-8 -ml-3 data-[state=open]:bg-accent">
          <span>{{ title }}</span>
          <Icon
            v-if="column.getIsSorted() === 'desc'"
            name="i-radix-icons-arrow-down"
            class="ml-2 h-4 w-4"
          />
          <Icon
            v-else-if="column.getIsSorted() === 'asc'"
            name="i-radix-icons-arrow-up"
            class="ml-2 h-4 w-4"
          />
          <Icon v-else name="i-radix-icons-caret-sort" class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem @click="column.toggleSorting(false)">
          <Icon name="i-radix-icons-arrow-up" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem @click="column.toggleSorting(true)">
          <Icon name="i-radix-icons-arrow-down" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="column.toggleVisibility(false)">
          <Icon name="i-radix-icons-eye-none" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div v-else :class="$attrs.class">
    {{ title }}
  </div>
</template>

```

# DataTableFacetedFilter.vue

```vue
<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import type { Component } from 'vue'
import type { Task } from '../data/schema'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface DataTableFacetedFilter {
  column?: Column<Task, any>
  title?: string
  options: {
    label: string
    value: string
    icon?: Component
  }[]
}

const props = defineProps<DataTableFacetedFilter>()

const facets = computed(() => props.column?.getFacetedUniqueValues())
const selectedValues = computed(() => new Set(props.column?.getFilterValue() as string[]))
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 border-dashed">
        <Icon name="i-radix-icons-plus-circled" class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden lg:flex space-x-1">
            <Badge
              v-if="selectedValues.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.size }} selected
            </Badge>

            <template v-else>
              <Badge
                v-for="item in options
                  .filter((option: any) => selectedValues.has(option.value))"
                :key="item.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ item.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command
        :filter-function="(list: DataTableFacetedFilter['options'], term: any) => list.filter(i => i.label.toLowerCase()?.includes(term))"
      >
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option"
              @select="(e: any) => {
                console.log(e.detail.value)
                const isSelected = selectedValues.has(option.value)
                if (isSelected) {
                  selectedValues.delete(option.value)
                }
                else {
                  selectedValues.add(option.value)
                }
                const filterValues = Array.from(selectedValues)
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined,
                )
              }"
            >
              <div
                :class="cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Icon name="i-radix-icons-check" :class="cn('h-4 w-4')" />
              </div>
              <component :is="option.icon" v-if="option.icon" class="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{{ option.label }}</span>
              <span v-if="facets?.get(option.value)" class="ml-auto h-4 w-4 flex items-center justify-center text-xs font-mono">
                {{ facets.get(option.value) }}
              </span>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="{ label: 'Clear filters' }"
                class="justify-center text-center"
                @select="column?.setFilterValue(undefined)"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

```

# DataTablePagination.vue

```vue
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Task } from '../data/schema'

interface DataTablePaginationProps {
  table: Table<Task>
}
defineProps<DataTablePaginationProps>()
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex-1 text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} of
      {{ table.getFilteredRowModel().rows.length }} row(s) selected.
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">
          Rows per page
        </p>
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="table.setPageSize"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="pageSize in [10, 20, 30, 40, 50]"
              :key="pageSize"
              :value="`${pageSize}`"
            >
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="w-[100px] flex items-center justify-center text-sm font-medium">
        Page {{ table.getState().pagination.pageIndex + 1 }} of
        {{ table.getPageCount() }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Go to first page</span>
          <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Go to previous page</span>
          <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Go to next page</span>
          <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">Go to last page</span>
          <Icon name="i-radix-icons-double-arrow-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

```

# DataTableRowActions.vue

```vue
<script setup lang="ts">
import type { Row } from '@tanstack/vue-table'
import type { User } from '../data/schema'
import { computed, defineEmits, ref, watch } from 'vue' // Added defineEmits

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
// Shadcn-vue components
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/components/ui/toast/use-toast'

// Assume useApi is a composable providing an API client instance
// e.g., import { useApi } from '@/composables/useApi';

interface UserRowActionsProps {
  row: Row<User>
}

const props = defineProps<UserRowActionsProps>()
const emit = defineEmits(['refreshData']) // Define emit for refreshing data

const { toast } = useToast()
const apiInstance = useApi() // Make sure useApi() is correctly set up
const user = computed(() => props.row.original)

// Edit Dialog States
const isEditDialogOpen = ref(false)
const isLoadingUser = ref(false) // Shared loading state for edit and delete
const editError = ref<string | null>(null)
const userToEdit = ref<EditableUserData | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const availableRoles = ref<RoleData[]>([])
const isLoadingRoles = ref(false)

// Delete Alert Dialog State
const isDeleteDialogOpen = ref(false)

interface RoleData {
  id: string | number
  name: string
}

interface EditableUserData {
  id: string | number
  name: string
  username: string
  email?: string
  status: boolean
  role_id?: string | number | null
  password?: string
  confirm_password?: string
  avatar_url?: string | null
  avatar_file?: File | null
  [key: string]: any
}

interface GetUserApiResponseData {
  id: string | number
  name: string
  username: string
  email?: string
  status: string | boolean
  role_id?: string | number
  avatar_url?: string // Ensure backend uses 'avatar_url' or map 'image' to it
  image?: string // Potentially from backend
  [key: string]: any
}

interface GetUserApiResponse {
  data: GetUserApiResponseData
}

interface UpdateUserApiResponse {
  success: boolean
  data: Partial<GetUserApiResponseData>
  message?: string
}

// --- (fetchAvailableRoles, openEditDialog, triggerAvatarFileInput, handleImageFileChange, clearOrRevertAvatarChange, isSaveDisabled, handleSaveChanges remain the same) ---
async function fetchAvailableRoles() {
  isLoadingRoles.value = true
  try {
    const response = await apiInstance<RoleData[]>('/roles/active', { method: 'GET' })
    if (response && Array.isArray(response)) {
      availableRoles.value = response
    }
    else if (response && (response as any).data && Array.isArray((response as any).data)) {
      availableRoles.value = (response as any).data
    }
    else {
      console.error('Failed to load roles: Invalid response structure.', response)
      availableRoles.value = []
    }
  }
  catch (error) {
    console.error('Error fetching roles:', error)
    toast({ title: 'Error', description: 'Could not load roles.', variant: 'destructive' })
    availableRoles.value = []
  }
  finally {
    isLoadingRoles.value = false
  }
}

async function openEditDialog() {
  if (!user.value || typeof user.value.id === 'undefined') {
    editError.value = 'User ID is missing.'
    isEditDialogOpen.value = true
    return
  }
  isEditDialogOpen.value = true
  isLoadingUser.value = true
  editError.value = null
  userToEdit.value = null
  imagePreviewUrl.value = null
  if (avatarFileInput.value)
    avatarFileInput.value.value = ''

  await fetchAvailableRoles()

  try {
    const response = await apiInstance<GetUserApiResponse>(`/users/edit/${user.value.id}`, {
      method: 'GET',
    })
    if (response && response.data) {
      const fetchedData = response.data
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
      }
      imagePreviewUrl.value = fetchedData.avatar_url || fetchedData.image || null
    }
    else {
      editError.value = 'Failed to load user details: Invalid response structure.'
    }
  }
  catch (error: any) {
    editError.value = error.data?.message || error.message || 'An unexpected error occurred.'
  }
  finally {
    isLoadingUser.value = false
  }
}

function triggerAvatarFileInput() {
  avatarFileInput.value?.click()
}

function handleImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && userToEdit.value) {
    userToEdit.value.avatar_file = file
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

function clearOrRevertAvatarChange() {
  if (userToEdit.value) {
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    userToEdit.value.avatar_file = null
    imagePreviewUrl.value = userToEdit.value.avatar_url || null
    if (avatarFileInput.value) {
      avatarFileInput.value.value = ''
    }
  }
}

const isSaveDisabled = computed(() => {
  if (isLoadingUser.value || isLoadingRoles.value || !userToEdit.value) {
    return true
  }
  if (
    !userToEdit.value.name.trim()
    || !userToEdit.value.username.trim()
    || userToEdit.value.role_id === null
    || userToEdit.value.role_id === undefined
  ) {
    return true
  }
  if (
    userToEdit.value.password
    && userToEdit.value.password !== userToEdit.value.confirm_password
  ) {
    return true
  }
  if (userToEdit.value.password && userToEdit.value.password.length < 6) {
    return true
  }
  return false
})

async function handleSaveChanges() {
  if (!userToEdit.value || userToEdit.value.id === undefined) {
    editError.value = 'No user data to save.'
    return
  }
  // ... (rest of validation logic remains the same)
  if (!userToEdit.value.name.trim()) {
    editError.value = 'Name is required.'
    return
  }
  if (!userToEdit.value.username.trim()) {
    editError.value = 'Username is required.'
    return
  }
  if (userToEdit.value.role_id === null || userToEdit.value.role_id === undefined) {
    editError.value = 'Role is required.'
    return
  }
  if (userToEdit.value.password) {
    if (userToEdit.value.password.length < 6) {
      editError.value = 'Password must be at least 6 characters long.'
      return
    }
    if (userToEdit.value.password !== userToEdit.value.confirm_password) {
      editError.value = 'Passwords do not match.'
      return
    }
  }
  editError.value = null
  isLoadingUser.value = true

  const formData = new FormData()
  formData.append('name', userToEdit.value.name)
  formData.append('username', userToEdit.value.username)
  if (userToEdit.value.email) {
    formData.append('email', userToEdit.value.email)
  }
  formData.append('status', userToEdit.value.status ? 'ACTIVE' : 'INACTIVE')
  formData.append('role_id', String(userToEdit.value.role_id))

  if (userToEdit.value.password) {
    formData.append('password', userToEdit.value.password)
  }

  if (userToEdit.value.avatar_file) {
    formData.append('image', userToEdit.value.avatar_file)
  }
  else if (userToEdit.value.avatar_url === null) {
    // If avatar_url was explicitly cleared (not just reverted)
    formData.append('image', '') // Send empty string to indicate removal if backend supports
  }
  // If avatar_file is null and avatar_url exists, don't send 'image' field to keep existing image

  try {
    const response = await apiInstance<UpdateUserApiResponse>(
      `/users/update-user/${userToEdit.value.id}`, // Ensure this route expects POST and handles FormData
      {
        method: 'POST', // Laravel typically uses POST with _method: 'PUT' or a dedicated PUT route for updates with FormData
        body: formData,
      },
    )

    if (response.success && response.data) {
      // Ensure response.data.avatar_url is used if available
      const newAvatarUrl
        = response.data.avatar_url
          || (userToEdit.value.avatar_file ? imagePreviewUrl.value : userToEdit.value.avatar_url)

      const updatedUserData = {
        ...props.row.original,
        ...response.data,
        avatar_url: newAvatarUrl,
        status: userToEdit.value.status, // Ensure local status aligns with what was sent
      }

      // If backend returns status as string, ensure it's correctly mapped for local state
      if (typeof response.data.status === 'string') {
        updatedUserData.status = response.data.status.toUpperCase() === 'ACTIVE'
      }

      Object.assign(props.row.original, updatedUserData) // Update the row data directly

      if (response.data.avatar_url) {
        // If backend returned a new avatar URL (e.g., after upload)
        userToEdit.value.avatar_url = response.data.avatar_url
        imagePreviewUrl.value = response.data.avatar_url // update preview to new persisted URL
        userToEdit.value.avatar_file = null // clear staged file
        if (avatarFileInput.value)
          avatarFileInput.value.value = '' // reset file input
      }
      else if (userToEdit.value.avatar_file) {
        // If a new file was uploaded but backend didn't return a new URL (e.g. error or direct storage)
        // We might need to refresh the user data or assume the local preview (blob) is okay for now
        // For simplicity, if `response.data.avatar_url` is not there, we keep the current `imagePreviewUrl`
        // which could be a blob if a new file was selected.
      }

      isEditDialogOpen.value = false
      toast({
        title: 'User Updated Successfully!',
        description: `The user ${userToEdit.value.name} has been updated.`,
      })
      emit('refreshData') // Also emit refresh on edit if necessary, or rely on Object.assign
    }
    else {
      editError.value = response.message || 'Failed to save changes.'
    }
  }
  catch (error: any) {
    editError.value
      = error.data?.message || error.message || 'An unexpected error occurred while saving.'
  }
  finally {
    isLoadingUser.value = false
  }
}

/**
 * Handles the user deletion confirmation.
 * Makes an API call to the backend to delete the user.
 */
async function confirmDeleteUser() {
  if (!user.value || typeof user.value.id === 'undefined') {
    toast({
      title: 'Error',
      description: 'User ID is missing. Cannot delete.',
      variant: 'destructive',
    })
    isDeleteDialogOpen.value = false // Close dialog if ID is missing
    return
  }

  isLoadingUser.value = true
  try {
    // Your Laravel backend's `destroy` method is mapped via Route::resource,
    // so a DELETE request to /users/{id} will trigger it.
    // It expects { success: boolean, message: string } in response.
    const response = await apiInstance<{ success: boolean, message: string }>(
      `/users/${user.value.id}`,
      { method: 'DELETE' },
    )

    if (response.success) {
      toast({
        title: 'User Deleted',
        description: response.message || `User "${user.value.name}" has been successfully deleted.`,
      })
      isDeleteDialogOpen.value = false // Close the dialog on successful deletion
      emit('refreshData') // Notify the parent component to refresh its data list
    }
    else {
      toast({
        title: 'Deletion Failed',
        description: response.message || 'Could not delete the user. Please try again.',
        variant: 'destructive',
      })
      // Optionally, keep the dialog open if deletion failed but was handled by backend
      // isDeleteDialogOpen.value = false;
    }
  }
  catch (error: any) {
    console.error('Error deleting user:', error)
    // Try to extract a meaningful error message
    let errorMessage = 'An unexpected error occurred during deletion.'
    if (error && error.data && error.data.message) {
      errorMessage = error.data.message
    }
    else if (error && error.message) {
      errorMessage = error.message
    }
    toast({
      title: 'Deletion Error',
      description: errorMessage,
      variant: 'destructive',
    })
    // Keep dialog open for network/unexpected errors, allowing user to retry or cancel.
  }
  finally {
    isLoadingUser.value = false // Reset loading state
  }
}

watch(isEditDialogOpen, (newValue) => {
  if (!newValue) {
    // Cleanup for edit dialog
    if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }
    imagePreviewUrl.value = null
    userToEdit.value = null
    editError.value = null
    availableRoles.value = []
    if (avatarFileInput.value) {
      avatarFileInput.value.value = ''
    }
  }
})

// Watcher for delete dialog (can be used for cleanup if needed, but usually not necessary for a simple confirm)
watch(isDeleteDialogOpen, (newValue) => {
  if (!newValue) {
    // Optional: any cleanup if dialog is closed without action (e.g. by pressing ESC)
    // isLoadingUser.value = false; // Reset if an action could have left it true
  }
})
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
        <DropdownMenuItem @click="openEditDialog">
          Edit
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
      <DialogContent class="rounded-lg shadow-xl md:max-w-4xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle class="text-xl text-gray-900 font-semibold dark:text-gray-100">
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
          class="mx-4 my-2 border border-red-300 rounded-md bg-red-50 px-6 py-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          <strong>Error:</strong> {{ editError }}
        </div>

        <div v-if="userToEdit" class="max-h-[70vh] overflow-y-auto p-6">
          <div
            v-if="editError"
            class="mb-4 border border-red-300 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            <strong>Error:</strong> {{ editError }}
          </div>

          <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            <div class="flex flex-col items-center md:col-span-1 md:items-start space-y-3">
              <Label class="self-start text-sm text-gray-700 font-medium dark:text-gray-300">User Avatar</Label>
              <div class="relative">
                <img
                  v-if="imagePreviewUrl"
                  :src="imagePreviewUrl"
                  alt="Avatar Preview"
                  class="h-32 w-32 border-2 border-gray-300 rounded-full object-cover shadow-sm dark:border-gray-600"
                >
                <div
                  v-else
                  class="h-32 w-32 flex items-center justify-center border-2 border-gray-300 rounded-full border-dashed bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
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
                  class="absolute bottom-0 right-0 h-8 w-8 border-slate-300 rounded-full bg-white dark:border-slate-500 dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                  :disabled="isLoadingUser"
                  aria-label="Change avatar"
                  @click="triggerAvatarFileInput"
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
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="isLoadingUser"
                @change="handleImageFileChange"
              >
              <div
                class="w-full flex flex-col items-center gap-2 sm:flex-row md:flex-col md:items-stretch"
              >
                <Button
                  type="button"
                  variant="outline"
                  :disabled="isLoadingUser"
                  class="w-full text-xs sm:text-sm"
                  @click="triggerAvatarFileInput"
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
                    userToEdit.avatar_file
                      || (imagePreviewUrl && imagePreviewUrl !== userToEdit.avatar_url)
                  "
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="w-full text-xs text-red-600 sm:text-sm hover:!text-red-500 dark:hover:!text-red-400"
                  :disabled="isLoadingUser"
                  @click="clearOrRevertAvatarChange"
                >
                  Revert / Cancel Change
                </Button>
              </div>
              <p class="text-center text-xs text-gray-500 md:text-left dark:text-gray-400">
                Max file size: 2MB. JPG, PNG.
              </p>
            </div>

            <div class="md:col-span-2 space-y-4">
              <div>
                <Label for="userFullNameEdit" class="mb-1 block text-sm font-medium">
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
                <Label for="userUsernameEdit" class="mb-1 block text-sm font-medium">
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
                <Label for="userEmailEdit" class="mb-1 block text-sm font-medium">Email</Label>
                <Input
                  id="userEmailEdit"
                  v-model="userToEdit.email"
                  type="email"
                  placeholder="Enter email"
                  :disabled="isLoadingUser"
                />
              </div>

              <div>
                <Label for="userRoleEdit" class="mb-1 block text-sm font-medium">
                  Role <span class="text-red-500">*</span>
                </Label>
                <div v-if="isLoadingRoles" class="pt-2 text-sm text-gray-500 dark:text-gray-400">
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
                <p v-else class="pt-2 text-sm text-red-500 dark:text-red-400">
                  No roles available. A role is required to save.
                </p>
              </div>

              <div class="flex items-center justify-between pt-2">
                <Label for="userStatusEdit" class="text-sm font-medium">Status</Label>
                <div class="flex items-center space-x-2">
                  <Switch
                    id="userStatusEdit"
                    :checked="userToEdit.status"
                    :disabled="isLoadingUser"
                    @update:checked="(newVal: boolean) => (userToEdit!.status = newVal)"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{
                    userToEdit.status ? 'ACTIVE' : 'INACTIVE'
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 class="text-md mb-3 text-gray-800 font-semibold dark:text-gray-200">
              Update Password <span class="text-sm text-gray-500 font-normal">(optional)</span>
            </h3>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Label for="newPasswordEdit" class="mb-1 block text-sm font-medium">New Password</Label>
                <Input
                  id="newPasswordEdit"
                  v-model="userToEdit.password"
                  type="password"
                  placeholder="Min. 6 characters"
                  :disabled="isLoadingUser"
                />
              </div>
              <div>
                <Label for="confirmNewPasswordEdit" class="mb-1 block text-sm font-medium">Confirm New Password</Label>
                <Input
                  id="confirmNewPasswordEdit"
                  v-model="userToEdit.confirm_password"
                  type="password"
                  placeholder="Confirm password"
                  :disabled="isLoadingUser"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter
          class="rounded-b-lg bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse dark:bg-slate-800"
        >
          <Button
            type="button"
            :disabled="isSaveDisabled || isLoadingUser || isLoadingRoles"
            @click="handleSaveChanges"
          >
            <svg
              v-if="isLoadingUser"
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
            {{ isLoadingUser ? 'Saving...' : 'Save Changes' }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="isLoadingUser || isLoadingRoles"
            @click="isEditDialogOpen = false"
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
          <AlertDialogCancel :disabled="isLoadingUser">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 text-white dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
            :disabled="isLoadingUser"
            @click="confirmDeleteUser"
          >
            <svg
              v-if="isLoadingUser"
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
            {{ isLoadingUser ? 'Deleting...' : 'Yes, delete user' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

```

# DataTableToolbar.vue

```vue
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
```

# DataTableViewOptions.vue

```vue
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { computed } from 'vue'

interface DataTableViewOptionsProps {
  table: Table<Task>
}

const props = defineProps<DataTableViewOptionsProps>()

const columns = computed(() => props.table.getAllColumns()
  .filter(
    column =>
      typeof column.accessorFn !== 'undefined' && column.getCanHide(),
  ))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="ml-auto hidden h-8 lg:flex"
      >
        <Icon name="i-radix-icons-mixer-horizontal" class="mr-2 h-4 w-4" />
        View
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[150px]">
      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        class="capitalize"
        :checked="column.getIsVisible()"
        @update:checked="(value) => column.toggleVisibility(!!value)"
      >
        {{ column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

```

