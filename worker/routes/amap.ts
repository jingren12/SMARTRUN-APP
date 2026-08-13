import { Hono } from 'hono'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

// AMap (高德地图) proxy — geocoding + walking directions.
// The key is injected via the `AMAP_KEY` Cloudflare secret; the frontend
// never sees it, and the AMap REST API's CORS limits never apply.
export const amapRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

amapRoutes.use('/*', requireAuth)

const REST = 'https://restapi.amap.com/v3'

interface PoiRow {
  id?: string
  name?: string
  address?: string
  location?: string
}

// POST /api/amap/geocode — free-text address → candidate coordinates (place/text)
amapRoutes.post('/geocode', async (c) => {
  const key = c.env.AMAP_KEY
  if (!key) return c.json({ ok: false, error: 'amap_not_configured' }, 503)

  const body = await c.req.json<{ query?: unknown }>().catch((): { query?: unknown } => ({}))
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return c.json({ ok: false, error: 'missing_query' }, 400)

  try {
    const url =
      `${REST}/place/text?key=${encodeURIComponent(key)}` +
      `&keywords=${encodeURIComponent(query)}&offset=10&page=1&extensions=base&city=上海&citylimit=true`
    const res = await fetch(url)
    if (!res.ok) return c.json({ ok: false, error: 'amap_upstream_error' }, 502)
    const data = (await res.json()) as { status?: string; pois?: PoiRow[] }
    if (data.status !== '1') return c.json({ ok: false, error: 'amap_upstream_error' }, 502)

    const results = (data.pois ?? [])
      .filter((p): p is PoiRow & { id: string; name: string; location: string } => !!p.id && !!p.name && !!p.location)
      .map(p => {
        const [lng, lat] = p.location.split(',').map(Number)
        const label = p.address ? `${p.name} · ${p.address}` : p.name
        return { id: p.id, label, lat, lng }
      })
    return c.json({ ok: true, results })
  } catch (e) {
    console.error('AMap geocode failed', e)
    return c.json({ ok: false, error: 'amap_network_error' }, 502)
  }
})

interface WalkStep {
  polyline?: string
}

// POST /api/amap/directions — walking route between two points (direction/walking)
amapRoutes.post('/directions', async (c) => {
  const key = c.env.AMAP_KEY
  if (!key) return c.json({ ok: false, error: 'amap_not_configured' }, 503)

  const body = await c.req
    .json<{ origin?: unknown; destination?: unknown }>()
    .catch((): { origin?: unknown; destination?: unknown } => ({}))
  const origin = typeof body.origin === 'string' ? body.origin.trim() : ''
  const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
  if (!origin || !destination) return c.json({ ok: false, error: 'missing_coords' }, 400)

  try {
    const url =
      `${REST}/direction/walking?key=${encodeURIComponent(key)}` +
      `&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    const res = await fetch(url)
    if (!res.ok) return c.json({ ok: false, error: 'amap_upstream_error' }, 502)
    const data = (await res.json()) as {
      status?: string
      route?: { paths?: { distance?: string; duration?: string; steps?: WalkStep[] }[] }
    }
    if (data.status !== '1' || !data.route?.paths?.length) {
      return c.json({ ok: false, error: 'amap_no_route' }, 502)
    }
    const path = data.route.paths[0]
    const coordinates: [number, number][] = []
    for (const step of path.steps ?? []) {
      if (!step.polyline) continue
      for (const pair of step.polyline.split(';')) {
        const [lng, lat] = pair.split(',').map(Number)
        if (Number.isFinite(lng) && Number.isFinite(lat)) coordinates.push([lng, lat])
      }
    }
    return c.json({
      ok: true,
      distanceM: Number(path.distance) || 0,
      durationMin: Math.round((Number(path.duration) || 0) / 60),
      coordinates,
    })
  } catch (e) {
    console.error('AMap directions failed', e)
    return c.json({ ok: false, error: 'amap_network_error' }, 502)
  }
})
