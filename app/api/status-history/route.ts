// app/api/status-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = req.nextUrl.searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    // Confirm the application exists
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const history = await prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching status history:', error);
    return NextResponse.json({ error: 'Failed to fetch status history' }, { status: 500 });
  }
}