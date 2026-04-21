'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import ProgressRing from '@/components/ui/ProgressRing';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getSubjects, setSubject, updateSubject, deleteSubject } from '@/lib/firestore';
import { Plus, ChevronRight, Pencil, Trash2 } from 'lucide-react';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#84cc16'];
const ICONS  = ['📚','🧮','💻','🌐','⚙️','📐','🔬','🎯','🎨','🏛️','⚗️','🌿'];

const emptyForm = { name: '', icon: '📚', color: '#6366f1', credits: 4 };

export default function SubjectsPage() {
  const { userData } = useAuth();
  const { addToast } = useAppContext();

  const [subjects, setSubjects]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [hoveredId, setHoveredId]     = useState<string | null>(null);

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;
    loadSubjects();
  }, [uid]);

  const loadSubjects = async () => {
    if (!uid) return;
    try {
      const data = await getSubjects(uid) as any[];
      setSubjects(data);
    } catch { addToast('Failed to load subjects', 'error'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(s.id);
    setForm({ name: s.name, icon: s.icon || '📚', color: s.color || '#6366f1', credits: s.credits || 4 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!uid || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        // Update existing
        await updateSubject(uid, editingId, {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
          credits: form.credits,
        });
        setSubjects(prev => prev.map(s =>
          s.id === editingId ? { ...s, name: form.name.trim(), icon: form.icon, color: form.color, credits: form.credits } : s
        ));
        addToast('Subject updated!', 'success');
      } else {
        // Add new
        const id = `subj_${Date.now()}`;
        const subData = {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
          credits: form.credits,
          progress: 0,
          chapters: [],
        };
        await setSubject(uid, id, subData);
        setSubjects(prev => [...prev, { id, ...subData }]);
        addToast('Subject added!', 'success');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch { addToast('Failed to save subject', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uid) return;
    if (!confirm(`Delete "${s.name}" and all its data? This cannot be undone.`)) return;
    try {
      await deleteSubject(uid, s.id);
      setSubjects(prev => prev.filter(x => x.id !== s.id));
      addToast('Subject deleted', 'success');
    } catch { addToast('Failed to delete subject', 'error'); }
  };

  const overallProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + (s.progress || 0), 0) / subjects.length)
    : 0;

  return (
    <PageWrapper breadcrumb="Subjects">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>Subjects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {subjects.length} subjects · {overallProgress}% overall progress
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', fontSize: '14px' }}>
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Overall Progress bar */}
      {subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ borderRadius: '18px', padding: '20px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <ProgressRing percent={overallProgress} size={72} stroke={7}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', fontFamily: 'Sora,sans-serif' }}>
              {overallProgress}%
            </span>
          </ProgressRing>
          <div>
            <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>
              Overall Progress
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {subjects.filter(s => (s.progress || 0) >= 100).length} of {subjects.length} subjects completed ·{' '}
              {subjects.filter(s => (s.progress || 0) >= 50).length} halfway there
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height={210} />)}
        </div>
      ) : subjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {subjects.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Edit / Delete action buttons — visible on hover */}
              <AnimatePresence>
                {hoveredId === s.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: '12px', right: '12px',
                      display: 'flex', gap: '6px', zIndex: 10,
                    }}
                  >
                    <button
                      onClick={(e) => openEdit(s, e)}
                      title="Edit subject"
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                        color: '#6366f1', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(s, e)}
                      title="Delete subject"
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                        color: '#f43f5e', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <Link href={`/subjects/${s.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card card-hover"
                  style={{
                    borderRadius: '20px', padding: '22px',
                    border: `1px solid ${s.color}30`,
                    background: `${s.color}06`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      background: `${s.color}22`, border: `1px solid ${s.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      {s.icon}
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: s.color, fontFamily: 'Sora,sans-serif' }}>
                      {s.progress || 0}%
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>
                    {s.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {(s.chapters || []).length} chapters · {s.credits || 0} credits
                  </p>
                  {/* Marks avg badge if available */}
                  {s.marksAvg != null && (
                    <p style={{ fontSize: '12px', color: s.color, fontWeight: 600, marginBottom: '4px' }}>
                      Avg marks: {s.marksAvg}%
                    </p>
                  )}

                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', marginTop: '10px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.progress || 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 + 0.3 }}
                      style={{ height: '100%', background: s.color, borderRadius: '10px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: s.color, fontWeight: 600 }}>
                      {(s.chapters || []).filter((c: any) => c.status === 'done').length}/
                      {(s.chapters || []).length} chapters done
                    </span>
                    <ChevronRight size={16} color={s.color} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>No subjects yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Add your first subject to get started!</p>
          <button onClick={openAdd} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>
            <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Add Subject
          </button>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} title={editingId ? 'Edit Subject' : 'Add New Subject'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Subject Name *</label>
            <input className="input-field" placeholder="e.g., Data Structures & Algorithms" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Credits</label>
            <input type="number" min={1} max={8} className="input-field" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid white' : '3px solid transparent',
                  transition: 'transform 0.15s', transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Icon</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} style={{
                  width: '40px', height: '40px', borderRadius: '10px', fontSize: '20px', cursor: 'pointer',
                  border: `2px solid ${form.icon === icon ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.icon === icon ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s',
                }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="btn-primary"
            style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', marginTop: '8px' }}
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Subject'}
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
