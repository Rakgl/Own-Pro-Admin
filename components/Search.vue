<script setup lang="ts">
import { navMenu } from '@/constants/menus' 

const { metaSymbol } = useShortcuts()
const { t } = useI18n() 

const openCommand = ref(false)
const router = useRouter()

defineShortcuts({
  Meta_K: () => (openCommand.value = true),
})

function handleSelectLink(link: string) {
  if (link) {
    router.push(link)
    openCommand.value = false
  }
}
</script>

<template>
  <SidebarMenuButton as-child :tooltip="t('common.search')">
    <Button variant="outline" size="sm" class="text-xs" @click="openCommand = !openCommand">
      <Icon name="i-lucide-search" />
      <span class="font-normal group-data-[collapsible=icon]:hidden">
        {{ t('common.search') }}
      </span>
      <div class="ml-auto flex items-center group-data-[collapsible=icon]:hidden space-x-0.5">
        <BaseKbd>{{ metaSymbol }}</BaseKbd>
        <BaseKbd>K</BaseKbd>
      </div>
    </Button>
  </SidebarMenuButton>

  <CommandDialog v-model:open="openCommand">
    <CommandInput :placeholder="t('common.search')" />
    <CommandList>
      <CommandEmpty>{{ t('command.no_results') }}</CommandEmpty>

      <CommandSeparator />

      <template v-for="(menu, menuIndex) in navMenu" :key="menu.heading || menuIndex">
        <CommandGroup :heading="menu.heading ? t(menu.heading) : ''">
          <template v-for="(item, itemIndex) in menu.items" :key="item.title || itemIndex">
            
            <template v-if="item.children && item.children.length > 0">
              <CommandItem
                v-for="(child, childIndex) in item.children"
                :key="child.title || childIndex"
                :value="child.title"
                class="gap-2"
                @select="() => handleSelectLink(child.link)"
              >
                <Icon v-if="child.icon" :name="child.icon" class="h-4 w-4" />
                <span
                  v-else-if="item.icon"
                  class="h-4 w-4 flex items-center justify-center opacity-50"
                >
                  <Icon :name="item.icon" class="h-3 w-3" />
                </span>
                <span v-else class="h-4 w-4" /> 
                {{ t(child.title) }}
              </CommandItem>
            </template>

            <template v-else-if="item.link">
              <CommandItem
                :key="item.title"
                :value="item.title"
                class="gap-2"
                @select="() => handleSelectLink(item.link)"
              >
                <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4" />
                <span v-else class="h-4 w-4" /> 
                {{ t(item.title) }}
              </CommandItem>
            </template>
            
          </template>
        </CommandGroup>
        <CommandSeparator v-if="menuIndex < navMenu.length - 1" />
      </template>
    </CommandList>
  </CommandDialog>
</template>