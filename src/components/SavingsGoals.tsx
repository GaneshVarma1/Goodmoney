'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { SavingsGoal } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';

export default function SavingsGoals() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useDatabase();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const fetchGoals = async () => {
    try {
      const fetchedGoals = await getSavingsGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load savings goals');
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">Loading...</div>;
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSavingsGoal({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount),
        target_date: new Date().toISOString().split('T')[0],
      });
      
      // Reset form
      setNewGoal({
        name: '',
        target_amount: '',
        current_amount: '0',
      });
      
      // Refresh goals
      await fetchGoals();
      toast.success('Savings goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add savings goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, currentAmount: number) => {
    try {
      await updateSavingsGoal(goalId, { current_amount: currentAmount });
      await fetchGoals();
      toast.success('Progress updated successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteSavingsGoal(goalId);
      await fetchGoals();
      toast.success('Goal deleted successfully!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Savings Goals</h2>

      <form onSubmit={handleAddGoal} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="e.g., New Car"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount
            </label>
            <input
              type="number"
              value={newGoal.target_amount}
              onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount
            </label>
            <input
              type="number"
              value={newGoal.current_amount}
              onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Add Goal
          </motion.button>
        </div>
      </form>

      {/* Display goals */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-gray-900">{goal.name}</h3>
                <p className="text-sm text-gray-500">
                  Target: ${goal.target_amount.toFixed(2)}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </motion.button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (goal.current_amount / goal.target_amount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Current: ${goal.current_amount.toFixed(2)}</span>
                <span>Target: ${goal.target_amount.toFixed(2)}</span>
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  value={goal.current_amount}
                  onChange={(e) => handleUpdateProgress(goal.id, parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </motion.div>
        ))}
        {goals.length === 0 && (
          <p className="text-center text-gray-500 py-4">No savings goals set yet.</p>
        )}
      </div>
    </div>
  );
} 