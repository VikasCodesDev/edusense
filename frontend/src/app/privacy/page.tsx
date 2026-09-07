import Link from 'next/link';

export default function PrivacyPage() {
  return <div className="max-w-3xl mx-auto px-4 py-12 space-y-5"><h1 className="text-3xl font-bold text-white">Privacy Policy</h1><p className="text-slate-300">EduSense uses account and academic information to provide authentication, academic dashboards, risk predictions, and recommendations.</p><p className="text-slate-300">Access to academic data is limited by the application&apos;s role-based permissions. Contact your institution&apos;s administrator with questions about retention or access.</p><Link href="/" className="text-indigo-400 hover:underline">Back to EduSense</Link></div>;
}
