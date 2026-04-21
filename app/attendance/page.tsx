'use client';
// app/attendance/page.tsx — Full attendance management
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import AttendanceDonut from '@/components/ui/AttendanceDonut';
import CalendarHeatmap from '@/components/ui/CalendarHeatmap';
import AttendanceBarChart from '@/components/charts/AttendanceBarChart';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getAttendance, setAttendance, updateUser } from '@/lib/firestore';
import { calcAttendance, classesNeededFor75, classesCanSkip, getStatusColor } from '@/lib/attendanceUtils';
import { toDateStr, XP_REWARDS } from '@/lib/dateUtils';
import { XP_REWARDS as XPR } from '@/lib/xpSystem';
import { Check, AlertTriangle, Info, TrendingUp } from 'lucide-react';

interface AttendanceEntry {
  subjectId: string;
  subjectName: string;
  color: string;
  totalClasses: number;
  presentCount: number;
  records: { date: string; status: 'present' | 'absent' | 'holiday' }[];
}

const SUBJECT_NAMES: Record<string, string> = {
  dsa: 'DSA', dbms: 'DBMS', os: 'OS', cn: 'CN', se: 'SE', maths: 'Maths',
};
const SUBJECT_COLORS: Record<string, string> = {
  dsa: '#6366f1', dbms: '#8b5cf6', os: '#06b6d4', cn: '#10b981', se: '#f59e0b', maths: '#f43f5e',
};

