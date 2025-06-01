<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

import DataTable from '@/components/roles/components/DataTable.vue'; // Adjust path as needed
import { roleColumns } from '@/components/roles/components/columns'; // Adjust path
import type { Role } from '@/components/roles/data/schema'; // Adjust path

import type {
  ColumnFiltersState,
  SortingState,
  PaginationState,
  Updater,
} from '@tanstack/vue-table';
import { valueUpdater } from '@/lib/utils'; // Your existing utility

// Assuming useApi composable or similar for API calls
// import { useApi } from '@/composables/useApi'; // Example

const rolesData = ref<Role[]>([]);
const isLoading = ref(true);

// --- Table States for Server-Side Control ---
const pagination = ref<PaginationState>({
  pageIndex: 0, // TanStack Table is 0-indexed for page
  pageSize: 10, // Default page size
});

const sorting = ref<SortingState>([]);

const columnFilters = ref<ColumnFiltersState>([]);

const pageCount = ref(0);
const totalRows = ref(0);

// --- API Fetching Logic ---
async function fetchRoles() {
  isLoading.value = true;
  const params: Record<string, any> = {
    page: pagination.value.pageIndex + 1,
    per_page: pagination.value.pageSize,
  };

  if (sorting.value.length > 0) {
    const sortItem = sorting.value[0];
    params.sort_by = sortItem.id;
    params.sort_dir = sortItem.desc ? 'desc' : 'asc';
  } else {
    params.sort_by = 'created_at';
    params.sort_dir = 'desc';
  }

  columnFilters.value.forEach((filter) => {
    if (filter.id === 'name') {
      params.search = filter.value;
    } else if (filter.id === 'status') {
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.status = filter.value.join(',');
      } else if (typeof filter.value === 'string') {
        params.status = filter.value;
      }
    }
  });

  const api = useApi();
  try {
    const response = await api('/roles', { params }); // Your actual API call
    rolesData.value = response.data;
    pageCount.value = response.meta.last_page;
    totalRows.value = response.meta.total;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    rolesData.value = [];
    pageCount.value = 0;
    totalRows.value = 0;
  } finally {
    isLoading.value = false;
  }
  isLoading.value = false; // Ensure isLoading is set to false after mock
}

// --- Handlers for DataTable emitted events ---
const handlePaginationChange = (updaterOrValue: Updater<PaginationState>) => {
  const oldPageSize = pagination.value.pageSize;

  valueUpdater(updaterOrValue, pagination);

  const newPageSize = pagination.value.pageSize;

  if (oldPageSize !== newPageSize) {
    pagination.value.pageIndex = 0;
  }
  fetchRoles();
};

const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
  valueUpdater(updaterOrValue, sorting);
  pagination.value.pageIndex = 0;
  fetchRoles();
};

const handleColumnFiltersChange = (updaterOrValue: Updater<ColumnFiltersState>) => {
  valueUpdater(updaterOrValue, columnFilters);
  pagination.value.pageIndex = 0;
  fetchRoles();
};

onMounted(fetchRoles);
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Role Permission</h2>
        <p class="text-muted-foreground">Here&apos;s a list of your permission for this month!</p>
      </div>
    </div>

    <!-- <div v-if="isLoading && rolesData.length === 0" class="w-full">
      <div class="rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="h-6 rounded animate-pulse w-1/3 mb-2"></div>
          <div class="h-4 rounded animate-pulse w-1/2"></div>
        </div>

        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="">
            <tr>
              <th
                v-for="(_, index) in roleColumns"
                :key="'header-skeleton-' + index"
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                <div class="h-4 rounded animate-pulse w-3/4"></div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="i in pagination.pageSize" :key="'row-skeleton-' + i" class="animate-pulse">
              <td
                v-for="(_, j) in roleColumns"
                :key="'cell-skeleton-' + i + '-' + j"
                class="px-6 py-4 whitespace-nowrap"
              >
                <div class="h-4 rounded"></div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="h-8 rounded animate-pulse w-1/4"></div>
          <div class="flex space-x-2">
            <div class="h-8 w-16 rounded animate-pulse"></div>
            <div class="h-8 w-16 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div> -->

    <DataTable
      :columns="roleColumns"
      :data="rolesData"
      :pageCount="pageCount"
      :pagination="pagination"
      :sorting="sorting"
      :columnFilters="columnFilters"
      @paginationChange="handlePaginationChange"
      @sortingChange="handleSortingChange"
      @columnFiltersChange="handleColumnFiltersChange"
      :manualPagination="true"
      :manualSorting="true"
      :manualFiltering="true"
    />
  </div>
</template>
