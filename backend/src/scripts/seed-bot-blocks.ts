/**
 * Seed Bot Blocks — creates default bot structure from hardcoded handlers
 * Run: npx tsx src/scripts/seed-bot-blocks.ts
 * Safe to re-run: skips if blocks already exist
 */

import { prisma } from '../db'

async function main() {
  const existing = await prisma.botBlock.count()
  if (existing > 0) {
    console.log(`⏭  ${existing} blocks already exist, skipping seed`)
    return
  }

  console.log('🌱 Seeding bot blocks...')

  // ── Groups ──────────────────────────────────────────────────
  const groups = await Promise.all([
    prisma.botBlockGroup.create({ data: { id: 'grp-main',         name: 'Главное меню',      icon: '🏠', sortOrder: 0 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-subscription', name: 'Подписка',           icon: '🔑', sortOrder: 1 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-tariffs',      name: 'Тарифы и оплата',    icon: '💳', sortOrder: 2 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-referral',     name: 'Рефералы',           icon: '👥', sortOrder: 3 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-balance',      name: 'Баланс',             icon: '💰', sortOrder: 4 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-promo',        name: 'Промокод',            icon: '🎟', sortOrder: 5 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-devices',      name: 'Устройства',         icon: '📱', sortOrder: 6 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-instructions', name: 'Инструкции',         icon: '📖', sortOrder: 7 } }),
    prisma.botBlockGroup.create({ data: { id: 'grp-onboarding',   name: 'Онбординг',          icon: '🎁', sortOrder: 8 } }),
  ])
  console.log(`  ✓ ${groups.length} groups created`)

  // ── Blocks ──────────────────────────────────────────────────

  // -- Main menu --
  const welcomeActive = await prisma.botBlock.create({
    data: {
      id: 'blk-welcome-active',
      name: 'Приветствие (активная подписка)',
      groupId: 'grp-main',
      type: 'MESSAGE',
      text: '✅ *Подписка активна!*\n\nВыберите нужный раздел:',
      parseMode: 'Markdown',
      deletePrev: 'none',
      sortOrder: 0,
    },
  })

  const welcomeExpired = await prisma.botBlock.create({
    data: {
      id: 'blk-welcome-expired',
      name: 'Приветствие (подписка истекла)',
      groupId: 'grp-main',
      type: 'MESSAGE',
      text: '⏰ *Ваша подписка истекла.*\n\nПродлите подписку или активируйте пробный период.',
      parseMode: 'Markdown',
      deletePrev: 'none',
      sortOrder: 1,
    },
  })

  const welcomeNew = await prisma.botBlock.create({
    data: {
      id: 'blk-welcome-new',
      name: 'Приветствие (новый пользователь)',
      groupId: 'grp-onboarding',
      type: 'MESSAGE',
      text: '👋 Добро пожаловать в *HIDEYOU VPN*!\n\nДля начала выберите один из вариантов:',
      parseMode: 'Markdown',
      deletePrev: 'none',
      sortOrder: 0,
    },
  })

  const mainMenu = await prisma.botBlock.create({
    data: {
      id: 'blk-main-menu',
      name: 'Главное меню',
      groupId: 'grp-main',
      type: 'MESSAGE',
      text: '👋 Добро пожаловать в *HIDEYOU VPN*!\n\nВыберите нужный раздел:',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 2,
    },
  })

  const startCondition = await prisma.botBlock.create({
    data: {
      id: 'blk-start-condition',
      name: 'Проверка подписки (/start)',
      groupId: 'grp-main',
      type: 'CONDITION',
      conditionType: 'has_sub',
      nextBlockTrue: 'blk-welcome-active',
      nextBlockFalse: 'blk-start-condition-expired',
      sortOrder: -1,
    },
  })

  const startConditionExpired = await prisma.botBlock.create({
    data: {
      id: 'blk-start-condition-expired',
      name: 'Проверка: есть RM но истекла?',
      groupId: 'grp-main',
      type: 'CONDITION',
      conditionType: 'has_remnawave',
      nextBlockTrue: 'blk-welcome-expired',
      nextBlockFalse: 'blk-welcome-new',
      sortOrder: -1,
    },
  })

  // -- Subscription --
  const subInfo = await prisma.botBlock.create({
    data: {
      id: 'blk-sub-info',
      name: 'Информация о подписке',
      groupId: 'grp-subscription',
      type: 'MESSAGE',
      text: '🔑 *Ваша подписка*\n\n📊 Статус: {subStatus}\n📅 До: {subExpireDate}\n⏳ Осталось: {daysLeft} дней\n📶 Трафик: {trafficUsed} / {trafficLimit}\n📱 Устройства: {deviceCount} / {deviceLimit}',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Tariffs --
  const tariffsList = await prisma.botBlock.create({
    data: {
      id: 'blk-tariffs-list',
      name: 'Список тарифов',
      groupId: 'grp-tariffs',
      type: 'MESSAGE',
      text: '💳 *Выберите тариф:*',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Referral --
  const referralInfo = await prisma.botBlock.create({
    data: {
      id: 'blk-referral-info',
      name: 'Реферальная программа',
      groupId: 'grp-referral',
      type: 'MESSAGE',
      text: '👥 *Реферальная программа*\n\nВаша ссылка: `{referralUrl}`\n\nПриглашено: {referralCount} чел.\nОплатили: {referralPaidCount} чел.\nНакоплено бонусных дней: {bonusDays}',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Balance --
  const balanceInfo = await prisma.botBlock.create({
    data: {
      id: 'blk-balance-info',
      name: 'Баланс',
      groupId: 'grp-balance',
      type: 'MESSAGE',
      text: '💰 *Ваш баланс: {balance} ₽*\n\nПополните баланс для оплаты подписки.',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Promo --
  const promoPrompt = await prisma.botBlock.create({
    data: {
      id: 'blk-promo-prompt',
      name: 'Ввод промокода',
      groupId: 'grp-promo',
      type: 'INPUT',
      inputPrompt: '🎟 *Введите промокод:*',
      inputVar: 'promo_code',
      inputValidation: 'text',
      sortOrder: 0,
    },
  })

  // -- Devices --
  const devicesList = await prisma.botBlock.create({
    data: {
      id: 'blk-devices-list',
      name: 'Список устройств',
      groupId: 'grp-devices',
      type: 'MESSAGE',
      text: '📱 *Ваши устройства*\n\n{deviceCount} / {deviceLimit} подключено',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Instructions --
  const instrMenu = await prisma.botBlock.create({
    data: {
      id: 'blk-instructions-menu',
      name: 'Выбор платформы',
      groupId: 'grp-instructions',
      type: 'MESSAGE',
      text: '📖 *Инструкции по настройке*\n\nВыберите вашу платформу:',
      parseMode: 'Markdown',
      deletePrev: 'buttons',
      sortOrder: 0,
    },
  })

  // -- Trial --
  const trialStart = await prisma.botBlock.create({
    data: {
      id: 'blk-trial-start',
      name: 'Активация пробного периода',
      groupId: 'grp-onboarding',
      type: 'ACTION',
      actionType: 'trial',
      actionValue: '3',
      nextBlockId: 'blk-welcome-active',
      sortOrder: 1,
    },
  })

  // -- Email linking --
  const linkEmail = await prisma.botBlock.create({
    data: {
      id: 'blk-link-email',
      name: 'Привязка email',
      groupId: 'grp-onboarding',
      type: 'INPUT',
      inputPrompt: '📧 Введите email, на который зарегистрирован аккаунт:',
      inputVar: 'link_email',
      inputValidation: 'email',
      sortOrder: 2,
    },
  })

  console.log('  ✓ blocks created')

  // ── Buttons ─────────────────────────────────────────────────

  // Main menu buttons (on welcome-active and main-menu)
  const menuButtons = [
    { label: '🔑 Подписка',   nextBlockId: 'blk-sub-info',          row: 0, col: 0 },
    { label: '💳 Тарифы',     nextBlockId: 'blk-tariffs-list',      row: 0, col: 1 },
    { label: '👥 Рефералы',   nextBlockId: 'blk-referral-info',     row: 1, col: 0 },
    { label: '💰 Баланс',     nextBlockId: 'blk-balance-info',      row: 1, col: 1 },
    { label: '🎟 Промокод',   nextBlockId: 'blk-promo-prompt',      row: 2, col: 0 },
    { label: '📱 Устройства', nextBlockId: 'blk-devices-list',      row: 2, col: 1 },
    { label: '📖 Инструкции', nextBlockId: 'blk-instructions-menu', row: 3, col: 0 },
  ]

  for (const parentId of ['blk-welcome-active', 'blk-main-menu']) {
    for (const btn of menuButtons) {
      await prisma.botButton.create({
        data: { blockId: parentId, type: 'block', ...btn },
      })
    }
    // WebApp button
    await prisma.botButton.create({
      data: { blockId: parentId, label: '🌐 Открыть ЛК', type: 'webapp', url: '/dashboard', row: 4, col: 0 },
    })
  }

  // Expired — buttons
  for (const btn of [
    { label: '💳 Выбрать тариф',  nextBlockId: 'blk-tariffs-list', row: 0, col: 0 },
    { label: '🎟 Ввести промокод', nextBlockId: 'blk-promo-prompt', row: 1, col: 0 },
  ]) {
    await prisma.botButton.create({
      data: { blockId: 'blk-welcome-expired', type: 'block', ...btn },
    })
  }
  await prisma.botButton.create({
    data: { blockId: 'blk-welcome-expired', label: '🌐 Открыть ЛК', type: 'webapp', url: '/dashboard', row: 2, col: 0 },
  })

  // New user — buttons
  for (const btn of [
    { label: '🎁 Пробный период',  nextBlockId: 'blk-trial-start',  row: 0, col: 0 },
    { label: '💳 Выбрать тариф',   nextBlockId: 'blk-tariffs-list', row: 1, col: 0 },
    { label: '📧 Привязать email',  nextBlockId: 'blk-link-email',   row: 2, col: 0 },
    { label: '🎟 Ввести промокод',  nextBlockId: 'blk-promo-prompt', row: 3, col: 0 },
  ]) {
    await prisma.botButton.create({
      data: { blockId: 'blk-welcome-new', type: 'block', ...btn },
    })
  }
  await prisma.botButton.create({
    data: { blockId: 'blk-welcome-new', label: '🌐 Открыть ЛК', type: 'webapp', url: '/dashboard', row: 4, col: 0 },
  })

  // Sub info — back + copy link
  await prisma.botButton.create({
    data: { blockId: 'blk-sub-info', label: '📋 Скопировать ссылку', type: 'block', nextBlockId: 'blk-sub-info', row: 0, col: 0 },
  })
  await prisma.botButton.create({
    data: { blockId: 'blk-sub-info', label: '🔄 Обновить ссылку', type: 'block', nextBlockId: 'blk-sub-info', row: 0, col: 1 },
  })
  await prisma.botButton.create({
    data: { blockId: 'blk-sub-info', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 1, col: 0 },
  })

  // Tariffs — back
  await prisma.botButton.create({
    data: { blockId: 'blk-tariffs-list', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 99, col: 0 },
  })

  // Referral — back + redeem
  await prisma.botButton.create({
    data: { blockId: 'blk-referral-info', label: '🎁 Использовать дни', type: 'block', nextBlockId: 'blk-referral-info', row: 0, col: 0 },
  })
  await prisma.botButton.create({
    data: { blockId: 'blk-referral-info', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 1, col: 0 },
  })

  // Balance — back
  await prisma.botButton.create({
    data: { blockId: 'blk-balance-info', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 1, col: 0 },
  })

  // Devices — back
  await prisma.botButton.create({
    data: { blockId: 'blk-devices-list', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 99, col: 0 },
  })

  // Instructions — back
  await prisma.botButton.create({
    data: { blockId: 'blk-instructions-menu', label: '◀️ Назад', type: 'block', nextBlockId: 'blk-main-menu', row: 99, col: 0 },
  })

  console.log('  ✓ buttons created')

  // ── Triggers ────────────────────────────────────────────────
  await prisma.botTrigger.create({
    data: { type: 'command', value: '/start', blockId: 'blk-start-condition', priority: 100 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:main', blockId: 'blk-main-menu', priority: 90 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:subscription', blockId: 'blk-sub-info', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:tariffs', blockId: 'blk-tariffs-list', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:referral', blockId: 'blk-referral-info', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:balance', blockId: 'blk-balance-info', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:promo', blockId: 'blk-promo-prompt', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:devices', blockId: 'blk-devices-list', priority: 80 },
  })
  await prisma.botTrigger.create({
    data: { type: 'command', value: 'menu:instructions', blockId: 'blk-instructions-menu', priority: 80 },
  })

  console.log('  ✓ triggers created')
  console.log('✅ Bot blocks seeded successfully!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
