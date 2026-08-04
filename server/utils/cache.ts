// server/utils/cache.ts - 内存缓存
const cache = new Map<string, { data: any; expire: number }>()

export function getCached<T>(key: string): T | null {
  const item = cache.get(key)
  if (item && item.expire > Date.now()) {
    return item.data as T
  }
  cache.delete(key)
  return null
}

export function setCache(key: string, data: any, ttlSeconds: number = 300) {
  cache.set(key, { data, expire: Date.now() + ttlSeconds * 1000 })
}
