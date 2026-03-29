'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Pin, Eye, EyeOff, Loader2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/api'

interface NewsItem {
  id: string; title: string; content: string; imageUrl?: string
  isActive: boolean; isPinned: boolean; publishedAt: string; createdAt: string
}

export default function AdminNewsPage() {
  const [items, setItems]     = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<NewsItem> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    adminApi.news().then(setItems).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing?.title || !editing?.content) return toast.error('Заполни название и контент')
    setSaving(true)
    try {
      if (editing.id) {
        await adminApi.updateNews(editing.id, editing)
      } else {
        await adminApi.createNews(editing)
      }
      toast.success(editing.id ? 'Обновлено' : 'Создано')
      setEditing(null); load()
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Удалить новость?')) return
    await adminApi.deleteNews(id)
    toast.success('Удалено'); load()
  }

  const toggle = async (item: NewsItem, field: 'isActive' | 'isPinned') => {
    await adminApi.updateNews(item.id, { [field]: !item[field] })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold"><span className="text-gradient">Новости</span></h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{items.length} записей</p>
        </div>
        <button onClick={() => setEditing({ title: '', content: '', isActive: true, isPinned: false })}
                className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass-card text-center py-12">
          <p style={{ color: 'var(--text-tertiary)' }}>Новостей пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="glass-card !p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{item.title}</h3>
                  {item.isPinned && <span className="badge-blue text-[9px]">Закреплена</span>}
                  {!item.isActive && <span className="badge-gray text-[9px]">Скрыта</span>}
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{item.content}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(item.publishedAt).toLocaleDateString('ru')}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggle(item, 'isPinned')}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: item.isPinned ? '#22d3ee' : 'var(--text-tertiary)' }} title="Закрепить">
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggle(item, 'isActive')}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: item.isActive ? '#34d399' : 'var(--text-tertiary)' }} title="Видимость">
                  {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
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
              <h3 className="font-semibold">{editing.id ? 'Редактировать' : 'Новая новость'}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/5"
                      style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Заголовок</label>
                <input className="glass-input text-sm" value={editing.title || ''}
                       onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Содержание (Markdown)</label>
                <textarea className="glass-input text-sm min-h-[150px] resize-y"
                          value={editing.content || ''}
                          onChange={e => setEditing({ ...editing, content: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>URL изображения</label>
                <input className="glass-input text-sm" value={editing.imageUrl || ''} placeholder="https://..."
                       onChange={e => setEditing({ ...editing, imageUrl: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.isActive ?? true}
                         onChange={e => setEditing({ ...editing, isActive: e.target.checked })}
                         className="rounded" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Активна</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.isPinned ?? false}
                         onChange={e => setEditing({ ...editing, isPinned: e.target.checked })}
                         className="rounded" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Закреплена</span>
                </label>
              </div>
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
