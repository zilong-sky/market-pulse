// server/utils/trend.ts - 趋势判断模块（MA5/MA20均线系统）

export interface TrendResult {
  direction: 'up' | 'down' | 'sideways' | 'crash'
  label: string
  emoji: string
  ma5: number
  ma20: number
  ma20Slope: number    // MA20斜率（%）
  strength: string     // 强度描述
  source: string       // 数据来源说明
}

/**
 * 根据K线数据判断趋势
 * @param klines 日K数据，按时间正序，每项含 close 收盘价
 */
export function analyzeTrend(klines: { close: number; date: string }[]): TrendResult {
  if (klines.length < 20) {
    return {
      direction: 'sideways',
      label: '数据不足',
      emoji: '❓',
      ma5: 0,
      ma20: 0,
      ma20Slope: 0,
      strength: '数据不足',
      source: 'K线数据不足20根，无法计算MA20'
    }
  }

  const closes = klines.map(k => k.close)

  // MA5 = 最近5天收盘价均值
  const ma5 = avg(closes.slice(-5))

  // MA20 = 最近20天收盘价均值
  const ma20 = avg(closes.slice(-20))

  // 昨天的MA20（用倒数第21到第2根K线）
  const ma20Yesterday = avg(closes.slice(-21, -1))

  // MA20斜率 = (今天MA20 - 昨天MA20) / 昨天MA20 × 100
  const ma20Slope = ma20Yesterday > 0
    ? Math.round(((ma20 - ma20Yesterday) / ma20Yesterday) * 10000) / 100
    : 0

  let direction: TrendResult['direction']
  let label: string
  let emoji: string
  let strength: string

  const diffPercent = Math.abs(ma5 - ma20) / ma20 * 100

  if (ma5 > ma20 && ma20Slope > 0) {
    direction = 'up'
    label = '上涨通道'
    emoji = '📈'
    if (ma20Slope > 1) strength = '强势上涨 🔥'
    else if (ma20Slope > 0.3) strength = '温和上涨'
    else strength = '弱势上涨'
  } else if (ma5 < ma20 && ma20Slope < 0) {
    if (diffPercent > 3 && ma20Slope < -1) {
      direction = 'crash'
      label = '暴跌'
      emoji = '🔴'
      strength = '急速下跌 ⚠️'
    } else {
      direction = 'down'
      label = '下跌通道'
      emoji = '📉'
      if (ma20Slope < -1) strength = '强势下跌 ⚠️'
      else if (ma20Slope < -0.3) strength = '温和下跌'
      else strength = '弱势下跌'
    }
  } else {
    direction = 'sideways'
    label = '震荡'
    emoji = '📊'
    if (Math.abs(ma20Slope) < 0.3) strength = '横盘震荡'
    else if (ma20Slope > 0) strength = '偏强震荡'
    else strength = '偏弱震荡'
  }

  return {
    direction,
    label,
    emoji,
    ma5: Math.round(ma5 * 100) / 100,
    ma20: Math.round(ma20 * 100) / 100,
    ma20Slope,
    strength,
    source: `MA5=${ma5.toFixed(2)} ${ma5 > ma20 ? '>' : '<'} MA20=${ma20.toFixed(2)}，MA20斜率=${ma20Slope}%`
  }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, n) => s + n, 0) / arr.length
}
