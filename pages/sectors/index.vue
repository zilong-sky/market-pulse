<template>
  <div class="min-h-screen pb-20 bg-gray-50">
    <div class="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-4 text-white sticky top-0 z-30">
      <div class="text-lg font-bold">🔥 全部板块</div>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">
      <div class="animate-pulse">加载中...</div>
    </div>

    <div v-else class="px-4 py-3">
      <!-- 排序 -->
      <div class="flex gap-2 mb-3">
        <button @click="sortBy = 'change'" class="px-3 py-1 rounded-lg text-xs font-medium" :class="sortBy === 'change' ? 'bg-brand-500 text-white' : 'bg-white text-gray-500'">按涨幅</button>
        <button @click="sortBy = 'amount'" class="px-3 py-1 rounded-lg text-xs font-medium" :class="sortBy === 'amount' ? 'bg-brand-500 text-white' : 'bg-white text-gray-500'">按成交额</button>
        <button @click="sortBy = 'upCount'" class="px-3 py-1 rounded-lg text-xs font-medium" :class="sortBy === 'upCount' ? 'bg-brand-500 text-white' : 'bg-white text-gray-500'">按上涨数</button>
      </div>

      <!-- 板块列表 -->
      <div class="space-y-2">
        <NuxtLink
          v-for="sector in sortedSectors"
          :key="sector.code"
          :to="`/sectors/${sector.name}`"
          class="block bg-white rounded-xl p-3 active:bg-gray-50"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-bold text-gray-800">{{ sector.name }}</span>
              <span class="text-xs text-gray-400 ml-2">领涨：{{ sector.leadStock }}</span>
            </div>
            <span class="text-sm font-bold" :class="sector.change >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ sector.change >= 0 ? '+' : '' }}{{ sector.change }}%
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>成交 {{ formatAmount(sector.amount) }}</span>
            <span>{{ sector.upCount }}涨 / {{ sector.downCount }}跌</span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
const sectors = ref<any[]>([])
const loading = ref(true)
const sortBy = ref('change')

const sortedSectors = computed(() => {
  const list = [...sectors.value]
  if (sortBy.value === 'change') return list.sort((a, b) => b.change - a.change)
  if (sortBy.value === 'amount') return list.sort((a, b) => b.amount - a.amount)
  if (sortBy.value === 'upCount') return list.sort((a, b) => b.upCount - a.upCount)
  return list
})

onMounted(async () => {
  try {
    const res = await $fetch('/api/sectors/all')
    if (res.code === 0) sectors.value = res.data
  } catch (e) { console.error(e) }
  loading.value = false
})

function formatAmount(val: number) {
  if (!val) return '0'
  if (val >= 100000000) return (val / 100000000).toFixed(2) + '亿'
  if (val >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toString()
}
</script>
