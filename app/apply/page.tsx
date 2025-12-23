'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function LoanApplicationForm() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    alternativePhone: '',
    residentialAddress: '',
    city: '',
    postalCode: '',
    employmentType: 'SELF_EMPLOYED',
    employerName: '',
    employerAddress: '',
    monthlyIncome: '',
    employmentDuration: '',
    loanAmount: '',
    repaymentPeriod: '1',
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    averageMonthlyFuel: '',
    identificationType: 'NATIONAL_ID',
    identificationNumber: '',
    hasExistingLoans: false,
    existingLoanAmount: '',
    monthlyExpenses: '',
  });

  const [files, setFiles] = useState({
    idDocument: null as File | null,
    bankStatement: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idDocument' | 'bankStatement') => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fileType]: e.target.files![0] }));
    }
  };

  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) return { isValid: false, message: 'First name is required' };
        if (!formData.lastName.trim()) return { isValid: false, message: 'Last name is required' };
        if (!formData.dateOfBirth) return { isValid: false, message: 'Date of birth is required' };
        if (!formData.phoneNumber.trim()) return { isValid: false, message: 'Phone number is required' };
        if (!formData.residentialAddress.trim()) return { isValid: false, message: 'Residential address is required' };
        if (!formData.city.trim()) return { isValid: false, message: 'City is required' };
        if (!formData.postalCode.trim()) return { isValid: false, message: 'Postal code is required' };
        break;
      case 2:
        if (!formData.employmentType) return { isValid: false, message: 'Employment type is required' };
        if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
          return { isValid: false, message: 'Valid monthly income is required' };
        }
        if (!formData.employmentDuration || parseInt(formData.employmentDuration) <= 0) {
          return { isValid: false, message: 'Employment duration is required' };
        }
        if (!formData.monthlyExpenses || parseFloat(formData.monthlyExpenses) <= 0) {
          return { isValid: false, message: 'Monthly expenses are required' };
        }
        if (formData.hasExistingLoans && (!formData.existingLoanAmount || parseFloat(formData.existingLoanAmount) <= 0)) {
          return { isValid: false, message: 'Existing loan amount is required when you have existing loans' };
        }
        break;
      case 3:
        if (!formData.loanAmount || parseFloat(formData.loanAmount) < 500 || parseFloat(formData.loanAmount) > 2000) {
          return { isValid: false, message: 'Loan amount must be between R500 and R2,000' };
        }
        if (!formData.vehicleRegistration.trim()) return { isValid: false, message: 'Vehicle registration is required' };
        if (!formData.vehicleMake.trim()) return { isValid: false, message: 'Vehicle make is required' };
        if (!formData.vehicleModel.trim()) return { isValid: false, message: 'Vehicle model is required' };
        if (!formData.vehicleYear || parseInt(formData.vehicleYear) < 1900 || parseInt(formData.vehicleYear) > new Date().getFullYear() + 1) {
          return { isValid: false, message: 'Valid vehicle year is required' };
        }
        if (!formData.averageMonthlyFuel || parseFloat(formData.averageMonthlyFuel) <= 0) {
          return { isValid: false, message: 'Average monthly fuel spend is required' };
        }
        break;
      case 4:
        if (!formData.identificationNumber.trim()) return { isValid: false, message: 'Identification number is required' };
        if (!files.idDocument) return { isValid: false, message: 'ID document is required' };
        if (!files.bankStatement) return { isValid: false, message: 'Bank statement is required' };
        break;
    }
    return { isValid: true };
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'File upload failed' }));
      throw new Error(errorData.error || 'File upload failed');
    }
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      for (let step = 1; step <= 4; step++) {
        const validation = validateStep(step);
        if (!validation.isValid) {
          throw new Error(validation.message || `Please complete step ${step} correctly`);
        }
      }
      console.log('Uploading files...');
      const idDocumentUrl = await uploadFile(files.idDocument!);
      const bankStatementUrl = await uploadFile(files.bankStatement!);
      const applicationData = {
        ...formData,
        idDocumentUrl,
        bankStatementUrl,
        monthlyIncome: parseFloat(formData.monthlyIncome),
        loanAmount: parseFloat(formData.loanAmount),
        employmentDuration: parseInt(formData.employmentDuration),
        repaymentPeriod: parseInt(formData.repaymentPeriod),
        vehicleYear: parseInt(formData.vehicleYear),
        averageMonthlyFuel: parseFloat(formData.averageMonthlyFuel),
        existingLoanAmount: formData.existingLoanAmount ? parseFloat(formData.existingLoanAmount) : null,
        monthlyExpenses: parseFloat(formData.monthlyExpenses),
      };
      console.log('Submitting application:', applicationData);
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });
      const responseData = await response.json().catch(() => ({}));
      console.log('Server response:', responseData);
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Application submission failed');
      }
      alert('Application submitted successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error.message || 'Failed to submit application. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setError(validation.message || 'Please complete all required fields');
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Petrol Loan Application</h1>
        <p className="text-gray-600 mb-8">Complete the form below to apply for your petrol loan</p>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
        <div className="mb-8">
          <div className="flex justify-between">
            {['Personal Info', 'Employment', 'Loan & Vehicle', 'Documents'].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  idx < currentStep ? 'bg-blue-600 text-white' : idx === currentStep - 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-xs mt-2 ${idx < currentStep ? 'text-blue-600' : 'text-gray-500'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Phone</label>
                  <input type="tel" name="alternativePhone" value={formData.alternativePhone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Residential Address *</label>
                <input type="text" name="residentialAddress" value={formData.residentialAddress} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Employment Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (R) *</label>
                <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name *</label>
                <input type="text" name="employerName" value={formData.employerName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Duration (months) *</label>
                <input type="number" name="employmentDuration" value={formData.employmentDuration} onChange={handleInputChange} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer Address</label>
                <input type="text" name="employerAddress" value={formData.employerAddress} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses (R) *</label>
                <input type="number" name="monthlyExpenses" value={formData.monthlyExpenses} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-sm text-gray-500 mt-1">Include rent, utilities, groceries, etc.</p>
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="hasExistingLoans" checked={formData.hasExistingLoans} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-700">I have existing loans</label>
              </div>
              {formData.hasExistingLoans && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Existing Loan Amount (R) *</label>
                  <input type="number" name="existingLoanAmount" value={formData.existingLoanAmount} onChange={handleInputChange} required={formData.hasExistingLoans} min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Loan & Vehicle Details</h2>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🚗 Driver Fuel Loan</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (R) *</label>
                    <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange} required min="500" max="2000" step="50" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-sm text-gray-500 mt-1">Min: R500, Max: R2,000</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Period *</label>
                    <input type="text" value="30 Days" disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700" />
                    <p className="text-sm text-gray-500 mt-1">Single payment after 1 month</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm text-gray-600">Interest Rate: 10% flat rate</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">Total to Repay: R{formData.loanAmount ? (parseFloat(formData.loanAmount) * 1.10).toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6">Vehicle Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Registration *</label>
                <input type="text" name="vehicleRegistration" value={formData.vehicleRegistration} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make *</label>
                  <input type="text" name="vehicleMake" value={formData.vehicleMake} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model *</label>
                  <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Year *</label>
                  <input type="number" name="vehicleYear" value={formData.vehicleYear} onChange={handleInputChange} required min="1900" max={new Date().getFullYear() + 1} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Fuel Spend (R) *</label>
                  <input type="number" name="averageMonthlyFuel" value={formData.averageMonthlyFuel} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Documents & Identification</h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800"><strong>Important:</strong> Please ensure all documents are clear and legible. Accepted formats: PDF, JPG, PNG (Max 5MB per file)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identification Type *</label>
                <select name="identificationType" value={formData.identificationType} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identification Number *</label>
                <input type="text" name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Document *</label>
                <input type="file" onChange={(e) => handleFileChange(e, 'idDocument')} accept=".pdf,.jpg,.jpeg,.png" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {files.idDocument && <p className="text-sm text-green-600 mt-2">✓ {files.idDocument.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bank Statement (Last 3 months) *</label>
                <input type="file" onChange={(e) => handleFileChange(e, 'bankStatement')} accept=".pdf,.jpg,.jpeg,.png" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {files.bankStatement && <p className="text-sm text-green-600 mt-2">✓ {files.bankStatement.name}</p>}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-start">
                  <input type="checkbox" required className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1" />
                  <span className="ml-2 text-sm text-gray-700">I declare that all information provided is true and accurate. I understand that providing false information may result in the rejection of my application and potential legal action.</span>
                </label>
              </div>
            </div>
          )}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Previous</button>
            )}
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Next</button>
            ) : (
              <button type="submit" disabled={loading} className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{loading ? 'Submitting...' : 'Submit Application'}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}