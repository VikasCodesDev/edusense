'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  History,
  Users,
  Database,
  Cpu,
  LogOut,
  ChevronDown,
  UserCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchDemoAccount } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  const studentLinks = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/performance', label: 'Performance', icon: BarChart3 },
    { href: '/student/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/student/risk-analysis', label: 'Risk Analysis', icon: AlertTriangle },
    { href: '/student/recommendations', label: 'AI Guidance', icon: Lightbulb },
    { href: '/student/progress', label: 'Progress', icon: History },
  ];

  const facultyLinks = [
    { href: '/faculty/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/faculty/dashboard#students', label: 'Students Directory', icon: Users },
    { href: '/faculty/analytics', label: 'Cohort Analytics', icon: BarChart3 },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/data-import', label: 'Data Ingestion', icon: Database },
    { href: '/admin/model-management', label: 'ML Model Hub', icon: Cpu },
    { href: '/admin/users', label: 'Accounts', icon: Users },
  ];

  const currentLinks = isStudent ? studentLinks : isFaculty ? facultyLinks : isAdmin ? adminLinks : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:bg-indigo-500 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  EduSense
                </span>
                <span className="text-[10px] -mt-1 font-mono uppercase tracking-widest text-slate-400">
                  Academic Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                {currentLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Controls: Demo Switcher + Profile/Auth */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setDemoOpen(!demoOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Demo Switcher</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {demoOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-[#101726] border border-slate-700/80 shadow-2xl py-2 z-50 text-xs text-slate-300 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setDemoOpen(false)}
                >
                  <div className="px-3 py-1.5 font-semibold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => {
                      switchDemoAccount('student', 'student1@edusense.edu');
                      setDemoOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">Rahul Sharma</p>
                      <p className="text-[11px] text-slate-400">Student (High Risk • DSA Weak)</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  </button>

                  <button
                    onClick={() => {
                      switchDemoAccount('student', 'student2@edusense.edu');
                      setDemoOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">Priya Patel</p>
                      <p className="text-[11px] text-slate-400">Student (Moderate Risk • Maths Weak)</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </button>

                  <button
                    onClick={() => {
                      switchDemoAccount('student', 'student3@edusense.edu');
                      setDemoOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">Aarav Gupta</p>
                      <p className="text-[11px] text-slate-400">Student (Low Risk • 92% Avg)</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      switchDemoAccount('faculty');
                      setDemoOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">Prof. Sunita Rao</p>
                      <p className="text-[11px] text-slate-400">Faculty (CSE Dept Coordinator)</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">Faculty</span>
                  </button>

                  <button
                    onClick={() => {
                      switchDemoAccount('admin');
                      setDemoOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">System Administrator</p>
                      <p className="text-[11px] text-slate-400">Admin (Data Ingestion & ML Hub)</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Session Info or Login CTA */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {user && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            {currentLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
                    isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
