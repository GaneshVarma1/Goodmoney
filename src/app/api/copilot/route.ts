import { NextResponse } from 'next/server';
import { getAiCompletion } from '@/lib/aiClient';
import { getChatHistory, saveMessage, getTransactionData } from '@/lib/supabaseClient';
import type { ChatMessage } from '@/lib/types';

/**
 * API route for the AI financial copilot.
 * Handles chat, summarization, and uses Supabase for context.
 */
export async function POST(req: Request) {
  if (!process.env.TOGETHER_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        error: 'Configuration error',
        message: 'Required environment variables are not configured.',
        setupInstructions: [
          '1. Add TOGETHER_API_KEY to your environment variables',
          '2. Add NEXT_PUBLIC_SUPABASE_URL to your environment variables',
          '3. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables',
          '4. Redeploy your application',
        ],
      },
      { status: 500 }
    );
  }

  try {
    const { message, context, userId } = await req.json();
    if (!message && !context) {
      return NextResponse.json({ error: 'No message or context provided' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    // Save user message
    if (message) await saveMessage(userId, 'user', message);

    let prompt = '';
    if (context) {
      // Summarization request
      prompt = `
        You are a financial assistant helping to summarize a conversation.
        Here is the conversation history:
        ${context}
        \nPlease provide a concise summary of the key points discussed, focusing on:
        1. Main financial topics covered
        2. Important advice or recommendations given
        3. Any action items or next steps mentioned
        \nFormat your response using markdown:
        - Use # for main headings
        - Use ## for subheadings
        - Use bullet points (-) for lists
        - Use paragraphs for detailed explanations
        - Use **bold** for emphasis on important points
        \nMake sure to include line breaks between sections for better readability.
      `;
    } else {
      // Get recent chat history and transaction data
      const [chatHistory, transactions] = await Promise.all([
        getChatHistory(userId),
        getTransactionData(userId),
      ]);
      const recentMessages = chatHistory
        .reverse()
        .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
        .join('\n');
      // Calculate financial context
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const categoryBreakdown = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as { [key: string]: number });
      const recentTransactions = transactions.slice(0, 5);
      const financialContext = `
        Financial Overview:
        - Total Income: $${totalIncome.toFixed(2)}
        - Total Expenses: $${totalExpenses.toFixed(2)}
        - Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}
        \nRecent Transactions:
        ${recentTransactions.map(t => `- ${t.date}: ${t.type} of $${t.amount.toFixed(2)} in ${t.category}${t.description ? ` (${t.description})` : ''}`).join('\n')}
        \nCategory Breakdown:
        ${Object.entries(categoryBreakdown).map(([category, amount]) => `- ${category}: $${(amount as number).toFixed(2)}`).join('\n')}
      `;
      prompt = `
        You are a financial assistant helping a user manage their finances.
        \n${financialContext}
        \nRecent conversation history:
        ${recentMessages}
        \nUser's question: ${message}
        \nPlease provide a helpful, concise response focusing on financial advice and insights.
        Use the provided financial data to give personalized recommendations.
        Consider the conversation history for context and continuity.
        When discussing spending patterns or categories, reference the actual data provided.
        If suggesting budget adjustments, base them on the user's current spending patterns.
        \nFormat your response using markdown:
        - Use # for main headings
        - Use ## for subheadings
        - Use bullet points (-) for lists
        - Use paragraphs for detailed explanations
        - Use **bold** for emphasis on important points
        - Use line breaks between sections for better readability
        \nStructure your response with:
        1. A clear heading summarizing the main point
        2. Key insights or recommendations as bullet points
        3. Detailed explanations in paragraphs
        4. Action items or next steps if applicable
      `;
    }
    // Get AI response
    const result = await getAiCompletion(prompt);
    if (!result || !result.choices?.[0]?.message?.content) {
      throw new Error('No response content received from Together AI');
    }
    const assistantResponse = result.choices[0].message.content;
    // Save assistant's response
    await saveMessage(userId, 'assistant', assistantResponse);
    return NextResponse.json({ response: assistantResponse, usage: result.usage });
  } catch (error: unknown) {
    const apiError = error as Error;
    console.error('Detailed error in copilot API:', {
      error: apiError,
      message: apiError.message,
      stack: apiError.stack,
    });
    if (apiError.message.includes('Invalid API key')) {
      return NextResponse.json(
        {
          error: 'Authentication error',
          message: 'Invalid API key. Please check your Together AI API key.',
          setupInstructions: [
            '1. Go to https://api.together.xyz/settings/api-keys',
            '2. Create a new API key or copy your existing one',
            '3. Add it to your Vercel environment variables',
            '4. Redeploy your application',
          ],
        },
        { status: 401 }
      );
    }
    if (apiError.message.includes('Rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have exceeded the rate limit. Please try again later.',
          resolution: [
            '1. Wait a few minutes before trying again',
            '2. Check your usage at https://api.together.xyz/settings/usage',
            '3. Consider upgrading your plan if needed',
          ],
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        error: 'Unexpected error',
        message: 'An unexpected error occurred. Please try again later.',
        details: apiError.message,
      },
      { status: 500 }
    );
  }
} 