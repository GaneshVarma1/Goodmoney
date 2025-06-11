import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

interface Category {
  id: string
  name: string
  limit: number
  spent: number
}

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
}

interface Store {
  transactions: Transaction[]
  categories: Category[]
  goals: Goal[]
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategoryLimit: (id: string, limit: number) => void
  updateCategorySpent: (id: string, spent: number) => void
  deleteCategory: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoalProgress: (id: string, currentAmount: number) => void
  deleteGoal: (id: string) => void
}

const COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEEAD', // Cream Yellow
  '#D4A5A5', // Dusty Rose
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#E67E22', // Orange
  '#2ECC71', // Emerald
  '#F1C40F', // Yellow
  '#1ABC9C', // Teal
]

export const useStore = create<Store>()(
  persist(
    (set) => ({
      transactions: [],
      categories: [],
      goals: [],

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: Date.now().toString() },
          ],
        })),

      updateTransaction: (id, transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addCategory: (category) =>
        set((state) => ({
          categories: [
            ...state.categories,
            {
              ...category,
              id: Date.now().toString(),
              color: COLORS[state.categories.length % COLORS.length],
            },
          ],
        })),

      updateCategoryLimit: (id, limit) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, limit } : c
          ),
        })),

      updateCategorySpent: (id, spent) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, spent } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, { ...goal, id: Date.now().toString() }],
        })),

      updateGoalProgress: (id, currentAmount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount } : g
          ),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'budget-storage',
    }
  )
) 