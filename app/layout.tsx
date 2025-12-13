import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata = {
  title: 'FuelFinance - Petrol Loan Application',
  description: 'Fast and secure petrol loan financing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="smooth-scroll">
        <body className="antialiased">
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}