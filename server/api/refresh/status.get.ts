// 查询刷新状态 - 前端用来显示刷新按钮状态和最后刷新时间
import { isRefreshing, getLastRefreshTime, getLastRefreshError, getCacheMeta } from '~/server/utils/cache'

export default defineEventHandler(() => {
  return {
    code: 0,
    data: {
      isRefreshing: isRefreshing(),
      lastRefreshTime: getLastRefreshTime(),
      lastRefreshError: getLastRefreshError(),
      cacheUpdatedAt: {
        indices: getCacheMeta('market:indices').updatedAt,
        hot: getCacheMeta('sectors:hot').updatedAt,
        all: getCacheMeta('sectors:all').updatedAt
      }
    }
  }
})
