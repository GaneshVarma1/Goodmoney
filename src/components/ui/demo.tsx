'use client'

import { Scene } from "@/components/ui/rubik-s-cube";
import { SignInButton, SignedOut, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DemoOne = () => {
  return (
    <div className="h-screen w-screen relative flex flex-col justify-center items-center">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight mix-blend-difference text-white">
        Good Money
      </h1>
      <p className="text-lg md:text-xl text-white mix-blend-exclusion max-w-2xl px-6 leading-relaxed">
        Why pay to save money? Good Money helps you track, manage, and grow your finances - completely free!
      </p>
      <div className="flex gap-4 mt-8 z-10">
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button className="bg-[var(--foreground)] text-[var(--background)] px-8 py-3 text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl border border-[var(--background)]">
              Login
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button className="bg-[var(--foreground)] text-[var(--background)] px-8 py-3 text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl border border-[var(--background)]">
              Go to Dashboard
            </Button>
          </Link>
        </SignedIn>
        <a
          href="https://github.com/GaneshVarma1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-gray-900 text-white px-8 py-3 text-lg font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl">
            GitHub
          </Button>
        </a>
      </div>
      <div className="absolute bottom-4 left-0 w-full flex justify-center z-20">
        <span className="text-white text-base md:text-lg bg-black/60 px-4 py-2 rounded-lg shadow">
          Built by{' '}
          <a
            href="https://bit.ly/sriport"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-blue-300 transition-colors"
          >
            this guy 
          </a>{' '}😎 to save your money
        </span>
      </div>
    </div>
  );
};

export { DemoOne }; 