// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  loanAmount: number;
  status: string;
  applicationDate: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  repaymentPeriod: number;
  monthlyIncome: number;
}

export default function UserDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'DISBURSED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateMonthlyPayment = (loanAmount: number, period: number) => {
    // Simple interest calculation: 15% annual interest
    const interestRate = 0.15;
    const totalInterest = loanAmount * (interestRate / 12) * period;
    const totalAmount = loanAmount + totalInterest;
    return (totalAmount / period).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName || 'User'}!</h1>
              <p className="text-gray-600 mt-1">Manage your petrol loan applications</p>
            </div>
            <button
              onClick={() => router.push('/apply')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              New Application
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Total Applications</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {applications.filter(a => a.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Approved</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {applications.filter(a => a.status === 'APPROVED' || a.status === 'DISBURSED').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Rejected</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {applications.filter(a => a.status === 'REJECTED').length}
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Applications</h2>
          </div>
          
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new loan application.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/apply')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.firstName} {application.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Loan Amount</p>
                          <p className="text-lg font-semibold text-gray-900">R {application.loanAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Repayment Period</p>
                          <p className="text-lg font-semibold text-gray-900">{application.repaymentPeriod} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="text-lg font-semibold text-gray-900">
                            R {calculateMonthlyPayment(application.loanAmount, application.repaymentPeriod)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <span>Applied: {new Date(application.applicationDate).toLocaleDateString()}</span>
                        {application.reviewedAt && (
                          <span>Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Admin Notes or Rejection Reason */}
                      {application.status === 'REJECTED' && application.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{application.rejectionReason}</p>
                        </div>
                      )}

                      {application.status === 'APPROVED' && application.adminNotes && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Approval Notes:</p>
                          <p className="text-sm text-green-700 mt-1">{application.adminNotes}</p>
                        </div>
                      )}

                      {application.status === 'DISBURSED' && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">✓ Funds have been disbursed to your account</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}