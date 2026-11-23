export const otherGender = (g: string) => (g === 'man' ? 'woman' : g === 'woman' ? 'man' : null)

const GENDER_LABELS: Record<string, string> = {
  man: '♂ Man',
  woman: '♀ Woman',
  nonbinary: 'Nonbinary',
  unclear: 'Unclear',
  unisex: 'Unisex',
  unknown: 'Unknown',
}

export const genderLabel = (g: string | null) => (g ? GENDER_LABELS[g] ?? g : '—')

/** True when an AI guess contradicts the user's selected gender. */
export const contradicts = (selected: string, guess: string | null) =>
  (guess === 'man' || guess === 'woman') && guess !== selected
