import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  try {
    // ml_families table
    await sql`
      CREATE TABLE IF NOT EXISTS ml_families (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // ml_members table
    await sql`
      CREATE TABLE IF NOT EXISTS ml_members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES ml_families(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        avatar TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // ml_categories table
    await sql`
      CREATE TABLE IF NOT EXISTS ml_categories (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES ml_families(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // ml_tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS ml_tasks (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES ml_families(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES ml_categories(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES ml_members(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        effort INTEGER NOT NULL CHECK (effort >= 1 AND effort <= 5),
        frequency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `;

    // Indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_members_family ON ml_members(family_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_categories_family ON ml_categories(family_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_tasks_family ON ml_tasks(family_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_tasks_category ON ml_tasks(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_tasks_assigned ON ml_tasks(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ml_tasks_status ON ml_tasks(status)`;

    initialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { sql };

// Default categories to seed on family creation
export const DEFAULT_CATEGORIES = [
  { name: 'Medical', icon: '🏥' },
  { name: 'School', icon: '📚' },
  { name: 'Meals', icon: '🍳' },
  { name: 'Emotional Support', icon: '💛' },
  { name: 'Finances', icon: '💰' },
  { name: 'Social', icon: '👥' },
  { name: 'Household', icon: '🏠' },
  { name: 'Admin', icon: '📋' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Childcare', icon: '👶' }
];

// Generate random family join code
export function generateFamilyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'LOAD-';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + code;
}

// Default member colors for visual distinction
export const DEFAULT_COLORS = [
  '#8B5CF6', // Purple
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
];