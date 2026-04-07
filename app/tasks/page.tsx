'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Filter, Check, Trash2, UserPlus, 
  ChevronDown, Square, CheckSquare
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  color: string;
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
  frequency: string;
  status: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_color: string | null;
  created_at: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMember, setFilterMember] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [sortBy, setSortBy] = useState<string>('date');
  
  // Selection for bulk actions
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  
  // Add task form
  const [showAddForm, setShowAddForm] = useState(false);
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
      const [familyRes, tasksRes] = await Promise.all([
        fetch(`/api/family/${familyId}`),
        fetch(`/api/tasks?familyId=${familyId}`)
      ]);

      const familyData = await familyRes.json();
      const tasksData = await tasksRes.json();

      setMembers(familyData.members || []);
      setCategories(familyData.categories || []);
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (filterCategory && task.category_id !== parseInt(filterCategory)) return false;
      if (filterMember && task.assigned_to !== parseInt(filterMember)) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'effort':
          return b.effort - a.effort;
        case 'category':
          return a.category_name.localeCompare(b.category_name);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const toggleSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkReassign = async (memberId: string | null) => {
    try {
      const promises = Array.from(selectedTasks).map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: memberId ? parseInt(memberId) : null })
        })
      );
      await Promise.all(promises);
      setSelectedTasks(new Set());
      setShowBulkAssign(false);
      loadData();
    } catch (error) {
      console.error('Failed to reassign tasks:', error);
    }
  };

  const handleComplete = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      loadData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.categoryId) return;

    try {
      await fetch('/api/tasks', {
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
      setNewTask({ title: '', categoryId: '', assignedTo: '', effort: 3, frequency: 'one-off' });
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-purple-400">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">All Tasks</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="">All Members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="date">Sort: Date</option>
            <option value="effort">Sort: Effort</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span>{selectedTasks.size} task(s) selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkAssign(true)}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 rounded-lg text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Reassign
              </button>
              <button
                onClick={() => setSelectedTasks(new Set())}
                className="px-3 py-1 text-zinc-400 hover:text-white text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Add Task Form */}
        {showAddForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Task title..."
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                  autoFocus
                />
                <select
                  value={newTask.categoryId}
                  onChange={(e) => setNewTask({...newTask, categoryId: e.target.value})}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
                <select
                  value={newTask.effort}
                  onChange={(e) => setNewTask({...newTask, effort: parseInt(e.target.value)})}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>Effort: {n}</option>
                  ))}
                </select>
                <select
                  value={newTask.frequency}
                  onChange={(e) => setNewTask({...newTask, frequency: e.target.value})}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  <option value="one-off">One-off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          {/* Select All */}
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-4"
          >
            {selectedTasks.size === filteredTasks.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Select all
          </button>

          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div 
                key={task.id}
                className={`bg-zinc-900 border rounded-lg p-4 flex items-center gap-4 ${
                  selectedTasks.has(task.id) ? 'border-purple-500' : 'border-zinc-800'
                } ${task.status === 'completed' ? 'opacity-60' : ''}`}
              >
                <button onClick={() => toggleSelect(task.id)}>
                  {selectedTasks.has(task.id) ? (
                    <CheckSquare className="h-5 w-5 text-purple-500" />
                  ) : (
                    <Square className="h-5 w-5 text-zinc-600" />
                  )}
                </button>
                
                <span className="text-xl">{task.category_icon}</span>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {task.category_name} • Effort: {task.effort} • {task.frequency}
                  </p>
                </div>

                {task.assigned_to_name && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: task.assigned_to_color || '#666' }}
                    title={task.assigned_to_name}
                  >
                    {task.assigned_to_name.charAt(0)}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(task.id)}
                      className="p-2 hover:bg-zinc-800 rounded text-green-500"
                      title="Mark complete"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 hover:bg-zinc-800 rounded text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-400">
              No tasks found. {!showAddForm && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="text-purple-400 hover:underline"
                >
                  Add one!
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Task Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            + Add Task
          </button>
        )}
      </main>

      {/* Bulk Reassign Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-sm">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-lg font-semibold">Reassign {selectedTasks.size} Tasks</h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleBulkReassign(null)}
                className="w-full p-3 text-left hover:bg-zinc-800 rounded-lg"
              >
                Unassigned
              </button>
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleBulkReassign(member.id.toString())}
                  className="w-full p-3 text-left hover:bg-zinc-800 rounded-lg flex items-center gap-3"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  {member.name}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="w-full py-2 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}