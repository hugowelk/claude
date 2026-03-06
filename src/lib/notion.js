/**
 * Notion API integration
 *
 * In development (localhost): requests go directly to api.notion.com.
 * In production: requests are routed through the /api/notion proxy
 * (Vercel Edge Function at api/notion.js) to avoid CORS restrictions.
 *
 * The API key is stored locally by the client and forwarded with each request.
 */

// Always route through /api/notion/v1:
//   - In production (Vercel): handled by the Edge Function at api/notion/[...path].js
//   - In dev (Vite): proxied to https://api.notion.com by vite.config.js server.proxy
function notionBase() {
  return '/api/notion/v1'
}

export function createNotionClient(apiKey) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28'
  }

  async function request(method, path, body) {
    const res = await fetch(`${notionBase()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || `Notion API error: ${res.status}`)
    }
    return res.json()
  }

  return {
    /**
     * Query a database for entries matching a filter
     */
    async queryDatabase(databaseId, filter, sorts) {
      return request('POST', `/databases/${databaseId}/query`, { filter, sorts })
    },

    /**
     * Create a page in a database
     */
    async createPage(databaseId, properties) {
      return request('POST', '/pages', {
        parent: { database_id: databaseId },
        properties
      })
    },

    /**
     * Update an existing page's properties
     */
    async updatePage(pageId, properties) {
      return request('PATCH', `/pages/${pageId}`, { properties })
    },

    /**
     * Retrieve a database schema
     */
    async getDatabase(databaseId) {
      return request('GET', `/databases/${databaseId}`)
    }
  }
}

// ── Property builders ──────────────────────────────────────────────────────

export function titleProp(text) {
  return { title: [{ text: { content: String(text) } }] }
}

export function richTextProp(text) {
  return { rich_text: [{ text: { content: String(text) } }] }
}

export function numberProp(value) {
  return { number: typeof value === 'number' ? value : null }
}

export function checkboxProp(checked) {
  return { checkbox: Boolean(checked) }
}

export function dateProp(dateStr) {
  return { date: { start: dateStr } }
}

export function selectProp(name) {
  return { select: { name: String(name) } }
}

// ── Notion → Local adapters ────────────────────────────────────────────────

export function extractTitle(page) {
  const titleProp = Object.values(page.properties).find(p => p.type === 'title')
  return titleProp?.title?.[0]?.plain_text ?? ''
}

export function extractText(prop) {
  return prop?.rich_text?.[0]?.plain_text ?? ''
}

export function extractNumber(prop) {
  return prop?.number ?? 0
}

export function extractCheckbox(prop) {
  return prop?.checkbox ?? false
}

export function extractDate(prop) {
  return prop?.date?.start ?? null
}

// ── High-level sync helpers ────────────────────────────────────────────────

/**
 * Build Notion properties for a Users database entry
 */
export function buildUserProperties(user) {
  return {
    Name: titleProp(user.name),
    'User ID': richTextProp(user.id),
    'PIN Hash': richTextProp(user.pinHash),
    Avatar: richTextProp(user.avatar),
    'Is Admin': checkboxProp(user.isAdmin),
    Settings: richTextProp(JSON.stringify(user.settings || {}))
  }
}

/**
 * Build Notion properties for a Daily Log database entry
 */
export function buildDailyLogProperties(log) {
  return {
    Title: titleProp(`${log.userId} — ${log.date}`),
    'User ID': richTextProp(log.userId),
    Date: dateProp(log.date),
    'Total Calories': numberProp(log.totalCalories || 0),
    'Total Protein': numberProp(log.totalProtein || 0),
    'Workout Completed': checkboxProp(log.workoutCompleted || false),
    Streak: numberProp(log.streak || 0),
    'Cards Completed': numberProp(log.cardsCompleted || 0),
    'Entry Data': richTextProp(JSON.stringify(log.entryData || {})),
    'Last Synced': dateProp(new Date().toISOString().split('T')[0])
  }
}

/**
 * Find a daily log page in Notion by userId + date
 */
export async function findDailyLogPage(notion, databaseId, userId, date) {
  const response = await notion.queryDatabase(databaseId, {
    and: [
      { property: 'User ID', rich_text: { equals: userId } },
      { property: 'Date', date: { equals: date } }
    ]
  })
  return response.results[0] ?? null
}

/**
 * Upsert a daily log entry to Notion
 */
export async function syncDailyLog(notion, databaseId, log) {
  const properties = buildDailyLogProperties(log)
  const existing = await findDailyLogPage(notion, databaseId, log.userId, log.date)

  if (existing) {
    return notion.updatePage(existing.id, properties)
  } else {
    return notion.createPage(databaseId, properties)
  }
}

// ── Users DB sync ──────────────────────────────────────────────────────────

/**
 * Find a user page in the Notion Users DB by User ID
 */
async function findUserPage(notion, databaseId, userId) {
  const response = await notion.queryDatabase(databaseId, {
    property: 'User ID', rich_text: { equals: userId }
  })
  return response.results[0] ?? null
}

/**
 * Upsert a user to the Notion Users database.
 * PIN hash is included so the DB can serve as a backup — it is never
 * used to authenticate directly; local IndexedDB is the auth source.
 */
export async function syncUserToNotion(notion, databaseId, user) {
  const properties = buildUserProperties(user)
  const existing = await findUserPage(notion, databaseId, user.id)
  if (existing) {
    return notion.updatePage(existing.id, properties)
  } else {
    return notion.createPage(databaseId, properties)
  }
}

/**
 * Pull all users from the Notion Users database and return as local user objects.
 * Merges with locally known data — Notion is the source for name/avatar/settings.
 */
export async function pullUsersFromNotion(notion, databaseId) {
  const response = await notion.queryDatabase(databaseId, undefined, [
    { property: 'Name', direction: 'ascending' }
  ])

  return response.results.map(page => {
    const p = page.properties
    const settingsStr = extractText(p['Settings'])
    let settings = {}
    try { settings = JSON.parse(settingsStr) } catch {}

    return {
      id: extractText(p['User ID']),
      name: extractTitle(page),
      avatar: extractText(p['Avatar']) || '👤',
      pinHash: extractText(p['PIN Hash']),
      isAdmin: extractCheckbox(p['Is Admin']),
      settings,
      notionPageId: page.id,
    }
  }).filter(u => u.id) // drop malformed rows
}
