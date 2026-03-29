import type {
  User, DashboardData, SubscriptionData, Tariff,
  ReferralInfo, Instruction, CreatePaymentResponse,
  AdminStats, AdminUser, AdminPayment, Payment,
  DevicesData, InternalSquad,
} from '@/types'

// ── Base fetch wrapper ────────────────────────────────────────
async function apiFetch<T>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  me:       ()           => apiFetch<User>('/auth/me'),
  telegram: (data: any)  => apiFetch<{ token: string; user: User }>('/auth/telegram', {
    method: 'POST', body: JSON.stringify(data),
  }),
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
}

// ── User ──────────────────────────────────────────────────────
export const userApi = {
  dashboard:    () => apiFetch<DashboardData>('/user/dashboard'),
  subscription: () => apiFetch<SubscriptionData>('/user/subscription'),
  instructions: () => apiFetch<Instruction[]>('/user/instructions'),
  payments:     () => apiFetch<Payment[]>('/user/payments'),
  referral:     () => apiFetch<ReferralInfo>('/user/referral'),
  sync:         () => apiFetch<{ ok: boolean; linked?: boolean }>('/user/sync', { method: 'POST', body: '{}' }),
  devices:      () => apiFetch<DevicesData>('/user/devices'),
  deleteDevice: (hwid: string) => apiFetch<{ ok: boolean }>(`/user/devices/${hwid}`, { method: 'DELETE' }),
}

// ── Public ────────────────────────────────────────────────────
export const publicApi = {
  tariffs: () => apiFetch<Tariff[]>('/public/tariffs'),
  config:  () => apiFetch<Record<string, unknown>>('/public/config'),
  checkReferral: (code: string) =>
    apiFetch<{ valid: boolean; referrerName?: string }>(`/public/referral/${code}`),
}

