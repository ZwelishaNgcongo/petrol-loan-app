import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  
  if (userId) {
    // This will trigger Clerk's sign-out
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }
  
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}