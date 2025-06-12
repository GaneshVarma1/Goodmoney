import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.TOGETHER_API_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'API key not configured',
          details: 'TOGETHER_API_KEY is not set in environment variables'
        },
        { status: 500 }
      );
    }

    // Test API connection with a simple prompt
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Say 'API connection successful' if you can read this."
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Test Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });

      if (response.status === 401) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Invalid API key',
            details: 'The provided API key is not valid'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          status: 'error',
          message: 'API test failed',
          details: response.statusText,
          errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'API connection successful',
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      response: result.choices?.[0]?.message?.content,
      usage: result.usage
    });

  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected error during API test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 