'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  loanApplicationSchema,
  adminUpdateSchema,
  validateSchema,
  formatZodErrors,
} from './validations';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          role: 'USER',
        },
      });
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Create loan application
// ---------------------------------------------------------------------------

export async function createLoanApplication(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const data = Object.fromEntries(formData);

    const parsedData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth as string),
      monthlyIncome: parseFloat(data.monthlyIncome as string),
      employmentDuration: parseInt(data.employmentDuration as string),
      loanAmount: parseFloat(data.loanAmount as string),
      repaymentPeriod: parseInt(data.repaymentPeriod as string),
      vehicleYear: parseInt(data.vehicleYear as string),
      averageMonthlyFuel: parseFloat(data.averageMonthlyFuel as string),
      monthlyExpenses: parseFloat(data.monthlyExpenses as string),
      hasExistingLoans: data.hasExistingLoans === 'true',
      existingLoanAmount: data.existingLoanAmount
        ? parseFloat(data.existingLoanAmount as string)
        : null,
    };

    const validation = validateSchema(loanApplicationSchema, parsedData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: formatZodErrors(validation.errors),
      };
    }

    const application = await prisma.loanApplication.create({
      data: {
        userId: user.id,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        dateOfBirth: validation.data.dateOfBirth,
        phoneNumber: validation.data.phoneNumber,
        alternativePhone: validation.data.alternativePhone || null,
        residentialAddress: validation.data.residentialAddress,
        city: validation.data.city,
        postalCode: validation.data.postalCode,
        employmentType: validation.data.employmentType,
        employerName: validation.data.employerName,
        employerAddress: validation.data.employerAddress || null,
        monthlyIncome: validation.data.monthlyIncome,
        employmentDuration: validation.data.employmentDuration,
        loanAmount: validation.data.loanAmount,
        repaymentPeriod: validation.data.repaymentPeriod,
        vehicleRegistration: validation.data.vehicleRegistration,
        vehicleMake: validation.data.vehicleMake,
        vehicleModel: validation.data.vehicleModel,
        vehicleYear: validation.data.vehicleYear,
        averageMonthlyFuel: validation.data.averageMonthlyFuel,
        identificationType: validation.data.identificationType,
        identificationNumber: validation.data.identificationNumber,
        idDocumentUrl: validation.data.idDocumentUrl,
        bankStatementUrl: validation.data.bankStatementUrl,
        hasExistingLoans: validation.data.hasExistingLoans,
        existingLoanAmount: validation.data.existingLoanAmount,
        monthlyExpenses: validation.data.monthlyExpenses,
        status: 'PENDING',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_CREATED',
        userId: user.clerkId,
        targetId: application.id,
        details: { loanAmount: validation.data.loanAmount, status: 'PENDING' },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, applicationId: application.id };
  } catch (error) {
    console.error('Error creating application:', error);
    return { success: false, error: 'Failed to create application' };
  }
}

// ---------------------------------------------------------------------------
// Read applications
// ---------------------------------------------------------------------------

export async function getUserApplications() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    return prisma.loanApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

export async function getAllApplications() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    return prisma.loanApplication.findMany({
      include: {
        user: { select: { email: true, clerkId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return [];
  }
}

export async function getApplication(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, clerkId: true, role: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        repayments: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!application) return null;
    if (user.role !== 'ADMIN' && application.userId !== user.id) return null;

    return application;
  } catch (error) {
    console.error('Error fetching application:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Status history
// ---------------------------------------------------------------------------

/**
 * Returns the full status-change history for a given application.
 * Admin-only.
 */
export async function getStatusHistory(applicationId: string) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return [];

    return prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Update application status  (now also writes history row)
// ---------------------------------------------------------------------------

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  adminNotes?: string,
  rejectionReason?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const validation = validateSchema(adminUpdateSchema, {
      applicationId,
      status,
      adminNotes,
      rejectionReason,
    });

    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: formatZodErrors(validation.errors),
      };
    }

    // Fetch current status so we can record the transition
    const current = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: { status: true },
    });

    if (!current) return { success: false, error: 'Application not found' };

    // Run update + history insert in one transaction
    const [application] = await prisma.$transaction([
      prisma.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: validation.data.status,
          reviewedAt: new Date(),
          reviewedBy: user.clerkId,
          adminNotes: validation.data.adminNotes || null,
          rejectionReason: validation.data.rejectionReason || null,
        },
      }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: current.status,
          toStatus: validation.data.status,
          changedBy: user.clerkId,
          notes:
            validation.data.status === 'REJECTED'
              ? validation.data.rejectionReason || null
              : validation.data.adminNotes || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'APPLICATION_STATUS_UPDATED',
          userId: user.clerkId,
          targetId: applicationId,
          details: {
            fromStatus: current.status,
            newStatus: validation.data.status,
            adminNotes: validation.data.adminNotes,
            rejectionReason: validation.data.rejectionReason,
          },
        },
      }),
    ]);

    // When an application is approved, auto-create the repayment schedule
    if (validation.data.status === 'APPROVED') {
      await _createRepaymentScheduleInternal(applicationId);
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');

    return { success: true, application };
  } catch (error) {
    console.error('Error updating application:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

// ---------------------------------------------------------------------------
// Repayments
// ---------------------------------------------------------------------------

/**
 * Internal helper — called automatically when an application is approved.
 * Creates one repayment row per repayment period month.
 */
async function _createRepaymentScheduleInternal(applicationId: string) {
  try {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: {
        loanAmount: true,
        repaymentPeriod: true,
        interestRate: true,
        totalRepayment: true,
        monthlyPayment: true,
        repayments: { select: { id: true } },
      },
    });

    if (!app || app.repayments.length > 0) return; // already created

    const loanAmount = Number(app.loanAmount);
    const interestRate = Number(app.interestRate);
    const repaymentPeriod = app.repaymentPeriod;

    const totalAmount =
      app.totalRepayment !== null
        ? Number(app.totalRepayment)
        : loanAmount * (1 + interestRate);

    const monthlyAmount =
      app.monthlyPayment !== null
        ? Number(app.monthlyPayment)
        : totalAmount / repaymentPeriod;

    const now = new Date();
    const rows = Array.from({ length: repaymentPeriod }, (_, i) => {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      return {
        applicationId,
        amountDue: monthlyAmount,
        dueDate,
        status: 'PENDING',
      };
    });

    await prisma.repayment.createMany({ data: rows });
  } catch (error) {
    console.error('Error creating repayment schedule:', error);
    // Non-critical — don't throw, approval already succeeded
  }
}

