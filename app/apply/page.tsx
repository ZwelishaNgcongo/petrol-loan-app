// app/apply/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function LoanApplicationForm() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    alternativePhone: '',
    residentialAddress: '',
    city: '',
    postalCode: '',
    
    // Employment Information
    employmentType: 'SELF_EMPLOYED', // Default for Uber drivers
    employerName: 'Uber',
    employerAddress: '',
    monthlyIncome: '',
    employmentDuration: '',
    
    // Loan Details
    loanAmount: '',
    repaymentPeriod: '1', // Fixed at 30 days (1 month)
    
    // Vehicle Information
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    averageMonthlyFuel: '',
    
    // Identification
    identificationType: 'NATIONAL_ID',
    identificationNumber: '',
    
    // Financial Information
    hasExistingLoans: false,
    existingLoanAmount: '',
    monthlyExpenses: '',
  });

  const [files, setFiles] = useState({
    idDocument: null as File | null,
    bankStatement: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload files first
      if (!files.idDocument || !files.bankStatement) {
        alert('Please upload both ID document and bank statement');
        setLoading(false);
        return;
      }

      const idDocumentUrl = await uploadFile(files.idDocument);
      const bankStatementUrl = await uploadFile(files.bankStatement);

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        throw new Error('Application submission failed');
      }

      alert('Application submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Petrol Loan Application</h1>
          <p className="text-gray-600 mb-8">Complete the form below to apply for your petrol loan</p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {['Personal Info', 'Employment', 'Loan & Vehicle', 'Documents'].map((step, idx) => (
                <div key={idx} className={`text-sm font-medium ${currentStep > idx ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alternative Phone</label>
                    <input
                      type="tel"
                      name="alternativePhone"
                      value={formData.alternativePhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Residential Address *</label>
                  <input
                    type="text"
                    name="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Employment Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Employment Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="SELF_EMPLOYED">Self Employed</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (R) *</label>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={formData.monthlyIncome}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name *</label>
                    <input
                      type="text"
                      name="employerName"
                      value={formData.employerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Duration (months) *</label>
                    <input
                      type="number"
                      name="employmentDuration"
                      value={formData.employmentDuration}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employer Address</label>
                  <input
                    type="text"
                    name="employerAddress"
                    value={formData.employerAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses (R) *</label>
                  <input
                    type="number"
                    name="monthlyExpenses"
                    value={formData.monthlyExpenses}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Include rent, utilities, groceries, etc.</p>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      name="hasExistingLoans"
                      checked={formData.hasExistingLoans}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      I have existing loans
                    </label>
                  </div>
                  
                  {formData.hasExistingLoans && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Existing Loan Amount (R) *</label>
                      <input
                        type="number"
                        name="existingLoanAmount"
                        value={formData.existingLoanAmount}
                        onChange={handleInputChange}
                        required={formData.hasExistingLoans}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Loan & Vehicle Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan & Vehicle Details</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">🚗 Uber Driver Fuel Loan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (R) *</label>
                      <input
                        type="number"
                        name="loanAmount"
                        value={formData.loanAmount}
                        onChange={handleInputChange}
                        required
                        min="500"
                        max="20000"
                        step="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Min: R500, Max: R20,000</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Period *</label>
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="text-2xl font-bold text-purple-600">30 Days</div>
                        <p className="text-xs text-gray-500">Single payment after 1 month</p>
                      </div>
                      <input type="hidden" name="repaymentPeriod" value="1" />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-bold text-blue-600">10% per annum</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Total to Repay:</span>
                      <span className="font-bold text-green-600">
                        R{formData.loanAmount ? (parseFloat(formData.loanAmount) * 1.00833).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Registration *</label>
                    <input
                      type="text"
                      name="vehicleRegistration"
                      value={formData.vehicleRegistration}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make *</label>
                    <input
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Toyota, BMW"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model *</label>
                    <input
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Corolla, 3 Series"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Year *</label>
                    <input
                      type="number"
                      name="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={handleInputChange}
                      required
                      min="1980"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Monthly Fuel Spend (R) *</label>
                    <input
                      type="number"
                      name="averageMonthlyFuel"
                      value={formData.averageMonthlyFuel}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents & Identification */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents & Identification</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please ensure all documents are clear and legible. 
                    Accepted formats: PDF, JPG, PNG (Max 5MB per file)
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Identification Type *</label>
                    <select
                      name="identificationType"
                      value={formData.identificationType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="NATIONAL_ID">National ID</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Identification Number *</label>
                    <input
                      type="text"
                      name="identificationNumber"
                      value={formData.identificationNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Document *</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'idDocument')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {files.idDocument && (
                      <p className="text-sm text-green-600 mt-1">✓ {files.idDocument.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bank Statement (Last 3 months) *</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'bankStatement')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {files.bankStatement && (
                      <p className="text-sm text-green-600 mt-1">✓ {files.bankStatement.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      I declare that all information provided is true and accurate. I understand that providing false 
                      information may result in the rejection of my application and potential legal action.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}