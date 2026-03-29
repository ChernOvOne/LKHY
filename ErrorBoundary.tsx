'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { adminApi } from '@/lib/api'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'user.extend':      { label: 'Продление', color: '#34d399' },
  'user.disable_rw':  { label: 'Блокировка RW', color: '#f87171' },
  'user.reset_traffic': { label: 'Сброс трафика', color: '#fbbf24' },
  'user.revoke':      { label: 'Revoke ссылки', color: '#fb923c' },
  'user.delete':      { label: 'Удаление', color: '#f87171' },
  'user.toggle':      { label: 'Вкл/Выкл', color: '#a78bfa' },
  'user.balance':     { label: 'Баланс', color: '#22d3ee' },
  'user.update_sub_link': { label: 'Смена ссылки', color: '#a78bfa' },
  'news.create':      { label: 'Новость +', color: '#34d399' },
  'news.update':      { label: 'Новость ~', color: '#fbbf24' },
  'news.delete':      { label: 'Новость -', color: '#f87171' },
  'promo.create':     { label: 'Акция +', color: '#34d399' },
  'promo.update':     { label: 'Акция ~', color: '#fbbf24' },
  'promo.delete':     { label: 'Акция -', color: '#f87171' },
  'proxy.create':     { label: 'Прокси +', color: '#34d399' },
  'notification.send': { label: 'Уведомление', color: '#22d3ee' },
  'tariff.create':    { label: 'Тариф +', color: '#34d399' },
  'tariff.update':    { label: 'Тариф ~', color: '#fbbf24' },
  'tariff.delete':    { label: 'Тариф -', color: '#f87171' },
}

export default function AuditLogPage() {
  const [logs, setLogs]       = useState<any[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [filter, setFilter]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi.auditLog(page, filter || undefined)
      .then(d => { setLogs(d.logs); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [page, filter])

  const totalPages = Math.ceil(total / 50)

  const getLabel = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'var(--text-tertiary)' }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">Журнал действий</span></h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{total} записей</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['', 'user', 'news', 'promo', 'tariff', 'notification', 'proxy'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: filter === f ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#a78bfa' : 'var(--text-tertiary)',
              border: `1px solid ${filter === f ? 'rgba(139,92,246,0.2)' : 'var(--glass-border)'}`,
            }}>
            {f || 'Все'}
          </button>
        ))}
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 skeleton rounded-2xl" />)}</div>
      ) : logs.length === 0 ? (
        <div className="glass-card text-center py-12">
          <ClipboardList className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Нет записей</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map(log => {
            const lbl = getLabel(log.action)
            const details = log.details ? JSON.parse(log.details) : null
            return (
              <div key={log.id} className="glass-card !p-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lbl.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: lbl.color }}>{lbl.label}</span>
                    {log.targetId && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {log.targetType}:{log.targetId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  {details && (
                    <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(log.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {log.ip && <p className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{log.ip}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs px-3" style={{ color: 'var(--text-tertiary)' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
