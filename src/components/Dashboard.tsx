'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MdHome, MdAttachMoney, MdBarChart, MdDescription, MdMenu, MdClose, MdTrackChanges } from 'react-icons/md'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import BudgetInsights from './BudgetInsights'
import BudgetReports from './BudgetReports'
import FinancialOverview from './FinancialOverview'
import { UserButton, SignedIn, useUser } from '@clerk/nextjs'
import { BudgetDataProvider } from './BudgetDataContext'
import SavingsGoals from './SavingsGoals'

type Tab = 'overview' | 'transactions' | 'goals' | 'insights' | 'reports'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user } = useUser();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <MdHome className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <MdAttachMoney className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <MdTrackChanges className="w-5 h-5" /> },
    { id: 'insights', label: 'Insights', icon: <MdBarChart className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <MdDescription className="w-5 h-5" /> },
  ]

  const tabDescriptions: Record<Tab, string> = {
    overview: 'View your financial overview and key metrics',
    transactions: 'Add and manage your income and expenses',
    goals: 'Track your savings goals and progress',
    insights: 'Get insights into your spending patterns',
    reports: 'Generate and export detailed financial reports',
  }

  // Close sidebar when clicking outside (on mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen]);

  return (
    <BudgetDataProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-2 sm:px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <MdClose className="w-6 h-6 text-gray-900" /> : <MdMenu className="w-6 h-6 text-gray-900" />}
              </button>
            </div>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        {/* Sidebar Drawer (Floating, No Backdrop) */}
        {sidebarOpen && (
          <aside
            ref={sidebarRef}
            className="fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out w-[90vw] md:w-[300px] overflow-x-hidden flex flex-col"
            style={{ maxWidth: '100vw' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <motion.h2 
                className="text-xl font-extrabold tracking-tight text-gray-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{ fontFamily: 'var(--font-righteous)' }}
              >
                Good Money
              </motion.h2>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <MdClose className="w-6 h-6 text-gray-900" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </nav>
            <div className="mt-auto border-t border-gray-200 p-4">
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</span>
                  </div>
                </div>
              </SignedIn>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 transition-all duration-300 ease-in-out">
          <div className="px-2 sm:px-4 lg:px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                {tabDescriptions[activeTab]}
              </p>
            </div>
            {activeTab === 'reports' ? (
              <BudgetReports />
            ) : (
              <div className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'overview' && <FinancialOverview />}
                {activeTab === 'transactions' && (
                  <>
                    <TransactionForm />
                    <TransactionList />
                  </>
                )}
                {activeTab === 'goals' && <SavingsGoals />}
                {activeTab === 'insights' && <BudgetInsights />}
              </div>
            )}
          </div>
        </main>
        <footer className="mt-8 text-center text-gray-500 text-sm">
          Built to save your money by <a href="https://bit.ly/sriport" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">this guy😎 </a>
        </footer>
      </div>
    </BudgetDataProvider>
  )
} 