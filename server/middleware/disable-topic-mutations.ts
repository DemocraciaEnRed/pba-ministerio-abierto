export default defineEventHandler((event) => {
  if (!event.path.match(/\/api\/consultations\/[^/]+\/topics(?:\/|$)/)) return
  if (event.path.match(/\/topics\/[^/]+\/(?:comments|support|vote|survey)(?:\/|$)/)) return
  if (event.node.req.method === 'GET' || event.node.req.method === 'HEAD') return

  throw createError({
    statusCode: 410,
    message: 'La gestión de temas de participación está deshabilitada'
  })
})
