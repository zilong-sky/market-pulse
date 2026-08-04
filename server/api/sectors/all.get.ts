// 全部板块列表 - 读缓存
import { getCached, getCacheMeta } from '~/server/utils/cache'
import { getSectorList } from '~/server/utils/eastmoney'

export default defineEventHandler(async () => {
  const cached = getCached<any[]>('sectors:all')
  if (cached) {
    return { code: 0, data: cached, cached: true, updatedAt: getCacheMeta('sectors:all').updatedAt }
  }
  const sectors = await getSectorList()
  return { code: 0, data: sectors, cached: false }
})
