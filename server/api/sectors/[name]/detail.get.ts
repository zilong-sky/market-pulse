// 板块详情（成分股+资金流+趋势+情绪+社交+资讯）
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) return { code: 1, message: '缺少板块名称' }

  const sectors = await getSectorList()
  const sector = sectors.find((s: any) => s.name === name)
  if (!sector) return { code: 1, message: '板块不存在' }

  const [stocks, klines, fundFlow, news] = await Promise.all([
    getSectorStocks(sector.code, 20),
    getSectorKline(sector.code, 25),
    getSectorFundFlow(sector.code),
    getSectorNews(sector.name, 5)
  ])

  const trend = analyzeTrend(klines)
  const marketScore = calcMarketScore(sector, fundFlow)
  const socialData = await fetchSocialData(sector.name)
  const socialScore = calcSocialScore(socialData)
  const sentiment = combineSentiment(marketScore, socialScore)

  return {
    code: 0,
    data: {
      ...sector,
      stocks,
      trend,
      sentiment,
      fundFlow,
      news,
      social: socialData,
      sourceUrl: `https://data.eastmoney.com/bkzj/${sector.code}.html`
    }
  }
})

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
      '东方财富股吧': 15, '微博': 15, '百度搜索': 10, '知乎': 5, '小红书': 5
    }
    const w = weights[s.platform] || 5
    score += (result.score - 50) * (w / 50)
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

async function fetchSocialData(keyword: string) {
  const [guba, weibo, baidu, zhihu, xhs] = await Promise.allSettled([
    crawlGuba(keyword), crawlWeibo(keyword), crawlBaidu(keyword),
    crawlZhihu(keyword), crawlXHS(keyword)
  ])
  return [
    guba.status === 'fulfilled' ? guba.value : null,
    weibo.status === 'fulfilled' ? weibo.value : null,
    baidu.status === 'fulfilled' ? baidu.value : null,
    zhihu.status === 'fulfilled' ? zhihu.value : null,
    xhs.status === 'fulfilled' ? xhs.value : null
  ].filter(Boolean)
}
