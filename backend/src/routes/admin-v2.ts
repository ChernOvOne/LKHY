import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma }    from '../db'
import { remnawave } from '../services/remnawave'
import { logger }    from '../utils/logger'

// ── Audit helper ──────────────────────────────────────────────
async function audit(adminId: string, action: string, targetType?: string, targetId?: string, details?: any, ip?: string) {
  await prisma.auditLog.create({
    data: { adminId, action, targetType, targetId, details: details ? JSON.stringify(details) : null, ip },
  }).catch(() => {})
}

export async function adminV2Routes(app: FastifyInstance) {
  // All routes require admin
  app.addHook('preHandler', async (req) => {
    if (!(req.user as any) || ((req.user as any)?.role) !== 'ADMIN') {
      throw app.httpErrors.forbidden('Admin access required')
    }
  })

  // ═══════════════════════════════════════════════════════════
  //  NEWS CRUD
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/news', async () => {
    return prisma.news.findMany({ orderBy: { publishedAt: 'desc' } })
  })

  app.post('/admin/news', async (req: FastifyRequest<{ Body: any }>) => {
    const { title, content, imageUrl, isActive, isPinned } = req.body as any
    const news = await prisma.news.create({
      data: { title, content, imageUrl, isActive: isActive ?? true, isPinned: isPinned ?? false },
    })
    await audit((req.user as any).sub, 'news.create', 'news', news.id, { title }, req.ip)
    return news
  })

  app.put('/admin/news/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: any }>) => {
    const { title, content, imageUrl, isActive, isPinned } = req.body as any
    const news = await prisma.news.update({
      where: { id: req.params.id },
      data: { title, content, imageUrl, isActive, isPinned },
    })
    await audit((req.user as any).sub, 'news.update', 'news', news.id, { title }, req.ip)
    return news
  })

  app.delete('/admin/news/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await prisma.news.delete({ where: { id: req.params.id } })
    await audit((req.user as any).sub, 'news.delete', 'news', req.params.id, null, req.ip)
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  PROMOS CRUD
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/promos', async () => {
    return prisma.promo.findMany({ orderBy: { createdAt: 'desc' } })
  })

  app.post('/admin/promos', async (req: FastifyRequest<{ Body: any }>) => {
    const data = req.body as any
    const promo = await prisma.promo.create({ data })
    await audit((req.user as any).sub, 'promo.create', 'promo', promo.id, { title: data.title }, req.ip)
    return promo
  })

  app.put('/admin/promos/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: any }>) => {
    const promo = await prisma.promo.update({
      where: { id: req.params.id },
      data: req.body as any,
    })
    await audit((req.user as any).sub, 'promo.update', 'promo', promo.id, null, req.ip)
    return promo
  })

  app.delete('/admin/promos/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await prisma.promo.delete({ where: { id: req.params.id } })
    await audit((req.user as any).sub, 'promo.delete', 'promo', req.params.id, null, req.ip)
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  TG PROXIES CRUD
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/proxies', async () => {
    return prisma.tgProxy.findMany({ orderBy: { sortOrder: 'asc' } })
  })

  app.post('/admin/proxies', async (req: FastifyRequest<{ Body: any }>) => {
    const data = req.body as any
    const proxy = await prisma.tgProxy.create({ data })
    await audit((req.user as any).sub, 'proxy.create', 'proxy', proxy.id, { name: data.name }, req.ip)
    return proxy
  })

  app.put('/admin/proxies/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: any }>) => {
    const proxy = await prisma.tgProxy.update({
      where: { id: req.params.id },
      data: req.body as any,
    })
    return proxy
  })

  app.delete('/admin/proxies/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await prisma.tgProxy.delete({ where: { id: req.params.id } })
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  // Send notification (to specific user or broadcast)
  app.post('/admin/notifications', async (req: FastifyRequest<{ Body: any }>) => {
    const { userId, title, message, type, link } = req.body as any
    const notif = await prisma.notification.create({
      data: { userId: userId || null, title, message, type: type || 'INFO', link },
    })
    await audit((req.user as any).sub, 'notification.send', 'notification', notif.id, { userId, title }, req.ip)
    return notif
  })

  // List all sent notifications
  app.get('/admin/notifications', async (req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>) => {
    const page  = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 50)
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { telegramName: true, email: true } } },
      }),
      prisma.notification.count(),
    ])
    return { notifications, total }
  })

  // ═══════════════════════════════════════════════════════════
  //  ADMIN NOTES on users
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/users/:userId/notes', async (req: FastifyRequest<{ Params: { userId: string } }>) => {
    return prisma.adminNote.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/admin/users/:userId/notes', async (req: FastifyRequest<{ Params: { userId: string }; Body: any }>) => {
    const { content } = req.body as any
    return prisma.adminNote.create({
      data: { userId: req.params.userId, adminId: (req.user as any).sub, content },
    })
  })

  app.delete('/admin/notes/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await prisma.adminNote.delete({ where: { id: req.params.id } })
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  AUDIT LOG
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/audit-log', async (req: FastifyRequest<{ Querystring: { page?: string; limit?: string; action?: string } }>) => {
    const page   = Number(req.query.page || 1)
    const limit  = Number(req.query.limit || 50)
    const where  = req.query.action ? { action: { contains: req.query.action } } : {}
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])
    return { logs, total }
  })

  // ═══════════════════════════════════════════════════════════
  //  REMNAWAVE ACTIONS (enhanced user management)
  // ═══════════════════════════════════════════════════════════

  // Disable user in REMNAWAVE
  app.post('/admin/users/:id/disable-rw', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user?.remnawaveUuid) throw app.httpErrors.badRequest('User has no REMNAWAVE UUID')
    await remnawave.disableUser(user.remnawaveUuid)
    await prisma.user.update({ where: { id: user.id }, data: { subStatus: 'INACTIVE' } })
    await audit((req.user as any).sub, 'user.disable_rw', 'user', user.id, null, req.ip)
    return { ok: true }
  })

  // Reset traffic in REMNAWAVE
  app.post('/admin/users/:id/reset-traffic', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user?.remnawaveUuid) throw app.httpErrors.badRequest('User has no REMNAWAVE UUID')
    await remnawave.resetTraffic(user.remnawaveUuid)
    await audit((req.user as any).sub, 'user.reset_traffic', 'user', user.id, null, req.ip)
    return { ok: true }
  })

  // Revoke subscription (new sub URL)
  app.post('/admin/users/:id/revoke', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user?.remnawaveUuid) throw app.httpErrors.badRequest('User has no REMNAWAVE UUID')
    const result = await remnawave.revokeSubscription(user.remnawaveUuid)
    if (result?.subscriptionUrl) {
      await prisma.user.update({ where: { id: user.id }, data: { subLink: result.subscriptionUrl } })
    }
    await audit((req.user as any).sub, 'user.revoke', 'user', user.id, null, req.ip)
    return { ok: true, newSubUrl: result?.subscriptionUrl }
  })

  // Update sub link manually
  app.put('/admin/users/:id/sub-link', async (req: FastifyRequest<{ Params: { id: string }; Body: any }>) => {
    const { subLink } = req.body as any
    await prisma.user.update({ where: { id: req.params.id }, data: { subLink } })
    await audit((req.user as any).sub, 'user.update_sub_link', 'user', req.params.id, { subLink }, req.ip)
    return { ok: true }
  })

  // Get full REMNAWAVE user data
  app.get('/admin/users/:id/remnawave', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user?.remnawaveUuid) return { data: null }
    try {
      const rwUser = await remnawave.getUser(user.remnawaveUuid)
      const devices = await remnawave.getDevices(user.remnawaveUuid).catch(() => null)
      return { data: rwUser, devices }
    } catch (err) {
      return { data: null, error: 'REMNAWAVE unavailable' }
    }
  })

  // Delete user completely
  app.delete('/admin/users/:id/delete', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) throw app.httpErrors.notFound()

    // Delete from REMNAWAVE if exists
    if (user.remnawaveUuid) {
      try { await remnawave.deleteUser(user.remnawaveUuid) } catch {}
    }

    // Delete all related data
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.adminNote.deleteMany({ where: { userId: user.id } })
    await prisma.notification.deleteMany({ where: { userId: user.id } })
    await prisma.balanceTransaction.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })

    await audit((req.user as any).sub, 'user.delete', 'user', user.id, { email: user.email, tg: user.telegramName }, req.ip)
    return { ok: true }
  })

  // Balance adjustment
  app.post('/admin/users/:id/balance', async (req: FastifyRequest<{ Params: { id: string }; Body: any }>) => {
    const { amount, description } = req.body as any
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount === 0) throw app.httpErrors.badRequest('Invalid amount')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: { balance: { increment: numAmount } },
      }),
      prisma.balanceTransaction.create({
        data: {
          userId: req.params.id,
          amount: numAmount,
          type: 'ADMIN',
          description: description || `Admin adjustment: ${numAmount > 0 ? '+' : ''}${numAmount}`,
        },
      }),
    ])
    await audit((req.user as any).sub, 'user.balance', 'user', req.params.id, { amount: numAmount, description }, req.ip)
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  REMNAWAVE SYSTEM INFO
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/remnawave/health', async () => {
    try {
      return await remnawave.getHealth()
    } catch { return { error: 'REMNAWAVE unavailable' } }
  })

  app.get('/admin/remnawave/nodes', async () => {
    try {
      return await remnawave.getNodesMetrics()
    } catch { return { error: 'REMNAWAVE unavailable', nodes: [] } }
  })

  // ═══════════════════════════════════════════════════════════
  //  GIFTS
  // ═══════════════════════════════════════════════════════════

  app.get('/admin/gifts', async () => {
    return prisma.giftSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { telegramName: true, email: true } },
        receiver: { select: { telegramName: true, email: true } },
        tariff: { select: { name: true, durationDays: true } },
      },
    })
  })
}
