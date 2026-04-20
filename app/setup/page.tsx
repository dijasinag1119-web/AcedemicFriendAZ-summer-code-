'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { BRANCHES, BRANCH_META } from '@/lib/academicData';

export default function SetupPage() {
  const { setBranch, setSemester, selectedBranch, selectedSemester, isLoggedIn } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<'branch' | 'semester'>('branch');
  const [localBranch, setLocalBranch] = useState(selectedBranch || '');
  const [localSem, setLocalSem] = useState(selectedSemester || 1);

  if (!isLoggedIn) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleBranchSelect = (branch: string) => {
    setLocalBranch(branch);
    setStep('semester');
  };

  const handleConfirm = () => {
    setBranch(localBranch);
    setSemester(localSem);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden flex flex-col">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-md">
          🎓
        </div>
        <span className="font-bold text-white text-lg">StudyArc</span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'branch' ? 'text-indigo-400' : 'text-emerald-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'branch' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {step === 'branch' ? '1' : '✓'}
              </div>
              Select Branch
            </div>
            <div className="flex-1 h-px bg-white/10 max-w-12" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step === 'semester' ? 'text-indigo-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'semester' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                2
              </div>
              Select Semester
            </div>
          </div>

          {step === 'branch' && (
            <div className="animate-fade-up">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  What&apos;s your branch? 🎓
                </h1>
                <p className="text-slate-400 text-sm">Choose your engineering branch to get started</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {BRANCHES.map(branch => {
                  const meta = BRANCH_META[branch];
                  return (
                    <button
                      key={branch}
                      id={`branch-${branch.replace(/\W/g, '-')}`}
                      onClick={() => handleBranchSelect(branch)}
                      className={`glass-card rounded-xl p-4 text-left transition-all duration-200 border group hover:border-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] ${
                        localBranch === branch ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                        {meta.icon}
                      </div>
                      <p className="text-white text-xs font-semibold leading-tight">{branch}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'semester' && (
            <div className="animate-fade-up">
              <button
                onClick={() => setStep('branch')}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Change branch
              </button>

              {/* Selected branch badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${BRANCH_META[localBranch]?.color} flex items-center justify-center text-xl shadow-md`}>
                  {BRANCH_META[localBranch]?.icon}
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Selected branch</p>
                  <p className="text-white font-bold">{localBranch}</p>
                </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Which semester? 📚
                </h1>
                <p className="text-slate-400 text-sm">You can switch semesters anytime later</p>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                  <button
                    key={sem}
                    id={`sem-${sem}`}
                    onClick={() => setLocalSem(sem)}
                    className={`glass-card rounded-xl py-4 px-2 text-center transition-all duration-200 border group hover:border-indigo-500/40 hover:scale-[1.03] active:scale-[0.98] ${
                      localSem === sem
                        ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                        : 'border-white/5 text-slate-300'
                    }`}
                  >
                    <span className="text-lg font-bold block">S{sem}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block">Sem {sem}</span>
                  </button>
                ))}
              </div>

              <button
                id="setup-confirm-btn"
                onClick={handleConfirm}
                className="w-full btn-primary text-white font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2"
              >
                🚀 Let&apos;s Start Studying!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
