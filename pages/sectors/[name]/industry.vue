<template>
  <div class="min-h-screen pb-20 bg-gray-50">
    <div class="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 border-b border-gray-100">
      <button @click="goBack" class="text-brand-500 text-sm">← 返回</button>
      <div class="text-lg font-bold text-gray-800">{{ name }}行业介绍</div>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">
      <div class="animate-pulse">加载中...</div>
    </div>

    <div v-else-if="data" class="px-4 py-3 space-y-4">
      <!-- 行业概述 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-brand-600 mb-2">📖 行业概述</div>
        <p class="text-sm text-gray-700 leading-relaxed">{{ data.overview }}</p>
        <p class="text-sm text-gray-500 mt-2">{{ data.importance }}</p>
      </div>

      <!-- 产业链 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-brand-600 mb-3">🔗 上下游产业链</div>

        <div class="mb-3">
          <div class="text-xs font-bold text-gray-500 mb-1">上游</div>
          <div v-for="item in data.upstream" :key="item" class="text-sm text-gray-700 flex items-start gap-1">
            <span class="text-gray-300">•</span> {{ item }}
          </div>
        </div>

        <div class="text-center text-gray-300 my-2">⬇️</div>

        <div class="mb-3">
          <div class="text-xs font-bold text-gray-500 mb-1">中游（本行业）</div>
          <div v-for="item in data.midstream" :key="item" class="text-sm text-gray-700 flex items-start gap-1">
            <span class="text-gray-300">•</span> {{ item }}
          </div>
        </div>

        <div class="text-center text-gray-300 my-2">⬇️</div>

        <div>
          <div class="text-xs font-bold text-gray-500 mb-1">下游</div>
          <div v-for="item in data.downstream" :key="item" class="text-sm text-gray-700 flex items-start gap-1">
            <span class="text-gray-300">•</span> {{ item }}
          </div>
        </div>
      </div>

      <!-- 国产现状 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-brand-600 mb-2">🇨🇳 国产现状</div>
        <p class="text-sm text-gray-700 leading-relaxed">{{ data.domesticStatus }}</p>
      </div>

      <!-- 国外现状 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-brand-600 mb-2">🌍 国外现状</div>
        <p class="text-sm text-gray-700 leading-relaxed">{{ data.overseasStatus }}</p>
      </div>

      <!-- 代表企业 -->
      <div class="bg-white rounded-2xl p-4">
        <div class="text-sm font-bold text-brand-600 mb-2">🏢 代表企业</div>
        <div class="mb-2">
          <div class="text-xs font-bold text-gray-500 mb-1">国内</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="c in data.domesticCompanies" :key="c" class="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg">{{ c }}</span>
          </div>
        </div>
        <div>
          <div class="text-xs font-bold text-gray-500 mb-1">国外</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="c in data.overseasCompanies" :key="c" class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{{ c }}</span>
          </div>
        </div>
      </div>

      <!-- 来源 -->
      <a v-if="data.sourceUrl" :href="data.sourceUrl" target="_blank" class="block text-center text-xs text-brand-500 underline py-2">
        🔗 东方财富-{{ name }}板块
      </a>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      <div class="text-4xl mb-2">📭</div>
      <div class="text-sm">暂无该板块的行业介绍</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const name = route.params.name as string
const data = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $fetch(`/api/sectors/${name}/industry`)
    if (res.code === 0) data.value = res.data
  } catch (e) { console.error(e) }
  loading.value = false
})

function goBack() { navigateTo(`/sectors/${name}`) }
</script>
