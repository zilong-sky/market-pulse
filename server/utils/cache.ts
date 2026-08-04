// server/utils/cache.ts - 内存缓存（Serverless全局缓存）
// 配合Vercel Cron每小时预热，页面只读缓存不触发爬虫

const cache = new Map<string, { data: any; expire: number; updatedAt: number }>()

export function getCached<T>(key: string): T | null {
  const item = cache.get(key)
  if (item && item.expire > Date.now()) {
    return item.data as T
  }
  // 过期了但数据还在，返回旧数据（宁可旧数据也不要空）
  if (item) {
    return item.data as T
  }
  return null
}

export function getCacheMeta(key: string): { updatedAt: number | null } {
  const item = cache.get(key)
  return { updatedAt: item ? item.updatedAt : null }
}

export function setCache(key: string, data: any, ttlSeconds: number = 3600) {
  const now = Date.now()
  cache.set(key, { data, expire: now + ttlSeconds * 1000, updatedAt: now })
}

export function isCacheExpired(key: string): boolean {
  const item = cache.get(key)
  if (!item) return true
  return item.expire <= Date.now()
}

// 全局刷新状态标记，防止重复刷新
let refreshing = false
let lastRefreshTime: number | null = null
let lastRefreshError: string | null = null

export function isRefreshing() { return refreshing }
export function setRefreshing(v: boolean) { refreshing = v }
export function getLastRefreshTime() { return lastRefreshTime }
export function setLastRefreshTime(t: number) { lastRefreshTime = t }
export function getLastRefreshError() { return lastRefreshError }
export function setLastRefreshError(e: string | null) { lastRefreshError = e }
