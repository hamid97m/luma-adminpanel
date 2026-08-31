export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageCount: number
}

export interface UserListItem {
  id: string
  telegramId: number
  username: string | null
  name: string
  age: number
  gender: string
  lookingFor?: string
  isActive: boolean
  isSeed: boolean
  bannedAt: string | null
  pausedAt: string | null
  deletedAt: string | null
  createdAt: string
  lastActive: string
}

export interface DayCount {
  date: string
  count: number
}

export interface Stats {
  totals: {
    users: number
    matches: number
    messages: number
    swipes: number
    likeRate: number
    banned: number
    deleted: number
    seed: number
  }
  today: { newUsers: number; matches: number; messages: number }
  week: { newUsers: number }
  dau: number
  wau: number
  genders: { man: number; woman: number; nonbinary: number }
  signupsPerDay: DayCount[]
  matchesPerDay: DayCount[]
  premium: { activeUsers: number; revenueStars: number; newPremiumPerDay: DayCount[] }
}

export interface MatchSummary {
  matchId: string
  matchedAt: string
  user: { id: string | null; name: string; photo: string | null }
}

export interface UserDetail {
  user: UserListItem & {
    lookingFor: string
    bio: string | null
    interests: string[]
    location: string | null
    icebreakerPrompt: string | null
    icebreakerAnswer: string | null
    allowsWriteToPm: boolean | null
    photos: string[]
    premiumUntil: string | null
  }
  counts: { swipesGiven: number; likesReceived: number; matches: number; messagesSent: number }
  matches: MatchSummary[]
}

export interface Participant {
  id: string | null
  name: string
  photo: string | null
  isSeed: boolean
}

export interface ChatListItem {
  matchId: string
  matchedAt: string
  users: Participant[]
  messageCount: number
  lastMessage: { body: string; createdAt: string } | null
}

export interface ChatMessage {
  id: string
  senderId: string
  body: string
  createdAt: string
  readAt: string | null
}

export interface ChatTranscript {
  match: { id: string; matchedAt: string; users: Participant[] }
  messages: Paginated<ChatMessage>
}

export interface ReportSummaryItem {
  reportedUser: { id: string; name: string; photo: string | null; bannedAt: string | null; deletedAt: string | null }
  reportCount: number
  reasons: string[]
  contexts: string[]
  latestAt: string
}

export interface ReportHistoryItem {
  id: string
  reportedUser: { id: string; name: string }
  reason: string
  context: 'discovery' | 'chat'
  status: 'resolved_banned' | 'dismissed'
  createdAt: string
  resolvedAt: string
}

export interface ReportRow {
  id: string
  reporterId: string
  reporterName: string
  context: 'discovery' | 'chat'
  reason: string
  note: string | null
  matchId: string | null
  status: 'pending' | 'resolved_banned' | 'dismissed'
  createdAt: string
}

export interface ReportUserDetail {
  reportedUser: {
    id: string; name: string; age: number; gender: string; bio: string | null
    username: string | null; telegramId: number
    bannedAt: string | null; deletedAt: string | null; photos: string[]
  }
  reports: ReportRow[]
}

export interface SupportMessageItem {
  id: string
  sender: 'user' | 'admin'
  body: string
  createdAt: string
}

export interface SupportTicketItem {
  id: string
  user: { id: string | null; name: string; photo: string | null }
  status: 'open' | 'closed'
  lastSender: 'user' | 'admin'
  lastMessageAt: string
  createdAt: string
  preview: string
  needsReply: boolean
}

export interface SupportTicketDetail {
  ticket: {
    id: string
    status: 'open' | 'closed'
    createdAt: string
    closedAt: string | null
    user: { id: string | null; name: string; photo: string | null; telegramId: number | null }
  }
  messages: SupportMessageItem[]
}

export interface GiftConfig {
  markupPercent: number
  lowBalanceThreshold: number
}

export interface ModerationConfig {
  photoReportThreshold: number
}

export interface GiftBalance {
  balance: number | null
  lowBalanceThreshold: number
  low: boolean
}

export interface GiftTransaction {
  id: string
  buyerName: string
  recipientName: string
  emoji: string | null
  giftStarCost: number
  chargedStars: number
  markupStars: number
  status: 'pending_payment' | 'paid' | 'sent' | 'send_failed' | 'refunded'
  context: 'chat' | 'discovery'
  introStatus: 'pending' | 'accepted' | 'dismissed' | null
  createdAt: string
}

export interface PremiumConfig {
  premiumEnabled: boolean
}

export interface PremiumPlan {
  id: string
  title: string
  description: string
  priceStars: number
  discountPercent: number | null
  discountEndsAt: string | null
  durationDays: number
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface PremiumPlanInput {
  title: string
  description: string
  priceStars: number
  discountPercent: number | null
  discountEndsAt: string | null
  durationDays: number
  isActive: boolean
  sortOrder: number
}

export interface PremiumTransaction {
  id: string
  userName: string
  userUsername: string | null
  planTitle: string
  priceStars: number
  durationDays: number
  status: 'pending_payment' | 'paid' | 'refunded'
  source: 'purchase' | 'admin_grant'
  createdAt: string
  paidAt: string | null
}

export interface FakeLikerConfig {
  enabled: boolean
  maxTargetsPerRun: number
}

export interface FakeLikerRunStats {
  likesSent: number
  matchesCreated: number
  salamsSent: number
  skipped: number
  errors: number
}

export interface FakeLikerFake {
  id: string
  name: string
  likesSent: number
  matches: number
  unreadCount: number
}

export interface FakeLikerStats {
  fakeWomenCount: number
  totalLikesSent: number
  totalMatchesCreated: number
  totalSalamsSent: number
  lastRunAt: string | null
  nextRunAt: string | null
}

export interface FakeLikerRun {
  id: string
  trigger: string
  startedAt: string
  finishedAt: string | null
  likesSent: number
  matchesCreated: number
  salamsSent: number
  errors: number
}

export interface NewSeedUser {
  name: string
  age: number
  gender: string
  looking_for: string
  bio?: string
  interests?: string[]
  location?: string
  icebreaker_prompt?: string
  icebreaker_answer?: string
  photos?: string[]
}

/** PUT /admin/users/:id — any subset of these fields; photos is a full replacement (max 6). */
export interface UpdateSeedUser {
  name?: string
  age?: number
  gender?: string
  looking_for?: string
  bio?: string | null
  location?: string | null
  interests?: string[]
  icebreaker_prompt?: string | null
  icebreaker_answer?: string | null
  is_active?: boolean
  photos?: string[]
}
