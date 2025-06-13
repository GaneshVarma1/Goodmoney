# Good Money - AI-Powered Financial Companion

A modern, intelligent dashboard for tracking personal finances with AI-powered insights, beautiful visualizations, and smart recommendations.

## Features

- 🤖 AI-Powered Financial Copilot
  - Natural language queries about your finances
  - Personalized spending insights
  - Smart budget recommendations
  - Predictive financial analysis

- 📊 Interactive Financial Dashboard
  - Real-time expense tracking
  - Income and expense categorization
  - Interactive charts and visualizations
  - Budget goal tracking
  - Savings forecasting with "what-if" scenarios

- 📱 Modern User Experience
  - Responsive design for all devices
  - Dark/Light mode support
  - Beautiful UI with smooth animations
  - PDF statement generation
  - Real-time updates

## Tech Stack

- **Frontend & Backend**
  - Next.js 14 with App Router
  - TypeScript
  - Tailwind CSS
  - Clerk for authentication
  - Supabase for database

- **AI & Data**
  - Together AI (Llama-3.3-70B) for financial insights
  - Recharts for data visualization
  - Zustand for state management
  - date-fns for date manipulation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TOGETHER_API_KEY=your_together_ai_key
   RESEND_API_KEY=your_resend_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Key Features in Detail

### AI Financial Copilot
- Ask questions about your spending habits
- Get personalized budget recommendations
- Receive insights on saving opportunities
- Analyze spending patterns
- Get financial advice in natural language

### Smart Budget Tracking
- Automatic transaction categorization
- Real-time budget monitoring
- Custom budget categories
- Spending alerts and notifications
- Monthly budget reports

### Savings & Goals
- Set and track savings goals
- Visualize progress towards goals
- Get AI-powered savings recommendations
- Forecast future savings
- Track multiple financial goals

## Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Together AI Documentation](https://docs.together.ai)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)

