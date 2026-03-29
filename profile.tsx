'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Eye, EyeOff, Loader2, X, Save, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'

interface PromoItem {
  id: string; title: string; description?: string; content?: string
  imageUrl?: string; buttonText?: string; buttonUrl?: string
  discount?: number; tariffId?: string; isActive: boolean
  startsAt?: string; endsAt?: string; createdAt: string
}

export default function AdminPromosPage() {
  const [items, setItems]     = useState<PromoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<PromoItem> | null>(null)
  const [saving, setSaving]   = useState(false)
  const [tariffs, setTariffs] = useState<any[]>([])

  const load = () => {
    Promise.all([adminApi.promos(), adminApi.tariffs()])
      .then(([p, t]) => { setItems(p); setTariffs(t) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing?.title) return toast.error('Заполни название')
    setSaving(true)
    try {
      if (editing.id) {
        await adminApi.updatePromo(editing.id, editing)
      } else {
        await adminApi.createPromo(editing)
      }
      toast.success(editing.id ? 'Обновлено' : 'Создано')
      setEditing(null); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить акцию?')) return
    await adminApi.deletePromo(id)
    toast.success('Удалено'); load()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">Акции</span></h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{items.length} акций</p>
        </div>
        <button onClick={() => setEditing({ title: '', isActive: true })} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass-card text-center py-12">
          <p style={{ color: 'var(--text-tertiary)' }}>Акций пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass-card !p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.discount && <span className="badge-green text-[9px]">-{item.discount}%</span>}
                    {!item.isActive && <span className="badge-gray text-[9px]">Скрыта</span>}
                  </div>
                  {item.description && (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.startsAt && <span>С {new Date(item.startsAt).toLocaleDateString('ru')}</span>}
                    {item.endsAt && <span>До {new Date(item.endsAt).toLocaleDateString('ru')}</span>}
                    {item.buttonText && <span className="badge-blue text-[9px]">{item.buttonText}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(item)}
                          className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-tertiary)' }}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(item.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--text-tertiary)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 animate-scale-in"
               style={{ background: 'rgba(18,18,30,0.97)', border: '1px solid var(--glass-border)' }}
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">{editing.id ? 'Редактировать' : 'Новая акция'}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/5"
                      style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Название">
                <input className="glass-input text-sm" value={editing.title || ''}
                       onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </Field>
              <Field label="Описание">
                <input className="glass-input text-sm" value={editing.description || ''}
                       onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="Контент (Markdown)">
                <textarea className="glass-input text-sm min-h-[100px] resize-y"
                          value={editing.content || ''}
                          onChange={e => setEditing({ ...editing, content: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Скидка %">
                  <input type="number" className="glass-input text-sm" value={editing.discount || ''}
                         onChange={e => setEditing({ ...editing, discount: Number(e.target.value) || undefined })} />
                </Field>
                <Field label="Привязка к тарифу">
                  <select className="glass-input text-sm" value={editing.tariffId || ''}
                          onChange={e => setEditing({ ...editing, tariffId: e.target.value || undefined })}>
                    <option value="">Нет</option>
                    {tariffs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Текст кнопки">
                  <input className="glass-input text-sm" value={editing.buttonText || ''} placeholder="Купить со скидкой"
                         onChange={e => setEditing({ ...editing, buttonText: e.target.value })} />
                </Field>
                <Field label="Ссылка кнопки">
                  <input className="glass-input text-sm" value={editing.buttonUrl || ''} placeholder="https://..."
                         onChange={e => setEditing({ ...editing, buttonUrl: e.target.value })} />
                </Field>
              </div>
              <Field label="URL изображения">
                <input className="glass-input text-sm" value={editing.imageUrl || ''} placeholder="https://..."
                       onChange={e => setEditing({ ...editing, imageUrl: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Начало">
                  <input type="datetime-local" className="glass-input text-sm"
                         value={editing.startsAt ? editing.startsAt.slice(0, 16) : ''}
                         onChange={e => setEditing({ ...editing, startsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                </Field>
                <Field label="Конец">
                  <input type="datetime-local" className="glass-input text-sm"
                         value={editing.endsAt ? editing.endsAt.slice(0, 16) : ''}
                         onChange={e => setEditing({ ...editing, endsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={editing.isActive ?? true}
                       onChange={e => setEditing({ ...editing, isActive: e.target.checked })} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Активна</span>
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
