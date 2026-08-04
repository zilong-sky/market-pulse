// 大盘指数
export default defineEventHandler(async () => {
  const indices = await getIndices()
  return { code: 0, data: indices }
})
