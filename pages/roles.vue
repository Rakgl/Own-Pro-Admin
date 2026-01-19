<script setup lang="ts">
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/vue-table'

import type { Role } from '@/components/roles/data/schema'
import { onMounted, ref } from 'vue'
import { roleColumns } from '@/components/roles/components/columns'
import DataTable from '@/components/roles/components/DataTable.vue'
import { valueUpdater } from '@/lib/utils'

const { t } = useI18n()

const rolesData = ref<Role[]>([])
const isLoading = ref(true)

const pagination = ref<PaginationState>({
  pageIndex: 0, 
  pageSize: 10,
})

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const pageCount = ref(0)
const totalRows = ref(0)

async function fetchRoles() {
  isLoading.value = true
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  }

  if (sorting.value.length > 0) {
    const sortItem = sorting.value[0]
    params.sort_by = sortItem.id
    params.sort_dir = sortItem.desc ? 'desc' : 'asc'
  } else {
    params.sort_by = 'created_at'
    params.sort_dir = 'desc'
  }

  columnFilters.value.forEach((filter) => {
    if (filter.id === 'name') {
      params.search = filter.value
    } else if (filter.id === 'status') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.status = filter.value.join(',')
      } else if (typeof filter.value === 'string') {
        params.status = filter.value
      }
    }
  })

  const api = useApi()
  try {
    const response = await api('/roles', { params })
    rolesData.value = response.data
    pageCount.value = response.meta.last_page
    totalRows.value = response.meta.total
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    rolesData.value = []
    pageCount.value = 0
    totalRows.value = 0
  } finally {
    isLoading.value = false
  }
}

function handlePaginationChange(updaterOrValue: Updater<PaginationState>) {
  const oldPageSize = pagination.value.pageSize
  valueUpdater(updaterOrValue, pagination)
  if (oldPageSize !== pagination.value.pageSize) {
    pagination.value.pageIndex = 0
  }
  fetchRoles()
}

function handleSortingChange(updaterOrValue: Updater<SortingState>) {
  valueUpdater(updaterOrValue, sorting)
  pagination.value.pageIndex = 0
  fetchRoles()
}

function handleColumnFiltersChange(updaterOrValue: Updater<ColumnFiltersState>) {
  valueUpdater(updaterOrValue, columnFilters)
  pagination.value.pageIndex = 0
  fetchRoles()
}

onMounted(fetchRoles)
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t('nav.role_permission') }}
        </h2>
        <p class="text-muted-foreground">
          {{ $t('common.role_description_subtitle') }}
        </p>
      </div>
    </div>

    <DataTable
      :columns="roleColumns"
      :data="rolesData"
      :page-count="pageCount"
      :pagination="pagination"
      :sorting="sorting"
      :column-filters="columnFilters"
      :manual-pagination="true"
      :manual-sorting="true"
      :manual-filtering="true"
      @pagination-change="handlePaginationChange"
      @sorting-change="handleSortingChange"
      @column-filters-change="handleColumnFiltersChange"
      :on-data-changed="fetchRoles"
    />
  </div>
</template>