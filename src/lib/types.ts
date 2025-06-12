export interface TogetherAIResponse {
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

export interface ChatMessage {
  id?: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Transaction {
  id?: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  created_at?: string;
} 