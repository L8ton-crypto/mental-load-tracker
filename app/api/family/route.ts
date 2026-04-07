import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql, generateFamilyCode, DEFAULT_CATEGORIES, DEFAULT_COLORS } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { name, memberName } = await request.json();

    if (!name || !memberName) {
      return NextResponse.json(
        { error: 'Family name and member name are required' },
        { status: 400 }
      );
    }

    // Generate unique family code
    let familyCode = '';
    let codeExists = true;
    while (codeExists) {
      familyCode = generateFamilyCode();
      const existing = await sql`SELECT id FROM ml_families WHERE code = ${familyCode}`;
      codeExists = existing.length > 0;
    }

    // Create family
    const [family] = await sql`
      INSERT INTO ml_families (name, code)
      VALUES (${name}, ${familyCode})
      RETURNING id, name, code, created_at
    `;

    // Create default categories for this family
    for (const category of DEFAULT_CATEGORIES) {
      await sql`
        INSERT INTO ml_categories (family_id, name, icon)
        VALUES (${family.id}, ${category.name}, ${category.icon})
      `;
    }

    // Create first member
    const [member] = await sql`
      INSERT INTO ml_members (family_id, name, color, avatar)
      VALUES (${family.id}, ${memberName}, ${DEFAULT_COLORS[0]}, '👤')
      RETURNING id, name, color, avatar, created_at
    `;

    return NextResponse.json({
      family,
      member,
      message: 'Family created successfully'
    });

  } catch (error) {
    console.error('Family creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create family' },
      { status: 500 }
    );
  }
}