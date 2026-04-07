import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    
    const { id } = await params;
    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const {
      title,
      effort,
      frequency,
      status,
      assignedTo,
      categoryId
    } = await request.json();

    // Validate effort if provided
    if (effort !== undefined && (effort < 1 || effort > 5)) {
      return NextResponse.json(
        { error: 'Effort must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Fetch current task
    const [currentTask] = await sql`
      SELECT * FROM ml_tasks WHERE id = ${taskId}
    `;

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update with new values or keep existing
    const newTitle = title !== undefined ? title : currentTask.title;
    const newEffort = effort !== undefined ? effort : currentTask.effort;
    const newFrequency = frequency !== undefined ? frequency : currentTask.frequency;
    const newStatus = status !== undefined ? status : currentTask.status;
    const newAssignedTo = assignedTo !== undefined ? (assignedTo || null) : currentTask.assigned_to;
    const newCategoryId = categoryId !== undefined ? categoryId : currentTask.category_id;

    // Handle completed_at based on status change
    let completedAtClause = '';
    if (status === 'completed' && currentTask.status !== 'completed') {
      completedAtClause = 'completed_at = NOW(),';
    } else if (status === 'active' && currentTask.status === 'completed') {
      completedAtClause = 'completed_at = NULL,';
    }

    // Use a simple update approach
    let result;
    if (status === 'completed' && currentTask.status !== 'completed') {
      result = await sql`
        UPDATE ml_tasks 
        SET title = ${newTitle},
            effort = ${newEffort},
            frequency = ${newFrequency},
            status = ${newStatus},
            assigned_to = ${newAssignedTo},
            category_id = ${newCategoryId},
            completed_at = NOW()
        WHERE id = ${taskId}
        RETURNING id, family_id, category_id, assigned_to, title, effort, frequency, status, created_at, completed_at
      `;
    } else if (status === 'active' && currentTask.status === 'completed') {
      result = await sql`
        UPDATE ml_tasks 
        SET title = ${newTitle},
            effort = ${newEffort},
            frequency = ${newFrequency},
            status = ${newStatus},
            assigned_to = ${newAssignedTo},
            category_id = ${newCategoryId},
            completed_at = NULL
        WHERE id = ${taskId}
        RETURNING id, family_id, category_id, assigned_to, title, effort, frequency, status, created_at, completed_at
      `;
    } else {
      result = await sql`
        UPDATE ml_tasks 
        SET title = ${newTitle},
            effort = ${newEffort},
            frequency = ${newFrequency},
            status = ${newStatus},
            assigned_to = ${newAssignedTo},
            category_id = ${newCategoryId}
        WHERE id = ${taskId}
        RETURNING id, family_id, category_id, assigned_to, title, effort, frequency, status, created_at, completed_at
      `;
    }

    const [updatedTask] = result;

    return NextResponse.json({
      task: updatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('Task update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    
    const { id } = await params;
    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM ml_tasks 
      WHERE id = ${taskId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Task deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}