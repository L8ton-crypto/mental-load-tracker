import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql, DEFAULT_COLORS } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { familyId, name, avatar = '👤' } = await request.json();

    if (!familyId || !name) {
      return NextResponse.json(
        { error: 'Family ID and name are required' },
        { status: 400 }
      );
    }

    // Check if member name already exists in this family
    const existingMember = await sql`
      SELECT id FROM ml_members 
      WHERE family_id = ${familyId} AND LOWER(name) = ${name.toLowerCase()}
    `;

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'A member with this name already exists in the family' },
        { status: 409 }
      );
    }

    // Get next available color
    const existingMembers = await sql`
      SELECT color FROM ml_members WHERE family_id = ${familyId}
    `;
    const usedColors = existingMembers.map(m => m.color);
    const availableColor = DEFAULT_COLORS.find(color => !usedColors.includes(color)) || DEFAULT_COLORS[0];

    // Create member
    const [member] = await sql`
      INSERT INTO ml_members (family_id, name, color, avatar)
      VALUES (${familyId}, ${name}, ${availableColor}, ${avatar})
      RETURNING id, family_id, name, color, avatar, created_at
    `;

    return NextResponse.json({
      member,
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Member creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}