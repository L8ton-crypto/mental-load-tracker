'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, LogIn, Scale, Heart, CheckCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [formData, setFormData] = useState({
    familyName: '',
    memberName: '',
    joinCode: ''
  });
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const familyId = localStorage.getItem('familyId');
    const memberId = localStorage.getItem('memberId');
    if (familyId && memberId) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.familyName || !formData.memberName) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.familyName,
          memberName: formData.memberName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create family');
      }

      localStorage.setItem('familyId', data.family.id);
      localStorage.setItem('memberId', data.member.id);
      localStorage.setItem('familyCode', data.family.code);

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.joinCode || !formData.memberName) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.joinCode.toUpperCase(),
          memberName: formData.memberName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join family');
      }

      localStorage.setItem('familyId', data.family.id);
      localStorage.setItem('memberId', data.member.id);
      localStorage.setItem('familyCode', data.family.code);

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="text-sm text-zinc-400 mb-4 hover:text-white"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold">Create Your Family</h2>
            <p className="mt-2 text-zinc-400">Start tracking your mental load together</p>
          </div>

          <form onSubmit={handleCreateFamily} className="space-y-6">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium mb-2">
                Family Name
              </label>
              <input
                id="familyName"
                type="text"
                value={formData.familyName}
                onChange={(e) => setFormData({...formData, familyName: e.target.value})}
                placeholder="e.g., The Smiths"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="memberName" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                id="memberName"
                type="text"
                value={formData.memberName}
                onChange={(e) => setFormData({...formData, memberName: e.target.value})}
                placeholder="Your first name"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Family'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setMode('home')}
              className="text-sm text-zinc-400 mb-4 hover:text-white"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold">Join Your Family</h2>
            <p className="mt-2 text-zinc-400">Enter the family code to get started</p>
          </div>

          <form onSubmit={handleJoinFamily} className="space-y-6">
            <div>
              <label htmlFor="joinCode" className="block text-sm font-medium mb-2">
                Family Code
              </label>
              <input
                id="joinCode"
                type="text"
                value={formData.joinCode}
                onChange={(e) => setFormData({...formData, joinCode: e.target.value.toUpperCase()})}
                placeholder="LOAD-XXXX"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
            </div>

            <div>
              <label htmlFor="memberNameJoin" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                id="memberNameJoin"
                type="text"
                value={formData.memberName}
                onChange={(e) => setFormData({...formData, memberName: e.target.value})}
                placeholder="Your first name"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Family'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Scale className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mental Load Tracker
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Make the invisible work visible. Track and balance the mental load 
              across your family so everyone shares the load fairly.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <Scale className="h-8 w-8 text-purple-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Fair Distribution</h3>
              <p className="text-zinc-400 text-sm">
                See who&apos;s handling what percentage of the mental load with clear, visual breakdowns.
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <Heart className="h-8 w-8 text-pink-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Reduce Stress</h3>
              <p className="text-zinc-400 text-sm">
                Stop feeling like you&apos;re the only one remembering everything. Share the cognitive burden.
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <CheckCircle className="h-8 w-8 text-green-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-zinc-400 text-sm">
                Monitor effort scores, category breakdowns, and celebrate improved balance over time.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button
              onClick={() => setMode('create')}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Family
            </button>
            <button
              onClick={() => setMode('join')}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Join Family
            </button>
          </div>
        </div>
      </div>

      {/* What Gets Tracked */}
      <div className="bg-zinc-900/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Gets Tracked?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: '🏥', title: 'Medical', examples: 'Appointments, insurance, medications' },
              { icon: '📚', title: 'School', examples: 'Homework help, meetings, permission slips' },
              { icon: '🍳', title: 'Meals', examples: 'Planning, shopping, dietary needs' },
              { icon: '💛', title: 'Emotional Support', examples: 'Listening, comforting, mediating' },
              { icon: '💰', title: 'Finances', examples: 'Budgets, bills, subscriptions' },
              { icon: '👥', title: 'Social', examples: 'Party planning, RSVPs, gifts' }
            ].map((category) => (
              <div key={category.title} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <div className="text-2xl mb-2">{category.icon}</div>
                <h3 className="font-semibold mb-1">{category.title}</h3>
                <p className="text-sm text-zinc-400">{category.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}