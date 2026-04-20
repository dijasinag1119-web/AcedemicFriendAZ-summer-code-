'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  label: string;
  percentage: number;
  icon?: string;
  color?: string;
  delay?: number;
}

export default function ProgressBar({ label, percentage, icon = '📖', color = 'from-indigo-500 to-purple-500', delay = 0 }: ProgressBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, delay + 100);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const getColor = () => {
    if (percentage >= 70) return 'from-emerald-500 to-teal-400';
    if (percentage >= 40) return 'from-indigo-500 to-purple-500';
    return 'from-orange-500 to-pink-500';
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-white">{percentage}%</span>
      </div>

      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
