export const TEXT_REASON_LABELS: Record<string, string> = {
  contact_info: 'Contact info / ID',
  fake_name: 'Fake name',
  offensive: 'Offensive',
  sexual: 'Sexual',
  ad_or_spam: 'Ad / spam',
}

export const TEXT_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  bio: 'Bio',
  icebreaker_answer: 'Icebreaker answer',
}

export const textReasonLabel = (code: string | null) => (code ? TEXT_REASON_LABELS[code] ?? code : 'Rejected')
export const textFieldLabel = (field: string) => TEXT_FIELD_LABELS[field] ?? field
export const textSourceLabel = (source: string) => (source === 'regex' ? 'Regex' : source === 'ai' ? 'AI' : source)
