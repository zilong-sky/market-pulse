// 全局数据管理 - 本地缓存 + 跨页面共享
// 数据拉一次存localStorage，1小时内切页面直接用，不重复请求

const CACHE_KEY = 'mp:cache'
const CACHE_TTL = 3600000 // 1小时

interface CacheData {
  indices: any[]
  hot: any[]
  all: any[]
  updatedAt: number
}

// 全局响应式状态（跨页面共享，切页面不丢失）
const state = reactive({
  indices: [] as any[],
  hot: [] as any[],
  all: [] as any[],
  updatedAt: 0,
  loading: false,
  refreshing: false,
})

let initialized = false

export function useMarketData() {
  // 首次调用时从localStorage恢复
  if (!initialized) {
    initialized = true
    restoreFromStorage()
  }

  // 是否需要刷新（超过1小时或没数据）
  const needsRefresh = computed(() => {
    if (!state.updatedAt) return true
    return Date.now() - state.updatedAt > CACHE_TTL
  })

  const cacheTimeText = computed(() => {
    if (!state.updatedAt) return ''
    const diff = Date.now() - state.updatedAt
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    return new Date(state.updatedAt).toLocaleTimeString('zh-CN', { hour12: false })
  })

  // 从localStorage恢复
  function restoreFromStorage() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return
      const data: CacheData = JSON.parse(raw)
      // 只恢复未过期的
      if (data.updatedAt && Date.now() - data.updatedAt < CACHE_TTL) {
        state.indices = data.indices || []
        state.hot = data.hot || []
        state.all = data.all || []
        state.updatedAt = data.updatedAt
      } else {
        // 过期了也先恢复数据，让页面有东西显示，后台静默刷新
        state.indices = data.indices || []
        state.hot = data.hot || []
        state.all = data.all || []
        state.updatedAt = data.updatedAt
      }
    } catch {}
  }

  // 存到localStorage
  function saveToStorage() {
    try {
      const data: CacheData = {
        indices: state.indices,
        hot: state.hot,
        all: state.all,
        updatedAt: state.updatedAt,
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {}
  }

  // 加载数据（只拉一次，之后切页面直接用state）
  async function load() {
    if (state.loading) return
    // 有数据且未过期，直接用
    if (state.hot.length > 0 && !needsRefresh.value) return
    // 有过期数据，先显示旧数据，静默拉新
    const hasOldData = state.hot.length > 0
    state.loading = !hasOldData
    try {
      const [idxRes, hotRes, allRes] = await Promise.all([
        $fetch('/api/market/indices'),
        $fetch('/api/sectors/hot'),
        $fetch('/api/sectors/all'),
      ])
      if (idxRes.code === 0) state.indices = idxRes.data
      if (hotRes.code === 0) state.hot = hotRes.data
      if (allRes.code === 0) state.all = allRes.data
      state.updatedAt = Date.now()
      saveToStorage()
    } catch (e) {
      console.error(e)
    }
    state.loading = false
  }

  // 手动刷新（点按钮触发）
  async function refresh() {
    if (state.refreshing) return
    state.refreshing = true
    try {
      const res: any = await $fetch('/api/cron/refresh', { timeout: 90000 })
      if (res.code === 0) {
        // 刷新成功，重新加载缓存数据
        const [idxRes, hotRes, allRes] = await Promise.all([
          $fetch('/api/market/indices'),
          $fetch('/api/sectors/hot'),
          $fetch('/api/sectors/all'),
        ])
        if (idxRes.code === 0) state.indices = idxRes.data
        if (hotRes.code === 0) state.hot = hotRes.data
        if (allRes.code === 0) state.all = allRes.data
        state.updatedAt = Date.now()
        saveToStorage()
      } else {
        throw new Error(res.message)
      }
    } catch (e: any) {
      throw e
    }
    state.refreshing = false
  }

  // 从热门板块缓存中查找某个板块
  function findSector(name: string): any | null {
    return state.hot.find((s: any) => s.name === name) || null
  }

  return {
    state: readonly(state),
    needsRefresh,
    cacheTimeText,
    load,
    refresh,
    findSector,
  }
}
