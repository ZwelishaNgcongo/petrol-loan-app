'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, calculateMonthlyPayment, calculateTotalInterest } from '@/lib/utils';

export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [repaymentPeriod, setRepaymentPeriod] = useState(12);
  const [interestRate] = useState(15); // Fixed 15% annual rate

  const monthlyPayment = calculateMonthlyPayment(loanAmount, repaymentPeriod, interestRate / 100);
  const totalInterest = calculateTotalInterest(loanAmount, repaymentPeriod, interestRate / 100);
  const totalAmount = loanAmount + totalInterest;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Loan Calculator
        </CardTitle>
        <CardDescription>
          Calculate your monthly payments and see the breakdown
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
            max="50000"
            step="500"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((loanAmount - 500) / (50000 - 500)) * 100}%, #dbeafe ${((loanAmount - 500) / (50000 - 500)) * 100}%, #dbeafe 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>R500</span>
            <span>R50,000</span>
          </div>
        </div>

        {/* Repayment Period Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Repayment Period</label>
            <span className="text-lg font-bold text-purple-600">{repaymentPeriod} months</span>
          </div>
          <input
            type="range"
            min="3"
            max="24"
            step="1"
            value={repaymentPeriod}
            onChange={(e) => setRepaymentPeriod(Number(e.target.value))}
            className="w-full h-3 bg-purple-100 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((repaymentPeriod - 3) / (24 - 3)) * 100}%, #f3e8ff ${((repaymentPeriod - 3) / (24 - 3)) * 100}%, #f3e8ff 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>3 months</span>
            <span>24 months</span>
          </div>
        </div>

        {/* Interest Rate Display */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Annual Interest Rate</span>
            <span className="text-xl font-bold gradient-text">{interestRate}%</span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm scale-in">
            <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyPayment)}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-sm text-gray-600 mb-1">Total Interest</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInterest)}</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-sm text-gray-600 mb-1">Total Payable</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalAmount)}</div>
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

        {/* Apply Button */}
        <Button variant="gradient" size="lg" className="w-full">
          Apply for This Loan
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}