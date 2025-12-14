'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardNavbar() {
  const { user } = useUser();
  const pathname = usePathname();

  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 13.5V19H6v-7h6v1.5zm0-3.5H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-black">
                <span className="text-orange-500">FUEL</span>
                <span className="text-gray-900">FINANCE</span>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`font-semibold transition ${
                pathname === '/dashboard' 
                  ? 'text-orange-600' 
                  : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Dashboard
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                className={`font-semibold transition ${
                  pathname === '/admin' 
                    ? 'text-orange-600' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Admin Panel
              </Link>
            )}

            <Link 
              href="/apply" 
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
            >
              New Application
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {isAdmin ? (
                  <span className="text-orange-600 font-bold">ADMIN</span>
                ) : (
                  user?.primaryEmailAddress?.emailAddress
                )}
              </div>
            </div>
            
            {/* Clerk User Button (includes sign out) */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                }
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex gap-2">
          <Link 
            href="/dashboard" 
            className={`flex-1 text-center px-3 py-2 rounded-lg font-semibold text-sm transition ${
              pathname === '/dashboard'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Dashboard
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`flex-1 text-center px-3 py-2 rounded-lg font-semibold text-sm transition ${
                pathname === '/admin'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Admin
            </Link>
          )}

          <Link 
            href="/apply" 
            className="flex-1 text-center px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold text-sm"
          >
            Apply
          </Link>
        </div>
      </div>
    </nav>
  );
}