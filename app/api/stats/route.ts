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

    const familyIdNum = parseInt(familyId);

    // Overall member effort distribution
    const memberEffort = await sql`
      SELECT 
        m.id,
        m.name,
        m.color,
        COUNT(t.id) as active_tasks,
        COALESCE(SUM(CASE WHEN t.status = 'active' THEN t.effort ELSE 0 END), 0) as total_effort,
        COUNT(CASE WHEN t.status = 'completed' AND t.completed_at > NOW() - INTERVAL '7 days' THEN 1 END) as completed_this_week
      FROM ml_members m
      LEFT JOIN ml_tasks t ON m.id = t.assigned_to
      WHERE m.family_id = ${familyIdNum}
      GROUP BY m.id, m.name, m.color
      ORDER BY total_effort DESC
    `;

    // Category breakdown by member
    const categoryBreakdown = await sql`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        m.id as member_id,
        m.name as member_name,
        m.color as member_color,
        COUNT(t.id) as task_count,
        COALESCE(SUM(t.effort), 0) as total_effort
      FROM ml_categories c
      LEFT JOIN ml_tasks t ON c.id = t.category_id AND t.status = 'active'
      LEFT JOIN ml_members m ON t.assigned_to = m.id
      WHERE c.family_id = ${familyIdNum}
      GROUP BY c.id, c.name, c.icon, m.id, m.name, m.color
      ORDER BY c.name, total_effort DESC
    `;

    // Recent activity (last 30 days)
    const recentActivity = await sql`
      SELECT 
        t.id,
        t.title,
        t.effort,
        t.status,
        t.created_at,
        t.completed_at,
        c.name as category_name,
        c.icon as category_icon,
        m.name as member_name,
        m.color as member_color
      FROM ml_tasks t
      LEFT JOIN ml_categories c ON t.category_id = c.id
      LEFT JOIN ml_members m ON t.assigned_to = m.id
      WHERE t.family_id = ${familyIdNum}
        AND t.created_at > NOW() - INTERVAL '30 days'
      ORDER BY t.created_at DESC
      LIMIT 20
    `;

    // Weekly effort trends (last 8 weeks)
    const weeklyTrends = await sql`
      SELECT 
        DATE_TRUNC('week', t.created_at) as week_start,
        m.id as member_id,
        m.name as member_name,
        m.color as member_color,
        COUNT(t.id) as tasks_created,
        COALESCE(SUM(t.effort), 0) as total_effort
      FROM ml_tasks t
      LEFT JOIN ml_members m ON t.assigned_to = m.id
      WHERE t.family_id = ${familyIdNum}
        AND t.created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', t.created_at), m.id, m.name, m.color
      ORDER BY week_start, member_name
    `;

    // Calculate total effort for percentages
    const totalEffort = memberEffort.reduce((sum, member) => sum + Number(member.total_effort), 0);

    // Calculate balance insights
    const balanceInsights: { type: string; message: string }[] = [];
    
    if (memberEffort.length >= 2 && totalEffort > 0) {
      const maxEffortMember = memberEffort[0];
      const maxPercentage = (Number(maxEffortMember.total_effort) / totalEffort) * 100;
      
      if (maxPercentage > 60) {
        balanceInsights.push({
          type: 'warning',
          message: `${maxEffortMember.name} is handling ${maxPercentage.toFixed(1)}% of the mental load. Consider redistributing some tasks.`
        });
      }
    }

    // Category imbalance check
    const categoryImbalances: { category: string; icon: string; member: string; percentage: string }[] = [];
    const categoryGroups = categoryBreakdown.reduce((groups, item) => {
      if (!groups[item.category_id]) {
        groups[item.category_id] = {
          category_name: item.category_name,
          category_icon: item.category_icon,
          total_effort: 0,
          members: []
        };
      }
      if (item.member_id) {
        groups[item.category_id].total_effort += Number(item.total_effort);
        groups[item.category_id].members.push(item);
      }
      return groups;
    }, {} as any);

    Object.values(categoryGroups).forEach((category: any) => {
      if (category.members.length >= 2 && category.total_effort > 0) {
        const topMember = category.members[0];
        const percentage = (Number(topMember.total_effort) / category.total_effort) * 100;
        
        if (percentage > 75) {
          categoryImbalances.push({
            category: category.category_name,
            icon: category.category_icon,
            member: topMember.member_name,
            percentage: percentage.toFixed(1)
          });
        }
      }
    });

    return NextResponse.json({
      memberEffort,
      categoryBreakdown,
      recentActivity,
      weeklyTrends,
      balanceInsights,
      categoryImbalances,
      totalEffort
    });

  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}