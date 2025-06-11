import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, pdfBase64 } = await req.json();
    // Decode base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    await resend.emails.send({
      from: 'Good Money <noreply@resend.dev>',
      to: email,
      subject: 'Your Good Money Statement',
      text: 'Attached is your requested Good Money statement (PDF).',
      attachments: [
        {
          filename: 'statement.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
} 