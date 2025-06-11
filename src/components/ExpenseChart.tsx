'use client'
import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useStore } from '@/store/useStore'
import { startOfMonth, endOfMonth } from 'date-fns'

const COLORS = [
  '#6366F1', // Indigo
  '#F59E42', // Orange
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#3B82F6', // Blue
  '#FBBF24', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#22D3EE', // Cyan
  '#84CC16', // Lime
  '#E11D48', // Red
  '#A3A3A3', // Gray
]

export default function ExpenseChart() {
  const { transactions } = useStore()

  const data = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(now)
    const endDate = endOfMonth(now)

    const monthlyExpenses = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= endDate
    )

    const expensesByCategory = monthlyExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
    }))
  }, [transactions])

  const totalExpenses = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  )

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No expense data available for this month.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Expenses</h2>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">Total Expenses</p>
        <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => 
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px',
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 