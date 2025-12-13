import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-2xl rounded-2xl border-2 border-white",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}