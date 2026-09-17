import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SplashWrapper from '@/components/SplashWrapper';

export const metadata: Metadata = {
  title: 'MediVerify – Fake Medicine Detection & Verification System',
  description:
    'Verify medicine authenticity, detect fake drugs, and report suspicious medicines to protect public health.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <SplashWrapper>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SplashWrapper>
      </body>
    </html>
  );
}
