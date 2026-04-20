'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Subject } from '@/context/AppContext';

interface SubjectCardProps {
  subject: Subject;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export default function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedChapters = subject.chapters?.filter(c => c.completed).length ?? 0;
  const totalChapters = subject.chapters?.length ?? 0;

  // Focus the input when edit mode opens
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== subject.name) onEdit(subject.id, trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') { setEditName(subject.name); setEditing(false); }
  };

  return (
    <div className={`glass-card rounded-xl p-5 border border-white/5 group relative transition-all duration-200 ${editing ? 'border-indigo-500/40' : 'hover:border-indigo-500/25 card-hover'}`}>

      {/* ── Edit / Delete buttons (top-right, visible on hover or edit) ── */}
      {!editing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            id={`edit-subject-${subject.id}`}
            onClick={(e) => { e.preventDefault(); setEditing(true); }}
            title="Edit subject name"
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 flex items-center justify-center text-xs transition-all"
          >
            ✏️
          </button>
          <button
            id={`delete-subject-${subject.id}`}
            onClick={(e) => { e.preventDefault(); onDelete(subject.id); }}
            title="Delete subject"
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center text-xs transition-all"
          >
            🗑️
          </button>
        </div>
      )}

      {/* ── Icon ── */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color ?? 'from-indigo-500 to-purple-500'} flex items-center justify-center text-2xl mb-4 shadow-lg transition-transform duration-200 ${!editing ? 'group-hover:scale-110' : ''}`}>
        {subject.icon ?? '📖'}
      </div>

      {/* ── Name (or inline edit input) ── */}
      {editing ? (
        <div className="mb-1">
          <input
            ref={inputRef}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className="w-full bg-white/5 border border-indigo-500/40 text-white text-sm font-semibold rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
            maxLength={60}
          />
          <p className="text-xs text-slate-500 mt-1">Enter to save · Esc to cancel</p>
        </div>
      ) : (
        <Link href={`/subjects/${subject.id}`} className="block">
          <h3 className="text-white font-semibold text-sm mb-1 leading-tight group-hover:text-indigo-300 transition-colors duration-200 pr-14">
            {subject.name}
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            {completedChapters}/{totalChapters} chapters
          </p>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full bg-gradient-to-r ${subject.color ?? 'from-indigo-500 to-purple-500'} rounded-full transition-all duration-700`}
              style={{ width: `${subject.progress ?? 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{subject.progress ?? 0}% complete</span>
            <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              View →
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}