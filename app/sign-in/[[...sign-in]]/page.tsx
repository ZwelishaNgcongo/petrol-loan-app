import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-2xl rounded-2xl border-2 border-white",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
              }
            }}
            // Enable password reset in the sign-in flow
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
        
        {/* Additional help text */}
        <div className="text-center mt-6 text-sm text-gray-600 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p>Forgot your password? Click "Forgot password?" above to reset it via email.</p>
        </div>
      </div>
    </div>
  );
}