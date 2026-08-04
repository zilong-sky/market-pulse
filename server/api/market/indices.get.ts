// 大盘指数 - 读缓存
import { getCached, getCacheMeta } from '~/server/utils/cache'
import { getIndices } from '~/server/utils/eastmoney'

export default defineEventHandler(async () => {
  const cached = getCached<any[]>('market:indices')
  if (cached) {
    return { code: 0, data: cached, cached: true, updatedAt: getCacheMeta('market:indices').updatedAt }
  }
  // 缓存miss时才抓取（首次冷启动）
  const indices = await getIndices()
  return { code: 0, data: indices, cached: false }
})
