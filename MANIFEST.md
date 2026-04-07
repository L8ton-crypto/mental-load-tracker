# Mental Load Tracker - MANIFEST

## Overview
A family mental load tracker that makes invisible household labour visible. Track task distribution across family members, visualize load balance, and identify imbalances that need rebalancing.

## Live URL
*(Deploy to Vercel to get URL)*

## Repository
GitHub: `L8ton-crypto/mental-load-tracker`

## Tech Stack
- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (dark mode forced)
- **Database:** Neon PostgreSQL via `@neondatabase/serverless`
- **Charts:** Recharts
- **Icons:** Lucide React
- **Analytics:** `@vercel/analytics` + `@vercel/speed-insights`

## Database Schema

### Tables (all prefixed with `ml_`)

**ml_families**
- `id` (serial PK)
- `name` (text) - Family display name
- `code` (text, unique) - Join code like "LOAD-7X3K"
- `created_at` (timestamptz)

**ml_members**
- `id` (serial PK)
- `family_id` (FK → ml_families)
- `name` (text)
- `color` (text) - Hex color for charts
- `avatar` (text) - Emoji
- `created_at` (timestamptz)

**ml_categories**
- `id` (serial PK)
- `family_id` (FK → ml_families)
- `name` (text) - Category name
- `icon` (text) - Emoji icon
- `created_at` (timestamptz)

Default categories seeded on family creation:
Medical 🏥, School 📚, Meals 🍳, Emotional Support 💛, Finances 💰, Social 👥, Household 🏠, Admin 📋, Transport 🚗, Childcare 👶

**ml_tasks**
- `id` (serial PK)
- `family_id` (FK → ml_families)
- `category_id` (FK → ml_categories)
- `assigned_to` (FK → ml_members, nullable)
- `title` (text)
- `effort` (int, 1-5) - Mental energy required
- `frequency` (text) - daily/weekly/monthly/one-off/ongoing
- `status` (text) - active/completed
- `created_at` (timestamptz)
- `completed_at` (timestamptz, nullable)

## Pages

### `/` - Landing/Onboarding
- Hero section explaining the app
- "Create Family" flow - name family, name yourself, get join code
- "Join Family" flow - enter code, name yourself
- Redirects to /dashboard on success
- Stores familyId, memberId, familyCode in localStorage

### `/dashboard` - Main Dashboard
- **Load Balance Bar** - Horizontal stacked bar showing % of total effort per member
- **Member Stats** - Cards showing each member's task count and effort
- **Category Breakdown** - Grid of categories with pie charts showing per-member distribution
- **Recent Tasks** - Latest 5 tasks with category icons and assignee avatars
- **Quick Add FAB** - Floating action button to quickly add new tasks
- Header shows family name and shareable join code

### `/tasks` - Full Task List
- Filter by category, member, status
- Sort by date, effort, category
- Bulk selection with checkbox UI
- Bulk reassign selected tasks to different member
- Mark complete / delete actions per task
- Add new task form (inline)

### `/insights` - Rebalancing Insights
- Current balance visualization with per-member progress bars
- Overloaded/Underloaded labels
- Balance warnings when one member handles >60% of load
- Category imbalance alerts (when one person handles >75% of a category)
- Rebalancing suggestions with specific recommendations
- Weekly effort trends line chart (last 8 weeks)
- Tips for better balance

## API Routes

### Family
- `POST /api/family` - Create family (name, memberName)
- `POST /api/family/join` - Join family (code, memberName)
- `GET /api/family/[id]` - Get family with members, categories, stats

### Members
- `POST /api/members` - Add member to family
- `PUT /api/members/[id]` - Update member

### Tasks
- `GET /api/tasks?familyId=X` - Get all tasks with joins
- `POST /api/tasks` - Create task
- `PUT /api/tasks/[id]` - Update task (reassign, complete, edit)
- `DELETE /api/tasks/[id]` - Delete task

### Stats
- `GET /api/stats?familyId=X` - Aggregated stats for dashboard
  - Member effort distribution
  - Category breakdown by member
  - Recent activity (30 days)
  - Weekly trends (8 weeks)
  - Balance insights
  - Category imbalances

## Key Features

1. **Family Code System** - Share a code like "LOAD-7X3K" to let partners join
2. **No Auth** - Simple localStorage-based session, no login required
3. **Effort Scoring** - Tasks rated 1-5 for mental energy, weighted in calculations
4. **Color-Coded Members** - Each member gets a unique color for charts
5. **Load Balance Bar** - Hero visual showing % distribution at a glance
6. **Category Breakdown** - See who owns each type of mental load
7. **Bulk Reassign** - Select multiple tasks and reassign in one action
8. **Rebalancing Suggestions** - Smart recommendations based on current distribution
9. **Weekly Trends** - Track balance improvements over time
10. **Mobile-First** - Designed for phone use while juggling kids

## Environment Variables

```
DATABASE_URL=postgresql://...
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deployment
Deploy to Vercel. The app uses `@vercel/analytics` and `@vercel/speed-insights` which auto-configure on Vercel.

Set `DATABASE_URL` in Vercel environment variables.