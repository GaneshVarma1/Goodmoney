'use client'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useStore } from '@/store/useStore'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const COLORS = {
  income: '#6366F1', // Indigo
  expense: '#F43F5E', // Rose
}

export default function IncomeChart() {
  const { transactions } = useStore()

  const data = useMemo(() => {
    const now = new Date()
    const startDate = startOfMonth(now)
    const endDate = endOfMonth(now)

    const monthlyTransactions = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    )

    const dailyData = monthlyTransactions.reduce((acc, t) => {
      const date = format(new Date(t.date), 'MMM dd')
      if (!acc[date]) {
        acc[date] = { date, income: 0, expenses: 0 }
      }
      if (t.type === 'income') {
        acc[date].income += t.amount
      } else {
        acc[date].expenses += t.amount
      }
      return acc
    }, {} as Record<string, { date: string; income: number; expenses: number }>)

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [transactions])

  const totalIncome = useMemo(
    () => data.reduce((sum, item) => sum + item.income, 0),
    [data]
  )

  const totalExpenses = useMemo(
    () => data.reduce((sum, item) => sum + item.expenses, 0),
    [data]
  )

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No income data available for this month.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              dataKey="date"
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
            <Bar
              dataKey="income"
              name="Income"
              fill={COLORS.income}
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={COLORS.expense}
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 