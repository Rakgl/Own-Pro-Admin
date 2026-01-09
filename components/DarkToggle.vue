<script setup lang="ts">
const color = useColorMode()

const modes = [
  { value: 'light', icon: 'i-ph-sun-dim-duotone', label: 'Light' },
  { value: 'dark', icon: 'i-ph-moon-stars-duotone', label: 'Dark' },
  { value: 'system', icon: 'i-lucide-monitor', label: 'System' },
]

const activeMode = computed(() => modes.find(m => m.value === color.preference) || modes[2])
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" title="Toggle Color Scheme" aria-label="button dark toggle">
        <Icon :name="activeMode.icon" class="h-[1.2rem] w-[1.2rem] transition-all text-primary" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuItem
          v-for="mode in modes"
          :key="mode.value"
          flex="~ gap-2"
          :class="{ 'bg-accent text-primary font-bold': color.preference === mode.value }"
          @click="color.preference = mode.value"
        >
          <Icon :name="mode.icon" size="16" />
          <span>{{ mode.label }}</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
