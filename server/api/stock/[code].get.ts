// 个股查询
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) return { code: 1, message: '缺少股票代码' }

  // 判断沪市(6开头)还是深市(0/3开头)
  const secid = code.startsWith('6') ? `1.${code}` : `0.${code}`

  // 实时行情
  const quoteUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f47,f48,f50,f57,f58,f60,f62,f170,f171`
  try {
    const res = await $fetch<any>(quoteUrl, { timeout: 5000 })
    if (!res?.data) return { code: 1, message: '股票不存在' }

    const d = res.data
    return {
      code: 0,
      data: {
        code: d.f57,
        name: d.f58,
        price: d.f43 / 100,
        change: d.f170 / 100,
        changeAmount: d.f169 ? d.f169 / 100 : 0,
        high: d.f44 / 100,
        low: d.f45 / 100,
        open: d.f46 / 100,
        prevClose: d.f60 / 100,
        volume: d.f47,
        amount: d.f48,
        turnover: d.f50 ? d.f50 / 100 : 0,
        mainNetInflow: d.f62,
        sourceUrl: `https://quote.eastmoney.com/${code.startsWith('6') ? 'sh' : 'sz'}${code}.html`
      }
    }
  } catch {
    return { code: 1, message: '查询失败' }
  }
})
