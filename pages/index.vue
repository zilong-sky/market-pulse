<template>
  <div class="min-h-screen pb-20 bg-gray-50">
    <!-- 顶部 -->
    <div class="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-4 text-white sticky top-0 z-30">
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold">📈 市场行情</div>
        <div class="text-xs opacity-80">{{ now }}</div>
      </div>
      <!-- 大盘指数 -->
      <div v-if="indices.length" class="flex gap-4 mt-2">
        <div v-for="idx in indices" :key="idx.code" class="flex-1">
          <div class="text-xs opacity-80">{{ idx.name }}</div>
          <div class="text-sm font-bold">{{ idx.price.toFixed(2) }}</div>
          <div class="text-xs" :class="idx.change >= 0 ? 'text-red-200' : 'text-green-200'">
            {{ idx.change >= 0 ? '▲' : '▼' }} {{ Math.abs(idx.change).toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20 text-gray-400">
      <div class="animate-pulse text-lg">⏳ 正在分析市场数据...</div>
      <div class="text-xs mt-2">抓取东方财富+股吧+微博+百度+知乎+小红书</div>
    </div>

    <!-- 热门板块卡片 -->
    <div v-else class="px-4 py-3 space-y-3">
      <div class="text-sm font-bold text-gray-700">🔥 热门板块 TOP{{ sectors.length }}</div>

      <div
        v-for="(sector, idx) in sectors"
        :key="sector.code"
        class="bg-white rounded-2xl p-4 shadow-sm"
      >
        <!-- 板块标题 -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">{{ idx + 1 }}</span>
            <span class="text-base font-bold text-gray-800">{{ sector.name }}</span>
            <span class="text-sm font-bold" :class="sector.change >= 0 ? 'text-red-500' : 'text-green-500'">
              {{ sector.change >= 0 ? '+' : '' }}{{ sector.change }}%
            </span>
          </div>
          <NuxtLink :to="`/sectors/${sector.name}`" class="text-xs text-brand-500">详情 →</NuxtLink>
        </div>

        <!-- 情绪指数 + 趋势 -->
        <div class="flex items-center gap-4 mb-3">
          <div class="flex-1">
            <div class="text-xs text-gray-400 mb-1">情绪指数</div>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="sentimentColor(sector.sentiment.score)"
                  :style="{ width: sector.sentiment.score + '%' }"
                ></div>
              </div>
              <span class="text-sm font-bold" :class="sentimentTextColor(sector.sentiment.score)">
                {{ sector.sentiment.score }}
              </span>
              <span class="text-sm">{{ sector.sentiment.emoji }}</span>
            </div>
            <div class="text-xs text-gray-500">{{ sector.sentiment.label }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">趋势</div>
            <div class="text-lg">{{ sector.trend.emoji }}</div>
            <div class="text-xs font-medium text-gray-700">{{ sector.trend.label }}</div>
            <div class="text-xs text-gray-400">{{ sector.trend.strength }}</div>
          </div>
        </div>

        <!-- 龙头股 -->
        <div v-if="sector.leadStocks?.length" class="mb-3">
          <div class="text-xs text-gray-400 mb-1">👑 龙头股</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="stock in sector.leadStocks"
              :key="stock.code"
              class="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"
            >
              <NuxtLink :to="`/stock/${stock.code}`" class="text-xs font-medium text-gray-700">{{ stock.name }}</NuxtLink>
              <span class="text-xs" :class="stock.change >= 0 ? 'text-red-500' : 'text-green-500'">
                {{ stock.change >= 0 ? '+' : '' }}{{ stock.change }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 展开内容 -->
        <details class="group">
          <summary class="text-xs text-brand-500 cursor-pointer select-none">
            📊 查看分析依据 & 社交热度 & 资讯
          </summary>

          <!-- 分析依据 -->
          <div class="mt-2 bg-gray-50 rounded-xl p-3 space-y-2">
            <div class="text-xs font-bold text-gray-600">📊 分析依据</div>

            <!-- 市场数据 -->
            <div class="text-xs text-gray-500">
              <div class="font-bold text-gray-600 mb-1">市场数据（50%）</div>
              <div>• 涨幅：{{ sector.change >= 0 ? '+' : '' }}{{ sector.change }}%</div>
              <div v-if="sector.fundFlow">• 主力资金：{{ sector.fundFlow.mainNetInflow >= 0 ? '+' : '' }}{{ formatAmount(sector.fundFlow.mainNetInflow) }}</div>
              <div>• 上涨/下跌：{{ sector.upCount }}/{{ sector.downCount }}家</div>
              <div>• 趋势判断：{{ sector.trend.source }}</div>
              <a :href="sector.sourceUrl" target="_blank" class="text-brand-500 underline">🔗 东方财富-{{ sector.name }}</a>
            </div>

            <!-- 社交热度 -->
            <div class="text-xs text-gray-500">
              <div class="font-bold text-gray-600 mb-1">💬 社交热度（50%）</div>
              <div v-for="s in sector.social" :key="s.platform" class="flex items-center gap-2 mb-0.5">
                <span>{{ s.icon }}</span>
                <span class="w-20">{{ s.platform }}</span>
                <span v-if="!s.degraded">{{ s.totalPosts }}条讨论</span>
                <span v-else class="text-gray-400">获取失败</span>
                <a :href="s.sourceUrl" target="_blank" class="text-brand-500 underline ml-auto">查看</a>
              </div>
            </div>
          </div>

          <!-- 资讯 -->
          <div v-if="sector.news?.length" class="mt-2">
            <div class="text-xs font-bold text-gray-600 mb-1">📰 最新资讯</div>
            <div v-for="n in sector.news" :key="n.url" class="text-xs text-gray-500 mb-1">
              <a :href="n.url" target="_blank" class="hover:text-brand-500">• {{ n.title }}</a>
              <span class="text-gray-300 ml-1">{{ n.source }}</span>
            </div>
          </div>

          <!-- 行业介绍入口 -->
          <NuxtLink
            :to="`/sectors/${sector.name}/industry`"
            class="block mt-2 text-xs text-center py-2 bg-brand-50 text-brand-600 rounded-lg font-medium"
          >
            📋 查看{{ sector.name }}行业详细介绍 →
          </NuxtLink>
        </details>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
const sectors = ref<any[]>([])
const indices = ref<any[]>([])
const loading = ref(true)
const now = ref('')

onMounted(async () => {
  now.value = new Date().toLocaleString('zh-CN', { hour12: false })
  try {
    const [idxRes, hotRes] = await Promise.all([
      $fetch('/api/market/indices'),
      $fetch('/api/sectors/hot')
    ])
    if (idxRes.code === 0) indices.value = idxRes.data
    if (hotRes.code === 0) sectors.value = hotRes.data
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

function sentimentColor(score: number) {
  if (score < 25) return 'bg-green-500'
  if (score < 45) return 'bg-green-400'
  if (score < 55) return 'bg-yellow-400'
  if (score < 75) return 'bg-orange-400'
  return 'bg-red-500'
}
function sentimentTextColor(score: number) {
  if (score < 45) return 'text-green-600'
  if (score < 55) return 'text-yellow-600'
  return 'text-red-500'
}
function formatAmount(val: number) {
  if (!val) return '0'
  const abs = Math.abs(val)
  if (abs >= 100000000) return (val / 100000000).toFixed(2) + '亿'
  if (abs >= 10000) return (val / 10000).toFixed(2) + '万'
  return val.toString()
}
</script>
