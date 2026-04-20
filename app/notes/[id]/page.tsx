'use client';
// app/notes/[id]/page.tsx — Note editor with markdown preview and auto-save
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import { getNotes, setNote, deleteNote } from '@/lib/firestore';
import { Trash2, Eye, Edit3, ArrowLeft, Zap } from 'lucide-react';

const SUB_OPTIONS = ['general','dsa','dbms','os','cn','se','maths'];
const SUB_COLORS: Record<string,string> = { dsa:'#6366f1', dbms:'#8b5cf6', os:'#06b6d4', cn:'#10b981', se:'#f59e0b', maths:'#f43f5e', general:'#94a3b8' };

// Basic markdown renderer (no external lib needed)
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)/gm, '<h3 style="font-size:16px;font-weight:700;color:var(--text);margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)/gm,  '<h2 style="font-size:20px;font-weight:700;color:var(--text);margin:20px 0 10px">$1</h2>')
    .replace(/^# (.+)/gm,   '<h1 style="font-size:24px;font-weight:800;color:var(--text);margin:24px 0 12px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:rgba(99,102,241,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px">$1</code>')
    .replace(/^- (.+)/gm,      '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/\n/g,            '<br/>');
}

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { userData } = useAuth();
  const { addToast } = useAppContext();
  const router = useRouter();

  const [note,     setNoteData]  = useState<any>(null);
  const [loading,  setLoading]   = useState(true);
  const [mode,     setMode]      = useState<'edit'|'preview'>('edit');
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'>('idle');
  const [showDelete, setShowDelete] = useState(false);

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const uid = userData?.uid;

  useEffect(() => {
    if (!uid || !id) return;
    loadNote();
  }, [uid, id]);

  const loadNote = async () => {
    if (!uid) return;
    try {
      const all = await getNotes(uid) as any[];
      const n   = all.find((n: any) => n.id === id);
      setNoteData(n || null);
    } catch { addToast('Failed to load note', 'error'); }
    finally { setLoading(false); }
  };

  const handleChange = (field: string, value: string) => {
    setNoteData((prev: any) => prev ? { ...prev, [field]: value } : null);
    setSaveState('saving');

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      if (!uid || !note) return;
      try {
        await setNote(uid, id as string, { ...note, [field]: value });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch { addToast('Auto-save failed', 'error'); setSaveState('idle'); }
    }, 3000);
  };

  const handleDelete = async () => {
    if (!uid) return;
    try {
      await deleteNote(uid, id as string);
      addToast('Note deleted', 'info');
      router.push('/notes');
    } catch { addToast('Failed to delete note', 'error'); }
  };

  if (loading) return (
    <PageWrapper breadcrumb="Note">
      <div style={{ height: '400px', borderRadius: '16px' }} className="skeleton" />
    </PageWrapper>
  );

  if (!note) return (
    <PageWrapper breadcrumb="Note">
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Note not found.</p>
        <button onClick={() => router.push('/notes')} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', marginTop: '16px', fontSize: '14px' }}>
          ← Back to Notes
        </button>
      </div>
    </PageWrapper>
  );

  const color = SUB_COLORS[note.subjectId] || '#94a3b8';

  const lastSaved = note.updatedAt ? (() => {
    const diff = Math.floor((Date.now() - new Date(note.updatedAt).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  })() : '';

  return (
    <PageWrapper breadcrumb={note.title}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/notes')} className="btn-ghost" style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ flex: 1 }} />

        {/* Save state */}
        <span style={{
          fontSize: '12px', fontWeight: 600,
          color: saveState === 'saving' ? '#f59e0b' : saveState === 'saved' ? '#10b981' : 'var(--text-dim)',
        }}>
          {saveState === 'saving' ? '● Saving...' : saveState === 'saved' ? '✓ Saved' : `Last saved ${lastSaved}`}
        </span>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
          <button onClick={() => setMode('edit')} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
            display: 'flex', alignItems: 'center', gap: '5px',
            background: mode === 'edit' ? '#6366f1' : 'transparent',
            color: mode === 'edit' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
          }}>
            <Edit3 size={14} /> Edit
          </button>
          <button onClick={() => setMode('preview')} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
            display: 'flex', alignItems: 'center', gap: '5px',
            background: mode === 'preview' ? '#6366f1' : 'transparent',
            color: mode === 'preview' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
          }}>
            <Eye size={14} /> Preview
          </button>
        </div>

        {/* Delete */}
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="btn-ghost" style={{ padding: '8px', borderRadius: '10px', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', display: 'flex' }}>
            <Trash2 size={15} />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleDelete} style={{ padding: '7px 14px', borderRadius: '10px', background: '#f43f5e', color: 'white', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              Confirm Delete
            </button>
            <button onClick={() => setShowDelete(false)} className="btn-ghost" style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '12px' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Note card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        {/* Note header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '6px', height: '48px', borderRadius: '3px', background: color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {mode === 'edit' ? (
              <input
                className="input-field"
                value={note.title}
                onChange={e => handleChange('title', e.target.value)}
                style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '22px', background: 'transparent', border: 'none', padding: '0', outline: 'none', width: '100%' }}
                placeholder="Note title..."
              />
            ) : (
              <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)' }}>
                {note.title}
              </h1>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
              <select
                value={note.subjectId}
                onChange={e => handleChange('subjectId', e.target.value)}
                style={{ fontSize: '12px', fontWeight: 600, color, background: `${color}15`, border: `1px solid ${color}30`, padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', outline: 'none' }}
              >
                {SUB_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {mode === 'edit' ? (
          <textarea
            value={note.content}
            onChange={e => handleChange('content', e.target.value)}
            placeholder="Start writing... Supports Markdown: **bold**, *italic*, # headings, `code`, - lists"
            style={{
              width: '100%', minHeight: '500px', padding: '24px',
              background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
              color: 'var(--text)', fontSize: '15px', lineHeight: 1.8,
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
        ) : (
          <div
            style={{ padding: '24px', minHeight: '200px', color: 'var(--text)', fontSize: '15px', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: note.content ? renderMarkdown(note.content) : '<p style="color:var(--text-dim)">Nothing to preview yet. Switch to Edit mode to write.</p>' }}
          />
        )}
      </motion.div>

      {/* Flashcard generator hint */}
      {note.content && note.content.includes('Q:') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card"
          style={{ borderRadius: '16px', padding: '16px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
              🃏 Flashcards detected
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Your note has Q:/A: pairs. Convert to flashcards for practice!
            </p>
          </div>
          <button
            onClick={() => addToast('Flashcard conversion: Go to the subject page → Flashcards tab', 'info')}
            className="btn-primary"
            style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', flexShrink: 0 }}
          >
            <Zap size={14} style={{ display: 'inline', marginRight: '5px' }} />
            Convert
          </button>
        </motion.div>
      )}
    </PageWrapper>
  );
}
