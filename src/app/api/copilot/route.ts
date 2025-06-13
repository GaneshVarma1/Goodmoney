import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Basic env validation (log only on the server)
if (!process.env.TOGETHER_API_KEY) {
  console.error('Missing Together AI API key');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env variables');
}

// Supabase client will be initialized lazily after env-var validation
let supabase: ReturnType<typeof createClient>;

interface TogetherAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

async function makeApiRequest(prompt: string, context?: string): Promise<TogetherAIResponse> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          messages: [
            {
              role: 'system',
              content: `You are a friendly and knowledgeable financial assistant named Good Money AI. Your goal is to help users with all aspects of personal finance in a conversational and engaging way.

Key responsibilities:
1. Answer general financial questions (budgeting, saving, investing, etc.)
2. Provide personalized financial advice based on user's context
3. Help users understand their spending patterns
4. Suggest ways to save money and increase income
5. Explain financial concepts in simple terms
6. Offer practical tips for financial success

Guidelines:
- Be conversational and friendly, but professional
- Use simple language and avoid complex financial jargon
- Provide actionable advice and specific examples
- Acknowledge user's financial goals and concerns
- Be encouraging and supportive
- If you don't know something, be honest about it
- Always prioritize user's financial well-being

About me:
I was built by Sri, a Full Stack Developer. You can get in touch with him at bit.ly/sriport

Remember: You're here to help users make better financial decisions and achieve their financial goals.`
            },
            ...(context ? [{ role: 'user', content: context }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Together AI API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          retryCount: attempt
        });

        // Only retry on specific error statuses
        if (response.status === 429 || response.status === 503 || response.status === 500) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retrying request (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Return a fallback response instead of throwing an error
        return {
          choices: [{
            message: {
              content: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a few moments. In the meantime, you can:\n\n1. Check your transaction history\n2. Review your budget categories\n3. Track your savings goals"
            }
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error in makeApiRequest:', error);
      // Return a fallback response for any other errors
      return {
        choices: [{
          message: {
            content: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a few moments. In the meantime, you can:\n\n1. Check your transaction history\n2. Review your budget categories\n3. Track your savings goals"
          }
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }

  // Return a fallback response if all retries fail
  return {
    choices: [{
      message: {
        content: "I apologize, but I'm currently experiencing technical difficulties. Please try again in a few moments. In the meantime, you can:\n\n1. Check your transaction history\n2. Review your budget categories\n3. Track your savings goals"
      }
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getChatHistory(_userId: string, _limit: number = 10): Promise<ChatMessage[]> {
  // Return empty array since we're not saving messages
  return [];
}

async function getTransactionData(userId: string): Promise<{
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: { [key: string]: number };
  recentTransactions: Transaction[];
}> {
  const { data: rawTx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return {
      transactions: [],
      totalIncome: 0,
      totalExpenses: 0,
      categoryBreakdown: {},
      recentTransactions: []
    };
  }

  const transactions = (rawTx ?? []) as unknown as Transaction[];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

  return {
    transactions,
    totalIncome,
    totalExpenses,
    categoryBreakdown,
    recentTransactions: transactions.slice(0, 5)
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function saveMessage(_userId: string, _role: 'user' | 'assistant', _content: string): Promise<void> {
  // Skip saving messages for now
  return;
}

export async function POST(req: Request) {
  // Guard against mis-configuration (do this once at the top of the handler)
  const { TOGETHER_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
  if (!TOGETHER_API_KEY || !NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Configuration error: missing env vars');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Initialize Supabase client only after validation
  if (!supabase) {
    supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  try {
    const { message, context, userId } = await req.json();

    if (!message && !context) {
      return NextResponse.json(
        { error: 'No message or context provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Save user message
    await saveMessage(userId, 'user', message);

    let prompt = '';
    if (context) {
      // This is a summarization request
      prompt = `
        You are a financial assistant helping to summarize a conversation.
        Here is the conversation history:
        ${context}
        
        Please provide a concise summary of the key points discussed, focusing on:
        1. Main financial topics covered
        2. Any specific advice or recommendations given
        3. Action items or next steps suggested
        4. Important insights or learnings
        
        Keep the summary clear and actionable.`;
    } else {
      // This is a regular conversation
      const transactionData = await getTransactionData(userId);
      
      prompt = `
        User's financial context:
        - Total Income: $${transactionData.totalIncome.toFixed(2)}
        - Total Expenses: $${transactionData.totalExpenses.toFixed(2)}
        - Net Savings: $${(transactionData.totalIncome - transactionData.totalExpenses).toFixed(2)}
        - Top Expense Categories: ${Object.entries(transactionData.categoryBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
          .join(', ')}
        
        User's question: ${message}
        
        Please provide a helpful and personalized response based on their financial situation.`;
    }

    const result = await makeApiRequest(prompt, context);
    
    // Save assistant's response
    await saveMessage(userId, 'assistant', result.choices[0].message.content);

    return NextResponse.json({
      response: result.choices[0].message.content,
      usage: result.usage
    });
  } catch (error) {
    const apiError = error as Error;
    console.error('Copilot route error:', apiError.message);

    // Handle specific error cases
    if (apiError.message.includes('Invalid API key')) {
      return NextResponse.json(
        { error: 'Authentication error', message: 'Invalid API key.' },
        { status: 401 }
      );
    }

    if (apiError.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Please try again in a few moments.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}