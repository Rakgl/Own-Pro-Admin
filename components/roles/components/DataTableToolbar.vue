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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { roleStatuses } from '../data/data'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
  table: Table<TData>
  onDataChanged?: () => void
}

const props = defineProps<DataTableToolbarProps>()
const { toast } = useToast()
const api = useApi()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
const localSearchValue = ref<string>((props.table.getColumn('name')?.getFilterValue() as string) ?? '')

// Debounce Search
let debounceTimer: number | undefined
watch(localSearchValue, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    props.table.getColumn('name')?.setFilterValue(newValue)
  }, 300)
})

const isNewRoleDialogOpen = ref(false)
const newRoleData = ref({
  name: '',
  status: 'ACTIVE',
  description: '',
})

async function handleCreateRole() {
  if (!newRoleData.value.name.trim()) return
  try {
    const response = await api<any>('/roles', {
      method: 'POST',
      body: newRoleData.value,
    })
    if (response.success) {
      isNewRoleDialogOpen.value = false
      toast({ title: t('success'), description: t('common.create_success') })
      props.onDataChanged?.()
    }
  } catch (error: any) {
    toast({ title: t('error'), description: error.message, variant: 'destructive' })
  }
}
</script>

<template>
  <div class="flex items-center justify-between py-4">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        v-model="localSearchValue"
        :placeholder="$t('common.search_placeholder')"
        class="h-9 w-[180px] lg:w-[280px]"
      />

      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        :title="$t('common.status')"
        :options="roleStatuses"
      />

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-9 px-3"
        @click="() => { table.resetColumnFilters(); localSearchValue = ''; }"
      >
        {{ $t('common.reset') }}
        <Icon name="i-radix-icons-cross-2" class="ml-2 h-4 w-4" />
      </Button>
    </div>

    <div class="flex items-center space-x-2">
      <Dialog v-model:open="isNewRoleDialogOpen">
        <DialogTrigger as-child>
          <Button variant="outline" class="h-9">
            <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
            {{ $t('nav.add_new_role') }}
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{ $t('nav.add_new_role') }}</DialogTitle>
            <DialogDescription>{{ $t('common.create_role_description') }}</DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label>{{ $t('common.name') }} *</Label>
              <Input v-model="newRoleData.name" :placeholder="$t('common.enter_name')" />
            </div>
            <div class="space-y-2">
              <Label>{{ $t('common.status') }} *</Label>
              <Select v-model="newRoleData.status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="st in roleStatuses" :key="st.value" :value="st.value">
                    {{ st.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>{{ $t('common.description') }}</Label>
              <Textarea v-model="newRoleData.description" />
            </div>
          </div>
          <DialogFooter>
            <Button @click="handleCreateRole">{{ $t('actions.save') }}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>