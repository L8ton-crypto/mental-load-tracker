'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Settings, LogOut, Copy, Check, 
  BarChart2, ListTodo, Lightbulb, Users, UserPlus
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Member {
  id: number;
  name: string;
  color: string;
  avatar: string;
  total_effort: number;
  active_tasks: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Task {
  id: number;
  title: string;
  effort: number;
  category_name: string;
  category_icon: string;
  assigned_to_name: string | null;
  assigned_to_color: string | null;
  status: string;
  created_at: string;
}

interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_icon: string;
  member_id: number | null;
  member_name: string | null;
  member_color: string | null;
  total_effort: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [familyCode, setFamilyCode] = useState<string>('');
  const [familyName, setFamilyName] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [totalEffort, setTotalEffort] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  
  // Quick add form state
  const [newTask, setNewTask] = useState({
    title: '',
    categoryId: '',
    assignedTo: '',
    effort: 3,
    frequency: 'one-off'
  });

  const loadData = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const [familyRes, statsRes, tasksRes] = await Promise.all([
        fetch(`/api/family/${familyId}`),
        fetch(`/api/stats?familyId=${familyId}`),
        fetch(`/api/tasks?familyId=${familyId}`)
      ]);

      const familyData = await familyRes.json();
      const statsData = await statsRes.json();
      const tasksData = await tasksRes.json();

      setFamilyName(familyData.family?.name || '');
      setFamilyCode(familyData.family?.code || '');
      setMembers(statsData.memberEffort || []);
      setCategories(familyData.categories || []);
      setCategoryBreakdown(statsData.categoryBreakdown || []);
      setTotalEffort(statsData.totalEffort || 0);
      setRecentTasks((tasksData.tasks || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    const storedFamilyId = localStorage.getItem('familyId');
    const storedMemberId = localStorage.getItem('memberId');
    
    if (!storedFamilyId || !storedMemberId) {
      router.push('/');
      return;
    }
    
    setFamilyId(storedFamilyId);
    setMemberId(storedMemberId);
  }, [router]);

  useEffect(() => {
    if (familyId) {
      loadData();
    }
  }, [familyId, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('familyId');
    localStorage.removeItem('memberId');
    localStorage.removeItem('familyCode');
    router.push('/');
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(familyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.categoryId) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: parseInt(familyId!),
          categoryId: parseInt(newTask.categoryId),
          assignedTo: newTask.assignedTo ? parseInt(newTask.assignedTo) : null,
          title: newTask.title,
          effort: newTask.effort,
          frequency: newTask.frequency
        })
      });

      if (response.ok) {
        setNewTask({ title: '', categoryId: '', assignedTo: '', effort: 3, frequency: 'one-off' });
        setShowQuickAdd(false);
        loadData();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setAddMemberError('');
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: parseInt(familyId!),
          name: newMemberName.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setAddMemberError(data.error || 'Failed to add member');
        return;
      }

      setNewMemberName('');
      setShowAddMember(false);
      loadData();
    } catch (error) {
      setAddMemberError('Failed to add member');
    }
  };

  // Group category breakdown by category
  const groupedCategories = categoryBreakdown.reduce((acc, item) => {
    if (!acc[item.category_id]) {
      acc[item.category_id] = {
        id: item.category_id,
        name: item.category_name,
        icon: item.category_icon,
        members: [],
        totalEffort: 0
      };
    }
    if (item.member_id && item.total_effort > 0) {
      acc[item.category_id].members.push({
        id: item.member_id,
        name: item.member_name!,
        color: item.member_color!,
        effort: Number(item.total_effort)
      });
      acc[item.category_id].totalEffort += Number(item.total_effort);
    }
    return acc;
  }, {} as Record<number, { id: number; name: string; icon: string; members: { id: number; name: string; color: string; effort: number }[]; totalEffort: number }>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{familyName}</h1>
              <button 
                onClick={copyCode}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
              >
                {familyCode}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/tasks" 
                className="p-2 hover:bg-zinc-800 rounded-lg"
                title="All Tasks"
              >
                <ListTodo className="h-5 w-5" />
              </Link>
              <Link 
                href="/insights" 
                className="p-2 hover:bg-zinc-800 rounded-lg"
                title="Insights"
              >
                <Lightbulb className="h-5 w-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
                title="Leave Family"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Load Balance Bar - THE HERO VISUAL */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            Load Balance
          </h2>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            {totalEffort > 0 ? (
              <>
                <div className="h-12 rounded-lg overflow-hidden flex mb-4">
                  {members.filter(m => Number(m.total_effort) > 0).map((member) => {
                    const percentage = (Number(member.total_effort) / totalEffort) * 100;
                    return (
                      <div
                        key={member.id}
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: member.color 
                        }}
                        className="flex items-center justify-center text-sm font-medium text-white transition-all"
                        title={`${member.name}: ${percentage.toFixed(1)}%`}
                      >
                        {percentage > 15 && `${percentage.toFixed(0)}%`}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4">
                  {members.map((member) => {
                    const percentage = totalEffort > 0 
                      ? (Number(member.total_effort) / totalEffort) * 100 
                      : 0;
                    return (
                      <div key={member.id} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="text-sm">
                          {member.name}: {percentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({member.active_tasks} tasks, {member.total_effort} effort)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <p>No tasks assigned yet.</p>
                <p className="text-sm mt-1">Add some tasks to see the load distribution!</p>
              </div>
            )}
          </div>
        </section>

        {/* Member Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Members
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-medium">{member.name}</span>
                </div>
                <div className="space-y-1 text-sm text-zinc-400">
                  <p>{member.active_tasks} active tasks</p>
                  <p>{member.total_effort} total effort</p>
                </div>
              </div>
            ))}

            {/* Add Member Card */}
            {showAddMember ? (
              <form onSubmit={handleAddMember} className="bg-zinc-900 rounded-xl p-4 border border-purple-500">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                {addMemberError && (
                  <p className="text-red-400 text-xs mb-2">{addMemberError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddMember(false); setNewMemberName(''); setAddMemberError(''); }}
                    className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-zinc-900 rounded-xl p-4 border border-dashed border-zinc-700 hover:border-purple-500 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-purple-400 transition-colors"
              >
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Add Member</span>
              </button>
            )}
          </div>
        </section>

        {/* Category Breakdown */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(groupedCategories).filter(c => c.totalEffort > 0).map((category) => (
              <div 
                key={category.id}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-zinc-500 ml-auto">{category.totalEffort} effort</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={category.members}
                          dataKey="effort"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={30}
                        >
                          {category.members.map((member, index) => (
                            <Cell key={index} fill={member.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1">
                    {category.members.map((member) => {
                      const pct = (member.effort / category.totalEffort) * 100;
                      return (
                        <div key={member.id} className="flex items-center gap-2 text-xs">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: member.color }}
                          />
                          <span className="truncate">{member.name}</span>
                          <span className="text-zinc-500 ml-auto">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Tasks</h2>
            <Link href="/tasks" className="text-sm text-purple-400 hover:text-purple-300">
              View all →
            </Link>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center gap-4">
                  <span className="text-xl">{task.category_icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-zinc-400">
                      {task.category_name} • Effort: {task.effort}
                    </p>
                  </div>
                  {task.assigned_to_name && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: task.assigned_to_color || '#666' }}
                      title={task.assigned_to_name}
                    >
                      {task.assigned_to_name.charAt(0)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400">
                No tasks yet. Add your first task!
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Quick Add FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Task</h3>
                <button onClick={() => setShowQuickAdd(false)} className="text-zinc-400 hover:text-white">
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleQuickAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">What needs doing?</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Book dentist appointment..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newTask.categoryId}
                  onChange={(e) => setNewTask({...newTask, categoryId: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign to</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mental Effort (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewTask({...newTask, effort: level})}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${
                        newTask.effort === level
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  1 = Quick/easy, 5 = Time-consuming/draining
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select
                  value={newTask.frequency}
                  onChange={(e) => setNewTask({...newTask, frequency: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="one-off">One-off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}