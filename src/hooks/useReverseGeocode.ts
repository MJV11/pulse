import { useEffect, useState } from 'react'

/**
 * Reverse-geocodes a lat/lng pair into a human-readable city string using
 * OpenStreetMap Nominatim (free, no API key required).
 *
 * Returns null while loading or if no coordinates are available.
 */
export function useReverseGeocode(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string | null {
  const [city, setCity] = useState<string | null>(null)

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setCity(null)
      return
    }

    let cancelled = false

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        const addr = json?.address ?? {}
        const label =
          addr.city ??
          addr.town ??
          addr.village ??
          addr.county ??
          addr.state ??
          null
        setCity(label)
      })
      .catch(() => {
        if (!cancelled) setCity(null)
      })

    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  return city
}
