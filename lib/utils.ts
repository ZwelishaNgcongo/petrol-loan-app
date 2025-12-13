type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Merge class names (simplified version without clsx/tailwind-merge)
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  inputs.forEach(input => {
    if (!input) return;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    }
  });
  
  return classes.join(' ');
}

/**
 * Format currency to South African Rand
 * Fixed for hydration by explicitly setting locale
 */
export function formatCurrency(amount: number): string {
  // Use explicit locale to ensure server and client match
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R');
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date to short string
 */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Calculate loan monthly payment with interest
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  repaymentPeriod: number,
  annualInterestRate: number = 0.15
): number {
  const monthlyRate = annualInterestRate / 12;
  const totalInterest = loanAmount * monthlyRate * repaymentPeriod;
  const totalAmount = loanAmount + totalInterest;
  return totalAmount / repaymentPeriod;
}

/**
 * Calculate total interest
 */
export function calculateTotalInterest(
  loanAmount: number,
  repaymentPeriod: number,
  annualInterestRate: number = 0.15
): number {
  const monthlyRate = annualInterestRate / 12;
  return loanAmount * monthlyRate * repaymentPeriod;
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDTI(
  monthlyIncome: number,
  monthlyPayment: number,
  monthlyExpenses: number,
  existingLoanPayment: number = 0
): number {
  const totalObligations = monthlyPayment + monthlyExpenses + existingLoanPayment;
  return (totalObligations / monthlyIncome) * 100;
}

/**
 * Calculate disposable income
 */
export function calculateDisposableIncome(
  monthlyIncome: number,
  monthlyPayment: number,
  monthlyExpenses: number,
  existingLoanPayment: number = 0
): number {
  return monthlyIncome - (monthlyPayment + monthlyExpenses + existingLoanPayment);
}

/**
 * Assess loan affordability
 */
export function assessAffordability(dti: number): {
  isAffordable: boolean;
  risk: 'low' | 'medium' | 'high';
  message: string;
} {
  if (dti <= 40) {
    return {
      isAffordable: true,
      risk: 'low',
      message: 'Excellent financial position',
    };
  } else if (dti <= 60) {
    return {
      isAffordable: true,
      risk: 'medium',
      message: 'Moderate financial position',
    };
  } else {
    return {
      isAffordable: false,
      risk: 'high',
      message: 'High debt-to-income ratio',
    };
  }
}

/**
 * Validate South African ID number
 */
export function validateSAID(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  
  // Luhn algorithm for validation
  let sum = 0;
  let alternate = false;
  
  for (let i = id.length - 1; i >= 0; i--) {
    let n = parseInt(id.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (South African format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+27|0)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('27')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate color from string (for avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

/**
 * Check if file is valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Check if file is valid document
 */
export function isValidDocument(file: File): boolean {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type);
}

/**
 * Convert bytes to readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    DISBURSED: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  };
  return colors[status as keyof typeof colors] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
}

/**
 * Get risk level color
 */
export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };
  return colors[risk];
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}