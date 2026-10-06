const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** 'IR' → 'Iran (IR)'; falls back to the raw code if the browser doesn't know it. */
export function countryName(code: string | null): string | null {
  if (!code) return null
  try {
    const name = regionNames.of(code)
    return name && name !== code ? `${name} (${code})` : code
  } catch {
    return code
  }
}

/** Compact 'Tehran, IR' for tables; null when nothing is resolved. */
export function formatGeo(city: string | null, country: string | null): string | null {
  if (!city && !country) return null
  return [city, country].filter(Boolean).join(', ')
}
