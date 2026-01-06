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
