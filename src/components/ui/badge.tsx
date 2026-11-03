import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'theory' | 'lab' | 'joint' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variants = {
    default: 'border-transparent bg-blue-600 text-white shadow-xs',
    secondary: 'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
    destructive: 'border-transparent bg-red-100 text-red-700 border-red-200',
    outline: 'border-slate-200 text-slate-700 bg-white',
    theory: 'border-amber-200 bg-amber-50 text-amber-800 font-mono',
    lab: 'border-emerald-200 bg-emerald-50 text-emerald-800 font-mono',
    joint: 'border-purple-200 bg-purple-50 text-purple-800 font-mono',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
}
