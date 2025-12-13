// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch applications (with role-based filtering)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If admin, return all applications; if user, return only their applications
    const applications = await prisma.loanApplication.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            email: true,
            clerkId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST - Create new application
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await req.headers.get('clerk-user');
      const email = clerkUser ? JSON.parse(clerkUser).email : 'user@example.com';
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
        },
      });
    }

    // Create application
    const application = await prisma.loanApplication.create({
      data: {
        userId: user.id,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        phoneNumber: body.phoneNumber,
        alternativePhone: body.alternativePhone || null,
        residentialAddress: body.residentialAddress,
        city: body.city,
        postalCode: body.postalCode,
        employmentType: body.employmentType,
        employerName: body.employerName,
        employerAddress: body.employerAddress || null,
        monthlyIncome: body.monthlyIncome,
        employmentDuration: body.employmentDuration,
        loanAmount: body.loanAmount,
        repaymentPeriod: body.repaymentPeriod,
        vehicleRegistration: body.vehicleRegistration,
        vehicleMake: body.vehicleMake,
        vehicleModel: body.vehicleModel,
        vehicleYear: body.vehicleYear,
        averageMonthlyFuel: body.averageMonthlyFuel,
        identificationType: body.identificationType,
        identificationNumber: body.identificationNumber,
        idDocumentUrl: body.idDocumentUrl,
        bankStatementUrl: body.bankStatementUrl,
        hasExistingLoans: body.hasExistingLoans,
        existingLoanAmount: body.existingLoanAmount || null,
        monthlyExpenses: body.monthlyExpenses,
        status: 'PENDING',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_CREATED',
        userId: userId,
        targetId: application.id,
        details: {
          loanAmount: body.loanAmount,
          status: 'PENDING',
        },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

// PATCH - Update application status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, status, adminNotes, rejectionReason } = body;

    const application = await prisma.loanApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: userId,
        adminNotes: adminNotes || null,
        rejectionReason: rejectionReason || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_STATUS_UPDATED',
        userId: userId,
        targetId: applicationId,
        details: {
          oldStatus: 'PENDING',
          newStatus: status,
          adminNotes,
        },
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}