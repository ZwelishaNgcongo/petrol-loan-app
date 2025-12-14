// app/api/user/role/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/clerkHelper';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      role: user.role,
      email: user.email,
      id: user.id,
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}