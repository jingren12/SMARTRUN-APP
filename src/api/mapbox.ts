// ─── Mapbox API Client ───────────────────────────────────────
// Real-address geocoding and real-road directions via Mapbox.
// Requires VITE_MAPBOX_TOKEN (public token, safe for client use).
// All functions degrade gracefully when the token is missing.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

export const MAPBOX_TOKEN = TOKEN

export interface GeocodeResult {
  id: string
  label: string
  lat: number
  lng: number
}

export interface DirectionsResult {
  distanceM: number
  durationMin: number
  coordinates: [number, number][]
}

export function hasMapbox(): boolean {
  return typeof TOKEN === 'string' && TOKEN.length > 0
}

// Convert a free-text address into candidate coordinates (Mapbox Geocoding API).
export async function mapboxGeocode(query: string): Promise<GeocodeResult[]> {
  if (!hasMapbox() || !query.trim()) return []
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${TOKEN}&limit=5&language=zh`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as {
      features?: { id: string; place_name: string; center: [number, number] }[]
    }
    return (data.features ?? []).map(f => ({
      id: f.id,
      label: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
    }))
  } catch {
    return []
  }
}

// Fetch a real walking route between two points (Mapbox Directions API).
export async function mapboxDirections(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<DirectionsResult | null> {
  if (!hasMapbox()) return null
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/${startLng},${startLat};${endLng},${endLat}` +
      `?access_token=${TOKEN}&overview=full&geometries=geojson&steps=false`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      routes?: {
        distance: number
        duration: number
        geometry: { coordinates: [number, number][] }
      }[]
    }
    const route = data.routes?.[0]
    if (!route) return null
    return {
      distanceM: route.distance,
      durationMin: Math.round(route.duration / 60),
      coordinates: route.geometry.coordinates,
    }
  } catch {
    return null
  }
}
