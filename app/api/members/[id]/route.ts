import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    
    const { id } = await params;
    const memberId = parseInt(id);
    
    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const { name, color, avatar } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Update member
    const [updatedMember] = await sql`
      UPDATE ml_members 
      SET name = ${name}, 
          color = ${color || '#8B5CF6'}, 
          avatar = ${avatar || '👤'}
      WHERE id = ${memberId}
      RETURNING id, family_id, name, color, avatar, created_at
    `;

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      member: updatedMember,
      message: 'Member updated successfully'
    });

  } catch (error) {
    console.error('Member update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}