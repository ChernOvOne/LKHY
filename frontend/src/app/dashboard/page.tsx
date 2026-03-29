'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield, Zap, Clock, Copy, CheckCircle2,
  Wifi, Globe2, BookOpen, QrCode, X,
  Smartphone, Monitor, Laptop, Tv, Star, CreditCard,
  Bitcoin, Loader2, ExternalLink,
  Download, Trash2, ChevronDown, Gift, TrendingUp,
  Newspaper, Megaphone, AlertTriangle, RefreshCw,
  Wallet, History,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { userApi, publicApi, paymentsApi, userV2Api } from '@/lib/api'
import type { SubscriptionData, Tariff, HwidDevice, DevicesData, Payment } from '@/types'

/* ═══════════════════════════════════════════════════════════════ */

interface DashData {
  user: any; rmStats: any; referralUrl: string
  referralCount: number; bonusDaysEarned: number
}

export default function DashboardPage() {
  const [data, setData]           = useState<DashData | null>(null)
  const [sub, setSub]             = useState<SubscriptionData | null>(null)
  const [devices, setDevices]     = useState<HwidDevice[]>([])
  const [loading, setLoading]     = useState(true)
  const [copied, setCopied]       = useState<string | null>(null)

  // New data
  const [news, setNews]           = useState<any[]>([])
  const [promos, setPromos]       = useState<any[]>([])
  const [proxies, setProxies]     = useState<any[]>([])
  const [payments, setPayments]   = useState<Payment[]>([])
  const [notifs, setNotifs]       = useState<any[]>([])
  const [unread, setUnread]       = useState(0)
  const [balance, setBalance]     = useState(0)

  // Modals
  const [showQR, setShowQR]           = useState(false)
  const [showInstr, setShowInstr]     = useState(false)
  const [showTariff, setShowTariff]   = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showPayHist, setShowPayHist] = useState(false)
  const [showRevoke, setShowRevoke]   = useState(false)
  const [revoking, setRevoking]       = useState(false)

  const load = useCallback(() => {
    Promise.all([
      userApi.dashboard(),
      userApi.subscription().catch(() => null),
      userApi.devices().catch(() => ({ devices: [], total: 0 })),
      publicApi.tariffs().catch(() => []),
      fetch('/api/public/news').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/public/promos').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/public/proxies').then(r => r.ok ? r.json() : []).catch(() => []),
      userApi.payments().catch(() => []),
      userV2Api.notifications().catch(() => ({ notifications: [], unread: 0 })),
      userV2Api.balance().catch(() => ({ balance: 0, transactions: [] })),
    ]).then(([d, s, dev, , n, pr, px, pay, notif, bal]) => {
      setData(d); setSub(s)
      setDevices((dev as DevicesData).devices || [])
      setNews(n); setPromos(pr); setProxies(px)
      setPayments(pay as Payment[])
      setNotifs(notif.notifications || []); setUnread(notif.unread || 0)
      setBalance(bal.balance || 0)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Listen for notification toggle from layout bell
  useEffect(() => {
    const handler = () => setShowNotifs(v => !v)
    window.addEventListener('toggle-notifications', handler)
    return () => window.removeEventListener('toggle-notifications', handler)
  }, [])

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id); toast.success('Скопировано!')
    setTimeout(() => setCopied(null), 2500)
  }

  const deleteDevice = async (hwid: string) => {
    try { await userApi.deleteDevice(hwid); toast.success('Устройство удалено'); load() }
    catch { toast.error('Ошибка') }
  }

  const doRevoke = async () => {
    setRevoking(true)
    try {
      const res = await userV2Api.revokeSubscription()
      toast.success('Ссылка подписки обновлена!')
      setShowRevoke(false); load()
    } catch (e: any) { toast.error(e.message) }
    setRevoking(false)
  }

  const activateTrial = async () => {
    try {
      const res = await userV2Api.activateTrial()
      toast.success('Пробная подписка активирована!')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const markAllRead = async () => {
    await userV2Api.readAllNotifs().catch(() => {})
    setUnread(0)
  }

  if (loading) return <DashSkeleton />
  if (!data) return null

  const { user, rmStats, referralUrl, referralCount, bonusDaysEarned } = data
  const isActive = user.subStatus === 'ACTIVE' || user.subStatus === 'TRIAL'
  const isTrial = user.subStatus === 'TRIAL'
  const isNew = !isActive && user.subStatus !== 'EXPIRED' && !user.trialUsed
  const daysLeft = user.subExpireAt
    ? Math.max(0, Math.ceil((new Date(user.subExpireAt).getTime() - Date.now()) / 86400_000))
    : null
  const usedGb  = rmStats ? rmStats.usedTrafficBytes / 1e9 : null
  const limitGb = rmStats?.trafficLimitBytes ? rmStats.trafficLimitBytes / 1e9 : null
  const trafficPct = usedGb && limitGb ? Math.min(100, (usedGb / limitGb) * 100) : 0

  return (
    <div className="space-y-5 md:space-y-7">
      {/* ── Welcome ── */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          {user.telegramName
            ? <>Привет, <span className="text-gradient">{user.telegramName}</span></>
            : <span className="text-gradient">Добро пожаловать</span>}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isActive ? 'Твой VPN работает' : 'Подключи VPN за пару минут'}
        </p>
      </div>

      {/* ── Pinned news ── */}
      {news.filter(n => n.isPinned).slice(0, 1).map(n => (
        <div key={n.id} className="rounded-2xl p-4 sm:p-5 animate-slide-up" style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.05), rgba(139,92,246,0.05))',
          border: '1px solid rgba(6,182,212,0.1)',
        }}>
          <div className="flex items-start gap-3">
            <Newspaper className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22d3ee' }} />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{n.title}</h3>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.content}</p>
            </div>
          </div>
        </div>
      ))}

      {/* ── Trial offer for new users ── */}
      {isNew && (
        <div className="rounded-2xl p-5 sm:p-6 gradient-border animate-slide-up" style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))',
          border: '1px solid rgba(6,182,212,0.12)',
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--accent-gradient)' }}>
              <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base sm:text-lg">Попробуй бесплатно</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Тестовая подписка — убедись что всё работает
              </p>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <button onClick={activateTrial} className="btn-primary flex-1 sm:w-auto text-sm">
                <Zap className="w-4 h-4" /> Попробовать
              </button>
              <button onClick={() => setShowTariff(true)} className="btn-secondary flex-1 sm:w-auto text-sm">
                Тарифы
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard icon={<Wifi className="w-4 h-4" />} label="Статус"
          value={isActive ? (isTrial ? 'Пробный' : 'Активен') : 'Офлайн'}
          color={isActive ? '#34d399' : 'var(--text-tertiary)'}
          bg={isActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'} dot={isActive} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Осталось"
          value={daysLeft !== null ? `${daysLeft} дн.` : '—'} color="#22d3ee" bg="rgba(6,182,212,0.08)" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Трафик"
          value={usedGb !== null ? `${usedGb.toFixed(1)} ГБ` : '—'}
          sub={limitGb ? `/ ${limitGb.toFixed(0)}` : '∞'}
          color="#a78bfa" bg="rgba(139,92,246,0.08)" />
        <StatCard icon={<Wallet className="w-4 h-4" />} label="Баланс"
          value={`${balance.toFixed(0)} ₽`}
          color="#fbbf24" bg="rgba(245,158,11,0.08)" />
      </div>

      {/* ── Active subscription ── */}
      {isActive && sub?.subUrl && (
        <div className="glass-card gradient-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-semibold text-base sm:text-lg">Моя подписка</h2>
              {sub.expireAt && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  до {new Date(sub.expireAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <span className="badge-green"><span className="glow-dot text-emerald-400 mr-1" />
                {isTrial ? 'Пробная' : 'Активна'}</span>
              {devices.length > 0 && (
                <span className="badge-blue text-[10px]">{devices.length} устр.</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <button onClick={() => setShowQR(true)}
                    className="mx-auto sm:mx-0 flex-shrink-0 p-3 rounded-2xl gradient-border transition-transform hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.93)' }}>
              <QRCodeSVG value={sub.subUrl} size={110} bgColor="transparent" fgColor="#1a1a2e" />
            </button>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
              }}>
                <p className="flex-1 text-[11px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {sub.subUrl}
                </p>
                <button onClick={() => copyText(sub.subUrl, 'sub')}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5">
                  {copied === 'sub'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
                </button>
              </div>

              {usedGb !== null && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: 'var(--text-tertiary)' }}>Трафик</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {usedGb.toFixed(1)} ГБ {limitGb ? `/ ${limitGb.toFixed(0)} ГБ` : '(∞)'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${limitGb ? trafficPct : 30}%`, background: 'var(--accent-gradient)' }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setShowInstr(true)} className="btn-secondary text-[11px] py-2">
                  <BookOpen className="w-3.5 h-3.5" /> Подключить
                </button>
                <button onClick={() => setShowQR(true)} className="btn-secondary text-[11px] py-2">
                  <QrCode className="w-3.5 h-3.5" /> QR
                </button>
                <button onClick={() => setShowRevoke(true)} className="btn-secondary text-[11px] py-2"
                        style={{ color: '#fbbf24' }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Обновить
                </button>
              </div>
            </div>
          </div>

          {/* Devices */}
          {devices.length > 0 && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <button onClick={() => setShowDevices(!showDevices)}
                      className="flex items-center justify-between w-full text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Устройства <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>{devices.length}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDevices ? 'rotate-180' : ''}`}
                             style={{ color: 'var(--text-tertiary)' }} />
              </button>
              {showDevices && (
                <div className="mt-2 space-y-1.5 animate-slide-up">
                  {devices.map(d => (
                    <div key={d.hwid} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                    }}>
                      <DevIcon platform={d.platform} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.deviceModel || d.platform || 'Устройство'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {d.platform} {d.osVersion && `· ${d.osVersion}`}
                        </p>
                      </div>
                      <button onClick={() => deleteDevice(d.hwid)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── No subscription CTA ── */}
      {!isActive && !isNew && (
        <div className="glass-card text-center py-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center gradient-border"
               style={{ background: 'rgba(6,182,212,0.05)' }}>
            <Shield className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h2 className="font-semibold text-lg">Подписка истекла</h2>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-tertiary)' }}>Продли чтобы вернуть VPN</p>
          <button onClick={() => setShowTariff(true)} className="btn-primary">
            <Zap className="w-4 h-4" /> Выбрать тариф
          </button>
        </div>
      )}

      {/* ── Grid: referral + extend/proxies ── */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Referral */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Пригласи друга</h3>
            <span className="text-gradient text-xs font-semibold">+30 дней</span>
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>За каждого друга — бонус</p>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
          }}>
            <p className="flex-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{referralUrl}</p>
            <button onClick={() => copyText(referralUrl, 'ref')} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5">
              {copied === 'ref' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
            </button>
          </div>
          {referralCount > 0 && <p className="text-[11px] mt-2 text-emerald-400">{referralCount} чел. · +{bonusDaysEarned} дней</p>}
        </div>

        {/* Extend or TG Proxies */}
        {isActive ? (
          <div className="glass-card flex flex-col">
            <h3 className="font-medium text-sm mb-1">Продлить подписку</h3>
            <p className="text-xs flex-1" style={{ color: 'var(--text-tertiary)' }}>
              {daysLeft !== null && daysLeft < 7 ? `Осталось ${daysLeft} дн. — продли!` : 'Срок добавится к текущему'}
            </p>
            <button onClick={() => setShowTariff(true)} className="btn-secondary text-xs mt-3 w-full justify-center">
              <TrendingUp className="w-3.5 h-3.5" /> Продлить
            </button>
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center text-center">
            <Globe2 className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="font-medium text-sm">Работает везде</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>iOS, Android, Windows, macOS, Linux</p>
          </div>
        )}
      </div>

      {/* ── Active promos ── */}
      {promos.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            <Megaphone className="w-4 h-4 inline mr-1.5" style={{ color: '#a78bfa' }} />Акции
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {promos.slice(0, 4).map(p => (
              <div key={p.id} className="glass-card !p-4">
                <h4 className="font-medium text-sm mb-1">{p.title}</h4>
                {p.description && <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{p.description}</p>}
                {p.discount && <span className="badge-green text-[10px] mr-2">-{p.discount}%</span>}
                {p.buttonText && p.buttonUrl && (
                  <a href={p.buttonUrl} className="text-xs font-medium" style={{ color: '#22d3ee' }}>{p.buttonText}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TG Proxies ── */}
      {proxies.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            <Globe2 className="w-4 h-4 inline mr-1.5" style={{ color: '#22d3ee' }} />Бесплатные прокси для Telegram
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {proxies.map(p => (
              <a key={p.id} href={p.tgLink} target="_blank" rel="noopener"
                 className="glass-card !p-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(6,182,212,0.08)' }}>
                  <Globe2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  {p.tag && <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{p.tag}</span>}
                </div>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── News feed ── */}
      {news.filter(n => !n.isPinned).length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            <Newspaper className="w-4 h-4 inline mr-1.5" style={{ color: '#fbbf24' }} />Новости
          </h3>
          <div className="space-y-2">
            {news.filter(n => !n.isPinned).slice(0, 3).map(n => (
              <div key={n.id} className="glass-card !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-sm">{n.title}</h4>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{n.content}</p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(n.publishedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment history toggle ── */}
      {payments.length > 0 && (
        <div className="glass-card">
          <button onClick={() => setShowPayHist(!showPayHist)}
                  className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                История платежей <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)' }}>{payments.length}</span>
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPayHist ? 'rotate-180' : ''}`}
                         style={{ color: 'var(--text-tertiary)' }} />
          </button>
          {showPayHist && (
            <div className="mt-3 space-y-1.5 animate-slide-up">
              {payments.slice(0, 10).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                }}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'PAID' ? 'bg-emerald-400' : p.status === 'PENDING' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{p.tariff?.name || 'Платёж'}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('ru')} · {p.provider}
                    </p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: p.status === 'PAID' ? '#34d399' : 'var(--text-tertiary)' }}>
                    {p.amount.toLocaleString('ru')} {p.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {showQR && sub?.subUrl && (
        <Overlay onClose={() => setShowQR(false)}>
          <h3 className="font-semibold text-lg mb-1 text-center">QR-код подписки</h3>
          <p className="text-xs mb-5 text-center" style={{ color: 'var(--text-secondary)' }}>Отсканируй в VPN-приложении</p>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <QRCodeSVG value={sub.subUrl} size={200} bgColor="transparent" fgColor="#1a1a2e" />
            </div>
          </div>
          <button onClick={() => copyText(sub.subUrl, 'qr')} className="btn-secondary w-full justify-center text-sm">
            <Copy className="w-4 h-4" /> Скопировать ссылку
          </button>
        </Overlay>
      )}

      {showInstr && <InstructionsModal subUrl={sub?.subUrl || ''} onClose={() => setShowInstr(false)} />}
      {showTariff && <TariffModal onClose={() => { setShowTariff(false); load() }} />}

      {/* Notifications panel */}
      {showNotifs && (
        <Overlay onClose={() => { setShowNotifs(false); markAllRead() }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Уведомления</h3>
            {unread > 0 && <span className="badge-blue text-[10px]">{unread} новых</span>}
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Нет уведомлений</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {notifs.map(n => (
                <div key={n.id} className="p-3 rounded-xl" style={{
                  background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.04)',
                  border: `1px solid ${n.isRead ? 'var(--glass-border)' : 'rgba(6,182,212,0.1)'}`,
                }}>
                  <p className="text-xs font-medium">{n.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{n.message}</p>
                  <p className="text-[9px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(n.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Overlay>
      )}

      {/* Revoke warning */}
      {showRevoke && (
        <Overlay onClose={() => setShowRevoke(false)}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                 style={{ background: 'rgba(245,158,11,0.1)' }}>
              <AlertTriangle className="w-7 h-7" style={{ color: '#fbbf24' }} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Обновить ссылку подписки?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Старая ссылка перестанет работать. Вам нужно будет заново добавить подписку во всех приложениях на ваших устройствах.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowRevoke(false)} className="btn-secondary flex-1 text-sm">Отмена</button>
              <button onClick={doRevoke} disabled={revoking} className="flex-1 text-sm font-medium rounded-xl py-3 transition-all"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                {revoking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Обновить ссылку'}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

/* ═══ Sub-components ═══ */

function StatCard({ icon, label, value, sub, color, bg, dot }: any) {
  return (
    <div className="glass-card p-3 sm:p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg, color }}>{icon}</div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        {dot && <span className="glow-dot mr-1" style={{ color }} />}
        <span className="text-sm sm:text-lg font-semibold" style={{ color: dot ? color : 'var(--text-primary)' }}>{value}</span>
        {sub && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
      </div>
    </div>
  )
}

function DevIcon({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase()
  const s = { color: 'var(--text-tertiary)' }
  if (p.includes('ios') || p.includes('iphone')) return <Smartphone className="w-5 h-5" style={s} />
  if (p.includes('android')) return <Smartphone className="w-5 h-5" style={s} />
  if (p.includes('mac')) return <Laptop className="w-5 h-5" style={s} />
  if (p.includes('tv')) return <Tv className="w-5 h-5" style={s} />
  return <Monitor className="w-5 h-5" style={s} />
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up"
           style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
           onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5"
                style={{ color: 'var(--text-tertiary)' }}>
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

/* ── Instructions Modal ── */
const PLAT_ICONS: Record<string, string> = {
  ios: '🍎', android: '🤖', windows: '🪟', macos: '💻', linux: '🐧', tv: '📺', router: '🌐',
}
interface Platform { id: string; slug: string; name: string; icon: string; apps: App[] }
interface App { id: string; name: string; icon: string; isFeatured: boolean; storeUrl?: string; deeplink?: string; steps: Step[] }
interface Step { id: string; order: number; text: string; imageUrl?: string }

function InstructionsModal({ subUrl, onClose }: { subUrl: string; onClose: () => void }) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [activeP, setActiveP] = useState(''); const [activeApp, setActiveApp] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/instructions/platforms').then(r => r.json())
      .then((ps: Platform[]) => {
        setPlatforms(ps)
        const ua = navigator.userAgent.toLowerCase()
        let slug = 'windows'
        if (/iphone|ipad/.test(ua)) slug = 'ios'
        else if (/android/.test(ua)) slug = 'android'
        else if (/mac os/.test(ua)) slug = 'macos'
        else if (/linux/.test(ua)) slug = 'linux'
        const found = ps.find(p => p.slug === slug) || ps[0]
        if (found) { setActiveP(found.slug); const f = found.apps.find(a => a.isFeatured) || found.apps[0]; if (f) setActiveApp(f.id) }
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const platform = platforms.find(p => p.slug === activeP)
  const app = platform?.apps.find(a => a.id === activeApp)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 animate-slide-up"
           style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 z-10"
                style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
        <h3 className="font-semibold text-lg mb-1">Подключить устройство</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Выбери платформу</p>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div> : (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
              {platforms.map(p => (
                <button key={p.slug} onClick={() => { setActiveP(p.slug); const f = p.apps.find(a => a.isFeatured) || p.apps[0]; if (f) setActiveApp(f.id) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
                  style={{ background: activeP === p.slug ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)', color: activeP === p.slug ? '#22d3ee' : 'var(--text-secondary)', border: `1px solid ${activeP === p.slug ? 'rgba(6,182,212,0.2)' : 'var(--glass-border)'}` }}>
                  <span>{PLAT_ICONS[p.slug] || '📱'}</span> {p.name}
                </button>
              ))}
            </div>
            {platform && platform.apps.length > 1 && (
              <div className="flex gap-2 mb-4">
                {platform.apps.map(a => (
                  <button key={a.id} onClick={() => setActiveApp(a.id)} className="flex-1 py-2 rounded-xl text-xs font-medium"
                    style={{ background: activeApp === a.id ? 'rgba(255,255,255,0.06)' : 'transparent', color: activeApp === a.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {a.icon} {a.name} {a.isFeatured && <Star className="w-3 h-3 inline ml-1 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
            {app?.storeUrl && (
              <a href={app.storeUrl} target="_blank" rel="noopener"
                 className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm hover:bg-white/[0.04]"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <Download className="w-4 h-4" style={{ color: '#22d3ee' }} /><span>Скачать {app.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            )}
            {app?.deeplink && subUrl && (
              <a href={app.deeplink.replace('{url}', encodeURIComponent(subUrl))}
                 className="flex items-center justify-center gap-2 btn-primary w-full mb-4 text-sm">
                <Zap className="w-4 h-4" /> Подключить в 1 клик
              </a>
            )}
            {app?.steps && app.steps.length > 0 && (
              <div className="space-y-3">
                {app.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                         style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}
                         dangerouslySetInnerHTML={{ __html: step.text.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;font-size:11px">$1</code>') }} />
                      {step.imageUrl && <img src={step.imageUrl} alt="" className="mt-2 rounded-xl max-w-full border" style={{ borderColor: 'var(--glass-border)' }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Tariff Modal ── */
function TariffModal({ onClose }: { onClose: () => void }) {
  const [tariffs, setTariffs] = useState<Tariff[]>([]); const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Tariff | null>(null); const [paying, setPaying] = useState(false)
  const [provider, setProvider] = useState<'YUKASSA' | 'CRYPTOPAY'>('YUKASSA')

  useEffect(() => { publicApi.tariffs().then(t => { setTariffs(t.filter(t => t.isActive)); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const handleBuy = async () => {
    if (!selected) return; setPaying(true)
    try { const res = await paymentsApi.create({ tariffId: selected.id, provider }); window.location.href = res.paymentUrl }
    catch (err: any) { toast.error(err.message || 'Ошибка оплаты'); setPaying(false) }
  }
  const fmtDays = (d: number) => d === 30 ? '1 мес.' : d === 90 ? '3 мес.' : d === 180 ? '6 мес.' : d === 365 ? '1 год' : `${d} дн.`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 animate-slide-up"
           style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 z-10"
                style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
        <h3 className="font-semibold text-lg mb-1">Выбери тариф</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Без скрытых платежей</p>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div> : (
          <>
            <div className="space-y-2 mb-5">
              {tariffs.map(t => (
                <button key={t.id} onClick={() => setSelected(t)} className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                  style={{ background: selected?.id === t.id ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected?.id === t.id ? 'rgba(6,182,212,0.3)' : 'var(--glass-border)'}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.name}</span>
                      {t.isFeatured && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}>ХИТ</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {t.deviceLimit} устр. · {t.trafficGb ? `${t.trafficGb} ГБ` : '∞'} · {fmtDays(t.durationDays)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base">{t.priceRub.toLocaleString('ru')} ₽</p>
                    {t.priceUsdt && <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>≈ ${t.priceUsdt}</p>}
                  </div>
                </button>
              ))}
            </div>
            {selected && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex gap-2">
                  {[{ id: 'YUKASSA' as const, icon: CreditCard, label: 'Карта / СБП' }, { id: 'CRYPTOPAY' as const, icon: Bitcoin, label: 'Крипта' }].map(p => (
                    <button key={p.id} onClick={() => setProvider(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: provider === p.id ? 'rgba(255,255,255,0.06)' : 'transparent', border: `1px solid ${provider === p.id ? 'rgba(255,255,255,0.12)' : 'var(--glass-border)'}`, color: provider === p.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      <p.icon className="w-3.5 h-3.5" /> {p.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleBuy} disabled={paying} className="btn-primary w-full justify-center">
                  {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Переход...</> : <>Оплатить {selected.priceRub.toLocaleString('ru')} ₽</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DashSkeleton() {
  return (
    <div className="space-y-6">
      <div><div className="h-8 skeleton w-48 rounded-lg" /><div className="h-4 skeleton w-32 rounded mt-2" /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      <div className="h-56 skeleton rounded-2xl" />
      <div className="grid sm:grid-cols-2 gap-4"><div className="h-36 skeleton rounded-2xl" /><div className="h-36 skeleton rounded-2xl" /></div>
    </div>
  )
}
