// 定时刷新任务 - Vercel Cron每小时调用
// vercel.json配置: { "crons": [{ "path": "/api/cron/refresh", "schedule": "0 * * * *" }] }
import { fetchAndCacheAllData } from '~/server/utils/data-fetcher'
import { isRefreshing, setRefreshing, setLastRefreshTime, setLastRefreshError } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  // 防止重复刷新
  if (isRefreshing()) {
    return { code: 0, message: '已有刷新任务正在运行', skipped: true }
  }

  setRefreshing(true)
  try {
    const result = await fetchAndCacheAllData()
    setLastRefreshTime(Date.now())
    setLastRefreshError(null)
    return { 
      code: 0, 
      message: '刷新成功',
      data: result,
      refreshedAt: new Date().toISOString()
    }
  } catch (e: any) {
    setLastRefreshError(e.message || '刷新失败')
    return { code: 1, message: '刷新失败: ' + (e.message || '未知错误') }
  } finally {
    setRefreshing(false)
  }
})
