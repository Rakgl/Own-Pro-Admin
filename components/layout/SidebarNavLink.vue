<script setup lang="ts">
import type { SidebarMenuButtonVariants } from '~/components/ui/sidebar'
import type { NavLink } from '~/types/nav'
import { useSidebar } from '~/components/ui/sidebar'

withDefaults(defineProps<{
  item: NavLink
  size?: SidebarMenuButtonVariants['size']
}>(), {
  size: 'default',
})

const { setOpenMobile } = useSidebar()
const localePath = useLocalePath()
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton as-child :tooltip="$t(item.title)" :size="size">
        <NuxtLink :to="localePath(item.link)" @click="setOpenMobile(false)">
          <Icon :name="item.icon || ''" mode="svg" />
          <span>{{ $t(item.title) }}</span>
          <span v-if="item.new" class="rounded-md bg-#adfa1d px-1.5 py-0.5 text-xs text-black leading-none no-underline group-hover:no-underline">
            New
          </span>
        </NuxtLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<style scoped>

</style>
