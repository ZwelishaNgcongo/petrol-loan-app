import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LoanCalculator } from '@/components/ui/LoanCalculator';

export default async function LandingPage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <>
      {/* Load fonts via HTML instead of CSS */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" 
        rel="stylesheet" 
      />
      
      <div className="min-h-screen bg-white">
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Petrol Pump Icon */}
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="url(#fuel-gradient)"/>
                  <defs>
                    <linearGradient id="fuel-gradient" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF6B00"/>
                      <stop offset="1" stopColor="#FF8C00"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-2xl font-bold text-gray-900">FuelFinance</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#calculator" className="text-gray-700 hover:text-orange-600 font-semibold transition uppercase text-sm tracking-wide">
                  Calculator
                </a>
                <a href="#how-it-works" className="text-gray-700 hover:text-orange-600 font-semibold transition uppercase text-sm tracking-wide">
                  How It Works
                </a>
                <Link href="/sign-in" className="text-gray-700 hover:text-orange-600 font-semibold transition uppercase text-sm tracking-wide">
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-bold text-sm tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all uppercase"
                >
                  Fuel Up Now
                </Link>
              </div>
              
              <div className="md:hidden flex gap-2">
                <Link href="/sign-in" className="px-4 py-2 text-gray-700 font-semibold text-sm">
                  Sign In
                </Link>
                <Link href="/sign-up" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-bold text-sm">
                  Apply
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-gray-50 to-white">
          {/* Subtle Petrol Pump Icons in Background */}
          <div className="absolute inset-0 overflow-hidden opacity-5">
            <svg className="absolute top-20 left-10 w-64 h-64 text-orange-500" style={{ animation: 'pulse 6s ease-in-out infinite' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
            <svg className="absolute bottom-20 right-10 w-72 h-72 text-orange-500" style={{ animation: 'pulse 8s ease-in-out infinite' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          </div>

          <div className="relative container mx-auto px-6 py-20 z-10">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-50 border border-orange-200 mb-8">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#FF6B00"/>
                </svg>
                <span className="text-orange-600 font-bold text-sm uppercase tracking-wider">Premium Fuel Financing</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight tracking-tight">
                <span className="text-gray-900">FUEL</span>
                <br />
                <span className="text-gray-900">YOUR</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">DRIVE</span>
              </h1>
              
              <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent mb-8"></div>
              
              <p className="text-2xl md:text-3xl text-gray-700 font-semibold mb-4 uppercase tracking-wide">
                Instant Petrol Loans for Uber Drivers
              </p>
              
              <p className="text-xl text-orange-600 font-bold mb-12 uppercase tracking-wide">
                R500 - R20,000 • 30 Days • Only 10% Interest
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <Link
                  href="/sign-up"
                  className="px-10 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all uppercase tracking-wide"
                >
                  Apply in 30 Seconds →
                </Link>
                
                <Link
                  href="/sign-in"
                  className="px-10 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold text-lg hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-wide"
                >
                  Dashboard
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">30s</div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Approval</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">24h</div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Funded</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">10%</div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Interest</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                Premium Features
              </h2>
              <p className="text-xl text-gray-600 uppercase tracking-wide">
                High-Octane Financing for Uber Drivers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: 'Instant Fuel',
                  description: 'Get approved in 30 seconds. Money in your account within 24 hours. No waiting, no delays.',
                  icon: '⚡',
                  stat: '30s',
                  statLabel: 'Approval Time'
                },
                {
                  title: 'Flat 10% Rate',
                  description: 'Transparent pricing. No hidden fees. Borrow R500-R20,000 for 30 days. Simple and honest.',
                  icon: '💰',
                  stat: '10%',
                  statLabel: 'Interest Only'
                },
                {
                  title: 'Zero Stress',
                  description: 'Bank-level encryption. Secure uploads. Protected data. Your information is completely safe.',
                  icon: '🔒',
                  stat: '256-bit',
                  statLabel: 'Encryption'
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-8 border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <div className="text-4xl font-black text-orange-600 mb-1">{feature.stat}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-6 font-bold">{feature.statLabel}</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-wide">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: '85%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section id="calculator" className="py-20 bg-gray-50 scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                Fuel Calculator
              </h2>
              <p className="text-xl text-gray-600 uppercase tracking-wide">
                Calculate Your Payback in Real-Time
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 shadow-lg">
                <LoanCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-white scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                3-Step Refuel
              </h2>
              <p className="text-xl text-gray-600 uppercase tracking-wide">
                From Empty to Full in Minutes
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    step: '01',
                    title: 'Register',
                    description: 'Create your account in 30 seconds. Email only. No paperwork. No hassle.',
                    icon: '📝',
                  },
                  {
                    step: '02',
                    title: 'Verify',
                    description: 'Upload your Uber profile and bank statements. Takes 2 minutes. Secure and encrypted.',
                    icon: '📤',
                  },
                  {
                    step: '03',
                    title: 'Fuel Up',
                    description: 'Instant approval. Money in 24 hours. Hit the road immediately. Start earning.',
                    icon: '⛽',
                  },
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-4xl">
                          {step.icon}
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-4 border-white">
                          <span className="font-black text-white text-lg">{step.step}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3 text-center uppercase tracking-wide">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-center leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600" style={{ width: `${(idx + 1) * 33}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 relative overflow-hidden">
          {/* Subtle pump icon */}
          <svg className="absolute top-10 right-10 w-64 h-64 text-white opacity-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
          
          <div className="relative container mx-auto px-6 text-center z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">
                Ready to Fuel Up?
              </h2>
              <p className="text-2xl text-white/95 font-bold mb-12 uppercase tracking-wide">
                Join Thousands of Uber Drivers Who Never Run on Empty
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Link
                  href="/sign-up"
                  className="px-12 py-5 bg-white text-orange-600 rounded-xl font-black text-xl tracking-wide hover:scale-105 transition-all uppercase"
                >
                  Get Fuel Now →
                </Link>
                
                <a
                  href="#calculator"
                  className="px-12 py-5 bg-transparent border-2 border-white text-white rounded-xl font-black text-xl tracking-wide hover:bg-white hover:text-orange-600 transition-all uppercase"
                >
                  Calculate Loan
                </a>
              </div>
              
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-white/30">
                {[
                  { value: '5,000+', label: 'Drivers Funded' },
                  { value: 'R50M+', label: 'Fuel Financed' },
                  { value: '99.9%', label: 'Approval Rate' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-4xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-sm font-bold text-white/90 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#FF6B00"/>
                  </svg>
                  <span className="text-xl font-bold text-white">FuelFinance</span>
                </div>
                <p className="text-sm">Premium fuel financing for Uber drivers.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/sign-up" className="hover:text-white transition">Apply Now</Link></li>
                  <li><Link href="/sign-in" className="hover:text-white transition">Dashboard</Link></li>
                  <li><a href="#calculator" className="hover:text-white transition">Calculator</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition">Careers</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-white mb-4 uppercase tracking-wide text-sm">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              <p>© 2024 FuelFinance. All rights reserved. • Powered by Premium Fuel Technology</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}