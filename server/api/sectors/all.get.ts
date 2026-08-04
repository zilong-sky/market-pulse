// 全部板块列表
export default defineEventHandler(async () => {
  const sectors = await getSectorList()
  return { code: 0, data: sectors }
})
