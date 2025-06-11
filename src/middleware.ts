import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  // Protect all routes under /dashboard (customize as needed)
  matcher: ['/(.*)'],
}; 