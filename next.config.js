'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Settings, Zap, Users, CreditCard, Globe2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'

type S = Record<string, string>

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<S>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState('general')

  useEffect(() => {
    adminApi.settings().then(s => { setSettings(s); setLoading(false) })
  }, [])

  const update = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(settings)
      toast.success('Настройки сохранены')
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 skeleton w-48 rounded-lg" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  )

  const TABS = [
    { id: 'general',  icon: Settings,    label: 'Общие' },
    { id: 'trial',    icon: Zap,         label: 'Пробный период' },
    { id: 'referral', icon: Users,       label: 'Реферальная' },
    { id: 'payments', icon: CreditCard,  label: 'Оплата' },
    { id: 'landing',  icon: Globe2,      label: 'Лендинг' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">Настройки</span></h1>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: tab === t.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
              color: tab === t.id ? '#a78bfa' : 'var(--text-tertiary)',
              border: `1px solid ${tab === t.id ? 'rgba(139,92,246,0.2)' : 'var(--glass-border)'}`,
            }}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {tab === 'general' && (
        <Section title="Общие настройки">
          <Field label="Название проекта" hint="Отображается в шапке, footer, title">
            <input className="glass-input text-sm" value={settings.project_name || 'HIDEYOU'}
                   onChange={e => update('project_name', e.target.value)} />
          </Field>
          <Field label="Ссылка на поддержку">
            <input className="glass-input text-sm" value={settings.support_url || ''}
                   onChange={e => update('support_url', e.target.value)} placeholder="https://t.me/support" />
          </Field>
          <Field label="Telegram-канал">
            <input className="glass-input text-sm" value={settings.telegram_channel || ''}
                   onChange={e => update('telegram_channel', e.target.value)} placeholder="https://t.me/channel" />
          </Field>
          <Field label="Telegram-бот">
            <input className="glass-input text-sm" value={settings.telegram_bot || ''}
                   onChange={e => update('telegram_bot', e.target.value)} placeholder="https://t.me/bot" />
          </Field>
        </Section>
      )}

      {/* ── Trial ── */}
      {tab === 'trial' && (
        <Section title="Пробный период" description="Настройка бесплатной пробной подписки для новых пользователей">
          <Field label="Включён">
            <ToggleBtn checked={settings.trial_enabled !== 'false'}
                       onChange={v => update('trial_enabled', String(v))} />
          </Field>
          <Field label="Количество дней">
            <input type="number" className="glass-input text-sm" value={settings.trial_days || '3'}
                   onChange={e => update('trial_days', e.target.value)} min="1" />
          </Field>
          <Field label="Лимит устройств" hint="0 = безлимит">
            <input type="number" className="glass-input text-sm" value={settings.trial_device_limit || '1'}
                   onChange={e => update('trial_device_limit', e.target.value)} min="0" />
          </Field>
          <Field label="Лимит трафика (ГБ)" hint="0 = безлимит">
            <input type="number" className="glass-input text-sm" value={settings.trial_traffic_gb || '0'}
                   onChange={e => update('trial_traffic_gb', e.target.value)} min="0" />
          </Field>
          <Field label="Стратегия сброса трафика">
            <select className="glass-input text-sm" value={settings.trial_traffic_strategy || 'NO_RESET'}
                    onChange={e => update('trial_traffic_strategy', e.target.value)}>
              <option value="NO_RESET">Без сброса</option>
              <option value="DAY">Ежедневно</option>
              <option value="WEEK">Еженедельно</option>
              <option value="MONTH">Ежемесячно</option>
            </select>
          </Field>
          <Field label="Squads (JSON массив UUID)" hint='["uuid1", "uuid2"]'>
            <input className="glass-input text-sm font-mono" value={settings.trial_squads || '[]'}
                   onChange={e => update('trial_squads', e.target.value)} placeholder='["..."]' />
          </Field>
        </Section>
      )}

      {/* ── Referral ── */}
      {tab === 'referral' && (
        <Section title="Реферальная программа">
          <Field label="Тип бонуса">
            <select className="glass-input text-sm" value={settings.referral_bonus_type || 'days'}
                    onChange={e => update('referral_bonus_type', e.target.value)}>
              <option value="days">Бонусные дни</option>
              <option value="balance">Денежный бонус (на баланс)</option>
            </select>
          </Field>
          {(settings.referral_bonus_type || 'days') === 'days' ? (
            <Field label="Дней за реферала" hint="Сколько дней добавляется пригласившему">
              <input type="number" className="glass-input text-sm" value={settings.referral_bonus_days || '30'}
                     onChange={e => update('referral_bonus_days', e.target.value)} min="1" />
            </Field>
          ) : (
            <Field label="Сумма бонуса (₽)" hint="Зачисляется на баланс пригласившего">
              <input type="number" className="glass-input text-sm" value={settings.referral_bonus_amount || '100'}
                     onChange={e => update('referral_bonus_amount', e.target.value)} min="1" />
            </Field>
          )}
          <Field label="Минимальный платёж для активации" hint="Реферал засчитывается после первой оплаты">
            <select className="glass-input text-sm" value={settings.referral_require_payment || 'true'}
                    onChange={e => update('referral_require_payment', e.target.value)}>
              <option value="true">Да, после первого платежа</option>
              <option value="false">Нет, сразу при регистрации</option>
            </select>
          </Field>
        </Section>
      )}

      {/* ── Payments ── */}
      {tab === 'payments' && (
        <Section title="Платёжные системы" description="Включите/отключите доступные методы оплаты">
          <Field label="ЮKassa (карты, СБП, ЮMoney)">
            <ToggleBtn checked={settings.payment_yukassa_enabled !== 'false'}
                       onChange={v => update('payment_yukassa_enabled', String(v))} />
          </Field>
          <Field label="CryptoPay (USDT, TON, BTC)">
            <ToggleBtn checked={settings.payment_cryptopay_enabled !== 'false'}
                       onChange={v => update('payment_cryptopay_enabled', String(v))} />
          </Field>
          <Field label="Оплата с баланса">
            <ToggleBtn checked={settings.payment_balance_enabled === 'true'}
                       onChange={v => update('payment_balance_enabled', String(v))} />
          </Field>
        </Section>
      )}

      {/* ── Landing CMS ── */}
      {tab === 'landing' && (
        <Section title="Настройки лендинга" description="Тексты и содержимое главной страницы">
          <Field label="Hero заголовок">
            <input className="glass-input text-sm" value={settings.landing_hero_title || ''}
                   onChange={e => update('landing_hero_title', e.target.value)} placeholder="Скройся от слежки." />
          </Field>
          <Field label="Hero подзаголовок">
            <textarea className="glass-input text-sm min-h-[60px] resize-y" value={settings.landing_hero_subtitle || ''}
                      onChange={e => update('landing_hero_subtitle', e.target.value)} />
          </Field>
          <Field label="Hero акцентный текст">
            <input className="glass-input text-sm" value={settings.landing_hero_accent || ''}
                   onChange={e => update('landing_hero_accent', e.target.value)} placeholder="Оставайся собой." />
          </Field>
          <Field label="CTA текст кнопки">
            <input className="glass-input text-sm" value={settings.landing_cta_text || ''}
                   onChange={e => update('landing_cta_text', e.target.value)} placeholder="Подключиться сейчас" />
          </Field>
          <Field label="Показывать отзывы">
            <ToggleBtn checked={settings.landing_show_reviews === 'true'}
                       onChange={v => update('landing_show_reviews', String(v))} />
          </Field>
          <Field label="Показывать прокси-секцию">
            <ToggleBtn checked={settings.landing_show_proxies === 'true'}
                       onChange={v => update('landing_show_proxies', String(v))} />
          </Field>
          <Field label="FAQ (JSON)" hint='[{"q": "Вопрос?", "a": "Ответ"}]'>
            <textarea className="glass-input text-sm font-mono min-h-[100px] resize-y"
                      value={settings.landing_faq || ''}
                      onChange={e => update('landing_faq', e.target.value)}
                      placeholder='[{"q":"...","a":"..."}]' />
          </Field>
        </Section>
      )}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card space-y-4">
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        {hint && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function ToggleBtn({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
            className="relative w-11 h-6 rounded-full transition-all duration-300"
            style={{ background: checked ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)' }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
            style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}
