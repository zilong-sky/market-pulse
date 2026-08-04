// 行业介绍
import { INDUSTRY_DATA } from '../../utils/industry-data'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  const data = (INDUSTRY_DATA as any)[name || ''] || null

  if (!data) {
    return {
      code: 0,
      data: null,
      message: '暂无该板块的行业介绍数据'
    }
  }

  return { code: 0, data }
})
