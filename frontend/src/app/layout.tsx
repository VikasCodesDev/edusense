import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
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
          <footer className="border-t border-slate-800/80 bg-[#070a12] py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="font-semibold text-slate-300">EduSense</span>
                <span>•</span>
                <span>AI-Based Academic Risk Prediction & Personalized Learning System</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span>Aligned with SDG 4 (Quality Education)</span>
                <span>•</span>
                <span>Institutional Privacy & Security</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
