// server/utils/eastmoney.ts - 东方财富数据层

const BASE = 'https://push2.eastmoney.com'
const BASE_HIS = 'https://push2his.eastmoney.com'
const BASE_EX = 'https://push2ex.eastmoney.com'

// 获取大盘指数
export async function getIndices() {
  // 1.000001=上证 0.399001=深证 0.399006=创业板
  const url = `${BASE}/api/qt/ulist.np/get?fields=f1,f2,f3,f4,f12,f14&secids=1.000001,0.399001,0.399006`
  const res = await $fetch<any>(url, { timeout: 5000 })
  if (!res?.data?.diff) return []
  return res.data.diff.map((item: any) => ({
    name: item.f14,
    code: item.f12,
    price: item.f2 / 100,
    change: item.f3 / 100,
    changeAmount: item.f4 / 100
  }))
}

// 获取行业板块列表（涨幅排序）
export async function getSectorList(): Promise<any[]> {
  // b:BK0475=行业板块
  const url = `${BASE}/api/qt/clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f2,f3,f4,f12,f14,f8,f6,f104,f105,f128,f136`
  const cacheKey = 'em_sectors'
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await $fetch<any>(url, { timeout: 5000 })
    if (!res?.data?.diff) return []
    const sectors = res.data.diff.map((item: any) => ({
      code: item.f12,           // 板块代码 BKxxxx
      name: item.f14,           // 板块名称
      change: item.f3 / 100,    // 涨跌幅 %
      turnover: item.f8 / 100,  // 换手率 %
      amount: item.f6,          // 成交额
      upCount: item.f104,       // 上涨家数
      downCount: item.f105,     // 下跌家数
      leadStock: item.f128,     // 领涨股
      leadChange: item.f136 ? item.f136 / 100 : 0  // 领涨股涨幅
    }))
    setCache(cacheKey, sectors, 300)
    return sectors
  } catch {
    return []
  }
}

// 获取板块成分股（龙头股）
export async function getSectorStocks(sectorCode: string, limit: number = 5): Promise<any[]> {
  // b:板块代码
  const url = `${BASE}/api/qt/clist/get?pn=1&pz=${limit}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=b:${sectorCode}&fields=f2,f3,f4,f12,f14,f20,f6`
  const cacheKey = `em_stocks_${sectorCode}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await $fetch<any>(url, { timeout: 5000 })
    if (!res?.data?.diff) return []
    const stocks = res.data.diff.map((item: any) => ({
      code: item.f12,
      name: item.f14,
      price: item.f2 / 100,
      change: item.f3 / 100,
      amount: item.f6,
      marketCap: item.f20   // 市值
    }))
    setCache(cacheKey, stocks, 300)
    return stocks
  } catch {
    return []
  }
}

// 获取板块K线数据（用于趋势判断）
export async function getSectorKline(sectorCode: string, days: number = 25): Promise<{ close: number; date: string }[]> {
  // 板块secid格式：90.BKxxxx
  const secid = `90.${sectorCode}`
  const url = `${BASE_HIS}/api/qt/stock/kline/get?secid=${secid}&klt=101&fqt=0&end=20500101&lmt=${days}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56`
  const cacheKey = `em_kline_${sectorCode}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await $fetch<any>(url, { timeout: 5000 })
    if (!res?.data?.klines) return []
    const klines = res.data.klines.map((line: string) => {
      const parts = line.split(',')
      return {
        date: parts[0],
        close: parseFloat(parts[2])
      }
    })
    setCache(cacheKey, klines, 300)
    return klines
  } catch {
    return []
  }
}

// 获取板块资金流向
export async function getSectorFundFlow(sectorCode: string) {
  const url = `${BASE}/api/qt/clist/get?pn=1&pz=1&po=1&np=1&fltt=2&invt=2&fid=f62&fs=b:${sectorCode}&fields=f12,f14,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87`
  const cacheKey = `em_fund_${sectorCode}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await $fetch<any>(url, { timeout: 5000 })
    if (!res?.data?.diff || res.data.diff.length === 0) return null
    const item = res.data.diff[0]
    const result = {
      mainNetInflow: item.f62,       // 主力净流入
      mainNetInflowPct: item.f184 ? item.f184 / 100 : 0,  // 主力净流入占比
      superLargeNetInflow: item.f66, // 超大单净流入
      largeNetInflow: item.f72,      // 大单净流入
      mediumNetInflow: item.f78,     // 中单净流入
      smallNetInflow: item.f84       // 小单净流入
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return null
  }
}

// 获取涨跌停统计
export async function getLimitStats() {
  // 涨停板
  const upLimitUrl = `${BASE_EX}/api/qt/clist/get?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f12,f14&fid=f3&pz=500`
  try {
    const res = await $fetch<any>(upLimitUrl, { timeout: 5000 })
    let upLimit = 0
    let downLimit = 0
    if (res?.data?.diff) {
      for (const item of res.data.diff) {
        if (item.f3 >= 9.9) upLimit++
        if (item.f3 <= -9.9) downLimit++
      }
    }
    return { upLimit, downLimit }
  } catch {
    return { upLimit: 0, downLimit: 0 }
  }
}

// 获取板块资讯
export async function getSectorNews(keyword: string, limit: number = 5): Promise<any[]> {
  const url = `https://search-api-web.eastmoney.com/search/jsonp?cb=jQuery&param=${encodeURIComponent(JSON.stringify({ uid: '', keyword, type: ['cmsArticleWebOld'], client: 'web', clientType: 'web', clientVersion: 'curr', param: { cmsArticleWebOld: { searchScope: 'default', sort: 'default', pageIndex: 1, pageSize: limit, preTag: '', postTag: '' } } }))}`
  const cacheKey = `em_news_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await $fetch<any>(url, { timeout: 5000 })
    // 解析jsonp
    const text = typeof res === 'string' ? res : JSON.stringify(res)
    const jsonStr = text.replace(/^jQuery\(/, '').replace(/\);?$/, '')
    const data = JSON.parse(jsonStr)
    const articles = data?.result?.cmsArticleWebOld?.list || []
    const news = articles.map((a: any) => ({
      title: a.title.replace(/<[^>]+>/g, ''),
      date: a.date,
      url: a.url,
      source: a.mediaName || '东方财富'
    }))
    setCache(cacheKey, news, 300)
    return news
  } catch {
    return []
  }
}

import { getCached, setCache } from './cache'
