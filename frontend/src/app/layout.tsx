import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EduSense | AI Academic Risk Prediction & Personalized Learning',
  description: 'Full-stack AI/ML-powered academic intelligence platform combining multi-dimensional student performance analytics, machine learning risk detection, and LLM-guided personalized intervention.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-[#070a12] py-10 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-2 space-y-2">
                <p className="font-semibold text-lg text-slate-200">EduSense</p>
                <p className="max-w-sm">Academic intelligence for informed student support, risk awareness, and personalized learning.</p>
              </div>
              <div className="space-y-3">
                <p className="font-semibold uppercase tracking-wider text-slate-300">Platform</p>
                <div className="flex flex-col gap-2"><Link href="/" className="hover:text-indigo-400">Home</Link><Link href="/login" className="hover:text-indigo-400">Sign in</Link></div>
              </div>
              <div className="space-y-3">
                <p className="font-semibold uppercase tracking-wider text-slate-300">Support & Legal</p>
                <div className="flex flex-col gap-2"><Link href="/report-bug" className="hover:text-indigo-400">Report a Bug</Link><Link href="/privacy" className="hover:text-indigo-400">Privacy Policy</Link><Link href="/terms" className="hover:text-indigo-400">Terms of Service</Link></div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between gap-2">
              <span>© {new Date().getFullYear()} EduSense</span><span>Academic platform for responsible student support.</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
