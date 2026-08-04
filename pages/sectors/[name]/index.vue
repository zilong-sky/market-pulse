<template>
  <div class="min-h-screen pb-20 bg-gray-50">
    <div class="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 border-b border-gray-100">
      <button @click="goBack" class="text-brand-500 text-sm">← 返回</button>
      <div class="text-lg font-bold text-gray-800">{{ sector?.name || '板块详情' }}</div>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">
      <div class="animate-pulse">正在抓取数据...</div>
    </div>

    <div v-else-if="sector" class="px-4 py-3 space-y-3">
      <!-- 概览 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xl font-bold" :class="sector.change >= 0 ? 'text-red-500' : 'text-green-500'">
            {{ sector.change >= 0 ? '+' : '' }}{{ sector.change }}%
          </span>
          <span class="text-sm text-gray-400">成交 {{ formatAmount(sector.amount) }}</span>
        </div>
        <div class="text-xs text-gray-400">{{ sector.upCount }}涨 / {{ sector.downCount }}跌 · 领涨：{{ sector.leadStock }}</div>
      </div>

      <!-- 情绪+趋势 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="flex items-center gap-6">
          <div class="flex-1">
            <div class="text-xs text-gray-400 mb-1">情绪指数</div>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :class="sentimentColor(sector.sentiment.score)" :style="{ width: sector.sentiment.score + '%' }"></div>
              </div>
              <span class="text-lg font-bold">{{ sector.sentiment.score }}</span>
              <span class="text-lg">{{ sector.sentiment.emoji }}</span>
            </div>
            <div class="text-xs text-gray-500">{{ sector.sentiment.label }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">趋势</div>
            <div class="text-2xl">{{ sector.trend.emoji }}</div>
            <div class="text-sm font-medium">{{ sector.trend.label }}</div>
            <div class="text-xs text-gray-400">{{ sector.trend.strength }}</div>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2">{{ sector.trend.source }}</div>
      </div>

      <!-- 龙头股 -->
      <div v-if="sector.stocks?.length" class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-gray-700 mb-2">👑 成分股</div>
        <div class="space-y-1">
          <NuxtLink
            v-for="stock in sector.stocks"
            :key="stock.code"
            :to="`/stock/${stock.code}`"
            class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
          >
            <div>
              <span class="text-sm font-medium text-gray-800">{{ stock.name }}</span>
              <span class="text-xs text-gray-400 ml-1">{{ stock.code }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold" :class="stock.change >= 0 ? 'text-red-500' : 'text-green-500'">{{ stock.change >= 0 ? '+' : '' }}{{ stock.change }}%</span>
              <span class="text-xs text-gray-400">{{ formatAmount(stock.amount) }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 资金流向 -->
      <div v-if="sector.fundFlow" class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-gray-700 mb-2">💰 资金流向</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-gray-50 rounded-lg p-2">
            <div class="text-gray-400">主力净流入</div>
            <div class="font-bold" :class="sector.fundFlow.mainNetInflow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ sector.fundFlow.mainNetInflow >= 0 ? '+' : '' }}{{ formatAmount(sector.fundFlow.mainNetInflow) }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <div class="text-gray-400">超大单净流入</div>
            <div class="font-bold" :class="sector.fundFlow.superLargeNetInflow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatAmount(sector.fundFlow.superLargeNetInflow) }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <div class="text-gray-400">大单净流入</div>
            <div class="font-bold" :class="sector.fundFlow.largeNetInflow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatAmount(sector.fundFlow.largeNetInflow) }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <div class="text-gray-400">小单净流入</div>
            <div class="font-bold" :class="sector.fundFlow.smallNetInflow >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ formatAmount(sector.fundFlow.smallNetInflow) }}
            </div>
          </div>
        </div>
        <a :href="sector.sourceUrl" target="_blank" class="text-xs text-brand-500 underline mt-2 block">🔗 东方财富-资金流向</a>
      </div>

      <!-- 社交热度 -->
      <div v-if="sector.social?.length" class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-gray-700 mb-2">💬 社交热度</div>
        <div v-for="s in sector.social" :key="s.platform" class="mb-2 pb-2 border-b border-gray-50 last:border-0">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium">{{ s.icon }} {{ s.platform }}</span>
            <a :href="s.sourceUrl" target="_blank" class="text-xs text-brand-500 underline">查看</a>
          </div>
          <div v-if="!s.degraded" class="text-xs text-gray-400 mt-0.5">
            {{ s.totalPosts }}条讨论
            <span v-if="s.warning" class="text-orange-500 ml-1">{{ s.warning }}</span>
          </div>
          <div v-else class="text-xs text-gray-300 mt-0.5">{{ s.message }}</div>
        </div>
      </div>

      <!-- 资讯 -->
      <div v-if="sector.news?.length" class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-gray-700 mb-2">📰 最新资讯</div>
        <div v-for="n in sector.news" :key="n.url" class="py-1.5 border-b border-gray-50 last:border-0">
          <a :href="n.url" target="_blank" class="text-sm text-gray-700 hover:text-brand-500">{{ n.title }}</a>
          <div class="text-xs text-gray-300">{{ n.source }} · {{ n.date }}</div>
        </div>
      </div>

      <!-- 行业介绍入口 -->
      <NuxtLink
        :to="`/sectors/${sector.name}/industry`"
        class="block bg-brand-50 rounded-2xl p-4 text-center"
      >
        <span class="text-sm font-bold text-brand-600">📋 查看{{ sector.name }}行业详细介绍 →</span>
      </NuxtLink>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sector = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  const name = route.params.name as string
  try {
    const res = await $fetch(`/api/sectors/${name}/detail`)
    if (res.code === 0) sector.value = res.data
  } catch (e) { console.error(e) }
  loading.value = false
})

function goBack() { navigateTo('/sectors') }
function sentimentColor(score: number) {
  if (score < 25) return 'bg-green-500'
  if (score < 45) return 'bg-green-400'
  if (score < 55) return 'bg-yellow-400'
  if (score < 75) return 'bg-orange-400'
  return 'bg-red-500'
}
function formatAmount(val: number) {
  if (!val) return '0'
  const abs = Math.abs(val)
  if (abs >= 100000000) return (val / 100000000).toFixed(2) + '亿'
  if (abs >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toString()
}
</script>
