// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { DashboardNavbar } from '@/components/dashboard/Navbar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  loanAmount: number;
  monthlyIncome: number;
  monthlyPayment?: number;
  totalRepayment?: number;
  status: string;
  applicationDate: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
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
  user?: { email: string };
}

interface StatusHistoryRow {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  notes?: string | null;
  createdAt: string;
}

interface RepaymentRow {
  id: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidAt?: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function statusColor(status: string) {
  switch (status) {
    case 'PENDING':      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'APPROVED':     return 'bg-green-100 text-green-800 border-green-300';
    case 'REJECTED':     return 'bg-red-100 text-red-800 border-red-300';
    case 'DISBURSED':    return 'bg-purple-100 text-purple-800 border-purple-300';
    default:             return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function repaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':     return 'text-green-700 bg-green-50 border-green-200';
    case 'OVERDUE':  return 'text-red-700 bg-red-50 border-red-200';
    case 'PENDING':  return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    default:         return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

function fmtCurrency(n: number) {
  return `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// DocumentLink — mints a fresh signed URL on every click
// ---------------------------------------------------------------------------

function DocumentLink({ applicationId, which, label }: {
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
      if (!res.ok) throw new Error(data.error || 'Failed to load document');
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
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Loading…' : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status History Timeline
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
};

function StatusTimeline({ history }: { history: StatusHistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No status changes recorded yet — history is captured from this point forward.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-4 pl-6">
      {history.map((row, idx) => (
        <li key={row.id} className="relative">
          {/* dot */}
          <span className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
          <div className="text-sm">
            <p className="font-semibold text-gray-800">
              <span className={`px-2 py-0.5 rounded text-xs border mr-1 ${statusColor(row.fromStatus)}`}>
                {STATUS_LABELS[row.fromStatus] ?? row.fromStatus}
              </span>
              →
              <span className={`px-2 py-0.5 rounded text-xs border ml-1 ${statusColor(row.toStatus)}`}>
                {STATUS_LABELS[row.toStatus] ?? row.toStatus}
              </span>
            </p>
            <p className="text-gray-500 mt-0.5">{fmtDateTime(row.createdAt)}</p>
            {row.notes && (
              <p className="text-gray-600 mt-1 italic">"{row.notes}"</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Repayment Panel
// ---------------------------------------------------------------------------

function RepaymentPanel({ applicationId, onPaid }: { applicationId: string; onPaid: () => void }) {
  const [repayments, setRepayments] = useState<RepaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repayments?applicationId=${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        setRepayments(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [applicationId]);

  const handlePay = async (repaymentId: string) => {
    const rawAmount = amountInputs[repaymentId];
    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }
    setPayingId(repaymentId);
    try {
      const res = await fetch('/api/repayments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repaymentId, amountPaid: amount }),
      });
      if (res.ok) {
        await load();
        onPaid();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to record payment');
      }
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading repayments…</p>;

  if (repayments.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Repayment schedule is created automatically when the application is approved.
      </p>
    );
  }

  const totalDue  = repayments.reduce((s, r) => s + Number(r.amountDue), 0);
  const totalPaid = repayments.reduce((s, r) => s + Number(r.amountPaid), 0);
  const paidCount = repayments.filter(r => r.status === 'PAID').length;

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Total Due</p>
          <p className="font-bold text-gray-800">{fmtCurrency(totalDue)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="font-bold text-green-700">{fmtCurrency(totalPaid)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-gray-500">Instalments</p>
          <p className="font-bold text-blue-700">{paidCount} / {repayments.length} paid</p>
        </div>
      </div>

      {/* Repayment rows */}
      <div className="space-y-2">
        {repayments.map((r, idx) => (
          <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${repaymentStatusColor(r.status)}`}>
            <div className="flex-1">
              <p className="font-semibold">Instalment {idx + 1} — due {fmtDate(r.dueDate)}</p>
              <p className="text-xs mt-0.5">
                Due: {fmtCurrency(Number(r.amountDue))}
                {Number(r.amountPaid) > 0 && ` · Paid: ${fmtCurrency(Number(r.amountPaid))}`}
                {r.paidAt && ` · ${fmtDate(r.paidAt)}`}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${repaymentStatusColor(r.status)}`}>
                {r.status}
              </span>

              {r.status !== 'PAID' && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={amountInputs[r.id] ?? ''}
                    onChange={e => setAmountInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => handlePay(r.id)}
                    disabled={payingId === r.id}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {payingId === r.id ? '…' : 'Record'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Affordability calc (same logic as before)
// ---------------------------------------------------------------------------

function calcAffordability(app: Application) {
  const interestRate = 0.15;
  const totalInterest = Number(app.loanAmount) * (interestRate / 12) * app.repaymentPeriod;
  const totalAmount = Number(app.loanAmount) + totalInterest;
  const monthlyPayment = totalAmount / app.repaymentPeriod;
  const existingLoanPayment =
    app.hasExistingLoans && app.existingLoanAmount ? Number(app.existingLoanAmount) / 12 : 0;
  const totalMonthlyObligations = monthlyPayment + Number(app.monthlyExpenses) + existingLoanPayment;
  const disposableIncome = Number(app.monthlyIncome) - totalMonthlyObligations;
  const affordabilityRatio = (totalMonthlyObligations / Number(app.monthlyIncome)) * 100;
  return { monthlyPayment, disposableIncome, affordabilityRatio, isAffordable: affordabilityRatio <= 60 };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Status history & repayments loaded per-modal
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Which tab is active in the detail modal
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'repayments'>('details');

  useEffect(() => {
    if (isLoaded && user) checkUserRole();
  }, [isLoaded, user]);

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/user/role');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
        if (data.role !== 'ADMIN') { router.push('/dashboard'); return; }
        fetchApplications();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) setApplications(await res.json());
    } catch {
      console.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (app: Application) => {
    setSelectedApp(app);
    setAdminNotes(app.adminNotes ?? '');
    setRejectionReason(app.rejectionReason ?? '');
    setActiveTab('details');
    // Load status history
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/status-history?applicationId=${app.id}`);
      if (res.ok) setStatusHistory(await res.json());
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedApp(null);
    setStatusHistory([]);
  };

