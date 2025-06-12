import type { Metadata } from "next";
import { Inter, Righteous } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs';
import AuthSyncer from '@/components/AuthSyncer';

const inter = Inter({ subsets: ["latin"] });
const righteous = Righteous({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-righteous',
});

export const metadata: Metadata = {
  title: "Good Money - Save your money",
  description: "Track your finances and achieve your financial goals with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <head>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤑</text></svg>" />
        </head>
        <body className={`${inter.className} ${righteous.variable} h-full antialiased`}>
          <AuthSyncer>
            {children}
          </AuthSyncer>
          <Toaster position="top-right" toastOptions={{
            style: { fontSize: '1rem', borderRadius: '0.75rem', padding: '1rem 1.5rem' },
          }} />
        </body>
      </html>
    </ClerkProvider>
  );
}
