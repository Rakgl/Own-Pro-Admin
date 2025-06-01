<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { computed, ref, watch } from 'vue';
import { roleStatuses } from '../data/data'; // Assuming this path is correct
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'; // Assuming this path is correct
import DataTableViewOptions from './DataTableViewOptions.vue'; // Assuming this path is correct
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast/use-toast';
import { Toaster } from '@/components/ui/toast';
// import { Icon } from '#components'; // Assuming Icon is globally available or imported if using Nuxt UI / Iconify

// Mock useApi for standalone example if not provided
const useApi = () => {
  return async <T extends { success: boolean; message?: string; data?: any }>(
    url: string,
    options: { method: string; body: any }
  ): Promise<T> => {
    console.log('Mock API call:', url, options);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate a successful response
    if (options.body.name === 'fail') {
      return { success: false, message: 'Simulated API failure to create role.' } as T;
    }
    return { success: true, data: { id: Date.now(), ...options.body } } as T;
  };
};

interface DataTableToolbarProps {
  table: Table<TData>;
  onDataChanged?: () => void;
}

const props = defineProps<DataTableToolbarProps>();
const { toast } = useToast();
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

const isNewRoleDialogOpen = ref(false);
const newRoleData = ref({
  name: '',
  status: 'ACTIVE',
  description: '',
});

watch(isNewRoleDialogOpen, (isOpen) => {
  if (isOpen) {
    newRoleData.value = {
      name: '',
      status: 'ACTIVE',
      description: '',
    };
  }
});

const api = useApi();

const handleCreateRole = async () => {
  if (!newRoleData.value.name.trim()) {
    toast({
      title: 'Validation Error',
      description: 'Role name cannot be empty.',
      variant: 'destructive',
    });
    return;
  }
  if (!newRoleData.value.status) {
    toast({
      title: 'Validation Error',
      description: 'Please select a role status.',
      variant: 'destructive',
    });
    return;
  }

  try {
    const response = await api<{ success: boolean; message?: string; data?: any }>('/roles', {
      method: 'POST',
      body: newRoleData.value,
    });

    if (!response.success) {
      throw new Error(response.message || `Failed to create role.`);
    }
    isNewRoleDialogOpen.value = false;
    toast({
      title: 'Role Created Successfully!',
      description: `The role "${newRoleData.value.name}" has been added.`,
      variant: 'default', // Or 'success' if you have one
    });
    props.onDataChanged?.();
  } catch (error: any) {
    console.error('Error creating role:', error);
    toast({
      title: 'Error Creating Role',
      description: error.message || 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
  }
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between py-4">
      <div class="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by name..."
          v-model="localSearchValue"
          class="h-9 w-[180px] lg:w-[280px] rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <DataTableFacetedFilter
          v-if="table.getColumn('status')"
          :column="table.getColumn('status')"
          title="Status"
          :options="roleStatuses"
        />

        <Button
          v-if="isFiltered"
          variant="ghost"
          class="h-9 px-3 lg:px-4 text-sm"
          @click="
            () => {
              table.resetColumnFilters();
              localSearchValue = ''; // Also clear the local search input
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
              fill-rule="evenodd"
              d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687L4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5l3.469-3.468Z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </Button>
      </div>

      <div class="flex items-center space-x-2">
        <Dialog v-model:open="isNewRoleDialogOpen">
          <DialogTrigger as-child>
            <Button
              variant="outline"
              class="h-9 flex items-center text-sm rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 15 15"
                class="mr-2 h-4 w-4"
              >
                <path
                  fill="currentColor"
                  d="M7.5 1a.5.5 0 0 0-.5.5V7H1a.5.5 0 0 0 0 1h6.5v6.5a.5.5 0 0 0 1 0V8H14a.5.5 0 0 0 0-1H8V1.5a.5.5 0 0 0-.5-.5Z"
                ></path>
              </svg>
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-md bg-card text-card-foreground rounded-lg shadow-lg">
            <DialogHeader class="p-6">
              <DialogTitle class="text-xl font-semibold">Create New Role</DialogTitle>
              <DialogDescription class="text-sm text-muted-foreground mt-1">
                Define the properties for the new role. Required fields are marked with an asterisk
                (*).
              </DialogDescription>
            </DialogHeader>
            <form @submit.prevent="handleCreateRole" class="px-6 pb-6 space-y-6">
              <div class="space-y-2">
                <label for="new-role-name" class="block text-sm font-medium text-foreground">
                  Role Name <span class="text-destructive">*</span>
                </label>
                <Input
                  id="new-role-name"
                  v-model="newRoleData.name"
                  class="w-full h-10 rounded-md border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Content Editor"
                  required
                />
              </div>

              <div class="space-y-2">
                <label for="new-role-status" class="block text-sm font-medium text-foreground">
                  Status <span class="text-destructive">*</span>
                </label>
                <Select v-model="newRoleData.status" required>
                  <SelectTrigger
                    class="w-full h-10 rounded-md border-input bg-background px-3 py-2 text-sm"
                    id="new-role-status"
                  >
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent class="bg-popover text-popover-foreground rounded-md shadow-lg">
                    <SelectItem
                      v-for="statusOption in roleStatuses"
                      :key="statusOption.value"
                      :value="statusOption.value"
                      class="hover:bg-accent focus:bg-accent"
                    >
                      {{ statusOption.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <label for="new-role-description" class="block text-sm font-medium text-foreground">
                  Description <span class="text-xs text-muted-foreground">(Optional)</span>
                </label>
                <Textarea
                  id="new-role-description"
                  v-model="newRoleData.description"
                  class="w-full min-h-[80px] rounded-md border-input bg-background px-3 py-2 text-sm"
                  placeholder="Provide a brief summary of the role's responsibilities and permissions."
                />
              </div>

              <DialogFooter
                class="pt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0"
              >
                <Button
                  type="button"
                  variant="outline"
                  @click="isNewRoleDialogOpen = false"
                  class="w-full sm:w-auto h-9 rounded-md text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  class="w-full sm:w-auto h-9 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <DataTableViewOptions :table="table" />
      </div>
    </div>
    <Toaster />
  </div>
</template>

<style>
/* Add any global styles or component-specific styles here if needed */
/* For example, to ensure the dialog overlay is dark enough */
/* This might be handled by shadcn/ui defaults already */

/* Placeholder for roleStatuses if not provided */
/*
const roleStatuses = [
  { value: 'ACTIVE', label: 'Active', icon: 'i-lucide-check-circle' },
  { value: 'INACTIVE', label: 'Inactive', icon: 'i-lucide-x-circle' },
  { value: 'PENDING', label: 'Pending', icon: 'i-lucide-clock' },
];
*/
</style>
