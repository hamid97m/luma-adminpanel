import type {
  ChatListItem, ChatTranscript, GiftBalance, GiftConfig, GiftTransaction, NewSeedUser, Paginated,
  PremiumConfig, PremiumPlan, PremiumPlanInput, PremiumTransaction,
  ReportHistoryItem, ReportSummaryItem, ReportUserDetail, Stats, SupportMessageItem, SupportTicketDetail,
  SupportTicketItem, UserDetail, UserListItem,
} from './types'

const BASE = import.meta.env.VITE_API_URL as string
const TOKEN_KEY = 'luma_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (res.status === 401 && path !== '/auth/login') {
    clearToken()
    window.location.href = '/login'
    throw new Error('unauthorized')
  }
  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error(text), { status: res.status })
  }
  return res.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ adminId: string; username: string }>('/me'),
  stats: () => request<Stats>('/stats'),
  users: {
    list: (params: { query?: string; status?: string; page?: number }) => {
      const qs = new URLSearchParams()
      if (params.query) qs.set('query', params.query)
      if (params.status) qs.set('status', params.status)
      qs.set('page', String(params.page ?? 1))
      return request<Paginated<UserListItem>>(`/users?${qs}`)
    },
    detail: (id: string) => request<UserDetail>(`/users/${id}`),
    create: (data: NewSeedUser) =>
      request<{ id: string }>('/users', { method: 'POST', body: JSON.stringify(data) }),
    ban: (id: string) => request<{ ok: boolean }>(`/users/${id}/ban`, { method: 'POST' }),
    unban: (id: string) => request<{ ok: boolean }>(`/users/${id}/unban`, { method: 'POST' }),
    grantPremium: (id: string, days: number) =>
      request<{ premiumUntil: string }>(`/users/${id}/premium/grant`, {
        method: 'POST', body: JSON.stringify({ days }),
      }),
    revokePremium: (id: string) =>
      request<{ ok: boolean }>(`/users/${id}/premium/revoke`, { method: 'POST' }),
  },
  chats: {
    list: (page = 1) => request<Paginated<ChatListItem>>(`/chats?page=${page}`),
    transcript: (matchId: string, page = 1) =>
      request<ChatTranscript>(`/chats/${matchId}?page=${page}`),
  },
  reports: {
    list: (params: { status?: string; page?: number }) => {
      const qs = new URLSearchParams()
      if (params.status) qs.set('status', params.status)
      qs.set('page', String(params.page ?? 1))
      return request<Paginated<ReportSummaryItem | ReportHistoryItem>>(`/reports?${qs}`)
    },
    userDetail: (userId: string) => request<ReportUserDetail>(`/reports/user/${userId}`),
    resolve: (userId: string, action: 'ban' | 'dismiss') =>
      request<{ ok: boolean }>(`/reports/user/${userId}/resolve`, {
        method: 'POST', body: JSON.stringify({ action }),
      }),
  },
  support: {
    list: (params: { status?: string; page?: number }) => {
      const qs = new URLSearchParams()
      if (params.status) qs.set('status', params.status)
      qs.set('page', String(params.page ?? 1))
      return request<Paginated<SupportTicketItem>>(`/support/tickets?${qs}`)
    },
    detail: (id: string) => request<SupportTicketDetail>(`/support/tickets/${id}`),
    reply: (id: string, body: string) =>
      request<{ message: SupportMessageItem }>(`/support/tickets/${id}/reply`, {
        method: 'POST', body: JSON.stringify({ body }),
      }),
    close: (id: string) => request<{ ok: boolean }>(`/support/tickets/${id}/close`, { method: 'POST' }),
    reopen: (id: string) => request<{ ok: boolean }>(`/support/tickets/${id}/reopen`, { method: 'POST' }),
  },
  gifts: {
    config: () => request<GiftConfig>('/gifts/config'),
    updateConfig: (data: Partial<GiftConfig>) =>
      request<GiftConfig>('/gifts/config', { method: 'PUT', body: JSON.stringify(data) }),
    balance: () => request<GiftBalance>('/gifts/balance'),
    transactions: (params: { page?: number; status?: string; context?: string } = {}) => {
      const qs = new URLSearchParams()
      if (params.status && params.status !== 'all') qs.set('status', params.status)
      if (params.context && params.context !== 'all') qs.set('context', params.context)
      qs.set('page', String(params.page ?? 1))
      return request<Paginated<GiftTransaction>>(`/gifts/transactions?${qs}`)
    },
  },
  premium: {
    config: () => request<PremiumConfig>('/premium/config'),
    updateConfig: (data: PremiumConfig) =>
      request<PremiumConfig>('/premium/config', { method: 'PUT', body: JSON.stringify(data) }),
    plans: () => request<{ plans: PremiumPlan[] }>('/premium/plans'),
    createPlan: (data: PremiumPlanInput) =>
      request<PremiumPlan>('/premium/plans', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id: string, data: Partial<PremiumPlanInput>) =>
      request<PremiumPlan>(`/premium/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePlan: (id: string) =>
      request<{ ok: boolean }>(`/premium/plans/${id}`, { method: 'DELETE' }),
    transactions: (params: { page?: number; status?: string; source?: string } = {}) => {
      const qs = new URLSearchParams()
      if (params.status && params.status !== 'all') qs.set('status', params.status)
      if (params.source && params.source !== 'all') qs.set('source', params.source)
      qs.set('page', String(params.page ?? 1))
      return request<Paginated<PremiumTransaction>>(`/premium/transactions?${qs}`)
    },
  },
}
