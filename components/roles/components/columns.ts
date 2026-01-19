import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { Role } from '../data/schema'
import { Badge } from '@/components/ui/badge'
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
    label: 'common.active', // Changed to key
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-400 border border-green-200 dark:border-green-600/30',
    dotClass: 'bg-green-500 dark:bg-green-400',
  },
  INACTIVE: {
    label: 'common.inactive', // Changed to key
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-400 border border-red-200 dark:border-red-600/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  DEFAULT: {
    label: 'common.unknown', // Changed to key
    badgeClass:
      'bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
}

export const roleColumns: ColumnDef<Role>[] = [
  {
    id: 'index',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'common.index' }), // Key
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      const globalIndex = pageIndex * pageSize + row.index + 1
      return h('div', { class: 'font-medium' }, globalIndex)
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'common.name' }), // Key
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'common.description' }), // Key
    cell: ({ row }) => h('div', {}, row.getValue('description') || 'N/A'),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'common.status' }), // Key
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
          // We wrap the label in a function that will be translated by the component
          useNuxtApp().$i18n.t(config.label),
        ],
      )
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'common.actions' }), // Key
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