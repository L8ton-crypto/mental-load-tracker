import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      );
    }

    const tasks = await sql`
      SELECT 
        t.id,
        t.title,
        t.effort,
        t.frequency,
        t.status,
        t.created_at,
        t.completed_at,
        c.name as category_name,
        c.icon as category_icon,
        c.id as category_id,
        m.name as assigned_to_name,
        m.color as assigned_to_color,
        m.avatar as assigned_to_avatar,
        t.assigned_to
      FROM ml_tasks t
      LEFT JOIN ml_categories c ON t.category_id = c.id
      LEFT JOIN ml_members m ON t.assigned_to = m.id
      WHERE t.family_id = ${parseInt(familyId)}
      ORDER BY t.created_at DESC
    `;

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const {
      familyId,
      categoryId,
      assignedTo,
      title,
      effort,
      frequency = 'one-off'
    } = await request.json();

    if (!familyId || !categoryId || !title || !effort) {
      return NextResponse.json(
        { error: 'Family ID, category ID, title, and effort are required' },
        { status: 400 }
      );
    }

    if (effort < 1 || effort > 5) {
      return NextResponse.json(
        { error: 'Effort must be between 1 and 5' },
        { status: 400 }
      );
    }

    const [task] = await sql`
      INSERT INTO ml_tasks (family_id, category_id, assigned_to, title, effort, frequency)
      VALUES (${familyId}, ${categoryId}, ${assignedTo || null}, ${title}, ${effort}, ${frequency})
      RETURNING id, family_id, category_id, assigned_to, title, effort, frequency, status, created_at
    `;

    return NextResponse.json({
      task,
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error('Task creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}