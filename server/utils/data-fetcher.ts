// server/utils/data-fetcher.ts - 核心数据抓取逻辑（供定时任务和手动刷新共用）
import { getSectorList, getIndices, getSectorStocks, getSectorKline, getSectorFundFlow, getSectorNews } from './eastmoney'
import { analyzeTrend } from './trend'
import { analyzeSentiment } from './sentiment'
import { crawlGuba, crawlWeibo, crawlBaidu, crawlZhihu, crawlXHS } from './social'
import { setCache } from './cache'

export async function fetchAndCacheAllData() {
  // 1. 大盘指数
  const indices = await getIndices()
  setCache('market:indices', indices, 7200)

  // 2. 全部板块列表
  const allSectors = await getSectorList()
  setCache('sectors:all', allSectors, 7200)

  // 3. 热门板块TOP10（含情绪+趋势+龙头+社交+资讯）
  const topSectors = [...allSectors]
    .sort((a: any, b: any) => b.change - a.change)
    .slice(0, 10)

  const hotResults = await Promise.all(
    topSectors.map(async (sector: any) => {
      const [stocks, klines, fundFlow, news] = await Promise.all([
        getSectorStocks(sector.code, 3),
        getSectorKline(sector.code, 25),
        getSectorFundFlow(sector.code),
        getSectorNews(sector.name, 3)
      ])

      const trend = analyzeTrend(klines)
      const marketScore = calcMarketScore(sector, fundFlow)
      const socialData = await fetchSocialData(sector.name)
      const socialScore = calcSocialScore(socialData)
      const sentiment = combineSentiment(marketScore, socialScore)

      return {
        ...sector,
        leadStocks: stocks,
        trend,
        sentiment,
        fundFlow,
        news,
        social: socialData,
        sourceUrl: `https://data.eastmoney.com/bkzj/${sector.code}.html`
      }
    })
  )
  setCache('sectors:hot', hotResults, 7200)

  return { indices, sectorsCount: allSectors.length, hotCount: hotResults.length }
}

function calcMarketScore(sector: any, fundFlow: any): number {
  let score = 50
  if (sector.change > 3) score += 15
  else if (sector.change > 1) score += 10
  else if (sector.change > 0) score += 5
  else if (sector.change < -3) score -= 15
  else if (sector.change < -1) score -= 10
  else if (sector.change < 0) score -= 5

  if (fundFlow?.mainNetInflow > 0) score += 15
  else if (fundFlow?.mainNetInflow < 0) score -= 15

  if (sector.upCount > 0) {
    const ratio = sector.upCount / (sector.upCount + sector.downCount)
    score += Math.round((ratio - 0.5) * 20)
  }

  if (sector.amount > 10000000000) score += 10
  else if (sector.amount > 5000000000) score += 5

  return Math.max(0, Math.min(100, score))
}

function calcSocialScore(socialData: any[]): number {
  let score = 50
  for (const s of socialData) {
    if (s.degraded || s.posts.length === 0) continue
    const result = analyzeSentiment(s.posts)
    const weights: Record<string, number> = {
      '东方财富股吧': 15,
      '微博': 15,
      '百度搜索': 10,
      '知乎': 5,
      '小红书': 5
    }
    const w = weights[s.platform] || 5
    score += (result.score - 50) * (w / 50)
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

async function fetchSocialData(keyword: string) {
  const [guba, weibo, baidu, zhihu, xhs] = await Promise.allSettled([
    crawlGuba(keyword),
    crawlWeibo(keyword),
    crawlBaidu(keyword),
    crawlZhihu(keyword),
    crawlXHS(keyword)
  ])
  return [
    guba.status === 'fulfilled' ? guba.value : null,
    weibo.status === 'fulfilled' ? weibo.value : null,
    baidu.status === 'fulfilled' ? baidu.value : null,
    zhihu.status === 'fulfilled' ? zhihu.value : null,
    xhs.status === 'fulfilled' ? xhs.value : null
  ].filter(Boolean)
}
