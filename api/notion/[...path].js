/**
 * Vercel Serverless Function — Notion API Proxy
 *
 * Routes: /api/notion/:path*
 *
 * The Notion API does not set CORS headers that allow browser requests
 * from arbitrary origins. This proxy forwards requests server-side,
 * injecting the Notion API key from the request Authorization header
 * (the client sends the key it has stored locally).
 *
 * Security note: this is designed for a private, close-circle app.
 * The API key is provided by the authenticated client — there is no
 * server-stored secret. For a stricter setup, move the key to a
 * Vercel environment variable and strip the Authorization header from
 * client requests.
 */

const NOTION_BASE = 'https://api.notion.com'

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const url = new URL(request.url)

  // Strip the /api/notion prefix to get the Notion path
  // e.g. /api/notion/v1/databases/abc/query → /v1/databases/abc/query
  const notionPath = url.pathname.replace(/^\/api\/notion/, '')
  const notionUrl = `${NOTION_BASE}${notionPath}${url.search}`

  // Forward the request to Notion
  const notionRequest = new Request(notionUrl, {
    method: request.method,
    headers: forwardHeaders(request.headers),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    // Required for streaming body passthrough
    duplex: 'half',
  })

  let notionResponse
  try {
    notionResponse = await fetch(notionRequest)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy fetch failed', detail: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }

  // Clone the response and add CORS headers
  const responseHeaders = new Headers(notionResponse.headers)
  for (const [k, v] of Object.entries(corsHeaders())) {
    responseHeaders.set(k, v)
  }

  return new Response(notionResponse.body, {
    status: notionResponse.status,
    headers: responseHeaders,
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
  }
}

function forwardHeaders(incoming) {
  const out = new Headers()
  // Forward auth + content-type + notion version
  for (const key of ['authorization', 'content-type', 'notion-version']) {
    const val = incoming.get(key)
    if (val) out.set(key, val)
  }
  return out
}
