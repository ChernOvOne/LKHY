import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma }    from '../db'
import { remnawave } from '../services/remnawave'
import { logger }    from '../utils/logger'
import { randomBytes } from 'crypto'

export async function userV2Routes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', async (req) => {
    if (!(req.user as any)) throw app.httpErrors.unauthorized()
  })

  // ═══════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  app.get('/notifications', async (req) => {
    // Get user-specific + broadcast notifications
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: (req.user as any).sub }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    const unread = notifications.filter(n => !n.isRead && n.userId === (req.user as any).sub).length
    return { notifications, unread }
  })

  app.post('/notifications/:id/read', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: (req.user as any).sub },
      data: { isRead: true },
    })
    return { ok: true }
  })

  app.post('/notifications/read-all', async (req) => {
    await prisma.notification.updateMany({
      where: { userId: (req.user as any).sub, isRead: false },
      data: { isRead: true },
    })
    return { ok: true }
  })

  // ═══════════════════════════════════════════════════════════
  //  BALANCE
  // ═══════════════════════════════════════════════════════════

  app.get('/balance', async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).sub },
      select: { balance: true },
    })
    const transactions = await prisma.balanceTransaction.findMany({
      where: { userId: (req.user as any).sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { balance: user?.balance ?? 0, transactions }
  })

  // ═══════════════════════════════════════════════════════════
  //  TRIAL ACTIVATION
  // ═══════════════════════════════════════════════════════════

  app.post('/activate-trial', async (req) => {
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).sub } })
    if (!user) throw app.httpErrors.notFound()
    if (user.trialUsed) throw app.httpErrors.badRequest('Trial already used')
    if (user.subStatus === 'ACTIVE') throw app.httpErrors.badRequest('Already have active subscription')

    // Get trial settings from DB
    const settings = await prisma.setting.findMany()
    const cfg: Record<string, string> = {}
    settings.forEach(s => { cfg[s.key] = s.value })

    const trialEnabled = cfg['trial_enabled'] !== 'false'
    if (!trialEnabled) throw app.httpErrors.badRequest('Trial not available')

    const trialDays           = parseInt(cfg['trial_days'] || '3', 10)
    const trialDeviceLimit    = parseInt(cfg['trial_device_limit'] || '1', 10)
    const trialTrafficGb      = parseInt(cfg['trial_traffic_gb'] || '0', 10)
    const trialTrafficStrategy = cfg['trial_traffic_strategy'] || 'NO_RESET'
    const trialSquads         = cfg['trial_squads'] ? JSON.parse(cfg['trial_squads']) : []

    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + trialDays)

    // Create in REMNAWAVE
    const username = `trial_${randomBytes(6).toString('hex')}`
    try {
      const rwUser = await remnawave.createUser({
        username,
        status:               'ACTIVE',
        expireAt:             expireAt.toISOString(),
        trafficLimitBytes:    trialTrafficGb > 0 ? trialTrafficGb * 1e9 : 0,
        trafficLimitStrategy: trialTrafficStrategy,
        hwidDeviceLimit:      trialDeviceLimit,
        telegramId:           user.telegramId ? parseInt(user.telegramId, 10) : null,
        email:                user.email || null,
        activeInternalSquads: trialSquads,
        tag:                  'TRIAL',
      })

      // Update local user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          remnawaveUuid: rwUser.uuid,
          subStatus:     'TRIAL',
          subExpireAt:   expireAt,
          subLink:       rwUser.subscriptionUrl,
          trialUsed:     true,
        },
      })

      return { ok: true, subUrl: rwUser.subscriptionUrl, expireAt: expireAt.toISOString() }
    } catch (err: any) {
      logger.error('Trial activation failed:', err.message)
      throw app.httpErrors.internalServerError('Failed to activate trial')
    }
  })

  // ═══════════════════════════════════════════════════════════
  //  GIFT SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════

  // Create a gift
  app.post('/gifts', async (req: FastifyRequest<{ Body: any }>) => {
    const { tariffId, message, recipientEmail } = req.body as any
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } })
    if (!tariff) throw app.httpErrors.notFound('Tariff not found')

    const gift = await prisma.giftSubscription.create({
      data: {
        senderId: (req.user as any).sub,
        tariffId,
        message,
        recipientEmail,
      },
    })

    return {
      ok: true,
      giftCode: gift.code,
      giftUrl: `${process.env.DOMAIN || ''}/gift/${gift.code}`,
    }
  })

  // My sent gifts
  app.get('/gifts', async (req) => {
    return prisma.giftSubscription.findMany({
      where: { senderId: (req.user as any).sub },
      include: {
        tariff:   { select: { name: true, durationDays: true, priceRub: true } },
        receiver: { select: { telegramName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  // ═══════════════════════════════════════════════════════════
  //  REVOKE SUBSCRIPTION (user self-service)
  // ═══════════════════════════════════════════════════════════

  app.post('/revoke-subscription', async (req) => {
    const user = await prisma.user.findUnique({ where: { id: (req.user as any).sub } })
    if (!user?.remnawaveUuid) throw app.httpErrors.badRequest('No subscription')

    const result = await remnawave.revokeSubscription(user.remnawaveUuid)
    if (result?.subscriptionUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subLink: result.subscriptionUrl },
      })
    }

    return { ok: true, newSubUrl: result?.subscriptionUrl }
  })
}
