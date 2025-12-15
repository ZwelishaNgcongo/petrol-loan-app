'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, calculateMonthlyPayment, calculateTotalInterest } from '@/lib/utils';

export function LoanCalculator() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState(500);
  const repaymentPeriod = 1; // Fixed at 1 month (30 days)
  const interestRate = 10; // Fixed at 10% for the month

  const monthlyPayment = calculateMonthlyPayment(loanAmount, repaymentPeriod, interestRate / 100);
  const totalInterest = calculateTotalInterest(loanAmount, repaymentPeriod, interestRate / 100);
  const totalAmount = loanAmount + totalInterest;

  const handleApplyClick = () => {
    router.push('/sign-up');
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Uber Driver Fuel Loan Calculator
        </CardTitle>
        <CardDescription>
          Calculate your 30-day fuel loan payment - Perfect for Uber drivers!
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Loan Amount Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Loan Amount</label>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(loanAmount)}</span>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="100"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((loanAmount - 500) / (2000 - 500)) * 100}%, #dbeafe ${((loanAmount - 500) / (2000 - 500)) * 100}%, #dbeafe 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>R500</span>
            <span>R2,000</span>
          </div>
        </div>

        {/* Loan Terms Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Repayment Period</div>
            <div className="text-2xl font-bold text-blue-600">30 Days</div>
            <div className="text-xs text-gray-500 mt-1">Single payment</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-gray-600 mb-1">Interest Rate</div>
            <div className="text-2xl font-bold text-purple-600">{interestRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Flat rate</div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm scale-in">
            <div className="text-sm text-gray-600 mb-1">Total to Repay</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">After 30 days</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-sm text-gray-600 mb-1">Interest</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInterest)}</div>
            <div className="text-xs text-gray-500 mt-1">Total interest</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-sm text-gray-600 mb-1">Daily Cost</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalInterest / 30)}</div>
            <div className="text-xs text-gray-500 mt-1">Interest per day</div>
          </div>
        </div>

        {/* Payment Breakdown Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">Payment Breakdown</div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">Principal</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(loanAmount / totalAmount) * 100}%` }}
                />
              </div>
              <div className="w-24 text-sm font-semibold text-right text-blue-600">
                {formatCurrency(loanAmount)}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-600">Interest</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(totalInterest / totalAmount) * 100}%`, transitionDelay: '0.2s' }}
                />
              </div>
              <div className="w-24 text-sm font-semibold text-right text-green-600">
                {formatCurrency(totalInterest)}
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">🚗 Perfect for Uber Drivers</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Get fuel money instantly - keep driving without delays</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>30-day repayment period aligned with your earnings</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Only 10% interest - transparent and affordable</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No hidden fees or surprises</span>
            </li>
          </ul>
        </div>

        {/* Apply Button */}
        <Button 
          variant="gradient" 
          size="lg" 
          className="w-full"
          onClick={handleApplyClick}
        >
          Apply for This Loan
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}