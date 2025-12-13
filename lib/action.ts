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

/**
 * Create or get user in database
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

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

/**
 * Check if user is admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Create loan application
 */
export async function createLoanApplication(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    
    // Convert string numbers to actual numbers
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
      existingLoanAmount: data.existingLoanAmount ? parseFloat(data.existingLoanAmount as string) : null,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_CREATED',
        userId: user.clerkId,
        targetId: application.id,
        details: {
          loanAmount: validation.data.loanAmount,
          status: 'PENDING',
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, applicationId: application.id };
  } catch (error) {
    console.error('Error creating application:', error);
    return { success: false, error: 'Failed to create application' };
  }
}

/**
 * Get user applications
 */
export async function getUserApplications() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const applications = await prisma.loanApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

/**
 * Get all applications (Admin only)
 */
export async function getAllApplications() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    const applications = await prisma.loanApplication.findMany({
      include: {
        user: {
          select: {
            email: true,
            clerkId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  } catch (error) {
    console.error('Error fetching all applications:', error);
    return [];
  }
}

/**
 * Get single application
 */
export async function getApplication(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            clerkId: true,
            role: true,
          },
        },
      },
    });

    // Check authorization
    if (!application) return null;
    if (user.role !== 'ADMIN' && application.userId !== user.id) {
      return null;
    }

    return application;
  } catch (error) {
    console.error('Error fetching application:', error);
    return null;
  }
}

/**
 * Update application status (Admin only)
 */
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

    const application = await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status: validation.data.status,
        reviewedAt: new Date(),
        reviewedBy: user.clerkId,
        adminNotes: validation.data.adminNotes || null,
        rejectionReason: validation.data.rejectionReason || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_STATUS_UPDATED',
        userId: user.clerkId,
        targetId: applicationId,
        details: {
          newStatus: validation.data.status,
          adminNotes: validation.data.adminNotes,
          rejectionReason: validation.data.rejectionReason,
        },
      },
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    
    return { success: true, application };
  } catch (error) {
    console.error('Error updating application:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

/**
 * Delete application (Admin only)
 */
export async function deleteApplication(applicationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.loanApplication.delete({
      where: { id: applicationId },
    });

    // Create audit log
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

/**
 * Get application statistics
 */
export async function getApplicationStats() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    if (user.role === 'ADMIN') {
      // Admin stats - all applications
      const [total, pending, approved, rejected, disbursed] = await Promise.all([
        prisma.loanApplication.count(),
        prisma.loanApplication.count({ where: { status: 'PENDING' } }),
        prisma.loanApplication.count({ where: { status: 'APPROVED' } }),
        prisma.loanApplication.count({ where: { status: 'REJECTED' } }),
        prisma.loanApplication.count({ where: { status: 'DISBURSED' } }),
      ]);

      const totalLoanAmount = await prisma.loanApplication.aggregate({
        _sum: { loanAmount: true },
        where: { status: { in: ['APPROVED', 'DISBURSED'] } },
      });

      return {
        total,
        pending,
        approved,
        rejected,
        disbursed,
        totalDisbursed: totalLoanAmount._sum.loanAmount || 0,
      };
    } else {
      // User stats - only their applications
      const [total, pending, approved, rejected] = await Promise.all([
        prisma.loanApplication.count({ where: { userId: user.id } }),
        prisma.loanApplication.count({ where: { userId: user.id, status: 'PENDING' } }),
        prisma.loanApplication.count({ 
          where: { 
            userId: user.id, 
            status: { in: ['APPROVED', 'DISBURSED'] } 
          } 
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

/**
 * Get recent audit logs (Admin only)
 */
export async function getAuditLogs(limit: number = 50) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return [];
    }

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Search applications (Admin only)
 */
export async function searchApplications(query: string) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return [];
    }

    const applications = await prisma.loanApplication.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
          { identificationNumber: { contains: query } },
          { vehicleRegistration: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      take: 20,
    });

    return applications;
  } catch (error) {
    console.error('Error searching applications:', error);
    return [];
  }
}