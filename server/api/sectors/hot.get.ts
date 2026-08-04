// 热门板块TOP10（含龙头股+趋势+情绪+社交热度+资讯）
export default defineEventHandler(async () => {
  const sectors = await getSectorList()
  // 按涨幅排序取前10
  const topSectors = sectors
    .sort((a: any, b: any) => b.change - a.change)
    .slice(0, 10)

  const results = await Promise.all(
    topSectors.map(async (sector: any) => {
      const [stocks, klines, fundFlow, news] = await Promise.all([
        getSectorStocks(sector.code, 3),
        getSectorKline(sector.code, 25),
        getSectorFundFlow(sector.code),
        getSectorNews(sector.name, 3)
      ])

      // 趋势分析
      const trend = analyzeTrend(klines)

      // 市场数据情绪分（50%）
      const marketScore = calcMarketScore(sector, fundFlow)

      // 社交热度（50%）
      const socialData = await fetchSocialData(sector.name)
      const socialScore = calcSocialScore(socialData)

      // 综合情绪
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

  return { code: 0, data: results }
})

function calcMarketScore(sector: any, fundFlow: any): number {
  let score = 50
  // 涨幅 15%
  if (sector.change > 3) score += 15
  else if (sector.change > 1) score += 10
  else if (sector.change > 0) score += 5
  else if (sector.change < -3) score -= 15
  else if (sector.change < -1) score -= 10
  else if (sector.change < 0) score -= 5

  // 资金流向 15%
  if (fundFlow?.mainNetInflow > 0) score += 15
  else if (fundFlow?.mainNetInflow < 0) score -= 15

  // 涨跌家数比 10%
  if (sector.upCount > 0) {
    const ratio = sector.upCount / (sector.upCount + sector.downCount)
    score += Math.round((ratio - 0.5) * 20)
  }

  // 成交量 10%
  if (sector.amount > 10000000000) score += 10
  else if (sector.amount > 5000000000) score += 5

  return Math.max(0, Math.min(100, score))
}

function calcSocialScore(socialData: any[]): number {
  let score = 50
  for (const s of socialData) {
    if (s.degraded || s.posts.length === 0) continue
    const result = analyzeSentiment(s.posts)
    // 每个平台按权重
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
