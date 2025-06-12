'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDatabase } from '@/hooks/useDatabase';
import { Transaction, SavingsGoal } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';

export default function FinancialOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getTransactions, getSavingsGoals } = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedTransactions, fetchedGoals] = await Promise.all([
        getTransactions(),
        getSavingsGoals(),
      ]);
      setTransactions(fetchedTransactions);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">Loading...</div>;
  }

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate savings progress
  const totalSavingsTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentSavings = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const savingsProgress = totalSavingsTarget > 0 
    ? (totalCurrentSavings / totalSavingsTarget) * 100 
    : 0;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 rounded-lg"
        >
          <h3 className="text-sm font-medium text-green-800 mb-1">Total Income</h3>
          <p className="text-2xl font-semibold text-green-900">
            ${totalIncome.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-red-50 rounded-lg"
        >
          <h3 className="text-sm font-medium text-red-800 mb-1">Total Expenses</h3>
          <p className="text-2xl font-semibold text-red-900">
            ${totalExpenses.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-blue-50 rounded-lg"
        >
          <h3 className="text-sm font-medium text-blue-800 mb-1">Savings Progress</h3>
          <p className="text-2xl font-semibold text-blue-900">
            {savingsProgress.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Savings Goals */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Savings Goals</h3>
        <div className="space-y-4">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{goal.name}</h4>
                <span className="text-sm text-gray-600">
                  ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                </span>
              </div>
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 