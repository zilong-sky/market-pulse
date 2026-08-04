// server/utils/social.ts - 社交平台爬虫模块

import { getCached, setCache } from './cache'

// ===== 东方财富股吧 =====
export async function crawlGuba(keyword: string) {
  const cacheKey = `guba_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    // 搜索股吧帖子
    const url = `https://search-api-web.eastmoney.com/search/jsonp?cb=jQuery&param=${encodeURIComponent(JSON.stringify({ uid: '', keyword, type: ['gubaWebOld'], client: 'web', clientType: 'web', clientVersion: 'curr', param: { gubaWebOld: { searchScope: 'default', sort: 'default', pageIndex: 1, pageSize: 20, preTag: '', postTag: '' } } }))}`
    const res = await $fetch<any>(url, { timeout: 5000, headers: { 'Referer': 'https://so.eastmoney.com/' } })
    const text = typeof res === 'string' ? res : JSON.stringify(res)
    const jsonStr = text.replace(/^jQuery\(/, '').replace(/\);?$/, '')
    const data = JSON.parse(jsonStr)
    const posts = data?.result?.gubaWebOld?.list || []

    const titles = posts.map((p: any) => p.title.replace(/<[^>]+>/g, ''))
    const totalPosts = posts.length
    const totalReads = posts.reduce((s: number, p: any) => s + (p.readCount || 0), 0)

    const result = {
      platform: '东方财富股吧',
      posts: titles.slice(0, 10),
      totalPosts,
      totalReads,
      sourceUrl: `https://so.eastmoney.com/web/s?keyword=${encodeURIComponent(keyword)}`,
      icon: '💬'
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return degraded('东方财富股吧', '💬', `https://so.eastmoney.com/web/s?keyword=${encodeURIComponent(keyword)}`)
  }
}

// ===== 微博 =====
export async function crawlWeibo(keyword: string) {
  const cacheKey = `weibo_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    // 微博搜索移动端接口
    const url = `https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D1%26q%3D${encodeURIComponent(keyword)}&page_type=searchall`
    const res = await $fetch<any>(url, { timeout: 5000, headers: { 'Referer': 'https://m.weibo.cn/' } })
    const cards = res?.data?.cards || []
    const texts: string[] = []
    let hotRank = 0

    for (const card of cards) {
      if (card.card_group) {
        for (const item of card.card_group) {
          if (item.desc) texts.push(item.desc)
          if (item.mblog?.text) texts.push(item.mblog.text.replace(/<[^>]+>/g, ''))
        }
      }
      if (item?.mblog?.text) texts.push(item.mblog.text.replace(/<[^>]+>/g, ''))
    }

    const result = {
      platform: '微博',
      posts: texts.slice(0, 10),
      totalPosts: texts.length,
      hotRank,
      sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`,
      icon: '🌐'
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return degraded('微博', '🌐', `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`)
  }
}

// ===== 百度搜索 =====
export async function crawlBaidu(keyword: string) {
  const cacheKey = `baidu_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword + ' 股票')}&rn=20`
    const html = await $fetch<string>(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      responseType: 'text'
    })

    // 提取搜索结果数量
    const countMatch = html.match(/找到相关结果约([\d,]+)个/)
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : 0

    // 提取资讯标题
    const titles: string[] = []
    const titleMatches = html.match(/<h3[^>]*>[\s\S]*?<\/h3>/g) || []
    for (const m of titleMatches.slice(0, 15)) {
      const cleanText = m.replace(/<[^>]+>/g, '').trim()
      if (cleanText.length > 5) titles.push(cleanText)
    }

    const result = {
      platform: '百度搜索',
      posts: titles.slice(0, 10),
      totalPosts: titles.length,
      totalCount,
      sourceUrl: `https://www.baidu.com/s?wd=${encodeURIComponent(keyword + ' 股票')}`,
      icon: '🔍'
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return degraded('百度搜索', '🔍', `https://www.baidu.com/s?wd=${encodeURIComponent(keyword + ' 股票')}`)
  }
}

// ===== 知乎 =====
export async function crawlZhihu(keyword: string) {
  const cacheKey = `zhihu_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const url = `https://www.zhihu.com/api/v4/search_v3?t=general&q=${encodeURIComponent(keyword)}&correction=1&offset=0&limit=10`
    const res = await $fetch<any>(url, {
      timeout: 5000,
      headers: {
        'Referer': 'https://www.zhihu.com/search?type=content&q=' + encodeURIComponent(keyword),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const items = res?.data || []
    const titles: string[] = []
    for (const item of items) {
      if (item.object?.title) titles.push(item.object.title)
      if (item.object?.excerpt) titles.push(item.object.excerpt)
    }

    const result = {
      platform: '知乎',
      posts: titles.slice(0, 10),
      totalPosts: titles.length,
      sourceUrl: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(keyword)}`,
      icon: '📖'
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return degraded('知乎', '📖', `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(keyword)}`)
  }
}

// ===== 小红书 =====
export async function crawlXHS(keyword: string) {
  const cacheKey = `xhs_${keyword}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    // 小红书反爬严格，先尝试搜索页面
    const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_notes`
    const html = await $fetch<string>(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Referer': 'https://www.xiaohongshu.com/'
      },
      responseType: 'text'
    })

    // 尝试提取笔记数量
    const countMatch = html.match(/"total":\s*(\d+)/)
    const noteCount = countMatch ? parseInt(countMatch[1]) : 0

    // 尝试提取笔记标题
    const titles: string[] = []
    const titleMatches = html.match(/"title":"([^"]+)"/g) || []
    for (const m of titleMatches.slice(0, 10)) {
      const title = m.match(/"title":"([^"]+)"/)
      if (title) titles.push(title[1])
    }

    const result = {
      platform: '小红书',
      posts: titles,
      totalPosts: titles.length,
      noteCount,
      warning: noteCount > 50 ? '散户涌入信号⚠️' : undefined,
      sourceUrl: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`,
      icon: '📕'
    }
    setCache(cacheKey, result, 300)
    return result
  } catch {
    return degraded('小红书', '📕', `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`)
  }
}

// 降级处理
function degraded(platform: string, icon: string, sourceUrl: string) {
  return {
    platform,
    posts: [],
    totalPosts: 0,
    degraded: true,
    sourceUrl,
    icon,
    message: '数据获取失败，点击链接手动查看'
  }
}
