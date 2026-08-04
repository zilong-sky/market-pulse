<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around z-50" style="padding-bottom: env(safe-area-inset-bottom);">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="flex flex-col items-center py-2 px-4"
      :class="isActive(tab.path) ? 'text-brand-600' : 'text-gray-400'"
    >
      <span class="text-xl">{{ tab.icon }}</span>
      <span class="text-xs mt-0.5">{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const tabs = [
  { path: '/', icon: '📈', label: '仪表盘' },
  { path: '/sectors', icon: '🔥', label: '板块' },
  { path: '/search', icon: '🔍', label: '搜索' }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
