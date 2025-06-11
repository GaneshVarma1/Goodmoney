import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Transaction, BudgetCategory, SavingsGoal } from '@/lib/supabase';

export function useDatabase() {
  const { userId } = useAuth();

  // Transactions
  const getTransactions = useCallback(async (): Promise<Transaction[]> => {
    if (!userId) {
      console.error('No user ID available');
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getTransactions:', error);
      throw error;
    }
  }, [userId]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Promise<Transaction> => {
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!transaction.amount || isNaN(transaction.amount)) {
      throw new Error('Invalid amount');
    }
    if (!transaction.category) {
      throw new Error('Category is required');
    }
    if (!transaction.date) {
      throw new Error('Date is required');
    }

    try {
      // Log the user ID and transaction data for debugging
      console.log('User ID:', userId);
      console.log('Transaction data:', {
        ...transaction,
        user_id: userId,
      });

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: userId,
            amount: Number(transaction.amount),
            date: new Date(transaction.date).toISOString(),
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error adding transaction:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error(error.message || 'Failed to add transaction');
      }

      if (!data) {
        throw new Error('No data returned after adding transaction');
      }

      return data;
    } catch (error) {
      console.error('Error in addTransaction:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while adding the transaction');
    }
  }, [userId]);

  // Budget Categories
  const getCategories = useCallback(async (): Promise<BudgetCategory[]> => {
    if (!userId) {
      console.error('No user ID available');
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }, [userId]);

  const addCategory = useCallback(async (category: Omit<BudgetCategory, 'id' | 'user_id' | 'created_at'>): Promise<BudgetCategory> => {
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert([{ ...category, user_id: userId }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in addCategory:', error);
      throw error;
    }
  }, [userId]);

  // Savings Goals
  const getSavingsGoals = useCallback(async (): Promise<SavingsGoal[]> => {
    if (!userId) {
      console.error('No user ID available');
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching savings goals:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getSavingsGoals:', error);
      throw error;
    }
  }, [userId]);

  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>): Promise<SavingsGoal> => {
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([{ ...goal, user_id: userId }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding savings goal:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in addSavingsGoal:', error);
      throw error;
    }
  }, [userId]);

  const updateSavingsGoal = useCallback(async (goalId: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating savings goal:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateSavingsGoal:', error);
      throw error;
    }
  }, [userId]);

  const deleteSavingsGoal = useCallback(async (goalId: string): Promise<void> => {
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting savings goal:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSavingsGoal:', error);
      throw error;
    }
  }, [userId]);

  return {
    getTransactions,
    addTransaction,
    getCategories,
    addCategory,
    getSavingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  };
} 