// app/api/repayments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// GET /api/repayments?applicationId=xxx
// Returns the repayment schedule for a given application.
// Admins can see any application; users can only see their own.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applicationId = req.nextUrl.searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    // Ownership check
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: { userId: true },
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (user.role !== 'ADMIN' && app.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark any past-due PENDING rows as OVERDUE before returning
    await prisma.repayment.updateMany({
      where: {
        applicationId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });

    const repayments = await prisma.repayment.findMany({
      where: { applicationId },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(repayments);
  } catch (error: any) {
    console.error('Error fetching repayments:', error);
    return NextResponse.json({ error: 'Failed to fetch repayments' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/repayments
// Body: { repaymentId: string, amountPaid: number }
// Records a payment against a single repayment instalment.
// Admin only.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { repaymentId, amountPaid } = body;

    if (!repaymentId || amountPaid === undefined || amountPaid === null) {
      return NextResponse.json(
        { error: 'repaymentId and amountPaid are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(String(amountPaid));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'amountPaid must be a positive number' }, { status: 400 });
    }

    const repayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
      select: { amountDue: true, applicationId: true, status: true },
    });

    if (!repayment) {
      return NextResponse.json({ error: 'Repayment not found' }, { status: 404 });
    }

    if (repayment.status === 'PAID') {
      return NextResponse.json({ error: 'Repayment is already marked as paid' }, { status: 409 });
    }

    const isPaid = parsedAmount >= Number(repayment.amountDue);

    const updated = await prisma.repayment.update({
      where: { id: repaymentId },
      data: {
        amountPaid: parsedAmount,
        paidAt: isPaid ? new Date() : null,
        status: isPaid ? 'PAID' : 'PENDING',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'REPAYMENT_RECORDED',
        userId,
        targetId: repaymentId,
        details: {
          applicationId: repayment.applicationId,
          amountDue: Number(repayment.amountDue),
          amountPaid: parsedAmount,
          status: updated.status,
        },
      },
    });

    // If all instalments for this application are now PAID, mark it DISBURSED
    const allRepayments = await prisma.repayment.findMany({
      where: { applicationId: repayment.applicationId },
      select: { status: true },
    });

    if (allRepayments.length > 0 && allRepayments.every((r) => r.status === 'PAID')) {
      await prisma.loanApplication.update({
        where: { id: repayment.applicationId },
        data: { status: 'DISBURSED' },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error recording repayment:', error);
    return NextResponse.json(
      { error: 'Failed to record repayment', message: error.message },
      { status: 500 }
    );
  }
}