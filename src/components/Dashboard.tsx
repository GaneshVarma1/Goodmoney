'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MdHome, MdAttachMoney, MdBarChart, MdDescription, MdMenu, MdClose, MdTrackChanges, MdChat } from 'react-icons/md'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import BudgetInsights from './BudgetInsights'
import BudgetReports from './BudgetReports'
import FinancialOverview from './FinancialOverview'
import { UserButton, SignedIn, useUser } from '@clerk/nextjs'
import { BudgetDataProvider } from './BudgetDataContext'
import SavingsGoals from './SavingsGoals'
import { useAuth } from '@clerk/nextjs'
import { FileText, Send } from 'lucide-react'

type Tab = 'overview' | 'transactions' | 'goals' | 'insights' | 'reports' | 'ai-chat'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const formatMessage = (content: string) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, index) => {
    // Check if paragraph is a list item
    if (paragraph.trim().startsWith('- ')) {
      return (
        <ul key={index} className="list-disc list-inside space-y-1">
          {paragraph.split('\n').map((item, itemIndex) => (
            <li key={itemIndex} className="ml-4">{item.replace('- ', '')}</li>
          ))}
        </ul>
      );
    }
    
    // Check if paragraph is a heading (starts with #)
    if (paragraph.trim().startsWith('#')) {
      const level = paragraph.match(/^#+/)?.[0].length || 1;
      const text = paragraph.replace(/^#+\s*/, '');
      
      // Use appropriate heading component based on level
      switch (level) {
        case 1:
          return <h1 key={index} className="text-xl font-bold mb-2">{text}</h1>;
        case 2:
          return <h2 key={index} className="text-lg font-semibold mb-2">{text}</h2>;
        case 3:
          return <h3 key={index} className="text-base font-semibold mb-2">{text}</h3>;
        default:
          return <h4 key={index} className="text-sm font-semibold mb-2">{text}</h4>;
      }
    }
    
    // Regular paragraph
    return <p key={index} className="mb-2">{paragraph}</p>;
  });
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user } = useUser();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <MdHome className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <MdAttachMoney className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <MdTrackChanges className="w-5 h-5" /> },
    { id: 'insights', label: 'Insights', icon: <MdBarChart className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <MdDescription className="w-5 h-5" /> },
    { id: 'ai-chat', label: 'AI Assistant', icon: <MdChat className="w-5 h-5" /> },
  ]

  const tabDescriptions: Record<Tab, string> = {
    overview: 'View your financial overview and key metrics',
    transactions: 'Add and manage your income and expenses',
    goals: 'Track your savings goals and progress',
    insights: 'Get insights into your spending patterns',
    reports: 'Generate and export detailed financial reports',
    'ai-chat': 'Chat with your AI financial assistant',
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

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          userId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (messages.length === 0 || !userId) return;
    
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: "Please summarize the key points from our conversation so far.",
          context: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to summarize');
      }

      const data = await response.json();
      const summaryMessage: Message = { 
        role: 'assistant', 
        content: `📝 **Conversation Summary**\n\n${data.response}` 
      };
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error while summarizing. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSummarizing(false);
    }
  };

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
                  onClick={() => handleTabClick(tab.id)}
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-600">
                {tabDescriptions[activeTab]}
              </p>
            </div>
            <div className="space-y-6">
              {activeTab === 'overview' && <FinancialOverview />}
              {activeTab === 'transactions' && (
                <>
                  <TransactionForm />
                  <TransactionList />
                </>
              )}
              {activeTab === 'goals' && <SavingsGoals />}
              {activeTab === 'insights' && <BudgetInsights />}
              {activeTab === 'reports' && <BudgetReports />}
              {activeTab === 'ai-chat' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">AI Financial Assistant</h3>
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing || messages.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                    >
                      <FileText size={16} />
                      {isSummarizing ? 'Summarizing...' : 'Summarize Chat'}
                    </button>
                  </div>

                  <div className="h-[calc(100vh-24rem)] min-h-[300px] overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-500 mt-8">
                        <h2 className="text-xl font-semibold mb-2">Welcome to your Financial Assistant</h2>
                        <p>Ask me anything about your finances, budgeting, or financial planning.</p>
                      </div>
                    )}
                    
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none">
                            {formatMessage(message.content)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-4 text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-4">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your finances..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send size={20} />
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="mt-8 text-center text-gray-500 text-sm">
          Built to save your money by <a href="https://bit.ly/sriport" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">this guy😎 </a>
        </footer>
      </div>
    </BudgetDataProvider>
  )
} 