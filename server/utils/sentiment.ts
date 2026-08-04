// server/utils/sentiment.ts - 情绪分析引擎

// 正面词（热情/看多）
const POSITIVE_WORDS = [
  '抄底', '加仓', '满仓', '牛市', '暴涨', '大涨', '涨停', '利好',
  '突破', '龙头', '强势', '起飞', '翻倍', '拉升', '放量上涨',
  '看好', '买入', '增持', '低估', '机会', '爆发', '反转',
  '启动', '主升浪', '加仓', '减亏', '政策利好', '超预期',
  '业绩大增', '订单', '产能', '供不应求', '涨疯了', '连板',
  '打板', '低吸', '反包', '新高', '逼空', '行情来了'
]

// 负面词（恐慌/看空）
const NEGATIVE_WORDS = [
  '割肉', '清仓', '空仓', '熊市', '暴跌', '大跌', '跌停', '利空',
  '破位', '跳水', '闪崩', '恐慌', '跑路', '止损', '减仓', '减持',
  '高估', '危险', '见顶', '泡沫', '崩盘', '被套', '血亏', '踩雷',
  '暴雷', '退市', '缩量下跌', '破发', '新低', '阴跌', '诱多',
  '出货', '砸盘', '闷杀', '天地板', '核按钮', '腰斩', '爆仓',
  '黑天鹅', '被收割', '骗炮', '杀跌', '断头铡'
]

export interface SentimentResult {
  score: number       // 0-100，越高越热情
  positiveCount: number
  negativeCount: number
  totalTexts: number
  positiveWords: string[]
  negativeWords: string[]
  label: string       // 极度恐慌/偏恐慌/中性/偏热情/极度狂热
  emoji: string
}

export function analyzeSentiment(texts: string[]): SentimentResult {
  let positiveCount = 0
  let negativeCount = 0
  const foundPositive: string[] = []
  const foundNegative: string[] = []

  for (const text of texts) {
    for (const word of POSITIVE_WORDS) {
      if (text.includes(word)) {
        positiveCount++
        if (!foundPositive.includes(word)) foundPositive.push(word)
      }
    }
    for (const word of NEGATIVE_WORDS) {
      if (text.includes(word)) {
        negativeCount++
        if (!foundNegative.includes(word)) foundNegative.push(word)
      }
    }
  }

  const total = positiveCount + negativeCount
  let score = 50
  if (total > 0) {
    score = Math.round((positiveCount / total) * 100)
  }

  return {
    score,
    positiveCount,
    negativeCount,
    totalTexts: texts.length,
    positiveWords: foundPositive,
    negativeWords: foundNegative,
    ...getLabel(score)
  }
}

function getLabel(score: number) {
  if (score < 25) return { label: '极度恐慌', emoji: '😱' }
  if (score < 45) return { label: '偏恐慌', emoji: '😰' }
  if (score < 55) return { label: '中性', emoji: '😐' }
  if (score < 75) return { label: '偏热情', emoji: '🔥' }
  return { label: '极度狂热', emoji: '🚀' }
}

// 综合情绪打分（市场数据 + 社交数据）
export function combineSentiment(marketScore: number, socialScore: number): SentimentResult {
  const score = Math.round(marketScore * 0.5 + socialScore * 0.5)
  return {
    score,
    positiveCount: 0,
    negativeCount: 0,
    totalTexts: 0,
    positiveWords: [],
    negativeWords: [],
    ...getLabel(score)
  }
}
