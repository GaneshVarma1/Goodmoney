'use client'
import { motion } from 'framer-motion'
import { useDatabase } from '@/hooks/useDatabase'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { Transaction } from '@/types'

interface Insight {
  id: string
  title: string
  description: string
  type: 'warning' | 'success' | 'info'
  icon: string
}

export default function BudgetInsights() {
  const { isLoaded, isSignedIn } = useAuth()
  const { getTransactions } = useDatabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTransactions()
      setTransactions(data)
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [getTransactions])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchTransactions()
    }
  }, [isLoaded, isSignedIn, fetchTransactions])

  // Calculate insights based on transaction data
  const calculateInsights = (): Insight[] => {
    const insights: Insight[] = []

    // Calculate total income and expenses
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // If there are no transactions, return an empty array (no insights)
    if (totalIncome === 0 && totalExpenses === 0) {
      return [];
    }

    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Add insights based on calculations
    if (savingsRate < 20) {
      insights.push({
        id: 'savings-rate',
        title: 'Low Savings Rate',
        description: 'Your savings rate is below the recommended 20%. Consider reducing expenses or increasing income.',
        type: 'warning',
        icon: '💰',
      })
    }

    if (totalExpenses > totalIncome) {
      insights.push({
        id: 'overspending',
        title: 'Overspending Detected',
        description: 'Your expenses exceed your income this month. Review your spending habits.',
        type: 'warning',
        icon: '⚠️',
      })
    }

    if (savingsRate >= 30) {
      insights.push({
        id: 'good-savings',
        title: 'Excellent Savings Rate',
        description: 'Great job! You\'re saving more than 30% of your income.',
        type: 'success',
        icon: '🎉',
      })
    }

    // Add category-specific insights
    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === 'expense') {
        acc[t.category] = (acc[t.category] || 0) + t.amount
      }
      return acc
    }, {} as Record<string, number>)

    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > totalIncome * 0.3) {
        insights.push({
          id: `category-${category}`,
          title: 'High Category Spending',
          description: `${category} expenses are over 30% of your income. Consider reducing spending in this category.`,
          type: 'warning',
          icon: '📊',
        })
      }
    })

    return insights
  }

  if (!isLoaded || !isSignedIn) {
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">Loading...</div>
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const insights = calculateInsights()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Financial Insights</h2>
      {insights.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No insights available yet. Add some transactions to get started!</p>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                insight.type === 'warning'
                  ? 'border-yellow-200 bg-yellow-50'
                  : insight.type === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
} 