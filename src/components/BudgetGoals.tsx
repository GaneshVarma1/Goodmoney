'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'

export default function BudgetGoals() {
  const { goals, addGoal, updateGoalProgress, deleteGoal } = useStore()
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
  })

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoal.name || !newGoal.targetAmount) {
      toast.error('Please fill in all fields')
      return
    }
    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
    })
    toast.success('Goal added!')
    setNewGoal({ name: '', targetAmount: '' })
  }

  const handleUpdateGoal = (id: string, currentAmount: number) => {
    updateGoalProgress(id, currentAmount)
    toast.success('Goal progress updated!')
  }

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id)
    toast.success('Goal deleted!')
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Goals</h2>

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
              placeholder="e.g., Emergency Fund"
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
              value={newGoal.targetAmount}
              onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
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
              value={newGoal.currentAmount}
              onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

      <div className="space-y-4">
        <AnimatePresence>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{goal.name}</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </motion.button>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (goal.currentAmount / goal.targetAmount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>${goal.currentAmount.toFixed(2)}</span>
                <span>${goal.targetAmount.toFixed(2)}</span>
              </div>
              <div className="mt-2">
                <input
                  type="number"
                  value={goal.currentAmount}
                  onChange={(e) =>
                    handleUpdateGoal(goal.id, parseFloat(e.target.value))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {goals.length === 0 && (
          <p className="text-center text-gray-500 py-4">No goals set yet.</p>
        )}
      </div>
    </div>
  )
} 