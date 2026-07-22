export default defineEventHandler(async () => {
  try {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`

    return {
      ok: result[0]?.ok === 1,
      database: 'mysql'
    }
  } catch (error) {
    console.error('Database health check failed:', error)

    throw createError({
      statusCode: 503,
      statusMessage: 'Database is not available'
    })
  }
})
