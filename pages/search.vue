<template>
  <div class="min-h-screen pb-20 bg-gray-50">
    <div class="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-4 text-white sticky top-0 z-30">
      <div class="text-lg font-bold">🔍 搜索</div>
    </div>

    <div class="px-4 py-4">
      <input
        v-model="keyword"
        type="text"
        placeholder="输入股票代码（如600519）或名称..."
        class="w-full px-4 py-3 rounded-xl bg-white text-sm border border-gray-100 focus:outline-none focus:border-brand-400"
        @keyup.enter="search"
      />
      <button
        @click="search"
        :disabled="!keyword.trim()"
        class="w-full mt-2 py-3 rounded-xl bg-brand-500 text-white text-sm font-bold disabled:opacity-40"
      >搜索</button>

      <!-- 结果 -->
      <div v-if="stock" class="mt-4 bg-white rounded-2xl p-4 space-y-2">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-base font-bold text-gray-800">{{ stock.name }}</span>
            <span class="text-xs text-gray-400 ml-1">{{ stock.code }}</span>
          </div>
          <span class="text-lg font-bold" :class="stock.change >= 0 ? 'text-red-500' : 'text-green-500'">
            {{ stock.price?.toFixed(2) }}
          </span>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span>涨跌幅 <span :class="stock.change >= 0 ? 'text-red-500' : 'text-green-500'">{{ stock.change >= 0 ? '+' : '' }}{{ stock.change }}%</span></span>
          <span>成交量 {{ formatAmount(stock.volume) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-gray-50 rounded-lg p-2">
            <span class="text-gray-400">最高</span>
            <span class="text-red-500 ml-1">{{ stock.high?.toFixed(2) }}</span>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <span class="text-gray-400">最低</span>
            <span class="text-green-500 ml-1">{{ stock.low?.toFixed(2) }}</span>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <span class="text-gray-400">今开</span>
            <span class="ml-1">{{ stock.open?.toFixed(2) }}</span>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <span class="text-gray-400">昨收</span>
            <span class="ml-1">{{ stock.prevClose?.toFixed(2) }}</span>
          </div>
        </div>
        <div v-if="stock.mainNetInflow" class="text-xs">
          <span class="text-gray-400">主力净流入</span>
          <span class="ml-1 font-bold" :class="stock.mainNetInflow >= 0 ? 'text-red-500' : 'text-green-500'">
            {{ stock.mainNetInflow >= 0 ? '+' : '' }}{{ formatAmount(stock.mainNetInflow) }}
          </span>
        </div>
        <a :href="stock.sourceUrl" target="_blank" class="text-xs text-brand-500 underline block">🔗 东方财富-{{ stock.name }}</a>
      </div>

      <div v-if="searched && !stock" class="text-center py-12 text-gray-400 text-sm">
        未找到相关股票
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
const keyword = ref('')
const stock = ref<any>(null)
const searched = ref(false)

async function search() {
  if (!keyword.value.trim()) return
  searched.value = false
  stock.value = null
  try {
    const res = await $fetch(`/api/stock/${keyword.value.trim()}`)
    if (res.code === 0) stock.value = res.data
    searched.value = true
  } catch {
    searched.value = true
  }
}

function formatAmount(val: number) {
  if (!val) return '0'
  const abs = Math.abs(val)
  if (abs >= 100000000) return (val / 100000000).toFixed(2) + '亿'
  if (abs >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toString()
}
</script>