export default function AttendancePage() {
  const { userData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();

  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [markDate, setMarkDate] = useState(toDateStr());
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent' | 'holiday'>>({});
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#6366f1');

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;
    loadAttendance();
  }, [uid]);

  const loadAttendance = async () => {
    if (!uid) return;
    try {
      const data = await getAttendance(uid) as any[];
      const mapped: AttendanceEntry[] = data.map(d => ({
        subjectId: d.subjectId || d.id,
        subjectName: SUBJECT_NAMES[d.subjectId || d.id] || d.subjectId,
        color: SUBJECT_COLORS[d.subjectId || d.id] || '#6366f1',
        totalClasses: d.totalClasses || 0,
        presentCount: d.presentCount || 0,
        records: d.records || [],
      }));
      setEntries(mapped);
      // Init mark form with today's existing marks
      const todayMarks: Record<string, 'present' | 'absent' | 'holiday'> = {};
      mapped.forEach(e => {
        const rec = e.records.find((r: any) => r.date === toDateStr());
        if (rec) todayMarks[e.subjectId] = rec.status;
      });
      setMarks(todayMarks);
    } catch {
      addToast('Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Overall summary
  const overall = (() => {
    let p = 0, t = 0;
    entries.forEach(e => { p += e.presentCount; t += e.totalClasses; });
    return calcAttendance(entries.flatMap(e => e.records));
  })();

  // Coverage helper for calendar
  const getStatusForDate = useCallback((date: string) => {
    const dayRecords = entries.flatMap(e => e.records.filter((r: any) => r.date === date));
    if (dayRecords.length === 0) return null;
    const holidays = dayRecords.filter((r: any) => r.status === 'holiday').length;
    if (holidays === dayRecords.length) return 'holiday';
    const presents = dayRecords.filter((r: any) => r.status === 'present').length;
    const nonHol = dayRecords.filter((r: any) => r.status !== 'holiday').length;
    if (presents === nonHol) return 'present';
    if (presents === 0) return 'absent';
    return 'partial';
  }, [entries]);

  const handleMarkSubmit = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      for (const entry of entries) {
        const status = marks[entry.subjectId];
        if (!status) continue;

        const existingIdx = entry.records.findIndex((r: any) => r.date === markDate);
        const newRecords = [...entry.records];
        if (existingIdx >= 0) {
          newRecords[existingIdx] = { date: markDate, status };
        } else {
          newRecords.push({ date: markDate, status });
        }

        let newPresent = newRecords.filter((r: any) => r.status === 'present').length;
        let newTotal = newRecords.filter((r: any) => r.status !== 'holiday').length;

        await setAttendance(uid, entry.subjectId, {
          subjectId: entry.subjectId,
          totalClasses: newTotal,
          presentCount: newPresent,
          records: newRecords,
        });
      }

      await awardXP(XPR.MARK_ATTENDANCE);
      triggerXPPopup(XPR.MARK_ATTENDANCE);
      addToast('Attendance saved! +3 XP', 'success');
      await loadAttendance();
    } catch {
      addToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleRenameSubject = async (subjectId: string) => {
    if (!uid || !editName.trim()) return;
    try {
      await setAttendance(uid, subjectId, { subjectName: editName.trim() });
      const updated = entries.map(e =>
        e.subjectId === subjectId ? { ...e, subjectName: editName.trim() } : e
      );
      setEntries(updated);
      setEditingSubject(null);
      addToast('Subject renamed!', 'success');
    } catch {
      addToast('Failed to rename subject', 'error');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!uid) return;
    if (!confirm('Delete this subject and all its attendance records?')) return;
    try {
      const { deleteAttendance } = await import('@/lib/firestore');
      await deleteAttendance(uid, subjectId);
      setEntries(prev => prev.filter(e => e.subjectId !== subjectId));
      addToast('Subject deleted', 'success');
    } catch {
      addToast('Failed to delete subject', 'error');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    const id = newSubjectName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newEntry: AttendanceEntry = {
      subjectId: id,
      subjectName: newSubjectName.trim(),
      color: newSubjectColor,
      totalClasses: 0,
      presentCount: 0,
      records: [],
    };
    if (uid) await setAttendance(uid, id, { subjectId: id, subjectName: newEntry.subjectName, color: newEntry.color, totalClasses: 0, presentCount: 0, records: [] });
    setEntries(prev => [...prev, newEntry]);
    setNewSubjectName('');
    setNewSubjectColor('#6366f1');
    setShowAddSubject(false);
    addToast('Subject added!', 'success');
  };
  const chartData = entries.map(e => {
    const summary = calcAttendance(e.records);
    return { subject: e.subjectName, percent: summary.percent };
  });

  return (
    <PageWrapper breadcrumb="Attendance">
      <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)', marginBottom: '24px' }}>
        Attendance Tracker
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={120} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Overall Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ borderRadius: '20px', padding: '28px', display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center' }}
          >
            <AttendanceDonut percent={overall.percent} present={overall.present} total={overall.total} size={160} />

            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>
                Overall Attendance
              </h2>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '24px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: '#10b981' }}>{overall.present}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Classes Present</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: '#f43f5e' }}>{overall.absent}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Classes Absent</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: 'var(--text)' }}>{overall.total}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Classes</div>
                </div>
              </div>

              {/* Advisory */}
              {overall.status === 'danger' && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <AlertTriangle size={16} color="#f43f5e" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '13px', color: '#f43f5e' }}>
                    Attendance is dangerously low. You need to attend <strong>{classesNeededFor75(overall.present, overall.total)}</strong> more consecutive classes to reach 75%.
                  </p>
                </div>
              )}
              {overall.status === 'warning' && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '13px', color: '#f59e0b' }}>
                    Attend <strong>{classesNeededFor75(overall.present, overall.total)}</strong> more classes to reach the safe 75% zone.
                  </p>
                </div>
              )}
              {overall.status === 'safe' && overall.percent >= 85 && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Info size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '13px', color: '#10b981' }}>
                    You can skip up to <strong>{classesCanSkip(overall.present, overall.total)}</strong> classes and still maintain 75%.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Subject-wise Table ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
            style={{ borderRadius: '20px', overflow: 'hidden' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                Subject-wise Breakdown
              </h2>
              <button
                onClick={() => setShowAddSubject(v => !v)}
                style={{ padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent, #6366f1)' }}
              >
                + Add Subject
              </button>
            </div>

            {/* Add subject form */}
            {showAddSubject && (
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', background: 'rgba(99,102,241,0.04)' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>SUBJECT NAME</label>
                  <input
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Physics"
                    className="input-field"
                    style={{ width: '160px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>COLOR</label>
                  <input type="color" value={newSubjectColor} onChange={e => setNewSubjectColor(e.target.value)}
                    style={{ width: '44px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                </div>
                <button onClick={handleAddSubject} className="btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', border: 'none' }}>
                  Add
                </button>
                <button onClick={() => setShowAddSubject(false)}
                  style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  Cancel
                </button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Subject', 'Classes', 'Present', 'Absent', '%', 'Status', 'Insight'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const summary = calcAttendance(e.records);
                    const color = getStatusColor(summary.status);
                    const needed = classesNeededFor75(summary.present, summary.total);
                    const canSkip = classesCanSkip(summary.present, summary.total);
                    return (
                      <motion.tr
                        key={e.subjectId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                            {editingSubject === e.subjectId ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                  value={editName}
                                  onChange={ev => setEditName(ev.target.value)}
                                  style={{ fontSize: '13px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--accent,#6366f1)', background: 'var(--surface2,#1a2236)', color: 'var(--text)', outline: 'none', width: '100px' }}
                                  autoFocus
                                  onKeyDown={ev => { if (ev.key === 'Enter') handleRenameSubject(e.subjectId); if (ev.key === 'Escape') setEditingSubject(null); }}
                                />
                                <button onClick={() => handleRenameSubject(e.subjectId)}
                                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✓</button>
                                <button onClick={() => setEditingSubject(null)}
                                  style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', cursor: 'pointer' }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{e.subjectName}</span>
                                <button onClick={() => { setEditingSubject(e.subjectId); setEditName(e.subjectName); }}
                                  title="Rename"
                                  style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer' }}>✎</button>
                                <button onClick={() => handleDeleteSubject(e.subjectId)}
                                  title="Delete"
                                  style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', cursor: 'pointer' }}>🗑</button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-muted)' }}>{summary.total}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>{summary.present}</td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#f43f5e', fontWeight: 600 }}>{summary.absent}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color, fontFamily: 'Sora,sans-serif' }}>
                            {summary.percent}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                            background: `${color}20`, color, border: `1px solid ${color}40`,
                          }}>
                            {summary.status === 'safe' ? 'Safe' : summary.status === 'warning' ? 'Warning' : 'Danger'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                          {summary.status !== 'safe' && needed > 0
                            ? <span style={{ color: '#f59e0b' }}>Attend {needed} more to reach 75%</span>
                            : canSkip > 0
                              ? <span style={{ color: '#10b981' }}>Can skip {canSkip} more</span>
                              : <span style={{ color: '#10b981' }}>✓ Safe</span>
                          }
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Calendar Heatmap ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ borderRadius: '20px', padding: '24px' }}
          >
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>
              Attendance Calendar
            </h2>
            <CalendarHeatmap
              records={entries.flatMap(e => e.records as any[])}
              getStatusForDate={getStatusForDate}
              onDayClick={date => setSelectedDay(date)}
            />

            {/* Day detail popup */}
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '20px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{selectedDay}</h3>
                  <button onClick={() => setSelectedDay(null)} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {entries.map(e => {
                    const rec = e.records.find((r: any) => r.date === selectedDay);
                    if (!rec) return null;
                    const statusColor = rec.status === 'present' ? '#10b981' : rec.status === 'absent' ? '#f43f5e' : '#8b5cf6';
                    return (
                      <div key={e.subjectId} style={{
                        padding: '6px 12px', borderRadius: '20px',
                        background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                        fontSize: '12px', fontWeight: 600, color: statusColor,
                      }}>
                        {e.subjectName}: {rec.status}
                      </div>
                    );
                  })}
                  {entries.every(e => !e.records.find((r: any) => r.date === selectedDay)) && (
                    <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No records for this day</p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Mark Attendance Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{ borderRadius: '20px', padding: '24px' }}
          >
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>
              Mark Attendance <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 500 }}>+3 XP</span>
            </h2>

            {/* Date picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Date
              </label>
              <input
                type="date"
                value={markDate}
                onChange={e => setMarkDate(e.target.value)}
                className="input-field"
                style={{ maxWidth: '200px' }}
              />
            </div>

            {/* Subject toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {entries.map(e => (
                <div key={e.subjectId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{e.subjectName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['present', 'absent', 'holiday'] as const).map(s => {
                      const sc = s === 'present' ? '#10b981' : s === 'absent' ? '#f43f5e' : '#8b5cf6';
                      const active = marks[e.subjectId] === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setMarks(m => ({ ...m, [e.subjectId]: s }))}
                          style={{
                            padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', border: `1px solid ${active ? sc : 'var(--border)'}`,
                            background: active ? `${sc}20` : 'transparent',
                            color: active ? sc : 'var(--text-dim)',
                            transition: 'all 0.15s', textTransform: 'capitalize',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleMarkSubmit}
              disabled={saving || Object.keys(marks).length === 0}
              className="btn-primary"
              style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </motion.div>

          {/* ── Analytics Chart ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card"
            style={{ borderRadius: '20px', padding: '24px' }}
          >
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>
              Attendance by Subject
            </h2>
            <AttendanceBarChart data={chartData} />
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
