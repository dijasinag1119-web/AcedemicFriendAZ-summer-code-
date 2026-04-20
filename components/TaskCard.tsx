'use client';

import { useState } from 'react';
import { Task } from '@/context/AppContext';

interface TaskCardProps {
  task: Task;
  onComplete: (id: number) => void;
}

const subjectColors: Record<string, string> = {
  DSA:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  DBMS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  OS:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CN:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export default function TaskCard({ task, onComplete }: TaskCardProps) {
  const [checking, setChecking] = useState(false);

  const handleComplete = () => {
    if (task.completed || checking) return;
    setChecking(true);
    setTimeout(() => {
      onComplete(task.id);
      setChecking(false);
    }, 300);
  };

  return (
    <div
      className={`glass-card rounded-xl p-4 card-hover transition-all duration-300 ${
        task.completed ? 'opacity-60 border-white/5' : 'glow-border'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          id={`task-checkbox-${task.id}`}
          onClick={handleComplete}
          disabled={task.completed}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 scale-[1.1]'
              : checking
              ? 'border-indigo-400 bg-indigo-400/20 animate-pulse'
              : 'border-white/20 hover:border-indigo-400 hover:bg-indigo-500/10 cursor-pointer'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                subjectColors[task.subject] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}
            >
              {task.subject}
            </span>
            {task.completed && (
              <span className="text-xs text-emerald-400 font-medium">✓ Done</span>
            )}
          </div>

          <h3 className={`font-semibold text-sm mb-1 ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
            {task.title}
          </h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">{task.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <span>⏱</span>
              <span>{task.timeEstimate}</span>
            </div>
            {!task.completed && (
              <div className="text-xs text-indigo-400 font-medium">+10 XP</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
