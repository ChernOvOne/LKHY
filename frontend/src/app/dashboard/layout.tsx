'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, LogOut, Menu, X, Settings, Bell,
} from 'lucide-react'

interface User {
  id: string; email?: string; telegramName?: string
  subStatus: string; subExpireAt?: string; role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread]     = useState(0)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(u => {
        setUser(u)
        // Fetch unread notifications count
        fetch('/api/user/notifications', { credentials: 'include' })
          .then(r => r.ok ? r.json() : { unread: 0 })
          .then(d => setUnread(d.unread || 0))
          .catch(() => {})
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
             style={{ borderTopColor: 'var(--accent-1)', borderRightColor: 'var(--accent-2)' }} />
      </div>
    )
  }

  if (!user) return null

  const isActive = user.subStatus === 'ACTIVE' || user.subStatus === 'TRIAL'

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
      <div className="aurora-bg" />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl" style={{
        background: 'rgba(10,10,18,0.8)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--accent-gradient)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">HIDEYOU</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded hidden sm:inline-block"
                  style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}>VPN</span>
          </div>

          {/* Status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
            background: isActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isActive ? 'rgba(16,185,129,0.15)' : 'var(--glass-border)'}`,
          }}>
            <span className="glow-dot" style={{ color: isActive ? '#34d399' : '#555' }} />
            <span className="text-xs font-medium" style={{ color: isActive ? '#34d399' : 'var(--text-tertiary)' }}>
              {isActive ? 'VPN активен' : 'Не подключён'}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg transition-colors hover:bg-white/5 relative"
                    style={{ color: 'var(--text-tertiary)' }} title="Уведомления"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-notifications'))}>
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: 'var(--accent-gradient)', fontSize: '9px' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {user.role === 'ADMIN' && (
              <Link href="/admin" className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-tertiary)' }} title="Админ-панель">
                <Settings className="w-4 h-4" />
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5 md:hidden"
                    style={{ color: 'var(--text-secondary)' }}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button onClick={logout}
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-tertiary)' }}>
              <LogOut className="w-3.5 h-3.5" />
              Выйти
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t animate-slide-up"
               style={{ borderColor: 'var(--glass-border)', background: 'rgba(10,10,18,0.95)' }}>
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                     style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                  {(user.telegramName || user.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.telegramName || user.email?.split('@')[0] || 'Пользователь'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {user.email || `@${user.telegramName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="glow-dot" style={{ color: isActive ? '#34d399' : '#555' }} />
                <span className="text-xs" style={{ color: isActive ? '#34d399' : 'var(--text-tertiary)' }}>
                  {isActive ? 'VPN активен' : 'Не подключён'}
                </span>
              </div>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>
                  <Settings className="w-4 h-4" /> Админ-панель
                </Link>
              )}
              <button onClick={logout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full hover:bg-red-500/5"
                      style={{ color: 'var(--text-secondary)' }}>
                <LogOut className="w-4 h-4" /> Выйти
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
