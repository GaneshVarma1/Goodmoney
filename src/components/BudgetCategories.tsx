'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDatabase } from '@/hooks/useDatabase'
import toast from 'react-hot-toast'
import { BudgetCategory } from '@/lib/supabase'
import { useAuth } from '@clerk/nextjs'

export default function BudgetCategories() {
  const { isLoaded, isSignedIn } = useAuth();
  const { getCategories, addCategory } = useDatabase()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [newCategory, setNewCategory] = useState({
    name: '',
    monthly_limit: '',
  })

  if (!isLoaded || !isSignedIn) {
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">Loading...</div>;
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addCategory({
        name: newCategory.name,
        monthly_limit: parseFloat(newCategory.monthly_limit),
      })
      
      // Reset form
      setNewCategory({
        name: '',
        monthly_limit: '',
      })
      
      // Refresh categories
      const updatedCategories = await getCategories()
      setCategories(updatedCategories)
      
      toast.success('Category added successfully!')
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category. Please try again.')
    }
  }

  return (
    <div className="bg-white p-2 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Budget Categories</h2>

      <form onSubmit={handleAddCategory} className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g., Groceries"
              className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Limit
            </label>
            <input
              type="number"
              value={newCategory.monthly_limit}
              onChange={(e) => setNewCategory({ ...newCategory, monthly_limit: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
            Add Category
          </motion.button>
        </div>
      </form>

      <div className="space-y-2 sm:space-y-4">
        {categories.map((category: BudgetCategory) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  Monthly Limit: ${category.monthly_limit.toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 