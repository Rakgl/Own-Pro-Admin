import type { ColumnDef, Table } from '@tanstack/vue-table';
import { h } from 'vue';
import type { Role } from '../data/schema'; // Ensure this path is correct and Role includes avatarUrl
import { Checkbox } from '@/components/ui/checkbox';
import DataTableColumnHeader from './DataTableColumnHeader.vue';
import RoleRowActions from './DataTableRowActions.vue';

interface CustomTableMeta {
  onDataChanged?: () => void;
}

export const roleColumns: ColumnDef<Role>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        checked:
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate'),
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all',
        class: 'translate-y-0.5',
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        ariaLabel: 'Select row',
        class: 'translate-y-0.5',
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'index',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: '#' }),
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      const globalIndex = pageIndex * pageSize + row.index + 1;
      return h('div', { class: 'font-medium' }, globalIndex);
    },
    enableSorting: false,
    enableHiding: false,
  },
  // ✨ NEW AVATAR COLUMN START
  {
    accessorKey: 'image',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Avatar' }),
    cell: ({ row }) => {
      const image = row.getValue('image') as string | undefined;
      const name = (row.getValue('name') as string) || 'User'; // Fallback name

      if (image) {
        return h('img', {
          src: image,
          alt: `${name}'s avatar`,
          class: 'w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700', // Added border
        });
      } else {
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        return h(
          'div',
          {
            class:
              'w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600', // Added border
          },
          initials || 'N/A'
        );
      }
    },
    enableSorting: false, // Avatars are typically not sortable
    enableHiding: true, // Allow users to hide this column if they prefer
    meta: {
      cellClass: 'flex justify-center items-center', // Optional: center the avatar in its cell
    },
  },
  // ✨ NEW AVATAR COLUMN END
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
      const statusValue = row.getValue('status');
      const status = String(statusValue || '').toLowerCase();
      const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
      let statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';

      if (String(statusValue) === 'ACTIVE') {
        statusClass = 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400';
      } else if (String(statusValue) === 'INACTIVE') {
        statusClass = 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400';
      }
      return h(
        'div',
        {
          class: `px-2 py-1 inline-block rounded font-semibold ${statusClass}`,
        },
        statusText
      );
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Actions' }),
    cell: ({ row, table }) => {
      const meta = table.options.meta as CustomTableMeta;
      return h(RoleRowActions, {
        row,
        onDataChanged: meta?.onDataChanged,
      });
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      cellClass: 'text-right',
    },
  },
];
