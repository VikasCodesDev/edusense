import Link from 'next/link';

export default function TermsPage() {
  return <div className="max-w-3xl mx-auto px-4 py-12 space-y-5"><h1 className="text-3xl font-bold text-white">Terms of Service</h1><p className="text-slate-300">EduSense provides academic analytics and recommendations as decision-support tools. Institutions and authorized users remain responsible for reviewing information and making appropriate academic decisions.</p><p className="text-slate-300">Use the platform only with authorized account credentials and institution-approved academic data.</p><Link href="/" className="text-indigo-400 hover:underline">Back to EduSense</Link></div>;
}
