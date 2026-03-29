'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Loader2, X, Save, Globe2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'

interface Proxy {
  id: string; name: string; description?: string
  tgLink: string; httpsLink?: string; tag?: string
  isActive: boolean; sortOrder: number
}

export default function AdminProxiesPage() {
  const [items, setItems]     = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Proxy> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => { adminApi.proxies().then(setItems).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing?.name || !editing?.tgLink) return toast.error('Заполни название и TG-ссылку')
    setSaving(true)
    try {
      if (editing.id) {
        await adminApi.updateProxy(editing.id, editing)
      } else {
        await adminApi.createProxy(editing)
      }
      toast.success(editing.id ? 'Обновлено' : 'Создано')
      setEditing(null); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить прокси?')) return
    await adminApi.deleteProxy(id); toast.success('Удалено'); load()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">TG Прокси</span></h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Бесплатные прокси для пользователей
          </p>
        </div>
        <button onClick={() => setEditing({ name: '', tgLink: '', isActive: true, sortOrder: 0 })}
                className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass-card text-center py-12">
          <Globe2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Прокси не добавлены</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="glass-card !p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(6,182,212,0.08)' }}>
                <Globe2 className="w-5 h-5" style={{ color: '#22d3ee' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  {p.tag && <span className="badge-violet text-[9px]">{p.tag}</span>}
                  {!p.isActive && <span className="badge-gray text-[9px]">Скрыт</span>}
                </div>
                {p.description && <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{p.description}</p>}
                <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{p.tgLink}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <a href={p.tgLink} target="_blank" rel="noopener"
                   className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-tertiary)' }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => setEditing(p)}
                        className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-tertiary)' }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(p.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--text-tertiary)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl p-6 animate-scale-in"
               style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">{editing.id ? 'Редактировать' : 'Новый прокси'}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/5"
                      style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Название">
                <input className="glass-input text-sm" value={editing.name || ''}
                       onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="MTProto Proxy #1" />
              </Field>
              <Field label="Описание">
                <input className="glass-input text-sm" value={editing.description || ''}
                       onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Быстрый прокси для Telegram" />
              </Field>
              <Field label="TG-ссылка">
                <input className="glass-input text-sm font-mono" value={editing.tgLink || ''}
                       onChange={e => setEditing({ ...editing, tgLink: e.target.value })} placeholder="tg://proxy?server=..." />
              </Field>
              <Field label="HTTPS-ссылка">
                <input className="glass-input text-sm font-mono" value={editing.httpsLink || ''}
                       onChange={e => setEditing({ ...editing, httpsLink: e.target.value })} placeholder="https://t.me/proxy?..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Тег">
                  <input className="glass-input text-sm" value={editing.tag || ''}
                         onChange={e => setEditing({ ...editing, tag: e.target.value })} placeholder="RU, NL..." />
                </Field>
                <Field label="Порядок">
                  <input type="number" className="glass-input text-sm" value={editing.sortOrder ?? 0}
                         onChange={e => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.isActive ?? true}
                       onChange={e => setEditing({ ...editing, isActive: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Активен</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditing(null)} className="btn-secondary flex-1 text-sm">Отмена</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  )
}
