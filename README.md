# Hugo's Health App 💪

A mobile-first Progressive Web App (PWA) for personal health tracking. Log daily food intake, workouts, supplements, and medications. Data syncs to Notion as the backend database.

## Features

- **Multi-user auth** — User tiles + 4-digit PIN (SHA-256 hashed locally)
- **Daily logging** — Expandable cards for meals, workout, supplements, medications
- **Macro tracking** — Auto-calculate protein & calories from a built-in food database + USDA API fallback
- **Workout logging** — Sets × Reps × Weight with preset templates
- **Dashboard** — Weekly stats, progress bars, streak tracking (🔥)
- **Notion sync** — All data syncs to Notion databases as source of truth
- **Offline support** — IndexedDB local cache, sync queued when connection restores
- **PWA** — Installable, mobile-first, dark mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (PWA) |
| Styling | Tailwind CSS |
| State | Zustand |
| Local DB | IndexedDB (idb) |
| Backend | Notion API |
| Bundler | Vite + vite-plugin-pwa |

## Setup

```bash
npm install
npm run dev
```

### Notion Integration

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Create two databases in your Notion workspace:
   - **Health App — Users** (see schema below)
   - **Health App — Daily Log** (see schema below)
3. Share both databases with your integration
4. In the app → Settings → Notion Integration, enter:
   - Your Notion API key (`secret_...`)
   - The Users database ID
   - The Daily Log database ID

### Notion Database Schemas

**Health App — Users**
| Property | Type |
|---------|------|
| Name | Title |
| User ID | Text |
| PIN Hash | Text |
| Avatar | Text |
| Is Admin | Checkbox |
| Settings | Text (JSON) |

**Health App — Daily Log**
| Property | Type |
|---------|------|
| Title | Title |
| User ID | Text |
| Date | Date |
| Total Calories | Number |
| Total Protein | Number |
| Workout Completed | Checkbox |
| Streak | Number |
| Cards Completed | Number |
| Entry Data | Text (JSON) |
| Last Synced | Date |

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## Deployment

Deploy the `dist/` folder to Vercel or Netlify.

**Note:** Notion API calls require a server-side proxy in production due to CORS. Configure a Vercel Edge Function or Netlify Function as a proxy for `/api/notion/*` routes.

## First-time setup

On first launch with no users, you'll see a "Set up first user" link. Create an admin user with a name and 4-digit PIN. From Settings → Manage Users, you can then add other family/partner users.

---

Owner: Hugo Hornschuch Welke · Last updated: 2026-03-06
