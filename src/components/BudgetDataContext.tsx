'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@clerk/nextjs';
import { Transaction, BudgetCategory, SavingsGoal } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface BudgetDataContextType {
  transactions: Transaction[];
  categories: BudgetCategory[];
  goals: SavingsGoal[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  addCategory: (c: Omit<BudgetCategory, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  addGoal: (g: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
}

const BudgetDataContext = createContext<BudgetDataContextType | undefined>(undefined);

export const useBudgetData = () => {
  const ctx = useContext(BudgetDataContext);
  if (!ctx) throw new Error('useBudgetData must be used within BudgetDataProvider');
  return ctx;
};

export const BudgetDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const db = useDatabase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const [tx, cat, gl] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
        db.getSavingsGoals(),
      ]);
      setTransactions(tx);
      setCategories(cat);
      setGoals(gl);
    } catch {
      setError('Failed to load budget data');
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [db, isLoaded, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshAll();
    }
    // Only run when auth state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const addTransaction = async (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    await db.addTransaction(t);
    await refreshAll();
  };
  const addCategory = async (c: Omit<BudgetCategory, 'id' | 'user_id' | 'created_at'>) => {
    await db.addCategory(c);
    await refreshAll();
  };
  const addGoal = async (g: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => {
    await db.addSavingsGoal(g);
    await refreshAll();
  };
  const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    await db.updateSavingsGoal(id, updates);
    await refreshAll();
  };

  if (!isLoaded || !isSignedIn || loading) {
    return <div className="w-full flex justify-center items-center py-12 text-gray-500">Loading...</div>;
  }
  if (error) {
    return <div className="w-full flex justify-center items-center py-12 text-red-500">{error}</div>;
  }
  return (
    <BudgetDataContext.Provider value={{
      transactions, categories, goals, loading, refreshAll,
      addTransaction, addCategory, addGoal, updateGoal
    }}>
      {children}
    </BudgetDataContext.Provider>
  );
}; 