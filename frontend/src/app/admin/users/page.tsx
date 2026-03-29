'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search, Shield, ShieldOff, ChevronLeft, ChevronRight,
  ChevronDown, ExternalLink, Copy, Plus, Minus,
  Calendar, CreditCard, Users, Wifi, Clock, Link2,
  CheckCircle2, XCircle, Loader2, Edit3, Save,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string; email?: string; telegramId?: string; telegramName?: string
  subStatus: string; subExpireAt?: string; subLink?: string; role: string
  isActive: boolean; createdAt: string; lastLoginAt?: string
  remnawaveUuid?: string
  _count: { referrals: number; payments: number }
}

const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: 'Активна',   cls: 'badge-green' },
  INACTIVE: { label: 'Неактивна', cls: 'badge-gray' },
  EXPIRED:  { label: 'Истекла',   cls: 'badge-red' },
  TRIAL:    { label: 'Пробная',   cls: 'badge-blue' },
}

export default function AdminUsers() {
  const [users, setUsers]       = useState<User[]>([])
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Extend modal state
  const [extendId, setExtendId]     = useState<string | null>(null)
  const [extendDays, setExtendDays] = useState(30)
  const [extending, setExtending]   = useState(false)

  // Edit sub link state
  const [editLinkId, setEditLinkId]   = useState<string | null>(null)
  const [editLinkVal, setEditLinkVal] = useState('')
  const [savingLink, setSavingLink]   = useState(false)

  const [copied, setCopied] = useState<string | null>(null)

  const limit = 15

  const load = useCallback(() => {
    setLoading(true)
    const q = new URLSearchParams({
      page: String(page), limit: String(limit),
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    })
    fetch(`/api/admin/users?${q}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }, [page, search, status])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, status])

  const toggle = async (user: User) => {
    await fetch(`/api/admin/users/${user.id}/toggle`, { method: 'POST', credentials: 'include' })
    toast.success(user.isActive ? 'Заблокирован' : 'Разблокирован')
    load()
  }

  const extend = async () => {
    if (!extendId || extendDays < 1) return
    setExtending(true)
    try {
      const res = await fetch(`/api/admin/users/${extendId}/extend`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: extendDays }),
      })
      if (!res.ok) throw new Error()
      toast.success(`+${extendDays} дней добавлено`)
      setExtendId(null)
      load()
    } catch { toast.error('Ошибка') }
    setExtending(false)
  }

  const saveLink = async (userId: string) => {
    setSavingLink(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/sub-link`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subLink: editLinkVal }),
      })
      if (!res.ok) throw new Error()
      toast.success('Ссылка обновлена')
      setEditLinkId(null)
      load()
    } catch { toast.error('Ошибка обновления ссылки') }
    setSavingLink(false)
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Скопировано')
    setTimeout(() => setCopied(null), 2000)
  }

  const totalPages = Math.ceil(total / limit)
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
  const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">Пользователи</span></h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{total} всего</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder="Поиск по имени, email, @username, Telegram ID..."
                 className="glass-input pl-10 text-sm" />
        </div>
        <div className="flex gap-2">
          {['', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'TRIAL'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: status === s ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                color: status === s ? '#22d3ee' : 'var(--text-tertiary)',
                border: `1px solid ${status === s ? 'rgba(6,182,212,0.2)' : 'var(--glass-border)'}`,
              }}>
              {s ? STATUS[s]?.label : 'Все'}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {loading && users.length === 0 ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)
        ) : users.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Пользователи не найдены</p>
          </div>
        ) : (
          users.map(u => {
            const isExp = expanded === u.id
            const st = STATUS[u.subStatus] || STATUS.INACTIVE

            return (
              <div key={u.id} className="glass-card !p-0 overflow-hidden transition-all">
                {/* Summary row */}
                <button onClick={() => setExpanded(isExp ? null : u.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                       style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                    {(u.telegramName || u.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.telegramName || u.email?.split('@')[0] || 'Без имени'}
                      {u.telegramId && (
                        <span className="text-[10px] ml-1.5 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          ID:{u.telegramId}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {u.email || (u.telegramName ? `@${u.telegramName}` : '—')}
                      {' · '}{fmtDate(u.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`${st.cls} flex-shrink-0 text-[10px]`}>{st.label}</span>

                  {/* Blocked indicator */}
                  {!u.isActive && (
                    <span className="badge-red text-[10px] flex-shrink-0">Бан</span>
                  )}

                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isExp ? 'rotate-180' : ''}`}
                               style={{ color: 'var(--text-tertiary)' }} />
                </button>

                {/* Expanded details */}
                {isExp && (
                  <div className="px-4 pb-4 animate-slide-up" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                      <InfoCell icon={<Calendar className="w-3.5 h-3.5" />} label="Регистрация" value={fmtDate(u.createdAt)} />
                      <InfoCell icon={<Clock className="w-3.5 h-3.5" />} label="Последний вход" value={fmtDateTime(u.lastLoginAt)} />
                      <InfoCell icon={<CreditCard className="w-3.5 h-3.5" />} label="Платежей" value={String(u._count.payments)} />
                      <InfoCell icon={<Users className="w-3.5 h-3.5" />} label="Рефералов" value={String(u._count.referrals)} />
                    </div>

                    {/* Subscription info */}
                    <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Подписка</span>
                        {u.subExpireAt && (
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            до {fmtDate(u.subExpireAt)}
                          </span>
                        )}
                      </div>

                      {/* Sub link */}
                      {u.subLink && editLinkId !== u.id && (
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                          <p className="flex-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {u.subLink}
                          </p>
                          <button onClick={() => copyText(u.subLink!, `link-${u.id}`)}
                                  className="p-1 rounded hover:bg-white/5">
                            {copied === `link-${u.id}`
                              ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              : <Copy className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />}
                          </button>
                          <button onClick={() => { setEditLinkId(u.id); setEditLinkVal(u.subLink || '') }}
                                  className="p-1 rounded hover:bg-white/5">
                            <Edit3 className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                          </button>
                        </div>
                      )}

                      {/* Edit link mode */}
                      {editLinkId === u.id && (
                        <div className="flex items-center gap-2 mb-2">
                          <input type="text" value={editLinkVal} onChange={e => setEditLinkVal(e.target.value)}
                                 className="glass-input text-[11px] py-1.5 font-mono" placeholder="vless://..." />
                          <button onClick={() => saveLink(u.id)} disabled={savingLink}
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/10" style={{ color: '#34d399' }}>
                            {savingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setEditLinkId(null)}
                                  className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-tertiary)' }}>
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {u.remnawaveUuid && (
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                            RW: {u.remnawaveUuid.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setExtendId(u.id); setExtendDays(30) }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.04]"
                              style={{ border: '1px solid var(--glass-border)', color: '#22d3ee' }}>
                        <Plus className="w-3 h-3" /> Добавить дни
                      </button>
                      <button onClick={() => toggle(u)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.04]"
                              style={{ border: '1px solid var(--glass-border)', color: u.isActive ? '#f87171' : '#34d399' }}>
                        {u.isActive ? <><ShieldOff className="w-3 h-3" /> Заблокировать</> : <><Shield className="w-3 h-3" /> Разблокировать</>}
                      </button>
                      <a href={`/admin/users/${u.id}`}
                         className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.04]"
                         style={{ border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        <ExternalLink className="w-3 h-3" /> Полный профиль
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs px-3" style={{ color: 'var(--text-tertiary)' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30"
                  style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Extend days modal */}
      {extendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setExtendId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in"
               style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
               onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-4">Добавить дни</h3>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setExtendDays(d => Math.max(1, d - 1))}
                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5"
                      style={{ border: '1px solid var(--glass-border)' }}>
                <Minus className="w-4 h-4" />
              </button>
              <input type="number" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))}
                     className="glass-input text-center text-lg font-bold w-24" min={1} />
              <button onClick={() => setExtendDays(d => d + 1)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5"
                      style={{ border: '1px solid var(--glass-border)' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 mb-3">
              {[7, 30, 90, 365].map(d => (
                <button key={d} onClick={() => setExtendDays(d)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: extendDays === d ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${extendDays === d ? 'rgba(6,182,212,0.2)' : 'var(--glass-border)'}`,
                          color: extendDays === d ? '#22d3ee' : 'var(--text-tertiary)',
                        }}>
                  {d}д
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setExtendId(null)} className="btn-secondary flex-1 text-sm">Отмена</button>
              <button onClick={extend} disabled={extending} className="btn-primary flex-1 text-sm">
                {extending ? <Loader2 className="w-4 h-4 animate-spin" /> : `+${extendDays} дней`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-xs font-medium">{value}</p>
    </div>
  )
}
