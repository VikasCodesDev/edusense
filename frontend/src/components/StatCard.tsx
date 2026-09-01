'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number; // positive or negative percentage
  trendLabel?: string;
  progress?: number; // 0 - 100
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
  className?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  progress,
  color = 'indigo',
  className = ''
}: StatCardProps) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  return (
    <div className={`subtle-card subtle-card-hover rounded-xl p-5 relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress < 60 ? 'bg-rose-500' : progress < 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        {subtitle && <span>{subtitle}</span>}
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-1 font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            <span>{trend > 0 ? `+${trend}%` : `${trend}%`}</span>
            {trendLabel && <span className="text-slate-500 font-normal">({trendLabel})</span>}
          </div>
        )}
      </div>
    </div>
  );
}
