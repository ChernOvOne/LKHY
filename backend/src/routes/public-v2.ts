import type { FastifyInstance } from 'fastify'
import { prisma } from '../db'

export async function publicV2Routes(app: FastifyInstance) {
  // Active news
  app.get('/news', async () => {
    return prisma.news.findMany({
      where: { isActive: true },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 20,
    })
  })

  // Active promos
  app.get('/promos', async () => {
    const now = new Date()
    return prisma.promo.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  // Active TG proxies
  app.get('/proxies', async () => {
    return prisma.tgProxy.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  })

  // Landing settings
  app.get('/landing', async () => {
    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    settings.forEach(s => { map[s.key] = s.value })
    return map
  })
}
