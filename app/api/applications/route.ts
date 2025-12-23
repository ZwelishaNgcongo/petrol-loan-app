// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to calculate loan payments
function calculateLoanPayments(loanAmount: number, repaymentPeriod: number, interestRate: number = 0.10) {
  // Calculate total amount with interest (10% flat rate)
  const totalRepayment = loanAmount * (1 + interestRate);
  
  // Calculate monthly payment
  const monthlyPayment = totalRepayment / repaymentPeriod;
  
  return {
    totalRepayment,
    monthlyPayment,
    interestAmount: loanAmount * interestRate
  };
}

// GET - Fetch applications (with role-based filtering)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
    console.log('Received application data:', JSON.stringify(body, null, 2));

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 
      'residentialAddress', 'city', 'postalCode', 'employmentType',
      'employerName', 'monthlyIncome', 'employmentDuration', 'loanAmount',
      'repaymentPeriod', 'vehicleRegistration', 'vehicleMake', 'vehicleModel',
      'vehicleYear', 'averageMonthlyFuel', 'identificationType',
      'identificationNumber', 'idDocumentUrl', 'bankStatementUrl', 'monthlyExpenses'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.log('User not found, creating new user with clerkId:', userId);
      
      let email = 'user@example.com';
      try {
        const clerkUserHeader = req.headers.get('clerk-user');
        if (clerkUserHeader) {
          const clerkUserData = JSON.parse(clerkUserHeader);
          email = clerkUserData.email || email;
        }
      } catch (e) {
        console.log('Could not parse clerk-user header, using default email');
      }
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
        },
      });
      console.log('New user created:', user.id);
    }

    console.log('Creating application for user:', user.id);

    // Calculate loan payments (10% flat interest rate)
    const loanAmount = parseFloat(String(body.loanAmount));
    const repaymentPeriod = parseInt(String(body.repaymentPeriod));
    const payments = calculateLoanPayments(loanAmount, repaymentPeriod);

    console.log('Calculated payments:', {
      loanAmount,
      repaymentPeriod,
      totalRepayment: payments.totalRepayment,
      monthlyPayment: payments.monthlyPayment,
      interestAmount: payments.interestAmount
    });

    // Prepare data with proper Decimal conversion and calculated payments
    const applicationData: Prisma.LoanApplicationCreateInput = {
      user: {
        connect: { id: user.id }
      },
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
      repaymentPeriod: repaymentPeriod,
      // Add calculated payment fields
      monthlyPayment: new Prisma.Decimal(payments.monthlyPayment),
      totalRepayment: new Prisma.Decimal(payments.totalRepayment),
      interestRate: new Prisma.Decimal(0.10), // 10% flat rate
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
      existingLoanAmount: body.existingLoanAmount ? new Prisma.Decimal(body.existingLoanAmount) : null,
      monthlyExpenses: new Prisma.Decimal(body.monthlyExpenses),
      status: 'PENDING',
    };

    const application = await prisma.loanApplication.create({
      data: applicationData,
    });

    console.log('Application created successfully:', application.id);

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_CREATED',
          userId: userId,
          targetId: application.id,
          details: {
            loanAmount: loanAmount,
            monthlyPayment: payments.monthlyPayment,
            totalRepayment: payments.totalRepayment,
            status: 'PENDING',
            applicantName: `${body.firstName} ${body.lastName}`,
            vehicleInfo: `${body.vehicleYear} ${body.vehicleMake} ${body.vehicleModel}`,
          },
        },
      });
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Failed to create audit log (non-critical):', auditError);
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    console.error('Error creating application:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      name: error.name,
    });
    
    let errorMessage = 'Failed to create application';
    let errorDetails = 'Unknown error';
    
    if (error.code === 'P2002') {
      errorMessage = 'Duplicate entry detected';
      errorDetails = 'This application may have already been submitted';
    } else if (error.code === 'P2003') {
      errorMessage = 'Invalid reference';
      errorDetails = 'User reference is invalid';
    } else if (error.message) {
      errorDetails = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      message: errorDetails,
      code: error.code || 'UNKNOWN'
    }, { status: 500 });
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

    if (!applicationId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: applicationId and status are required' 
      }, { status: 400 });
    }

    const oldApplication = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    if (!oldApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

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
    try {
      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_STATUS_UPDATED',
          userId: userId,
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
      console.error('Failed to create audit log (non-critical):', auditError);
    }

    return NextResponse.json(application);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ 
      error: 'Failed to update application',
      message: error.message 
    }, { status: 500 });
  }
}