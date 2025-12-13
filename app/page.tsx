import React from 'react';
import { Fuel, Zap, Shield, Clock, TrendingUp, CheckCircle, ArrowRight, Calculator, FileText, CreditCard } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Petrol-themed with fuel pump imagery */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white">
        {/* Animated fuel drops background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-10 left-[10%] w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-20 left-[30%] w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-32 left-[60%] w-4 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-16 left-[80%] w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-40 left-[45%] w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8 animate-pulse">
              <Fuel className="w-4 h-4" />
              <span>Fuel Your Journey Today</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Fill Up Now,
              <br />
              <span className="text-yellow-300">Pay Later</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
              Get instant petrol loans from <strong>R500 to R50,000</strong>.
              <br />
              No queues. No stress. Just fuel and go.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="group px-8 py-5 bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-300 transition-all duration-300 text-lg font-bold shadow-2xl hover:shadow-yellow-400/50 hover:scale-105 flex items-center justify-center gap-2">
                Apply Now - It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="px-8 py-5 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-lg font-semibold">
                Calculate My Loan
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-white/90 text-sm md:text-base pt-6 border-t border-white/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-yellow-300" />
                <span className="font-medium">Instant Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-yellow-300" />
                <span className="font-medium">No Hidden Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-yellow-300" />
                <span className="font-medium">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* Features Section - Petrol-focused benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">FuelFinance</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We understand your fuel needs. Get money fast when you need it most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Zap className="w-10 h-10" />,
                title: 'Lightning Fast',
                description: 'Apply in 5 minutes. Get approved instantly. Money in your account within 24 hours.',
                gradient: 'from-yellow-400 to-orange-500',
                bg: 'bg-yellow-50',
                iconBg: 'bg-yellow-100 text-yellow-600',
              },
              {
                icon: <Fuel className="w-10 h-10" />,
                title: 'Fuel-Specific Loans',
                description: 'Designed specifically for petrol needs. From R500 to R50,000 with flexible repayment from 3-24 months.',
                gradient: 'from-green-400 to-emerald-500',
                bg: 'bg-green-50',
                iconBg: 'bg-green-100 text-green-600',
              },
              {
                icon: <Shield className="w-10 h-10" />,
                title: 'Secure & Safe',
                description: 'Bank-level encryption. Your personal and financial data is protected with military-grade security.',
                gradient: 'from-blue-400 to-purple-500',
                bg: 'bg-blue-50',
                iconBg: 'bg-blue-100 text-blue-600',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`group relative ${feature.bg} rounded-2xl p-8 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
              >
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${feature.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`${feature.iconBg} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-green-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Calculate Your Petrol Loan
            </h2>
            <p className="text-xl text-gray-600">
              See exactly how much you'll pay. No surprises, just transparency.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Loan Calculator</h3>
                <p className="text-gray-600">Adjust to see your monthly payment</p>
              </div>
            </div>

            {/* Simple Calculator Display */}
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Loan Amount</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    defaultValue="10000"
                    className="flex-1 h-3 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-2xl font-bold text-green-600 w-32 text-right">R 10,000</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Repayment Period</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="24"
                    step="1"
                    defaultValue="12"
                    className="flex-1 h-3 bg-teal-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-2xl font-bold text-teal-600 w-32 text-right">12 months</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Interest Rate (Annual)</span>
                  <span className="text-xl font-bold text-green-600">15%</span>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
                  <div className="text-3xl font-bold text-blue-600">R 1,125</div>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Total Interest</div>
                  <div className="text-3xl font-bold text-green-600">R 1,500</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Total Payable</div>
                  <div className="text-3xl font-bold text-purple-600">R 11,500</div>
                </div>
              </div>

              <button className="w-full py-5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2">
                Apply for This Loan
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Petrol themed */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Fueled in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600">
              From application to fuel pump in less than 24 hours
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: <FileText className="w-12 h-12" />,
                  title: 'Quick Application',
                  description: 'Fill out our simple online form. Takes less than 5 minutes. No paperwork hassle.',
                  color: 'from-blue-500 to-blue-600',
                },
                {
                  step: '02',
                  icon: <Clock className="w-12 h-12" />,
                  title: 'Instant Approval',
                  description: 'Our AI reviews your application instantly. Get approved in minutes, not days.',
                  color: 'from-green-500 to-green-600',
                },
                {
                  step: '03',
                  icon: <CreditCard className="w-12 h-12" />,
                  title: 'Money Deposited',
                  description: 'Funds transferred directly to your account within 24 hours. Fill up immediately!',
                  color: 'from-purple-500 to-purple-600',
                },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
                        {step.icon}
                      </div>
                      <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center font-bold text-gray-900 shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-12 -right-4 text-4xl text-green-400">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Fuel-themed */}
      <section className="relative py-24 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Fuel pump icons background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <Fuel className="absolute top-10 left-10 w-32 h-32 rotate-12" />
          <Fuel className="absolute bottom-10 right-20 w-40 h-40 -rotate-12" />
          <Fuel className="absolute top-1/2 left-1/3 w-24 h-24 rotate-45" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Fuel Your Journey?
            </h2>
            <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed">
              Join <strong>10,000+ drivers</strong> who never worry about fuel money again
            </p>
            <button className="inline-flex items-center gap-3 px-10 py-6 bg-yellow-400 text-gray-900 rounded-xl hover:bg-yellow-300 transition-all duration-300 text-xl font-bold shadow-2xl hover:shadow-yellow-400/50 hover:scale-110">
              <Fuel className="w-6 h-6" />
              Get Your Fuel Loan Now
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="mt-6 text-white/80 text-sm">
              ✓ No credit check required  ✓ Approval in minutes  ✓ Money in 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Fuel className="w-8 h-8 text-green-400" />
                <h3 className="text-2xl font-bold">FuelFinance</h3>
              </div>
              <p className="text-gray-400">Making petrol accessible to everyone, every day.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">Apply Now</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Calculator</a></li>
                <li><a href="#" className="hover:text-green-400 transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-green-400 transition">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-green-400 transition">Responsible Lending</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FuelFinance. All rights reserved. Fuel your dreams responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}