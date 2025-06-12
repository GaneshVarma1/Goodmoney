import type { Metadata } from "next";
import { Inter, Righteous } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs';
import AuthSyncer from '@/components/AuthSyncer';
import FinancialCopilot from '@/components/FinancialCopilot';

const inter = Inter({ subsets: ["latin"] });
const righteous = Righteous({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-righteous',
});

export const metadata: Metadata = {
  title: "Good Money",
  description: "Track your finances and achieve your financial goals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${inter.className} ${righteous.variable} h-full antialiased`}>
          <AuthSyncer>
            {children}
          </AuthSyncer>
          <Toaster position="top-right" toastOptions={{
            style: { fontSize: '1rem', borderRadius: '0.75rem', padding: '1rem 1.5rem' },
          }} />
          <FinancialCopilot />
        </body>
      </html>
    </ClerkProvider>
  );
}
