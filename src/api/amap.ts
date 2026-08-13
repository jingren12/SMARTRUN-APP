// ─── AMap (高德地图) API Client ─────────────────────────────
// Address search + walking directions, proxied through the Worker
// (the AMap REST API key stays server-side; CORS is not an issue).

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://smartrun-api.eos-run.workers.dev' : '')

export interface AmapGeocodeResult {
  id: string
  label: string
  lat: number
  lng: number
}

export interface AmapDirectionsResult {
  distanceM: number
  durationMin: number
  coordinates: [number, number][]
}

async function amapRequest<T>(token: string, path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok || json.ok === false) return { ok: false, error: json.error || 'request_failed' }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}

export function amapGeocode(token: string, query: string): Promise<{ ok: true; data: { results: AmapGeocodeResult[] } } | { ok: false; error: string }> {
  return amapRequest('/api/amap/geocode', token, { query })
}

export function amapDirections(token: string, origin: string, destination: string): Promise<{ ok: true; data: AmapDirectionsResult } | { ok: false; error: string }> {
  return amapRequest('/api/amap/directions', token, { origin, destination })
}
