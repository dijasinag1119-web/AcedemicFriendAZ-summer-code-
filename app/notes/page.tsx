'use client';
// app/notes/page.tsx — Notes list with search, filter, and create
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getNotes, setNote, deleteNote } from '@/lib/firestore';
import { XP_REWARDS } from '@/lib/xpSystem';
import { Search, Plus, Grid, List, Trash2, FileText, BookOpen } from 'lucide-react';

const SUB_COLORS: Record<string,string> = { dsa:'#6366f1', dbms:'#8b5cf6', os:'#06b6d4', cn:'#10b981', se:'#f59e0b', maths:'#f43f5e', general:'#94a3b8' };
const SUB_OPTIONS = ['general','dsa','dbms','os','cn','se','maths'];

export default function NotesPage() {
  const { userData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();
  const router = useRouter();

  const [notes,   setNotes]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filterSub, setFilterSub] = useState('all');
  const [viewMode,  setViewMode]  = useState<'grid'|'list'>('grid');

  const uid = userData?.uid;

  useEffect(() => { if (uid) loadNotes(); }, [uid]);

  const loadNotes = async () => {
    if (!uid) return;
    try { const data = await getNotes(uid) as any[]; setNotes(data.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())); }
    catch { addToast('Failed to load notes', 'error'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!uid) return;
    const id = `note_${Date.now()}`;
    const data = {
      title: 'Untitled Note',
      subjectId: 'general', subjectName: 'General',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setNote(uid, id, data);
      await awardXP(XP_REWARDS.CREATE_NOTE);
      triggerXPPopup(XP_REWARDS.CREATE_NOTE);
      router.push(`/notes/${id}`);
    } catch { addToast('Failed to create note', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    try {
      await deleteNote(uid, id);
      setNotes(prev => prev.filter(n => n.id !== id));
      addToast('Note deleted', 'info');
    } catch { addToast('Failed to delete note', 'error'); }
  };

  const filtered = notes.filter(n => {
    const matchesSub    = filterSub === 'all' || n.subjectId === filterSub;
    const matchesSearch = search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    return matchesSub && matchesSearch;
  });

  return (
    <PageWrapper breadcrumb="Notes">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>Notes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{notes.length} notes · auto-saved to cloud</p>
        </div>
        <button onClick={handleCreate} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', fontSize: '14px' }}>
          <Plus size={16} /> New Note <span style={{ fontSize: '11px', opacity: 0.8 }}>+2 XP</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            className="input-field"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="input-field" value={filterSub} onChange={e => setFilterSub(e.target.value)} style={{ width: '140px', cursor: 'pointer' }}>
          <option value="all">All Subjects</option>
          {SUB_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
          {[
            { mode: 'grid' as const, icon: <Grid size={15} /> },
            { mode: 'list' as const, icon: <List size={15} /> },
          ].map(({ mode, icon }) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center',
              background: viewMode === mode ? '#6366f1' : 'transparent',
              color: viewMode === mode ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} height={180} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>
            {search || filterSub !== 'all' ? 'No matching notes' : 'No notes yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            {search ? 'Try a different search term' : 'Create your first note to get started!'}
          </p>
          {!search && (
            <button onClick={handleCreate} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>
              + Create Note
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '14px',
        }}>
          {filtered.map((note, i) => {
            const color   = SUB_COLORS[note.subjectId] || '#94a3b8';
            const preview = note.content.replace(/[#*`_\[\]]/g, '').slice(0, 120);
            const updated = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ position: 'relative' }}
              >
                <Link href={`/notes/${note.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="glass-card card-hover"
                    style={{
                      borderRadius: '16px', padding: '18px',
                      borderTop: `3px solid ${color}`,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Subject tag */}
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color, background: `${color}15`, padding: '3px 10px', borderRadius: '20px' }}>
                        {note.subjectName || note.subjectId}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title}
                    </h3>

                    {preview && (
                      <p style={{
                        fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        marginBottom: '12px',
                      }}>
                        {preview}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Updated {updated}</span>
                      <FileText size={13} color="var(--text-dim)" />
                    </div>
                  </div>
                </Link>

                {/* Delete button */}
                <button
                  onClick={e => { e.preventDefault(); handleDelete(note.id); }}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: '8px', padding: '4px', cursor: 'pointer',
                    color: '#f43f5e', opacity: 0, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0'; }}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
