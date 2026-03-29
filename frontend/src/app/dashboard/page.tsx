'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Shield, Zap, Users, Clock, Copy, CheckCircle2,
  Wifi, Globe2, BookOpen, QrCode, X,
  Smartphone, Monitor, Laptop, Tv, Star, CreditCard,
  Bitcoin, Loader2, ExternalLink,
  Download, Trash2, ChevronDown, Gift, TrendingUp,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { userApi, publicApi, paymentsApi } from '@/lib/api'
import type { SubscriptionData, Tariff, HwidDevice, DevicesData } from '@/types'

/* ═══════════════════════════════════════════════════════════════
   UNIFIED DASHBOARD — всё в одном
   ═══════════════════════════════════════════════════════════════ */

interface DashData {
  user: any; rmStats: any; referralUrl: string
  referralCount: number; bonusDaysEarned: number
}

export default function DashboardPage() {
  const [data, setData]         = useState<DashData | null>(null)
  const [sub, setSub]           = useState<SubscriptionData | null>(null)
  const [devices, setDevices]   = useState<HwidDevice[]>([])
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState<string | null>(null)

  // Modals
  const [showQR, setShowQR]         = useState(false)
  const [showInstr, setShowInstr]   = useState(false)
  const [showTariff, setShowTariff] = useState(false)
  const [showDevices, setShowDevices] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      userApi.dashboard(),
      userApi.subscription().catch(() => null),
      userApi.devices().catch(() => ({ devices: [], total: 0 })),
    ]).then(([d, s, dev]) => {
      setData(d)
      setSub(s)
      setDevices((dev as DevicesData).devices || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Скопировано!')
    setTimeout(() => setCopied(null), 2500)
  }

  const deleteDevice = async (hwid: string) => {
    try {
      await userApi.deleteDevice(hwid)
      toast.success('Устройство удалено')
      load()
    } catch { toast.error('Ошибка удаления') }
  }

  if (loading) return <DashSkeleton />
  if (!data) return null

  const { user, rmStats, referralUrl, referralCount, bonusDaysEarned } = data
  const isActive = user.subStatus === 'ACTIVE' || user.subStatus === 'TRIAL'
  const isTrial = user.subStatus === 'TRIAL'
  const daysLeft = user.subExpireAt
    ? Math.max(0, Math.ceil((new Date(user.subExpireAt).getTime() - Date.now()) / 86400_000))
    : null
  const usedGb  = rmStats ? rmStats.usedTrafficBytes / 1e9 : null
  const limitGb = rmStats?.trafficLimitBytes ? rmStats.trafficLimitBytes / 1e9 : null
  const trafficPct = usedGb && limitGb ? Math.min(100, (usedGb / limitGb) * 100) : 0

  return (
    <div className="space-y-6 md:space-y-8">
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

      {/* ── NEW USER: Trial offer ── */}
      {!isActive && user.subStatus !== 'EXPIRED' && (
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
                Тестовая подписка — убедись что всё работает перед покупкой
              </p>
            </div>
            <button onClick={() => setShowTariff(true)}
                    className="btn-primary w-full sm:w-auto flex-shrink-0">
              <Zap className="w-4 h-4" /> Подключить
            </button>
          </div>
        </div>
      )}

      {/* ── Status cards row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusCard icon={<Wifi className="w-4 h-4" />} label="Статус"
          value={isActive ? (isTrial ? 'Пробный' : 'Активен') : 'Офлайн'}
          color={isActive ? '#34d399' : 'var(--text-tertiary)'}
          bg={isActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'}
          dot={isActive} />
        <StatusCard icon={<Clock className="w-4 h-4" />} label="Осталось"
          value={daysLeft !== null ? `${daysLeft} дн.` : '—'}
          color="#22d3ee" bg="rgba(6,182,212,0.08)" />
        <StatusCard icon={<Zap className="w-4 h-4" />} label="Трафик"
          value={usedGb !== null ? `${usedGb.toFixed(1)} ГБ` : '—'}
          sub={limitGb ? `/ ${limitGb.toFixed(0)} ГБ` : '∞'}
          color="#a78bfa" bg="rgba(139,92,246,0.08)" />
        <StatusCard icon={<Users className="w-4 h-4" />} label="Рефералы"
          value={String(referralCount)}
          sub={bonusDaysEarned ? `+${bonusDaysEarned} дн.` : ''}
          color="#fbbf24" bg="rgba(245,158,11,0.08)" />
      </div>

      {/* ── Active subscription section ── */}
      {isActive && sub?.subUrl && (
        <div className="glass-card gradient-border animate-slide-up">
          {/* Sub header */}
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
                {isTrial ? 'Пробная' : 'Активна'}
              </span>
            </div>
          </div>

          {/* QR + link + actions */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* QR */}
            <button onClick={() => setShowQR(true)}
                    className="mx-auto sm:mx-0 flex-shrink-0 p-3 rounded-2xl gradient-border transition-transform hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.93)' }}>
              <QRCodeSVG value={sub.subUrl} size={120} bgColor="transparent" fgColor="#1a1a2e" />
            </button>

            {/* Info + buttons */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Sub URL */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
              }}>
                <p className="flex-1 text-[11px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {sub.subUrl}
                </p>
                <button onClick={() => copyText(sub.subUrl, 'sub')}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-white/5">
                  {copied === 'sub'
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
                </button>
              </div>

              {/* Traffic bar */}
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

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowInstr(true)} className="btn-secondary text-xs py-2.5">
                  <BookOpen className="w-3.5 h-3.5" /> Подключить
                </button>
                <button onClick={() => setShowQR(true)} className="btn-secondary text-xs py-2.5">
                  <QrCode className="w-3.5 h-3.5" /> QR-код
                </button>
              </div>
            </div>
          </div>

          {/* Devices */}
          {devices.length > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <button onClick={() => setShowDevices(!showDevices)}
                      className="flex items-center justify-between w-full text-sm group">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Устройства <span className="text-xs ml-1 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>{devices.length}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDevices ? 'rotate-180' : ''}`}
                             style={{ color: 'var(--text-tertiary)' }} />
              </button>
              {showDevices && (
                <div className="mt-3 space-y-2 animate-slide-up">
                  {devices.map(d => (
                    <div key={d.hwid} className="flex items-center gap-3 p-3 rounded-xl" style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                    }}>
                      <DeviceIcon platform={d.platform} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.deviceModel || d.platform || 'Устройство'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {d.platform} {d.osVersion && `· ${d.osVersion}`}
                        </p>
                      </div>
                      <button onClick={() => deleteDevice(d.hwid)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400/60 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Inactive: tariff CTA ── */}
      {!isActive && (
        <div className="glass-card text-center py-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center gradient-border"
               style={{ background: 'rgba(6,182,212,0.05)' }}>
            <Shield className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h2 className="font-semibold text-lg">Нет активной подписки</h2>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Выбери тариф и подключись за 2 минуты
          </p>
          <button onClick={() => setShowTariff(true)} className="btn-primary">
            <Zap className="w-4 h-4" /> Выбрать тариф
          </button>
        </div>
      )}

      {/* ── Bottom row: referral + quick upgrade ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Referral */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Пригласи друга</h3>
            <span className="text-gradient text-xs font-semibold">+30 дней</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            За каждого друга — 30 дней бесплатно
          </p>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
          }}>
            <p className="flex-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
              {referralUrl}
            </p>
            <button onClick={() => copyText(referralUrl, 'ref')}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5">
              {copied === 'ref'
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
            </button>
          </div>
          {referralCount > 0 && (
            <p className="text-xs mt-2 text-emerald-400">
              {referralCount} чел. · +{bonusDaysEarned} дней
            </p>
          )}
        </div>

        {/* Upgrade / Extend */}
        {isActive ? (
          <div className="glass-card flex flex-col">
            <h3 className="font-medium text-sm mb-2">Продлить подписку</h3>
            <p className="text-xs flex-1" style={{ color: 'var(--text-tertiary)' }}>
              {daysLeft !== null && daysLeft < 7
                ? `Осталось ${daysLeft} дней — продли сейчас!`
                : 'Новый срок добавится к текущему'}
            </p>
            <button onClick={() => setShowTariff(true)}
                    className="btn-secondary text-xs mt-3 w-full justify-center">
              <TrendingUp className="w-3.5 h-3.5" /> Продлить
            </button>
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center text-center">
            <Globe2 className="w-8 h-8 mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="font-medium text-sm">Работает везде</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              iOS, Android, Windows, macOS, Linux, роутеры
            </p>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* QR Modal */}
      {showQR && sub?.subUrl && (
        <ModalOverlay onClose={() => setShowQR(false)}>
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-1">QR-код подписки</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
              Отсканируй в VPN-приложении
            </p>
            <div className="inline-block p-4 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <QRCodeSVG value={sub.subUrl} size={200} bgColor="transparent" fgColor="#1a1a2e" />
            </div>
            <button onClick={() => copyText(sub.subUrl, 'qr-modal')}
                    className="btn-secondary w-full justify-center text-sm">
              <Copy className="w-4 h-4" /> Скопировать ссылку
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Instructions Modal */}
      {showInstr && <InstructionsModal subUrl={sub?.subUrl || ''} onClose={() => setShowInstr(false)} />}

      {/* Tariff Modal */}
      {showTariff && <TariffModal onClose={() => { setShowTariff(false); load() }} />}
    </div>
  )
}

/* ═══ SUB-COMPONENTS ═══ */

function StatusCard({ icon, label, value, sub, color, bg, dot }: {
  icon: React.ReactNode; label: string; value: string
  sub?: string; color: string; bg: string; dot?: boolean
}) {
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

function DeviceIcon({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase()
  const cls = "w-5 h-5"
  const sty = { color: 'var(--text-tertiary)' }
  if (p.includes('ios') || p.includes('iphone')) return <Smartphone className={cls} style={sty} />
  if (p.includes('android')) return <Smartphone className={cls} style={sty} />
  if (p.includes('mac'))     return <Laptop className={cls} style={sty} />
  if (p.includes('tv'))      return <Tv className={cls} style={sty} />
  return <Monitor className={cls} style={sty} />
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
  const [activeP, setActiveP]    = useState('')
  const [activeApp, setActiveApp] = useState('')
  const [loading, setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/instructions/platforms')
      .then(r => r.json())
      .then((ps: Platform[]) => {
        setPlatforms(ps)
        // Auto-detect platform
        const ua = navigator.userAgent.toLowerCase()
        let slug = 'windows'
        if (/iphone|ipad/.test(ua)) slug = 'ios'
        else if (/android/.test(ua)) slug = 'android'
        else if (/mac os/.test(ua)) slug = 'macos'
        else if (/linux/.test(ua)) slug = 'linux'
        const found = ps.find(p => p.slug === slug)
        if (found) {
          setActiveP(found.slug)
          const feat = found.apps.find(a => a.isFeatured) || found.apps[0]
          if (feat) setActiveApp(feat.id)
        } else if (ps[0]) {
          setActiveP(ps[0].slug)
          if (ps[0].apps[0]) setActiveApp(ps[0].apps[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const platform = platforms.find(p => p.slug === activeP)
  const app = platform?.apps.find(a => a.id === activeApp)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 animate-slide-up"
           style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
           onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 z-10"
                style={{ color: 'var(--text-tertiary)' }}>
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-semibold text-lg mb-1">Подключить устройство</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Выбери платформу и следуй инструкции
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : (
          <>
            {/* Platform tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1 no-scrollbar">
              {platforms.map(p => (
                <button key={p.slug} onClick={() => {
                  setActiveP(p.slug)
                  const feat = p.apps.find(a => a.isFeatured) || p.apps[0]
                  if (feat) setActiveApp(feat.id)
                }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: activeP === p.slug ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                    color: activeP === p.slug ? '#22d3ee' : 'var(--text-secondary)',
                    border: `1px solid ${activeP === p.slug ? 'rgba(6,182,212,0.2)' : 'var(--glass-border)'}`,
                  }}>
                  <span>{PLAT_ICONS[p.slug] || '📱'}</span> {p.name}
                </button>
              ))}
            </div>

            {/* App selector */}
            {platform && platform.apps.length > 1 && (
              <div className="flex gap-2 mb-4">
                {platform.apps.map(a => (
                  <button key={a.id} onClick={() => setActiveApp(a.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: activeApp === a.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      color: activeApp === a.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>
                    {a.icon} {a.name}
                    {a.isFeatured && <Star className="w-3 h-3 inline ml-1 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}

            {/* Store link */}
            {app?.storeUrl && (
              <a href={app.storeUrl} target="_blank" rel="noopener"
                 className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm transition-all hover:bg-white/[0.04]"
                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <Download className="w-4 h-4" style={{ color: '#22d3ee' }} />
                <span>Скачать {app.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto" style={{ color: 'var(--text-tertiary)' }} />
              </a>
            )}

            {/* Deeplink quick-connect */}
            {app?.deeplink && subUrl && (
              <a href={app.deeplink.replace('{url}', encodeURIComponent(subUrl))}
                 className="flex items-center justify-center gap-2 btn-primary w-full mb-4 text-sm">
                <Zap className="w-4 h-4" /> Подключить в 1 клик
              </a>
            )}

            {/* Steps */}
            {app?.steps && app.steps.length > 0 && (
              <div className="space-y-3">
                {app.steps.sort((a, b) => a.order - b.order).map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                         style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}
                         dangerouslySetInnerHTML={{ __html: step.text.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;font-size:11px">$1</code>') }} />
                      {step.imageUrl && (
                        <img src={step.imageUrl} alt="" className="mt-2 rounded-xl max-w-full border"
                             style={{ borderColor: 'var(--glass-border)' }} />
                      )}
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
  const [tariffs, setTariffs]   = useState<Tariff[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Tariff | null>(null)
  const [paying, setPaying]     = useState(false)
  const [provider, setProvider] = useState<'YUKASSA' | 'CRYPTOPAY'>('YUKASSA')

  useEffect(() => {
    publicApi.tariffs().then(t => {
      setTariffs(t.filter(t => t.isActive))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleBuy = async () => {
    if (!selected) return
    setPaying(true)
    try {
      const res = await paymentsApi.create({ tariffId: selected.id, provider })
      window.location.href = res.paymentUrl
    } catch (err: any) {
      toast.error(err.message || 'Ошибка оплаты')
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 animate-slide-up"
           style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
           onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 z-10"
                style={{ color: 'var(--text-tertiary)' }}>
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-semibold text-lg mb-1">Выбери тариф</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>Без скрытых платежей</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5">
              {tariffs.map(t => (
                <button key={t.id} onClick={() => setSelected(t)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: selected?.id === t.id ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selected?.id === t.id ? 'rgba(6,182,212,0.3)' : 'var(--glass-border)'}`,
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.name}</span>
                      {t.isFeatured && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}>ХИТ</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {t.deviceLimit} устр. · {t.trafficGb ? `${t.trafficGb} ГБ` : '∞ трафик'} · {formatDays(t.durationDays)}
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
                {/* Provider */}
                <div className="flex gap-2">
                  <button onClick={() => setProvider('YUKASSA')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: provider === 'YUKASSA' ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: `1px solid ${provider === 'YUKASSA' ? 'rgba(255,255,255,0.12)' : 'var(--glass-border)'}`,
                      color: provider === 'YUKASSA' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>
                    <CreditCard className="w-3.5 h-3.5" /> Карта / СБП
                  </button>
                  <button onClick={() => setProvider('CRYPTOPAY')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: provider === 'CRYPTOPAY' ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: `1px solid ${provider === 'CRYPTOPAY' ? 'rgba(255,255,255,0.12)' : 'var(--glass-border)'}`,
                      color: provider === 'CRYPTOPAY' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>
                    <Bitcoin className="w-3.5 h-3.5" /> Крипта
                  </button>
                </div>

                <button onClick={handleBuy} disabled={paying} className="btn-primary w-full justify-center">
                  {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Переход к оплате...</>
                    : <>Оплатить {selected.priceRub.toLocaleString('ru')} ₽</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatDays(d: number) {
  if (d === 30) return '1 мес.'
  if (d === 90) return '3 мес.'
  if (d === 180) return '6 мес.'
  if (d === 365) return '1 год'
  return `${d} дн.`
}

function DashSkeleton() {
  return (
    <div className="space-y-6">
      <div><div className="h-8 skeleton w-48 rounded-lg" /><div className="h-4 skeleton w-32 rounded mt-2" /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
      </div>
      <div className="h-64 skeleton rounded-2xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    </div>
  )
}