// ── Payments ──────────────────────────────────────────────────
export const paymentsApi = {
  create: (params: {
    tariffId: string
    provider: 'YUKASSA' | 'CRYPTOPAY'
    currency?: 'USDT' | 'TON' | 'BTC'
  }) => apiFetch<CreatePaymentResponse>('/payments/create', {
    method: 'POST', body: JSON.stringify(params),
  }),
  status: (orderId: string) =>
    apiFetch<Payment>(`/payments/status/${orderId}`),
  verify: (orderId: string) =>
    apiFetch<{ confirmed: boolean }>(`/payments/verify/${orderId}`, { method: 'POST' }),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  stats:    () => apiFetch<AdminStats>('/admin/stats'),

  // Users
  users: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v).map(([k,v]) => [k, String(v)]))
    return apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${q}`)
  },
  userById:   (id: string) => apiFetch<AdminUser>(`/admin/users/${id}`),
  extendUser: (id: string, days: number, note?: string) =>
    apiFetch<{ ok: boolean; newExpireAt: string }>(`/admin/users/${id}/extend`, {
      method: 'POST', body: JSON.stringify({ days, note }),
    }),
  toggleUser: (id: string) =>
    apiFetch<{ ok: boolean; isActive: boolean }>(`/admin/users/${id}/toggle`, { method: 'POST' }),

  // Tariffs
  tariffs:      () => apiFetch<Tariff[]>('/admin/tariffs'),
  createTariff: (data: Partial<Tariff>) =>
    apiFetch<Tariff>('/admin/tariffs', { method: 'POST', body: JSON.stringify(data) }),
  updateTariff: (id: string, data: Partial<Tariff>) =>
    apiFetch<Tariff>(`/admin/tariffs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTariff: (id: string) =>
    apiFetch<void>(`/admin/tariffs/${id}`, { method: 'DELETE' }),

  // Instructions
  instructions:      () => apiFetch<Instruction[]>('/admin/instructions'),
  createInstruction: (data: Partial<Instruction>) =>
    apiFetch<Instruction>('/admin/instructions', { method: 'POST', body: JSON.stringify(data) }),
  updateInstruction: (id: string, data: Partial<Instruction>) =>
    apiFetch<Instruction>(`/admin/instructions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstruction: (id: string) =>
    apiFetch<void>(`/admin/instructions/${id}`, { method: 'DELETE' }),

  // Payments
  payments: (params: { page?: number; status?: string; provider?: string } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v).map(([k,v]) => [k, String(v)]))
    return apiFetch<{ payments: AdminPayment[]; total: number }>(`/admin/payments?${q}`)
  },

  // Settings
  settings:       () => apiFetch<Record<string, string>>('/admin/settings'),
  updateSettings: (data: Record<string, string>) =>
    apiFetch<{ ok: boolean }>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Import
  importStatus: () => apiFetch<{ total: number; matched: number; pending: number; unmatched: number }>('/admin/import'),
  squads: () => apiFetch<{ squads: InternalSquad[]; total: number }>('/admin/squads'),

  // ── v2: News ──
  news:       () => apiFetch<any[]>('/admin/news'),
  createNews: (data: any) => apiFetch<any>('/admin/news', { method: 'POST', body: JSON.stringify(data) }),
  updateNews: (id: string, data: any) => apiFetch<any>(`/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNews: (id: string) => apiFetch<void>(`/admin/news/${id}`, { method: 'DELETE' }),

  // ── v2: Promos ──
  promos:       () => apiFetch<any[]>('/admin/promos'),
  createPromo:  (data: any) => apiFetch<any>('/admin/promos', { method: 'POST', body: JSON.stringify(data) }),
  updatePromo:  (id: string, data: any) => apiFetch<any>(`/admin/promos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePromo:  (id: string) => apiFetch<void>(`/admin/promos/${id}`, { method: 'DELETE' }),

  // ── v2: Proxies ──
  proxies:       () => apiFetch<any[]>('/admin/proxies'),
  createProxy:   (data: any) => apiFetch<any>('/admin/proxies', { method: 'POST', body: JSON.stringify(data) }),
  updateProxy:   (id: string, data: any) => apiFetch<any>(`/admin/proxies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProxy:   (id: string) => apiFetch<void>(`/admin/proxies/${id}`, { method: 'DELETE' }),

  // ── v2: Notifications ──
  sendNotification: (data: any) => apiFetch<any>('/admin/notifications', { method: 'POST', body: JSON.stringify(data) }),
  notificationsList: (page = 1) => apiFetch<{ notifications: any[]; total: number }>(`/admin/notifications?page=${page}`),

  // ── v2: User REMNAWAVE actions ──
  disableUserRW:  (id: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}/disable-rw`, { method: 'POST' }),
  resetTraffic:   (id: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}/reset-traffic`, { method: 'POST' }),
  revokeUser:     (id: string) => apiFetch<{ ok: boolean; newSubUrl?: string }>(`/admin/users/${id}/revoke`, { method: 'POST' }),
  updateSubLink:  (id: string, subLink: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}/sub-link`, { method: 'PUT', body: JSON.stringify({ subLink }) }),
  deleteUser:     (id: string) => apiFetch<{ ok: boolean }>(`/admin/users/${id}/delete`, { method: 'DELETE' }),
  getUserRW:      (id: string) => apiFetch<{ data: any; devices?: any }>(`/admin/users/${id}/remnawave`),
  adjustBalance:  (id: string, amount: number, description?: string) =>
    apiFetch<{ ok: boolean }>(`/admin/users/${id}/balance`, { method: 'POST', body: JSON.stringify({ amount, description }) }),

  // ── v2: Notes ──
  getUserNotes:  (userId: string) => apiFetch<any[]>(`/admin/users/${userId}/notes`),
  addUserNote:   (userId: string, content: string) =>
    apiFetch<any>(`/admin/users/${userId}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteNote:    (id: string) => apiFetch<void>(`/admin/notes/${id}`, { method: 'DELETE' }),

  // ── v2: Audit log ──
  auditLog: (page = 1, action?: string) => {
    const q = new URLSearchParams({ page: String(page), ...(action ? { action } : {}) })
    return apiFetch<{ logs: any[]; total: number }>(`/admin/audit-log?${q}`)
  },

  // ── v2: REMNAWAVE system ──
  rwHealth: () => apiFetch<any>('/admin/remnawave/health'),
  rwNodes:  () => apiFetch<any>('/admin/remnawave/nodes'),

  // ── v2: Gifts ──
  gifts: () => apiFetch<any[]>('/admin/gifts'),
}

// ── User v2 ───────────────────────────────────────────────────
export const userV2Api = {
  notifications:    () => apiFetch<{ notifications: any[]; unread: number }>('/user/notifications'),
  readNotification: (id: string) => apiFetch<any>(`/user/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifs:    () => apiFetch<any>('/user/notifications/read-all', { method: 'POST' }),
  balance:          () => apiFetch<{ balance: number; transactions: any[] }>('/user/balance'),
  activateTrial:    () => apiFetch<{ ok: boolean; subUrl: string; expireAt: string }>('/user/activate-trial', { method: 'POST' }),
  createGift:       (data: any) => apiFetch<{ ok: boolean; giftCode: string; giftUrl: string }>('/user/gifts', { method: 'POST', body: JSON.stringify(data) }),
  myGifts:          () => apiFetch<any[]>('/user/gifts'),
  revokeSubscription: () => apiFetch<{ ok: boolean; newSubUrl?: string }>('/user/revoke-subscription', { method: 'POST' }),
}
