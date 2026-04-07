'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Member {
  id: number;
  name: string;
  color: string;
  total_effort: number;
  active_tasks: number;
}

interface CategoryImbalance {
  category: string;
  icon: string;
  member: string;
  percentage: string;
}

interface BalanceInsight {
  type: string;
  message: string;
}

interface WeeklyTrend {
  week_start: string;
  member_id: number;
  member_name: string;
  member_color: string;
  total_effort: number;
}

export default function InsightsPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalEffort, setTotalEffort] = useState(0);
  const [categoryImbalances, setCategoryImbalances] = useState<CategoryImbalance[]>([]);
  const [balanceInsights, setBalanceInsights] = useState<BalanceInsight[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);

  const loadData = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const response = await fetch(`/api/stats?familyId=${familyId}`);
      const data = await response.json();

      setMembers(data.memberEffort || []);
      setTotalEffort(data.totalEffort || 0);
      setCategoryImbalances(data.categoryImbalances || []);
      setBalanceInsights(data.balanceInsights || []);
      setWeeklyTrends(data.weeklyTrends || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    const storedFamilyId = localStorage.getItem('familyId');
    if (!storedFamilyId) {
      router.push('/');
      return;
    }
    setFamilyId(storedFamilyId);
  }, [router]);

  useEffect(() => {
    if (familyId) {
      loadData();
    }
  }, [familyId, loadData]);

  // Process weekly trends for chart
  const processedTrends = weeklyTrends.reduce((acc, item) => {
    const weekKey = new Date(item.week_start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey };
    }
    if (item.member_name) {
      acc[weekKey][item.member_name] = Number(item.total_effort);
    }
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(processedTrends);
  const memberNames = [...new Set(weeklyTrends.filter(t => t.member_name).map(t => t.member_name))];
  const memberColors = weeklyTrends.reduce((acc, t) => {
    if (t.member_name && t.member_color) {
      acc[t.member_name] = t.member_color;
    }
    return acc;
  }, {} as Record<string, string>);

  // Generate rebalancing suggestions
  const generateSuggestions = () => {
    const suggestions: string[] = [];
    
    if (members.length >= 2 && totalEffort > 0) {
      const sorted = [...members].sort((a, b) => Number(b.total_effort) - Number(a.total_effort));
      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];
      
      const highPct = (Number(highest.total_effort) / totalEffort) * 100;
      const lowPct = (Number(lowest.total_effort) / totalEffort) * 100;
      const diff = highPct - lowPct;
      
      if (diff > 30) {
        const tasksToMove = Math.ceil((diff / 2) * totalEffort / 100 / 3); // Assuming avg effort of 3
        suggestions.push(
          `Consider moving ${tasksToMove} tasks from ${highest.name} to ${lowest.name} to improve balance.`
        );
      }
      
      if (highest.active_tasks > lowest.active_tasks * 2) {
        suggestions.push(
          `${highest.name} has ${highest.active_tasks} tasks while ${lowest.name} only has ${lowest.active_tasks}. Time to redistribute!`
        );
      }
    }

    // Category-specific suggestions
    categoryImbalances.forEach(imbalance => {
      suggestions.push(
        `${imbalance.member} handles ${imbalance.percentage}% of ${imbalance.category} ${imbalance.icon} tasks. Consider sharing this category.`
      );
    });

    if (suggestions.length === 0 && members.length >= 2) {
      suggestions.push('Great job! Your mental load looks fairly balanced. Keep it up!');
    }

    return suggestions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const suggestions = generateSuggestions();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-purple-400">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Insights</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Overall Balance Status */}
        <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Current Balance
          </h2>
          
          {members.length > 0 && totalEffort > 0 ? (
            <div className="space-y-4">
              {members.map((member) => {
                const percentage = (Number(member.total_effort) / totalEffort) * 100;
                const isOverloaded = percentage > 60;
                const isUnderloaded = percentage < 20 && members.length >= 2;
                
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-medium">{member.name}</span>
                        {isOverloaded && (
                          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                            Overloaded
                          </span>
                        )}
                        {isUnderloaded && (
                          <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                            Underloaded
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: member.color 
                        }}
                      />
                    </div>
                    <p className="text-sm text-zinc-500">
                      {member.active_tasks} tasks, {member.total_effort} total effort
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-4">
              Add some tasks to see balance insights.
            </p>
          )}
        </section>

        {/* Warnings */}
        {balanceInsights.length > 0 && (
          <section className="space-y-3">
            {balanceInsights.map((insight, index) => (
              <div 
                key={index}
                className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p>{insight.message}</p>
              </div>
            ))}
          </section>
        )}

        {/* Category Imbalances */}
        {categoryImbalances.length > 0 && (
          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Category Imbalances
            </h2>
            <div className="space-y-3">
              {categoryImbalances.map((imbalance, index) => (
                <div 
                  key={index}
                  className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="text-xl">{imbalance.icon}</span>
                  <div>
                    <p className="font-medium">{imbalance.category}</p>
                    <p className="text-sm text-zinc-400">
                      {imbalance.member} handles {imbalance.percentage}% of tasks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rebalancing Suggestions */}
        <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-500" />
            Suggestions
          </h2>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4 flex items-start gap-3"
              >
                <RefreshCw className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p>{suggestion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Trends Chart */}
        {chartData.length > 1 && (
          <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Weekly Effort Trends
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="week" 
                    stroke="#71717a" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {memberNames.map((name) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={memberColors[name] || '#8B5CF6'}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-zinc-500 mt-4 text-center">
              Track how the mental load distribution changes over time
            </p>
          </section>
        )}

        {/* Tips */}
        <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Tips for Better Balance</h2>
          <ul className="space-y-3 text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Review your load balance weekly and discuss imbalances openly
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Consider effort level, not just task count - some tasks drain more energy
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Rotate high-effort categories monthly to share the cognitive burden
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              Celebrate improvements! Balance takes time and communication
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}