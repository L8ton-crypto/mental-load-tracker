import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql, DEFAULT_COLORS } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { code, memberName } = await request.json();

    if (!code || !memberName) {
      return NextResponse.json(
        { error: 'Family code and member name are required' },
        { status: 400 }
      );
    }

    // Find family by code
    const [family] = await sql`
      SELECT id, name, code, created_at 
      FROM ml_families 
      WHERE code = ${code.toUpperCase()}
    `;

    if (!family) {
      return NextResponse.json(
        { error: 'Invalid family code' },
        { status: 404 }
      );
    }

    // Check if member name already exists in this family
    const existingMember = await sql`
      SELECT id FROM ml_members 
      WHERE family_id = ${family.id} AND LOWER(name) = ${memberName.toLowerCase()}
    `;

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'A member with this name already exists in the family' },
        { status: 409 }
      );
    }

    // Get next color for member
    const existingMembers = await sql`
      SELECT color FROM ml_members WHERE family_id = ${family.id}
    `;
    const usedColors = existingMembers.map(m => m.color);
    const availableColor = DEFAULT_COLORS.find(color => !usedColors.includes(color)) || DEFAULT_COLORS[0];

    // Create new member
    const [member] = await sql`
      INSERT INTO ml_members (family_id, name, color, avatar)
      VALUES (${family.id}, ${memberName}, ${availableColor}, '👤')
      RETURNING id, name, color, avatar, created_at
    `;

    return NextResponse.json({
      family,
      member,
      message: 'Successfully joined family'
    });

  } catch (error) {
    console.error('Family join failed:', error);
    return NextResponse.json(
      { error: 'Failed to join family' },
      { status: 500 }
    );
  }
}