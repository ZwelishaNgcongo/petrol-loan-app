import { z } from 'zod';

/**
 * Personal Information Schema
 */
export const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 18 && age <= 80;
  }, 'You must be between 18 and 80 years old'),
  phoneNumber: z.string()
    .regex(/^(\+27|0)[0-9]{9}$/, 'Invalid South African phone number'),
  alternativePhone: z.string()
    .regex(/^(\+27|0)[0-9]{9}$/, 'Invalid South African phone number')
    .optional()
    .or(z.literal('')),
  residentialAddress: z.string().min(10, 'Address must be at least 10 characters').max(200),
  city: z.string().min(2, 'City must be at least 2 characters').max(50),
  postalCode: z.string().regex(/^\d{4}$/, 'Postal code must be 4 digits'),
});

/**
 * Employment Information Schema
 */
export const employmentInfoSchema = z.object({
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'CONTRACT']),
  employerName: z.string().min(2, 'Employer name is required').max(100),
  employerAddress: z.string().max(200).optional().or(z.literal('')),
  monthlyIncome: z.number()
    .min(3000, 'Minimum monthly income is R3,000')
    .max(1000000, 'Monthly income seems too high'),
  employmentDuration: z.number()
    .min(3, 'Minimum employment duration is 3 months')
    .max(600, 'Employment duration seems too long'),
  monthlyExpenses: z.number()
    .min(0, 'Monthly expenses cannot be negative')
    .max(1000000),
  hasExistingLoans: z.boolean(),
  existingLoanAmount: z.number()
    .min(0)
    .max(10000000)
    .optional()
    .nullable(),
}).refine((data) => {
  if (data.hasExistingLoans && !data.existingLoanAmount) {
    return false;
  }
  return true;
}, {
  message: 'Existing loan amount is required when you have existing loans',
  path: ['existingLoanAmount'],
});

/**
 * Loan Details Schema
 */
export const loanDetailsSchema = z.object({
  loanAmount: z.number()
    .min(500, 'Minimum loan amount is R500')
    .max(50000, 'Maximum loan amount is R50,000'),
  repaymentPeriod: z.number()
    .min(3, 'Minimum repayment period is 3 months')
    .max(24, 'Maximum repayment period is 24 months'),
  vehicleRegistration: z.string()
    .min(3, 'Vehicle registration is required')
    .max(20)
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid vehicle registration format'),
  vehicleMake: z.string().min(2, 'Vehicle make is required').max(50),
  vehicleModel: z.string().min(2, 'Vehicle model is required').max(50),
  vehicleYear: z.number()
    .min(1980, 'Vehicle year must be 1980 or later')
    .max(new Date().getFullYear(), 'Vehicle year cannot be in the future'),
  averageMonthlyFuel: z.number()
    .min(100, 'Average monthly fuel spend must be at least R100')
    .max(50000, 'Average monthly fuel spend seems too high'),
});

/**
 * Identification Schema
 */
export const identificationSchema = z.object({
  identificationType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE']),
  identificationNumber: z.string().min(5, 'Identification number is required').max(20),
  idDocumentUrl: z.string().url('Invalid document URL'),
  bankStatementUrl: z.string().url('Invalid document URL'),
});

/**
 * Complete Loan Application Schema
 */
export const loanApplicationSchema = z.object({
  ...personalInfoSchema.shape,
  ...employmentInfoSchema.shape,
  ...loanDetailsSchema.shape,
  ...identificationSchema.shape,
});

/**
 * Admin Update Schema
 */
export const adminUpdateSchema = z.object({
  applicationId: z.string().cuid('Invalid application ID'),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED']),
  adminNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
}).refine((data) => {
  if (data.status === 'REJECTED' && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: 'Rejection reason is required when rejecting an application',
  path: ['rejectionReason'],
});

/**
 * File Upload Schema
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      'File must be PDF, JPG, or PNG'
    ),
});

/**
 * User Profile Update Schema
 */
export const userProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phoneNumber: z.string().regex(/^(\+27|0)[0-9]{9}$/).optional(),
  email: z.string().email().optional(),
});

/**
 * Application Filter Schema
 */
export const applicationFilterSchema = z.object({
  status: z.enum(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().max(1000000).optional(),
  searchQuery: z.string().max(100).optional(),
});

/**
 * Loan Calculator Input Schema
 */
export const loanCalculatorSchema = z.object({
  loanAmount: z.number().min(500).max(50000),
  repaymentPeriod: z.number().min(3).max(24),
  interestRate: z.number().min(0).max(100).default(15),
});

/**
 * Type exports
 */
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type EmploymentInfoInput = z.infer<typeof employmentInfoSchema>;
export type LoanDetailsInput = z.infer<typeof loanDetailsSchema>;
export type IdentificationInput = z.infer<typeof identificationSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type ApplicationFilterInput = z.infer<typeof applicationFilterSchema>;
export type LoanCalculatorInput = z.infer<typeof loanCalculatorSchema>;

/**
 * Validation helper function
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError<any>): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  return errors;
}