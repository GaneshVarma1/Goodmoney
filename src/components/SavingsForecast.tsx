'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, addMonths } from 'date-fns'

const COLORS = {
  current: '#6366F1', // Indigo
  potential: '#F59E42', // Orange
}

export default function SavingsForecast() {
  const { transactions } = useStore()
  const [expenseReduction, setExpenseReduction] = useState(20)

  const data = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => addMonths(now, i))

    const currentSavings = transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc += t.amount
      } else {
        acc -= t.amount
      }
      return acc
    }, 0)

    const monthlyIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const potentialMonthlyExpenses = monthlyExpenses * (1 - expenseReduction / 100)

    return months.map((month, index) => {
      const currentSavingsAtMonth = currentSavings + (monthlyIncome - monthlyExpenses) * index
      const potentialSavingsAtMonth = currentSavings + (monthlyIncome - potentialMonthlyExpenses) * index

      return {
        month: format(month, 'MMM yyyy'),
        current: Math.max(0, currentSavingsAtMonth),
        potential: Math.max(0, potentialSavingsAtMonth),
      }
    })
  }, [transactions, expenseReduction])

  const currentSavings = data[0]?.current || 0
  const potentialSavings = data[data.length - 1]?.potential || 0
  const savingsDifference = potentialSavings - currentSavings

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
      >
        <p className="text-gray-500">No transaction data available yet.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Savings Forecast</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reduce Monthly Expenses by {expenseReduction}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={expenseReduction}
          onChange={(e) => setExpenseReduction(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Current Savings</p>
          <p className="text-2xl font-bold text-blue-600">${currentSavings.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Potential Savings</p>
          <p className="text-2xl font-bold text-green-600">${potentialSavings.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Additional Savings</p>
          <p className="text-2xl font-bold text-purple-600">${savingsDifference.toFixed(2)}</p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Savings"
              stroke={COLORS.current}
              strokeWidth={2}
              dot={{ fill: COLORS.current, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="potential"
              name="Potential Savings"
              stroke={COLORS.potential}
              strokeWidth={2}
              dot={{ fill: COLORS.potential, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
} 