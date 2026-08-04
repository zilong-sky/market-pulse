// 热门板块TOP10 - 只读缓存，不触发爬虫
import { getCached, getCacheMeta } from '~/server/utils/cache'

export default defineEventHandler(async () => {
  const cached = getCached<any[]>('sectors:hot')
  if (cached) {
    return { code: 0, data: cached, cached: true, updatedAt: getCacheMeta('sectors:hot').updatedAt }
  }
  // 缓存miss（首次冷启动），返回空数据提示用户刷新
  return { 
    code: 0, 
    data: [], 
    cached: false, 
    message: '数据正在准备中，请点击右上角刷新按钮或等待定时任务自动刷新' 
  }
})