/**
 * Fetches repayments for a given application.
 * Admin can see any; user can only see their own.
 */
export async function getRepayments(applicationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Verify ownership / admin access
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: { userId: true },
    });

    if (!app) return [];
    if (user.role !== 'ADMIN' && app.userId !== user.id) return [];

    return prisma.repayment.findMany({
      where: { applicationId },
      orderBy: { dueDate: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching repayments:', error);
    return [];
  }
}

/**
 * Mark a repayment as paid (Admin only).
 */
export async function markRepaymentPaid(repaymentId: string, amountPaid: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const repayment = await prisma.repayment.findUnique({
      where: { id: repaymentId },
      select: { amountDue: true, applicationId: true },
    });

    if (!repayment) return { success: false, error: 'Repayment not found' };

    const isPaid = amountPaid >= Number(repayment.amountDue);

    const updated = await prisma.repayment.update({
      where: { id: repaymentId },
      data: {
        amountPaid,
        paidAt: isPaid ? new Date() : null,
        status: isPaid ? 'PAID' : 'PENDING',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'REPAYMENT_RECORDED',
        userId: user.clerkId,
        targetId: repaymentId,
        details: {
          applicationId: repayment.applicationId,
          amountDue: Number(repayment.amountDue),
          amountPaid,
          status: updated.status,
        },
      },
    });

    // Check if all repayments are now paid → auto-set application to DISBURSED
    const allRepayments = await prisma.repayment.findMany({
      where: { applicationId: repayment.applicationId },
      select: { status: true },
    });

    const allPaid = allRepayments.every((r) => r.status === 'PAID');
    if (allPaid) {
      await prisma.loanApplication.update({
        where: { id: repayment.applicationId },
        data: { status: 'DISBURSED' },
      });
    }

    revalidatePath('/admin');
    return { success: true, repayment: updated };
  } catch (error) {
    console.error('Error marking repayment paid:', error);
    return { success: false, error: 'Failed to record repayment' };
  }
}

/**
 * Mark overdue repayments. Call this from a cron job or on admin page load.
 * Admin only.
 */
export async function markOverdueRepayments() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const now = new Date();

    const result = await prisma.repayment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    return { success: true, markedOverdue: result.count };
  } catch (error) {
    console.error('Error marking overdue repayments:', error);
    return { success: false, error: 'Failed to mark overdue repayments' };
  }
}

// ---------------------------------------------------------------------------
// Delete application
// ---------------------------------------------------------------------------

export async function deleteApplication(applicationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.loanApplication.delete({ where: { id: applicationId } });

    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_DELETED',
        userId: user.clerkId,
        targetId: applicationId,
        details: { deletedAt: new Date() },
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: 'Failed to delete application' };
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getApplicationStats() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (user.role === 'ADMIN') {
      const [total, pending, underReview, approved, rejected, disbursed] =
        await Promise.all([
          prisma.loanApplication.count(),
          prisma.loanApplication.count({ where: { status: 'PENDING' } }),
          prisma.loanApplication.count({ where: { status: 'UNDER_REVIEW' } }),
          prisma.loanApplication.count({ where: { status: 'APPROVED' } }),
          prisma.loanApplication.count({ where: { status: 'REJECTED' } }),
          prisma.loanApplication.count({ where: { status: 'DISBURSED' } }),
        ]);

      const totalLoanAmount = await prisma.loanApplication.aggregate({
        _sum: { loanAmount: true },
        where: { status: { in: ['APPROVED', 'DISBURSED'] } },
      });

      const overdueCount = await prisma.repayment.count({
        where: { status: 'OVERDUE' },
      });

      return {
        total,
        pending,
        underReview,
        approved,
        rejected,
        disbursed,
        totalDisbursed: totalLoanAmount._sum.loanAmount || 0,
        overdueRepayments: overdueCount,
      };
    } else {
      const [total, pending, approved, rejected] = await Promise.all([
        prisma.loanApplication.count({ where: { userId: user.id } }),
        prisma.loanApplication.count({ where: { userId: user.id, status: 'PENDING' } }),
        prisma.loanApplication.count({
          where: { userId: user.id, status: { in: ['APPROVED', 'DISBURSED'] } },
        }),
        prisma.loanApplication.count({ where: { userId: user.id, status: 'REJECTED' } }),
      ]);

      return { total, pending, approved, rejected };
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogs(limit: number = 50) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return [];

    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchApplications(query: string) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return [];

    return prisma.loanApplication.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
          { identificationNumber: { contains: query } },
          { vehicleRegistration: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { user: { select: { email: true } } },
      take: 20,
    });
  } catch (error) {
    console.error('Error searching applications:', error);
    return [];
  }
}