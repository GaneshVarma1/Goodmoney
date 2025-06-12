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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeApiRequest(prompt: string, retryCount = 0): Promise<TogetherAIResponse> {
  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "lgai/exaone-deep-32b",
        messages: [
          {
            role: "system",
            content: "You are a helpful financial assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Together AI API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        retryCount
      });
      
      if (retryCount < MAX_RETRIES && 
          (response.status === 429 || response.status === 503 || response.status === 500)) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        await delay(RETRY_DELAY * Math.pow(2, retryCount));
        return makeApiRequest(prompt, retryCount + 1);
      }

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Together AI API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Together AI API error: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof Error && 
        (error.message.includes('network') || error.message.includes('timeout'))) {
      console.log(`Retrying request after error (${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * Math.pow(2, retryCount));
      return makeApiRequest(prompt, retryCount + 1);
    }
    throw error;
  }
}

async function getChatHistory(userId: string, limit: number = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return (data ?? []) as ChatMessage[];
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

  const transactions = (rawTx ?? []) as Transaction[];

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

async function saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: userId,
        role,
        content,
      }
    ]);

  if (error) {
    console.error('Error saving message:', error);
  }
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
        2. Important advice or recommendations given
        3. Any action items or next steps mentioned
        
        Format your response using markdown:
        - Use # for main headings
        - Use ## for subheadings
        - Use bullet points (-) for lists
        - Use paragraphs for detailed explanations
        - Use **bold** for emphasis on important points
        
        Make sure to include line breaks between sections for better readability.
      `;
    } else {
      // Get recent chat history and transaction data
      const [chatHistory, transactionData] = await Promise.all([
        getChatHistory(userId),
        getTransactionData(userId)
      ]);

      const recentMessages = chatHistory
        .reverse()
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Format transaction data for the prompt
      const financialContext = `
        Financial Overview:
        - Total Income: $${transactionData.totalIncome.toFixed(2)}
        - Total Expenses: $${transactionData.totalExpenses.toFixed(2)}
        - Net Balance: $${(transactionData.totalIncome - transactionData.totalExpenses).toFixed(2)}
        
        Recent Transactions:
        ${transactionData.recentTransactions.map(t => 
          `