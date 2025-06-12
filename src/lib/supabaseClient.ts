import { createClient } from '@supabase/supabase-js';
import type { ChatMessage, Transaction } from './types';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Fetches recent chat messages for a user.
 */
export async function getChatHistory(userId: string, limit = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/**
 * Saves a chat message for a user.
 */
export async function saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert([{ user_id: userId, role, content }]);
  if (error) throw error;
}

/**
 * Fetches transaction data for a user.
 */
export async function getTransactionData(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
} 