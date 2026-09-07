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
          <footer className="border-t border-slate-800/80 bg-[#070a12] py-12 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="space-y-3 lg:col-span-2"><p className="font-semibold text-xl text-slate-200">EduSense</p><p className="max-w-sm leading-relaxed">Academic intelligence for informed student support, risk awareness, and personalized learning.</p></div>
              <div className="space-y-3"><p className="font-semibold uppercase tracking-wider text-slate-300">Product / Platform</p><div className="flex flex-col gap-2"><Link href="/" className="hover:text-indigo-400">Home</Link><Link href="/login" className="hover:text-indigo-400">Sign in</Link></div></div>
              <div className="space-y-3"><p className="font-semibold uppercase tracking-wider text-slate-300">Legal</p><div className="flex flex-col gap-2"><Link href="/privacy" className="hover:text-indigo-400">Privacy Policy</Link><Link href="/terms" className="hover:text-indigo-400">Terms of Service</Link></div></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between gap-2"><span>© {new Date().getFullYear()} EduSense</span><span>Academic platform for responsible student support.</span></div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
