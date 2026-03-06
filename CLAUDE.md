# CLAUDE.md

This file provides guidance for AI assistants (and developers) working with the `hugowelk/claude` repository.

## Project Status

**Active development.** Phases 1–6 of Hugo's Health App are implemented: React PWA with auth, daily logging, dashboard, settings, and Notion sync. See README.md for full feature list and setup instructions.

## Repository Overview

- **Repository**: `hugowelk/claude`
- **Branch strategy**: Feature branches prefixed with `claude/`

## Development Conventions

### Git Workflow

- Create feature branches from `main` (or the default branch once established)
- Branch naming: `claude/<descriptive-name>` or as assigned
- Write clear, concise commit messages that explain *why*, not just *what*
- Push with `git push -u origin <branch-name>`

### Code Style

- Follow the language-specific conventions established by the project's linter/formatter config once added
- Prefer readability and simplicity over cleverness
- Keep functions small and focused on a single responsibility

### Testing

- Tests should be added alongside new functionality
- Run the full test suite before pushing (command TBD once test framework is chosen)

### Dependencies

- Pin dependency versions for reproducibility
- Document why non-obvious dependencies are needed

## Project Structure

```
/
├── CLAUDE.md                  # This file
├── README.md                  # Setup and usage guide
├── package.json               # Dependencies (React, Zustand, idb, Notion client)
├── vite.config.js             # Vite + PWA plugin config
├── tailwind.config.js         # Tailwind CSS config
├── index.html                 # App entry point
├── public/                    # Static assets (favicon)
└── src/
    ├── main.jsx               # React root
    ├── App.jsx                # Router + auth gate
    ├── index.css              # Global styles + Tailwind
    ├── components/
    │   ├── LoginScreen.jsx    # User selection + PIN entry
    │   ├── TopBar.jsx         # Date nav + user avatar + sync status
    │   ├── BottomNav.jsx      # Today / Dashboard / Settings tabs
    │   └── cards/
    │       ├── MealCard.jsx       # Meal logging with food search + macros
    │       ├── WorkoutCard.jsx    # Workout logging with exercise rows
    │       └── ChecklistCard.jsx  # Supplements & medications toggle list
    ├── pages/
    │   ├── TodayPage.jsx      # Daily checklist view
    │   ├── DashboardPage.jsx  # Weekly stats + streaks
    │   └── SettingsPage.jsx   # Profile, targets, Notion, user management
    ├── store/
    │   └── useAppStore.js     # Zustand store (auth, entries, sync)
    ├── lib/
    │   ├── crypto.js          # SHA-256 PIN hashing (Web Crypto API)
    │   ├── db.js              # IndexedDB via idb (users, logs, settings)
    │   └── notion.js          # Notion API client + upsert helpers
    └── data/
        ├── foods.js           # Built-in nutrition DB + USDA API lookup
        └── exercises.js       # Exercise list + workout presets
```

## Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview production build | `npm run preview` |

## Guidelines for AI Assistants

1. **Read before writing** — always read existing files before proposing changes.
2. **Minimal changes** — only modify what is necessary to accomplish the task. Avoid unrelated refactors.
3. **No secrets** — never commit `.env` files, credentials, or API keys.
4. **Verify work** — run tests and linters when available before considering a task complete.
5. **Update this file** — when adding new tools, scripts, or conventions, update CLAUDE.md to reflect the current state of the project.
