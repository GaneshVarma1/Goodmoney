import type { TogetherAIResponse } from './types';

/**
 * Calls Together AI's chat completion endpoint with the EXAONE Deep 32B model.
 * Handles retries and errors internally.
 * @param prompt The prompt to send to the AI
 * @returns The Together AI response
 */
export async function getAiCompletion(prompt: string): Promise<TogetherAIResponse> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  let retryCount = 0;
  while (retryCount <= MAX_RETRIES) {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'lgai/exaone-deep-32b',
          messages: [
            { role: 'system', content: 'You are a helpful financial assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.95,
        }),
      });
      if (!response.ok) {
        if ([429, 503, 500].includes(response.status) && retryCount < MAX_RETRIES) {
          await new Promise(res => setTimeout(res, RETRY_DELAY * Math.pow(2, retryCount)));
          retryCount++;
          continue;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || response.statusText);
      }
      return await response.json();
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, RETRY_DELAY * Math.pow(2, retryCount)));
        retryCount++;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to get AI completion after retries.');
} 