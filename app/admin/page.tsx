// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  loanAmount: number;
  monthlyIncome: number;
  status: string;
  applicationDate: string;
  employmentType: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  repaymentPeriod: number;
  idDocumentUrl: string;
  bankStatementUrl: string;
  hasExistingLoans: boolean;
  existingLoanAmount?: number;
  monthlyExpenses: number;
  user?: {
    email: string;
  };
}

function DocumentLink({
  applicationId,
  which,
  label,
}: {
  applicationId: string;
  which: 'id' | 'bank';
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents?applicationId=${applicationId}&which=${which}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load document');
      }
      // Open in a new tab. The URL expires in 5 minutes, so we mint it
      // fresh on every click rather than caching it anywhere.
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
      >
        {loading ? 'Loading...' : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

import { DashboardNavbar } from '@/components/dashboard/Navbar';

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      // Check user role from public metadata
      checkUserRole();
    }
  }, [isLoaded, user]);

  const checkUserRole = async () => {
    try {
      console.log('🔍 [ADMIN] Checking user role...');
      const response = await fetch('/api/user/role');
      console.log('📡 [ADMIN] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ADMIN] User data received:', data);
        console.log('🎯 [ADMIN] User role is:', data.role);
        setUserRole(data.role);
        
        // If not admin, redirect to user dashboard
        if (data.role !== 'ADMIN') {
          console.log('❌ [ADMIN] User is NOT admin - Redirecting to /dashboard...');
          router.push('/dashboard');
          return;
        }
        
        console.log('✅ [ADMIN] User is admin - Fetching all applications...');
        // If admin, fetch applications
        fetchApplications();
      } else {
        console.error('❌ [ADMIN] Response not OK:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('[ADMIN] Error details:', errorData);
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 [ADMIN] Error checking user role:', error);
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // Your existing /api/applications route already handles role-based filtering
      // Admins will get ALL applications, users will get only their own
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

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status,
          adminNotes: status === 'APPROVED' || status === 'DISBURSED' ? adminNotes : undefined,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        alert(`Application ${status.toLowerCase()} successfully!`);
        setSelectedApp(null);
        setAdminNotes('');
        setRejectionReason('');
        fetchApplications();
      } else {
        alert('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application');
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

  const calculateAffordability = (app: Application) => {
    const interestRate = 0.15;
    const totalInterest = Number(app.loanAmount) * (interestRate / 12) * app.repaymentPeriod;
    const totalAmount = Number(app.loanAmount) + totalInterest;
    const monthlyPayment = totalAmount / app.repaymentPeriod;
    
    const existingLoanPayment = app.hasExistingLoans && app.existingLoanAmount 
      ? Number(app.existingLoanAmount) / 12 
      : 0;
    
    const totalMonthlyObligations = monthlyPayment + Number(app.monthlyExpenses) + existingLoanPayment;
    const disposableIncome = Number(app.monthlyIncome) - totalMonthlyObligations;
    const affordabilityRatio = (totalMonthlyObligations / Number(app.monthlyIncome)) * 100;

    return {
      monthlyPayment,
      disposableIncome,
      affordabilityRatio,
      isAffordable: affordabilityRatio <= 60, // 60% debt-to-income ratio threshold
    };
  };

  const filteredApplications = applications.filter(app => 
    filter === 'ALL' || app.status === filter
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => a.status === 'APPROVED' || a.status === 'DISBURSED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // If not admin, show access denied while redirecting
  if (userRole && userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8 text-white">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 opacity-90">Manage all loan applications</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Applications</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Pending Review</div>
              <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Approved</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Rejected</div>
              <div className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Income
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => {
                    const affordability = calculateAffordability(app);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {app.firstName} {app.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{app.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">R {Number(app.loanAmount).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{app.repaymentPeriod} months</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">R {Number(app.monthlyIncome).toLocaleString()}</div>
                          <div className={`text-xs ${affordability.isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                            DTI: {affordability.affordabilityRatio.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.applicationDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No applications found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedApp.firstName} {selectedApp.lastName}
                </h2>
                <p className="text-gray-600">{selectedApp.user?.email}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Affordability Analysis */}
              {(() => {
                const affordability = calculateAffordability(selectedApp);
                return (
                  <div className={`p-4 rounded-lg border-2 ${affordability.isAffordable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <h3 className="font-semibold text-lg mb-3">Affordability Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Monthly Payment</p>
                        <p className="text-lg font-bold">R {affordability.monthlyPayment.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Disposable Income</p>
                        <p className="text-lg font-bold">R {affordability.disposableIncome.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">DTI Ratio</p>
                        <p className="text-lg font-bold">{affordability.affordabilityRatio.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Recommendation</p>
                        <p className={`text-lg font-bold ${affordability.isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                          {affordability.isAffordable ? '✓ Affordable' : '✗ High Risk'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Phone:</span> {selectedApp.phoneNumber}</div>
                  <div><span className="font-medium">Employment:</span> {selectedApp.employmentType.replace('_', ' ')}</div>
                  <div><span className="font-medium">Monthly Income:</span> R {Number(selectedApp.monthlyIncome).toLocaleString()}</div>
                  <div><span className="font-medium">Monthly Expenses:</span> R {Number(selectedApp.monthlyExpenses).toLocaleString()}</div>
                  {selectedApp.hasExistingLoans && (
                    <div className="col-span-2">
                      <span className="font-medium">Existing Loans:</span> R {selectedApp.existingLoanAmount ? Number(selectedApp.existingLoanAmount).toLocaleString() : 0}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Registration:</span> {selectedApp.vehicleRegistration}</div>
                  <div><span className="font-medium">Vehicle:</span> {selectedApp.vehicleMake} {selectedApp.vehicleModel}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Documents</h3>
                <div className="flex gap-4">
                  <div>
                  <h3 className="font-semibold text-lg mb-3">Documents</h3>
                  <div className="flex gap-4">
                  <DocumentLink applicationId={selectedApp.id} which="id" label="View ID Document" />
                  <DocumentLink applicationId={selectedApp.id} which="bank" label="View Bank Statement" />
                </div>
               </div>
                </div>
              </div>

              {/* Admin Actions */}
              {selectedApp.status === 'PENDING' || selectedApp.status === 'UNDER_REVIEW' ? (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-3">Update Application Status</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Admin Notes (for approval)</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter any notes for the applicant..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter reason for rejection..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => updateApplicationStatus(selectedApp.id, 'APPROVED')}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(selectedApp.id, 'REJECTED')}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(selectedApp.id, 'UNDER_REVIEW')}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Mark Under Review
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedApp.status === 'APPROVED' ? (
                <div className="border-t pt-6">
                  <button
                    onClick={() => updateApplicationStatus(selectedApp.id, 'DISBURSED')}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    Mark as Disbursed
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}