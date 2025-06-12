'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { useDatabase } from '@/hooks/useDatabase'
import toast from 'react-hot-toast'
import { generatePDF, generatePDFAsBase64 } from '@/utils/pdfExport'
import { useAuth } from '@clerk/nextjs'
import { Transaction } from '@/lib/supabase'

const COLORS = [
  '#6366F1', '#F59E42', '#10B981', '#F43F5E', '#3B82F6', '#FBBF24', '#8B5CF6', '#EC4899', '#22D3EE', '#84CC16', '#E11D48', '#A3A3A3',
]

const dateRanges = [
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
]

export default function BudgetReports() {
  const { isLoaded, isSignedIn } = useAuth()
  const { getTransactions } = useDatabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month')
  const [customRange, setCustomRange] = useState({ from: '', to: '' })
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [isExporting, setIsExporting] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch transactions
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchTransactions()
    }
  }, [isLoaded, isSignedIn])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const data = await getTransactions()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // Date filtering logic
  const now = new Date()
  const filteredTransactions = useMemo(() => {
    if (range === 'all') return transactions
    if (range === 'month') {
      const month = now.getMonth()
      const year = now.getFullYear()
      return transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === month && d.getFullYear() === year
      })
    }
    if (range === 'year') {
      const year = now.getFullYear()
      return transactions.filter(t => (new Date(t.date)).getFullYear() === year)
    }
    if (range === 'custom' && customRange.from && customRange.to) {
      return transactions.filter(t => isWithinInterval(new Date(t.date), { start: new Date(customRange.from), end: new Date(customRange.to) }))
    }
    return transactions
  }, [transactions, range, customRange, now])

  // Summary
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const netSavings = totalIncome - totalExpenses

  // Income vs Expenses by month (for chart)
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string, income: number, expenses: number }> = {}
    filteredTransactions.forEach(t => {
      const m = format(new Date(t.date), 'MMM yyyy')
      if (!map[m]) map[m] = { month: m, income: 0, expenses: 0 }
      if (t.type === 'income') map[m].income += Number(t.amount)
      if (t.type === 'expense') map[m].expenses += Number(t.amount)
    })
    return Object.values(map).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }, [filteredTransactions])

  // Expenses by category (for pie chart)
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredTransactions])

  // Export as PDF with proper loading state
  const handleExportPDF = useCallback(async () => {
    if (isExporting || !isClient || !contentRef.current) return
    
    try {
      setIsExporting(true)
      await generatePDF(contentRef.current, 'budget-report.pdf')
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, isClient])

  // Export as CSV (now: Email statement)
  const handleEmailStatement = useCallback(async () => {
    if (!email || emailStatus === 'sending' || !isClient || !contentRef.current) return
    
    try {
      setEmailStatus('sending')
      const pdfBase64 = await generatePDFAsBase64(contentRef.current)
      
      const res = await fetch('/api/send-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pdfBase64 }),
      })

      if (!res.ok) {
        throw new Error('Failed to send email')
      }

      setEmailStatus('success')
      toast.success('PDF statement emailed!')
    } catch (error) {
      console.error('Email error:', error)
      setEmailStatus('error')
      toast.error('Failed to send statement. Please try again.')
    } finally {
      setTimeout(() => setEmailStatus('idle'), 4000)
    }
  }, [email, emailStatus, isClient])

  // Don't render export button until client-side
  if (!isClient) {
    return (
      <div className="flex flex-col gap-6 bg-white p-4 sm:p-6 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 bg-white p-4 sm:p-6 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Loading overlay - outside the content to be captured */}
      {isExporting && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Main content to be captured */}
      <div 
        ref={contentRef}
        className="flex flex-col gap-4 sm:gap-6 bg-white p-2 sm:p-4 md:p-6 w-full"
        style={{ 
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}
      >
        {/* Date Range Picker & Export */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-between w-full">
          <div className="flex flex-wrap gap-2">
            {dateRanges.map(r => (
              <button
                key={r.value}
                className={`px-4 py-2 rounded-lg font-medium border transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${range === r.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
            <button
              className={`px-4 py-2 rounded-lg font-medium border transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${range === 'custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'}`}
              onClick={() => setRange('custom')}
            >
              Custom
            </button>
            {range === 'custom' && (
              <>
                <input type="date" className="border rounded px-2 py-1 text-sm" value={customRange.from} onChange={e => setCustomRange({ ...customRange, from: e.target.value })} />
                <span className="text-gray-500">to</span>
                <input type="date" className="border rounded px-2 py-1 text-sm" value={customRange.to} onChange={e => setCustomRange({ ...customRange, to: e.target.value })} />
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition w-full sm:w-auto
                ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <input
              type="email"
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500 bg-white w-full sm:w-auto"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ minWidth: 0 }}
            />
            <button
              onClick={handleEmailStatement}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium shadow hover:bg-green-700 transition disabled:opacity-60 w-full sm:w-auto"
              disabled={!email || emailStatus === 'sending'}
            >
              {emailStatus === 'sending' ? 'Sending...' : 'Email me Statement'}
            </button>
          </div>
        </div>
        {emailStatus === 'success' && <div className="text-green-600 font-medium">Statement sent to {email}!</div>}
        {emailStatus === 'error' && <div className="text-red-600 font-medium">Failed to send statement. Please try again.</div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full">
          <div className="bg-white rounded-xl shadow border p-4 flex flex-col items-center">
            <span className="text-gray-500 text-sm">Total Income</span>
            <span className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</span>
          </div>
          <div className="bg-white rounded-xl shadow border p-4 flex flex-col items-center">
            <span className="text-gray-500 text-sm">Total Expenses</span>
            <span className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString()}</span>
          </div>
          <div className="bg-white rounded-xl shadow border p-4 flex flex-col items-center">
            <span className="text-gray-500 text-sm">Net Savings</span>
            <span className={`text-2xl font-bold ${netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>${netSavings.toLocaleString()}</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="bg-white rounded-xl shadow border p-2 sm:p-4 flex flex-col w-full h-[300px] sm:h-[400px]">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Income vs Expenses</h2>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'white', borderRadius: 8, border: '1px solid #eee' }} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border p-2 sm:p-4 flex flex-col w-full h-[300px] sm:h-[400px]">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Expenses by Category</h2>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {expensesByCategory.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'white', borderRadius: 8, border: '1px solid #eee' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto w-full">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Transactions</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Type</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Category</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-900">Description</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">No transactions for this period.</td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 hover:bg-blue-50 transition">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">{format(parseISO(t.date), 'yyyy-MM-dd')}</td>
                    <td className="px-3 py-2 whitespace-nowrap capitalize text-gray-900">{t.type}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">{t.category}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">{t.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900">${Number(t.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 