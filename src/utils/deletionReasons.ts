// Answer codes sent by the app's delete-account screen.
const LABELS: Record<string, string> = {
  found_someone: 'Found someone',
  few_matches: 'Not enough matches',
  no_replies: 'No replies',
  fake_profiles: 'Fake profiles',
  too_expensive: 'Too expensive',
  privacy_safety: 'Privacy / safety',
  buggy: 'Buggy / slow',
  taking_break: 'Taking a break',
  other: 'Other',
}

/** Human label for a reason code; null = deleted without answering. */
export const deletionReasonLabel = (reason: string | null) =>
  reason === null ? 'No answer' : LABELS[reason] ?? reason
