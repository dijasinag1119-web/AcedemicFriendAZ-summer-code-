'use client';
// app/assignments/page.tsx — Assignments management
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import DeadlineCard from '@/components/ui/DeadlineCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getAssignments, addAssignment, updateAssignment, deleteAssignment } from '@/lib/firestore';
import { XP_REWARDS } from '@/lib/xpSystem';
import { formatCountdown, toDateStr } from '@/lib/dateUtils';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const SUB_COLORS: Record<string, string> = { dsa:'#6366f1', dbms:'#8b5cf6', os:'#06b6d4', cn:'#10b981', se:'#f59e0b', maths:'#f43f5e' };
const SUB_OPTIONS = ['dsa','dbms','os','cn','se','maths'];
type FilterTab = 'all' | 'pending' | 'submitted' | 'overdue';

export default function AssignmentsPage() {
  const { userData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [addOpen,     setAddOpen]     = useState(false);
  const [filter,      setFilter]      = useState<FilterTab>('all');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  const [form, setForm] = useState({ title: '', subjectId: 'dsa', dueDate: toDateStr(), priority: 'medium', description: '' });

  const uid = userData?.uid;

  useEffect(() => { if (uid) loadAssignments(); }, [uid]);

  const loadAssignments = async () => {
    if (!uid) return;
    try { const data = await getAssignments(uid) as any[]; setAssignments(data); }
    catch { addToast('Failed to load assignments', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!uid || !form.title.trim()) return;
    const subName = form.subjectId.toUpperCase();
    const data = { title: form.title.trim(), subjectId: form.subjectId, subjectName: subName, dueDate: form.dueDate, priority: form.priority, status: 'pending', description: form.description };
    try {
      const ref = await addAssignment(uid, data as Record<string, unknown>);
      setAssignments(prev => [...prev, { id: (ref as any).id, ...data }]);
      setAddOpen(false);
      setForm({ title: '', subjectId: 'dsa', dueDate: toDateStr(), priority: 'medium', description: '' });
      addToast('Assignment added!', 'success');
    } catch { addToast('Failed to add assignment', 'error'); }
  };

  const handleSubmit = async (id: string) => {
    if (!uid) return;
    try {
      await updateAssignment(uid, id, { status: 'submitted', submittedAt: new Date().toISOString() });
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'submitted' } : a));
      await awardXP(XP_REWARDS.SUBMIT_ASSIGNMENT);
      triggerXPPopup(XP_REWARDS.SUBMIT_ASSIGNMENT);
      addToast('+8 XP! Assignment submitted!', 'success');
    } catch { addToast('Failed to update assignment', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    try {
      await deleteAssignment(uid, id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      addToast('Assignment deleted', 'info');
    } catch { addToast('Failed to delete', 'error'); }
  };

  const today = toDateStr();
  const filtered = assignments.filter(a => {
    switch (filter) {
      case 'pending':   return a.status === 'pending' && a.dueDate >= today;
      case 'submitted': return a.status === 'submitted';
      case 'overdue':   return a.status === 'pending' && a.dueDate < today;
      default:          return true;
    }
  });

  const PRIORITY_MAP = { high: { color: '#f43f5e', label: 'High' }, medium: { color: '#f59e0b', label: 'Medium' }, low: { color: '#10b981', label: 'Low' } };
  const counts = {
    all:       assignments.length,
    pending:   assignments.filter(a => a.status === 'pending' && a.dueDate >= today).length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    overdue:   assignments.filter(a => a.status === 'pending' && a.dueDate < today).length,
  };

  return (
    <PageWrapper breadcrumb="Assignments">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>Assignments</h1>
        <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', fontSize: '14px' }}>
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
        {(['all','pending','submitted','overdue'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', textTransform: 'capitalize', flexShrink: 0,
              background: filter === tab ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: filter === tab ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {tab} <span style={{ opacity: 0.7, fontSize: '11px' }}>({counts[tab]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3].map(i => <SkeletonCard key={i} height={80} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            {filter === 'overdue' ? 'No overdue assignments!' : filter === 'submitted' ? 'No submissions yet' : 'All clear!'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {filter === 'all' ? 'No assignments yet. Add one!' : `Nothing in ${filter} category`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Overdue section */}
          {filter === 'all' && counts.overdue > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', animation: 'pulseGlow 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f43f5e' }}>OVERDUE ({counts.overdue})</span>
              </div>
            </div>
          )}

          {filtered.map((a, i) => {
            const { days, label, urgent } = formatCountdown(a.dueDate);
            const p = PRIORITY_MAP[a.priority as keyof typeof PRIORITY_MAP] || PRIORITY_MAP.medium;
            const overdue = a.status === 'pending' && days < 0;
            const expanded = expandedId === a.id;

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card"
                style={{
                  borderRadius: '16px',
                  borderLeft: `3px solid ${overdue ? '#f43f5e' : SUB_COLORS[a.subjectId] || '#6366f1'}`,
                  overflow: 'hidden',
                }}
              >
                {/* Main row */}
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Left */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                        background: `${SUB_COLORS[a.subjectId] || '#6366f1'}15`,
                        color: SUB_COLORS[a.subjectId] || '#6366f1',
                      }}>
                        {a.subjectName}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${p.color}15`, color: p.color }}>
                        {p.label}
                      </span>
                      {a.status === 'submitted' && <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}>✓ Submitted</span>}
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </p>
                    {a.description && (
                      <button onClick={() => setExpandedId(expanded ? null : a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '12px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {expanded ? <><ChevronUp size={12} /> Hide details</> : <><ChevronDown size={12} /> Show details</>}
                      </button>
                    )}
                  </div>

                  {/* Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span className={overdue ? 'urgency-high' : days <= 2 ? 'urgency-high' : days <= 7 ? 'urgency-medium' : 'urgency-low'} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid currentColor', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                    {a.status === 'pending' && (
                      <button onClick={() => handleSubmit(a.id)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                        Submit
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', opacity: 0.6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded description */}
                {expanded && a.description && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {a.description}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Assignment">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input className="input-field" placeholder="Assignment title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Subject</label>
              <select className="input-field" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} style={{ cursor: 'pointer' }}>
                {SUB_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ cursor: 'pointer' }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Due Date</label>
            <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description (optional)</label>
            <textarea className="input-field" rows={3} placeholder="Assignment details and instructions..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <button onClick={handleAdd} disabled={!form.title.trim()} className="btn-primary" style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', marginTop: '4px' }}>
            Add Assignment
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
