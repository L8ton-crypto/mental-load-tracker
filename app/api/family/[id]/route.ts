import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    
    const { id } = await params;
    const familyId = parseInt(id);
    
    if (isNaN(familyId)) {
      return NextResponse.json(
        { error: 'Invalid family ID' },
        { status: 400 }
      );
    }

    // Get family
    const [family] = await sql`
      SELECT id, name, code, created_at 
      FROM ml_families 
      WHERE id = ${familyId}
    `;

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Get members
    const members = await sql`
      SELECT id, name, color, avatar, created_at 
      FROM ml_members 
      WHERE family_id = ${familyId}
      ORDER BY created_at
    `;

    // Get categories
    const categories = await sql`
      SELECT id, name, icon, created_at 
      FROM ml_categories 
      WHERE family_id = ${familyId}
      ORDER BY name
    `;

    // Get task stats per member
    const memberStats = await sql`
      SELECT 
        m.id,
        m.name,
        m.color,
        COUNT(t.id) as task_count,
        COALESCE(SUM(t.effort), 0) as total_effort
      FROM ml_members m
      LEFT JOIN ml_tasks t ON m.id = t.assigned_to AND t.status = 'active'
      WHERE m.family_id = ${familyId}
      GROUP BY m.id, m.name, m.color
      ORDER BY m.created_at
    `;

    // Get category stats
    const categoryStats = await sql`
      SELECT 
        c.id,
        c.name,
        c.icon,
        COUNT(t.id) as task_count,
        COALESCE(SUM(t.effort), 0) as total_effort
      FROM ml_categories c
      LEFT JOIN ml_tasks t ON c.id = t.category_id AND t.status = 'active'
      WHERE c.family_id = ${familyId}
      GROUP BY c.id, c.name, c.icon
      ORDER BY c.name
    `;

    return NextResponse.json({
      family,
      members,
      categories,
      memberStats,
      categoryStats
    });

  } catch (error) {
    console.error('Failed to get family data:', error);
    return NextResponse.json(
      { error: 'Failed to get family data' },
      { status: 500 }
    );
  }
}