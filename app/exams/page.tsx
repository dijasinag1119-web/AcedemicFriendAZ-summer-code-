'use client';
// app/exams/page.tsx — Exams, grades, CGPA calculator
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getExams, addExam, updateExam, deleteExam } from '@/lib/firestore';
import { calcSGPA, getGradeFromPercent, GRADE_POINTS, GRADE_COLORS, GradeLetter } from '@/lib/gradeUtils';
import { formatCountdown, toDateStr, formatTime12 } from '@/lib/dateUtils';
import { GraduationCap, Plus, Check, Trash2, Target, Calculator } from 'lucide-react';

const SUB_OPTIONS = ['dsa','dbms','os','cn','se','maths'];
const SUB_NAMES: Record<string,string> = { dsa:'DSA', dbms:'DBMS', os:'OS', cn:'CN', se:'SE', maths:'Maths' };
const SUB_COLORS: Record<string,string> = { dsa:'#6366f1', dbms:'#8b5cf6', os:'#06b6d4', cn:'#10b981', se:'#f59e0b', maths:'#f43f5e' };
const EXAM_TYPES = ['Mid', 'End', 'Practical', 'Quiz'];
const GRADE_ORDER: GradeLetter[] = ['O','A+','A','B+','B','C','F'];

export default function ExamsPage() {
  const { userData } = useAuth();
  const { addToast } = useAppContext();

  const [exams,     setExams]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [addOpen,   setAddOpen]   = useState(false);
  const [tab,       setTab]       = useState<'upcoming'|'past'|'cgpa'>('upcoming');

  const [form, setForm] = useState({
    subjectId: 'dsa', examType: 'Mid', date: toDateStr(), time: '10:00', venue: '', syllabus: '',
  });

  // CGPA calculator state
  const [cgpaEntries, setCgpaEntries] = useState([
    { subject: 'DSA', credits: 4, grade: 'A' as GradeLetter },
    { subject: 'DBMS', credits: 4, grade: 'A+' as GradeLetter },
    { subject: 'OS', credits: 4, grade: 'B+' as GradeLetter },
    { subject: 'CN', credits: 3, grade: 'A' as GradeLetter },
    { subject: 'SE', credits: 3, grade: 'B+' as GradeLetter },
    { subject: 'Maths', credits: 4, grade: 'A' as GradeLetter },
  ]);
  const [targetCGPA, setTargetCGPA] = useState('8.0');

  const uid = userData?.uid;

  useEffect(() => { if (uid) loadExams(); }, [uid]);

  const loadExams = async () => {
    if (!uid) return;
    try { const data = await getExams(uid) as any[]; setExams(data); }
    catch { addToast('Failed to load exams', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!uid) return;
    const data = {
      subjectId: form.subjectId, subjectName: SUB_NAMES[form.subjectId],
      examType: form.examType, date: form.date, time: form.time,
      venue: form.venue, syllabus: form.syllabus,
      topics: [
        { id: 't1', title: 'Unit 1', done: false },
        { id: 't2', title: 'Unit 2', done: false },
        { id: 't3', title: 'Unit 3', done: false },
        { id: 't4', title: 'Unit 4', done: false },
      ],
      marksObtained: null, totalMarks: null, grade: null,
    };
    try {
      const ref = await addExam(uid, data as Record<string, unknown>);
      setExams(prev => [...prev, { id: (ref as any).id, ...data }]);
      setAddOpen(false);
      addToast('Exam added!', 'success');
    } catch { addToast('Failed to add exam', 'error'); }
  };

  const handleTopicToggle = async (examId: string, topicIdx: number) => {
    if (!uid) return;
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    const topics = [...(exam.topics || [])];
    topics[topicIdx] = { ...topics[topicIdx], done: !topics[topicIdx].done };
    try {
      await updateExam(uid, examId, { topics });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, topics } : e));
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleGradeEntry = async (examId: string, obtained: number, total: number) => {
    if (!uid || !total) return;
    const pct   = Math.round((obtained / total) * 100);
    const grade = getGradeFromPercent(pct);
    try {
      await updateExam(uid, examId, { marksObtained: obtained, totalMarks: total, grade, percentage: pct });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, marksObtained: obtained, totalMarks: total, grade, percentage: pct } : e));
      addToast(`Grade saved: ${grade} (${pct}%)`, 'success');
    } catch { addToast('Failed to save grade', 'error'); }
  };

  const today   = toDateStr();
  const upcoming = exams.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past     = exams.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const sgpa = calcSGPA(cgpaEntries.map(e => ({ subjectName: e.subject, credits: e.credits, grade: e.grade })));

  const needForTarget = () => {
    const current = cgpaEntries.reduce((s, e) => s + e.credits * GRADE_POINTS[e.grade], 0);
    const totalCr  = cgpaEntries.reduce((s, e) => s + e.credits, 0);
    const target   = parseFloat(targetCGPA);
    const needed   = (target * totalCr - current) / totalCr;
    return Math.min(10, Math.max(0, Math.round(needed * 100) / 100));
  };

  return (
    <PageWrapper breadcrumb="Exams">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>Exams</h1>
        <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', fontSize: '14px' }}>
          <Plus size={16} /> Add Exam
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'upcoming', label: '⏳ Upcoming' },
          { id: 'past',     label: '📋 Past Exams' },
          { id: 'cgpa',     label: '🎓 CGPA Calc' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: tab === t.id ? '#6366f1' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <SkeletonCard height={300} /> : (

        /* ── UPCOMING TAB ── */
        tab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>📅</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>No upcoming exams</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Add your exams and start preparing!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcoming.map((exam, i) => {
                const { days, label, urgent } = formatCountdown(exam.date);
                const color = SUB_COLORS[exam.subjectId] || '#6366f1';
                const readiness = exam.topics?.length
                  ? Math.round((exam.topics.filter((t: any) => t.done).length / exam.topics.length) * 100)
                  : 0;
                return (
                  <motion.div key={exam.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-card" style={{ borderRadius: '18px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GraduationCap size={22} color={color} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>{exam.subjectName}</h3>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${color}15`, color }}>{exam.examType}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {formatTime12(exam.time)} · {exam.venue || 'TBA'}
                          </p>
                        </div>
                      </div>
                      <span className={days <= 3 ? 'urgency-high' : days <= 7 ? 'urgency-medium' : 'urgency-low'} style={{ fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', border: '1px solid currentColor', whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                    </div>

                    {/* Prep tracker */}
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Preparation Progress</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color }}>
                          {readiness}% ready
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${readiness}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: color, borderRadius: '10px' }} />
                      </div>
                      {exam.topics && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {exam.topics.map((topic: any, ti: number) => (
                            <button
                              key={topic.id}
                              onClick={() => handleTopicToggle(exam.id, ti)}
                              style={{
                                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                cursor: 'pointer', border: `1px solid ${topic.done ? '#10b98140' : 'var(--border)'}`,
                                background: topic.done ? 'rgba(16,185,129,0.1)' : 'transparent',
                                color: topic.done ? '#10b981' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
                              }}
                            >
                              {topic.done && <Check size={11} />}
                              {topic.title}
                            </button>
                          ))}
                        </div>
                      )}
                      {exam.syllabus && <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>📋 {exam.syllabus}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )

        /* ── PAST TAB ── */
        ) : tab === 'past' ? (
          past.length === 0 ? (
            <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No past exams. They'll appear here after their date passes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {past.map((exam, i) => {
                const color = SUB_COLORS[exam.subjectId] || '#6366f1';
                const gradeColor = exam.grade ? GRADE_COLORS[exam.grade as GradeLetter] : 'var(--text-muted)';
                return (
                  <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card" style={{ borderRadius: '16px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{exam.subjectName}</h3>
                          <span style={{ fontSize: '11px', fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: '20px' }}>{exam.examType}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>

                      {/* Grade entry */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {exam.grade ? (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '28px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: gradeColor }}>{exam.grade}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{exam.marksObtained}/{exam.totalMarks} ({exam.percentage}%)</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input type="number" placeholder="Obtained" style={{ width: '80px' }} className="input-field"
                              onBlur={e => {
                                const obtained = Number(e.target.value);
                                const totalEl  = e.target.parentElement?.querySelector('input:last-of-type') as HTMLInputElement;
                                const total    = Number(totalEl?.value);
                                if (obtained && total) handleGradeEntry(exam.id, obtained, total);
                              }}
                            />
                            <span style={{ color: 'var(--text-dim)' }}>/</span>
                            <input type="number" placeholder="Total" style={{ width: '80px' }} className="input-field" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )

        /* ── CGPA TAB ── */
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="md:grid block">
            <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '20px' }}>
                CGPA / SGPA Calculator
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {cgpaEntries.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input className="input-field" value={entry.subject} onChange={e => setCgpaEntries(prev => prev.map((en, j) => j === i ? { ...en, subject: e.target.value } : en))} style={{ flex: 1 }} />
                    <input type="number" min={1} max={8} className="input-field" value={entry.credits} onChange={e => setCgpaEntries(prev => prev.map((en, j) => j === i ? { ...en, credits: Number(e.target.value) } : en))} style={{ width: '60px' }} />
                    <select className="input-field" value={entry.grade} onChange={e => setCgpaEntries(prev => prev.map((en, j) => j === i ? { ...en, grade: e.target.value as GradeLetter } : en))} style={{ width: '70px', cursor: 'pointer' }}>
                      {GRADE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={() => setCgpaEntries(prev => [...prev, { subject: 'New Subject', credits: 3, grade: 'A' }])} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: '10px', width: '100%', marginBottom: '16px', fontSize: '13px' }}>
                + Add Subject
              </button>

              <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
                  {sgpa.toFixed(2)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>SGPA (10-point scale)</div>
              </div>
            </div>

            {/* What grade do I need? */}
            <div className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '20px' }}>
                🎯 Grade Needed for Target
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Target SGPA
                </label>
                <input
                  type="number" min={0} max={10} step={0.1}
                  className="input-field"
                  value={targetCGPA}
                  onChange={e => setTargetCGPA(e.target.value)}
                />
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calculator size={24} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      To reach SGPA of {targetCGPA}, you need an average grade point of:
                    </div>
                    <div style={{ fontSize: '36px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: '#10b981' }}>
                      {needForTarget()}/10
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade Point Table */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Grade Point Reference</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {GRADE_ORDER.map(g => (
                    <div key={g} style={{
                      padding: '6px 12px', borderRadius: '10px',
                      background: `${GRADE_COLORS[g]}15`, border: `1px solid ${GRADE_COLORS[g]}30`,
                      fontSize: '12px', fontWeight: 700, color: GRADE_COLORS[g],
                    }}>
                      {g} = {GRADE_POINTS[g]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Add Exam Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Exam">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Subject</label>
              <select className="input-field" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} style={{ cursor: 'pointer' }}>
                {SUB_OPTIONS.map(s => <option key={s} value={s}>{SUB_NAMES[s]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Exam Type</label>
              <select className="input-field" value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value }))} style={{ cursor: 'pointer' }}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Time</label>
              <input type="time" className="input-field" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Venue</label>
            <input className="input-field" placeholder="e.g., Hall A" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Syllabus Notes</label>
            <textarea className="input-field" rows={2} placeholder="Topics covered..." value={form.syllabus} onChange={e => setForm(f => ({ ...f, syllabus: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <button onClick={handleAdd} className="btn-primary" style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>
            Add Exam
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
