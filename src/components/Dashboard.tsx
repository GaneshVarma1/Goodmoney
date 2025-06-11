'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdHome, MdAttachMoney, MdTrackChanges, MdFolder, MdBarChart, MdDescription } from 'react-icons/md'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import BudgetCategories from './BudgetCategories'
import SavingsGoals from './SavingsGoals'
import BudgetInsights from './BudgetInsights'
import BudgetReports from './BudgetReports'
import FinancialOverview from './FinancialOverview'
import { UserButton, SignedIn, useUser } from '@clerk/nextjs'

type Tab = 'overview' | 'transactions' | 'goals' | 'categories' | 'insights' | 'reports'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { user } = useUser();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <MdHome className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <MdAttachMoney className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <MdTrackChanges className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <MdFolder className="w-5 h-5" /> },
    { id: 'insights', label: 'Insights', icon: <MdBarChart className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <MdDescription className="w-5 h-5" /> },
  ]

  const tabDescriptions: Record<Tab, string> = {
    overview: 'View your financial overview and key metrics',
    transactions: 'Add and manage your income and expenses',
    goals: 'Track your savings goals and progress',
    categories: 'Manage your budget categories and limits',
    insights: 'Get insights into your spending patterns',
    reports: 'Generate and export detailed financial reports',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Budget Tracker</h1>
            <SignedIn>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || 'User'}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
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
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                {tabDescriptions[activeTab]}
              </p>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && <FinancialOverview />}
              {activeTab === 'transactions' && (
                <>
                  <TransactionForm />
                  <TransactionList />
                </>
              )}
              {activeTab === 'goals' && <SavingsGoals />}
              {activeTab === 'categories' && <BudgetCategories />}
              {activeTab === 'insights' && <BudgetInsights />}
              {activeTab === 'reports' && <BudgetReports />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 