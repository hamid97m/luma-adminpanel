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
  isActive: boolean
  isSeed: boolean
  bannedAt: string | null
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
  }
  counts: { swipesGiven: number; likesReceived: number; matches: number; messagesSent: number }
  matches: MatchSummary[]
}

export interface Participant {
  id: string | null
  name: string
  photo: string | null
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