  const updateStatus = async (applicationId: string, status: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status,
          adminNotes: ['APPROVED', 'DISBURSED'].includes(status) ? adminNotes : undefined,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        alert(`Application ${status.toLowerCase().replace('_', ' ')} successfully!`);
        closeModal();
        setAdminNotes('');
        setRejectionReason('');
        fetchApplications();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update application status');
      }
    } catch {
      alert('Error updating application');
    }
  };

  const filteredApps = applications.filter(a => filter === 'ALL' || a.status === filter);

  const stats = {
    total:    applications.length,
    pending:  applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => ['APPROVED', 'DISBURSED'].includes(a.status)).length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (userRole && userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Applications', value: stats.total, color: 'text-gray-900' },
              { label: 'Pending Review',     value: stats.pending,  color: 'text-yellow-600' },
              { label: 'Approved',           value: stats.approved, color: 'text-green-600' },
              { label: 'Rejected',           value: stats.rejected, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">{s.label}</div>
                <div className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Applicant', 'Loan Amount', 'Income', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApps.map(app => {
                    const aff = calcAffordability(app);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</div>
                          <div className="text-sm text-gray-500">{app.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{fmtCurrency(app.loanAmount)}</div>
                          <div className="text-xs text-gray-500">{app.repaymentPeriod} month{app.repaymentPeriod !== 1 ? 's' : ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{fmtCurrency(app.monthlyIncome)}</div>
                          <div className={`text-xs ${aff.isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                            DTI: {aff.affordabilityRatio.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fmtDate(app.applicationDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button onClick={() => openModal(app)} className="text-blue-600 hover:text-blue-800 font-medium">
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredApps.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No applications found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          Review Modal
      ----------------------------------------------------------------------- */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedApp.firstName} {selectedApp.lastName}
                </h2>
                <p className="text-gray-600">{selectedApp.user?.email}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab bar */}
            <div className="sticky top-[88px] bg-white border-b border-gray-200 px-6 z-10">
              <nav className="flex gap-6">
                {(['details', 'history', 'repayments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 transition ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'details' ? 'Application Details' : tab === 'history' ? 'Status History' : 'Repayments'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 space-y-6">

              {/* ── Tab: Details ─────────────────────────────────────────── */}
              {activeTab === 'details' && (
                <>
                  {/* Affordability */}
                  {(() => {
                    const aff = calcAffordability(selectedApp);
                    return (
                      <div className={`p-4 rounded-lg border-2 ${aff.isAffordable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                        <h3 className="font-semibold text-lg mb-3">Affordability Analysis</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Monthly Payment</p>
                            <p className="text-lg font-bold">{fmtCurrency(aff.monthlyPayment)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Disposable Income</p>
                            <p className="text-lg font-bold">{fmtCurrency(aff.disposableIncome)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">DTI Ratio</p>
                            <p className="text-lg font-bold">{aff.affordabilityRatio.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Recommendation</p>
                            <p className={`text-lg font-bold ${aff.isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                              {aff.isAffordable ? '✓ Affordable' : '✗ High Risk'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Personal info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Phone:</span> {selectedApp.phoneNumber}</div>
                      <div><span className="font-medium">Employment:</span> {selectedApp.employmentType.replace('_', ' ')}</div>
                      <div><span className="font-medium">Monthly Income:</span> {fmtCurrency(selectedApp.monthlyIncome)}</div>
                      <div><span className="font-medium">Monthly Expenses:</span> {fmtCurrency(selectedApp.monthlyExpenses)}</div>
                      {selectedApp.hasExistingLoans && (
                        <div className="col-span-2">
                          <span className="font-medium">Existing Loans:</span>{' '}
                          {fmtCurrency(selectedApp.existingLoanAmount ?? 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle */}
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
                      <DocumentLink applicationId={selectedApp.id} which="id"   label="View ID Document" />
                      <DocumentLink applicationId={selectedApp.id} which="bank" label="View Bank Statement" />
                    </div>
                  </div>

                  {/* Admin actions */}
                  {(selectedApp.status === 'PENDING' || selectedApp.status === 'UNDER_REVIEW') && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-3">Update Application Status</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Admin Notes (for approval)</label>
                          <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter any notes for the applicant…"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                          <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            placeholder="Enter reason for rejection…"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => updateStatus(selectedApp.id, 'APPROVED')}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                            Approve
                          </button>
                          <button onClick={() => updateStatus(selectedApp.id, 'REJECTED')}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                            Reject
                          </button>
                          <button onClick={() => updateStatus(selectedApp.id, 'UNDER_REVIEW')}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                            Mark Under Review
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApp.status === 'APPROVED' && (
                    <div className="border-t pt-6">
                      <button onClick={() => updateStatus(selectedApp.id, 'DISBURSED')}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                        Mark as Disbursed
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Tab: Status History ──────────────────────────────────── */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Status Change History</h3>
                  {historyLoading
                    ? <p className="text-sm text-gray-500">Loading history…</p>
                    : <StatusTimeline history={statusHistory} />
                  }
                </div>
              )}

              {/* ── Tab: Repayments ──────────────────────────────────────── */}
              {activeTab === 'repayments' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Repayment Schedule</h3>
                  <RepaymentPanel
                    applicationId={selectedApp.id}
                    onPaid={fetchApplications}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}