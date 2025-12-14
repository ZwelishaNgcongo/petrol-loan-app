import { SignOutButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Signing you out...</h2>
        <SignOutButton>
          <button className="px-6 py-3 bg-red-600 text-white rounded-lg">
            Click here if not redirected
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}