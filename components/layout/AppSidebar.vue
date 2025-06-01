<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav';
import { navMenu, navMenuBottom } from '~/constants/menus';

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item) return resolveComponent('LayoutSidebarNavGroup');
  return resolveComponent('LayoutSidebarNavLink');
}

const teams: {
  name: string;
  logo: string;
  plan: string;
}[] = [
  {
    name: 'Acme Inc',
    logo: 'i-lucide-gallery-vertical-end',
    plan: 'Enterprise',
  },
  {
    name: 'Acme Corp.',
    logo: 'i-lucide-audio-waveform',
    plan: 'Startup',
  },
  {
    name: 'Evil Corp.',
    logo: 'i-lucide-command',
    plan: 'Free',
  },
];

const user: {
  name: string;
  email: string;
  avatar: string;
} = {
  name: 'Dian Pratama',
  email: 'dianpratama2@gmail.com',
  avatar: '/avatars/avatartion.png',
};

const { sidebar } = useAppSettings();
const { hasPermission, isAuthenticated } = useAuthPermission();

// Filter navigation items based on permissions
function filterNavItemsByPermission(items: any[]): any[] {
  return items
    .filter((item) => {
      // If no permission is required, show the item
      if (!item.permission) return true;

      // If user is not authenticated, hide items with permissions
      if (!isAuthenticated.value) return false;

      // Check if user has the required permission
      return hasPermission(item.permission);
    })
    .map((item) => {
      // If item has children (NavGroup), recursively filter them
      if ('children' in item && item.children) {
        return {
          ...item,
          children: filterNavItemsByPermission(item.children),
        };
      }
      return item;
    });
}

// Filter nav menu sections based on permissions
const filteredNavMenu = computed(() => {
  return navMenu
    .map((navSection) => ({
      ...navSection,
      items: filterNavItemsByPermission(navSection.items),
    }))
    .filter((navSection) => navSection.items.length > 0); // Remove empty sections
});

// Filter bottom navigation items
const filteredNavMenuBottom = computed(() => {
  return navMenuBottom ? filterNavItemsByPermission(navMenuBottom) : [];
});
</script>

<template>
  <Sidebar :collapsible="sidebar.collapsible" :side="sidebar.side" :variant="sidebar.variant">
    <SidebarHeader>
      <!-- <LayoutSidebarNavHeader :teams="teams" /> -->
      <Search />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in filteredNavMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ nav.heading }}
        </SidebarGroupLabel>

        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in nav.items"
          :key="index"
          :item="item"
        />
      </SidebarGroup>

      <!-- <SidebarGroup v-if="filteredNavMenuBottom.length > 0" class="mt-auto">
        <component
          :is="resolveNavItemComponent(item)"
          v-for="(item, index) in filteredNavMenuBottom"
          :key="index"
          :item="item"
          size="sm"
        />
      </SidebarGroup> -->
    </SidebarContent>
    <SidebarFooter>
      <LayoutSidebarNavFooter :user="user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped></style>
