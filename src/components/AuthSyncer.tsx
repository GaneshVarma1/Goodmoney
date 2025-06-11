"use client";
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export default function AuthSyncer({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const setAuthHeader = async () => {
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' });
        console.log('Clerk JWT from getToken:', token);
        if (token) {
          await supabase.auth.setSession({ access_token: token, refresh_token: '' });
          console.log('Supabase session set with Clerk JWT');
        } else {
          console.warn('No Clerk JWT returned from getToken');
        }
      } else {
        await supabase.auth.signOut();
        console.log('Signed out from Supabase');
      }
    };
    setAuthHeader();
  }, [getToken, isSignedIn]);

  return <>{children}</>;
} 