// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateLoanPayments(
  loanAmount: number,
  repaymentPeriod: number,
  interestRate: number = 0.10
) {
  const totalRepayment = loanAmount * (1 + interestRate);
  const monthlyPayment = totalRepayment / repaymentPeriod;
  return { totalRepayment, monthlyPayment, interestAmount: loanAmount * interestRate };
}

/**
 * Auto-creates one repayment row per month of the repayment period.
 * Called inside the PATCH transaction when status changes to APPROVED.
 * Safe to call multiple times — skips if rows already exist.
 */
async function createRepaymentSchedule(
  tx: Prisma.TransactionClient,
  applicationId: string,
  loanAmount: number,
  repaymentPeriod: number,
  interestRate: number,
  existingTotalRepayment: number | null,
  existingMonthlyPayment: number | null
) {
  const existing = await tx.repayment.count({ where: { applicationId } });
  if (existing > 0) return; // already created, skip

  const totalAmount =
    existingTotalRepayment !== null
      ? existingTotalRepayment
      : loanAmount * (1 + interestRate);

  const monthlyAmount =
    existingMonthlyPayment !== null
      ? existingMonthlyPayment
      : totalAmount / repaymentPeriod;

  const now = new Date();
  const rows = Array.from({ length: repaymentPeriod }, (_, i) => {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return { applicationId, amountDue: monthlyAmount, dueDate, status: 'PENDING' };
  });

  await tx.repayment.createMany({ data: rows });
}

// ---------------------------------------------------------------------------
// GET — fetch applications (role-based)
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

    const applications = await prisma.loanApplication.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { user: { select: { email: true, clerkId: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create new application
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber',
      'residentialAddress', 'city', 'postalCode', 'employmentType',
      'employerName', 'monthlyIncome', 'employmentDuration', 'loanAmount',
      'repaymentPeriod', 'vehicleRegistration', 'vehicleMake', 'vehicleModel',
      'vehicleYear', 'averageMonthlyFuel', 'identificationType',
      'identificationNumber', 'idDocumentUrl', 'bankStatementUrl', 'monthlyExpenses',
    ];

    const missingFields = requiredFields.filter(
      (f) => body[f] === undefined || body[f] === null || body[f] === ''
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: { clerkId: userId, email: 'user@example.com' },
      });
    }

    const loanAmount = parseFloat(String(body.loanAmount));
    const repaymentPeriod = parseInt(String(body.repaymentPeriod));
    const payments = calculateLoanPayments(loanAmount, repaymentPeriod);

    const applicationData: Prisma.LoanApplicationCreateInput = {
      user: { connect: { id: user.id } },
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      dateOfBirth: new Date(body.dateOfBirth),
      phoneNumber: String(body.phoneNumber),
      alternativePhone: body.alternativePhone ? String(body.alternativePhone) : null,
      residentialAddress: String(body.residentialAddress),
      city: String(body.city),
      postalCode: String(body.postalCode),
      employmentType: body.employmentType,
      employerName: String(body.employerName),
      employerAddress: body.employerAddress ? String(body.employerAddress) : null,
      monthlyIncome: new Prisma.Decimal(body.monthlyIncome),
      employmentDuration: parseInt(String(body.employmentDuration)),
      loanAmount: new Prisma.Decimal(loanAmount),
      repaymentPeriod,
      monthlyPayment: new Prisma.Decimal(payments.monthlyPayment),
      totalRepayment: new Prisma.Decimal(payments.totalRepayment),
      interestRate: new Prisma.Decimal(0.10),
      vehicleRegistration: String(body.vehicleRegistration),
      vehicleMake: String(body.vehicleMake),
      vehicleModel: String(body.vehicleModel),
      vehicleYear: parseInt(String(body.vehicleYear)),
      averageMonthlyFuel: new Prisma.Decimal(body.averageMonthlyFuel),
      identificationType: body.identificationType,
      identificationNumber: String(body.identificationNumber),
      idDocumentUrl: String(body.idDocumentUrl),
      bankStatementUrl: String(body.bankStatementUrl),
      hasExistingLoans: Boolean(body.hasExistingLoans),
      existingLoanAmount: body.existingLoanAmount
        ? new Prisma.Decimal(body.existingLoanAmount)
        : null,
      monthlyExpenses: new Prisma.Decimal(body.monthlyExpenses),
      status: 'PENDING',
    };

    const application = await prisma.loanApplication.create({ data: applicationData });

    // Audit log (non-critical)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_CREATED',
          userId,
          targetId: application.id,
          details: {
            loanAmount,
            monthlyPayment: payments.monthlyPayment,
            totalRepayment: payments.totalRepayment,
            status: 'PENDING',
            applicantName: `${body.firstName} ${body.lastName}`,
          },
        },
      });
    } catch (auditError) {
      console.error('Audit log failed (non-critical):', auditError);
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    console.error('Error creating application:', error);

    let errorMessage = 'Failed to create application';
    if (error.code === 'P2002') errorMessage = 'Duplicate entry detected';
    if (error.code === 'P2003') errorMessage = 'Invalid user reference';

    return NextResponse.json(
      { error: errorMessage, message: error.message, code: error.code || 'UNKNOWN' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — update status (admin only)
// Writes ApplicationStatusHistory + optional repayment schedule in one transaction
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
    const { applicationId, status, adminNotes, rejectionReason } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'applicationId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    if (status === 'REJECTED' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'rejectionReason is required when rejecting an application' },
        { status: 400 }
      );
    }

    const oldApplication = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: {
        status: true,
        loanAmount: true,
        repaymentPeriod: true,
        interestRate: true,
        totalRepayment: true,
        monthlyPayment: true,
      },
    });

    if (!oldApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Run everything in one transaction: update + history + optional repayment schedule
    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: userId,
          adminNotes: adminNotes || null,
          rejectionReason: rejectionReason || null,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: oldApplication.status,
          toStatus: status,
          changedBy: userId,
          notes:
            status === 'REJECTED'
              ? rejectionReason || null
              : adminNotes || null,
        },
      });

      // Auto-create repayment schedule on first approval
      if (status === 'APPROVED') {
        await createRepaymentSchedule(
          tx,
          applicationId,
          Number(oldApplication.loanAmount),
          oldApplication.repaymentPeriod,
          Number(oldApplication.interestRate),
          oldApplication.totalRepayment !== null ? Number(oldApplication.totalRepayment) : null,
          oldApplication.monthlyPayment !== null ? Number(oldApplication.monthlyPayment) : null
        );
      }

      return updated;
    });

    // Audit log (outside transaction — non-critical)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_STATUS_UPDATED',
          userId,
          targetId: applicationId,
          details: {
            oldStatus: oldApplication.status,
            newStatus: status,
            adminNotes: adminNotes || null,
            rejectionReason: rejectionReason || null,
            reviewedBy: user.email,
          },
        },
      });
    } catch (auditError) {
      console.error('Audit log failed (non-critical):', auditError);
    }

    return NextResponse.json(application);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application', message: error.message },
      { status: 500 }
    );
  }
}