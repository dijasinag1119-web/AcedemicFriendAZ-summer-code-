'use client';
// app/timetable/page.tsx — Weekly timetable grid with add/edit
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getTimetable, addTimetableSlot, deleteTimetableSlot } from '@/lib/firestore';
import { formatTime12, minutesUntil, toDateStr } from '@/lib/dateUtils';
import { Plus, Trash2, Clock, Copy, Check } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_INDEX = [1, 2, 3, 4, 5, 6]; // 1=Mon,...,6=Sat
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am - 6pm

const SUBJECT_OPTIONS = [
  { id: 'dsa',   name: 'DSA',   color: '#6366f1' },
  { id: 'dbms',  name: 'DBMS',  color: '#8b5cf6' },
  { id: 'os',    name: 'OS',    color: '#06b6d4' },
  { id: 'cn',    name: 'CN',    color: '#10b981' },
  { id: 'se',    name: 'SE',    color: '#f59e0b' },
  { id: 'maths', name: 'Maths', color: '#f43f5e' },
];

export default function TimetablePage() {
  const { userData } = useAuth();
  const { addToast } = useAppContext();

  const [slots,   setSlots]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [activeTab, setActiveTab] = useState<'week' | 'today'>('week');

  const [form, setForm] = useState({
    subjectId: 'dsa', teacher: '', room: '',
    dayOfWeek: 1, startTime: '09:00', endTime: '10:00',
  });

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;
    loadTimetable();
  }, [uid]);

  const loadTimetable = async () => {
    if (!uid) return;
    try {
      const data = await getTimetable(uid) as any[];
      setSlots(data);
    } catch { addToast('Failed to load timetable', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!uid) return;
    const sub = SUBJECT_OPTIONS.find(s => s.id === form.subjectId)!;
    const id  = `tt_${Date.now()}`;
    const slotData = {
      subjectId:   form.subjectId,
      subjectName: sub.name,
      color:       sub.color,
      teacher:     form.teacher,
      room:        form.room,
      dayOfWeek:   form.dayOfWeek,
      startTime:   form.startTime,
      endTime:     form.endTime,
    };
    try {
      await addTimetableSlot(uid, id, slotData);
      setSlots(prev => [...prev, { id, ...slotData }]);
      setAddOpen(false);
      addToast('Class added to timetable!', 'success');
    } catch { addToast('Failed to add class', 'error'); }
  };

  const handleDelete = async (slotId: string) => {
    if (!uid) return;
    try {
      await deleteTimetableSlot(uid, slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      addToast('Class removed', 'info');
    } catch { addToast('Failed to remove class', 'error'); }
  };

  // Get slots for a given day and hour
  const getSlotsAt = (day: number, hour: number) => {
    return slots.filter(s => {
      const startH = parseInt(s.startTime.split(':')[0]);
      return s.dayOfWeek === day && startH === hour;
    });
  };

  // Today's classes
  const todayDow = new Date().getDay(); // 0=Sun
  const todaySlots = slots
    .filter(s => s.dayOfWeek === todayDow)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const copyTimetable = () => {
    const text = DAYS.map((day, i) => {
      const daySlots = slots.filter(s => s.dayOfWeek === DAY_INDEX[i]).sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (daySlots.length === 0) return `${day}: Free`;
      return `${day}:\n${daySlots.map(s => `  ${formatTime12(s.startTime)}-${formatTime12(s.endTime)} ${s.subjectName} (${s.room})`).join('\n')}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Timetable copied to clipboard!', 'success');
  };

  return (
    <PageWrapper breadcrumb="Timetable">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>
          Timetable
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={copyTimetable} className="btn-ghost" style={{ padding: '9px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ padding: '9px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', border: 'none' }}>
            <Plus size={16} /> Add Class
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {(['week', 'today'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', textTransform: 'capitalize',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'week' ? 'Week View' : "Today's Classes"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard height={400} />
      ) : activeTab === 'week' ? (
        /* ── Weekly Grid ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card"
          style={{ borderRadius: '20px', overflow: 'auto' }}
        >
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }} />
                {DAYS.map(day => (
                  <th key={day} style={{
                    padding: '14px', textAlign: 'center',
                    fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '8px' }}>
                    {formatTime12(`${hour}:00`)}
                  </td>
                  {DAY_INDEX.map(dayIdx => {
                    const daySlots = getSlotsAt(dayIdx, hour);
                    return (
                      <td key={dayIdx} style={{ padding: '4px', verticalAlign: 'top', minHeight: '48px' }}>
                        {daySlots.map(slot => (
                          <div
                            key={slot.id}
                            style={{
                              borderRadius: '8px', padding: '8px 10px',
                              background: `${slot.color}20`,
                              border: `1px solid ${slot.color}40`,
                              marginBottom: '3px', position: 'relative',
                            }}
                          >
                            <p style={{ fontSize: '12px', fontWeight: 700, color: slot.color, marginBottom: '2px' }}>{slot.subjectName}</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                              {formatTime12(slot.startTime)}–{formatTime12(slot.endTime)}
                            </p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Room {slot.room}</p>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              style={{
                                position: 'absolute', top: '4px', right: '4px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-dim)', padding: '2px', opacity: 0.6,
                              }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        /* ── Today View ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todaySlots.length === 0 ? (
            <div className="glass-card" style={{ borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>No classes today!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enjoy your day off or use it for self-study.</p>
            </div>
          ) : (
            todaySlots.map((slot, i) => {
              const minsLeft = minutesUntil(slot.startTime);
              const isNow    = minutesUntil(slot.startTime) <= 0 && minutesUntil(slot.endTime) > 0;
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card"
                  style={{
                    borderRadius: '16px', padding: '18px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    borderLeft: `4px solid ${slot.color}`,
                    background: isNow ? `${slot.color}08` : undefined,
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0, background: `${slot.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color={slot.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{slot.subjectName}</p>
                      {isNow && <span style={{ fontSize: '10px', fontWeight: 700, color: slot.color, background: `${slot.color}20`, padding: '2px 8px', borderRadius: '20px' }}>IN PROGRESS</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)} · Room {slot.room} · {slot.teacher}
                    </p>
                    {!isNow && minsLeft > 0 && (
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>
                        Starts in {minsLeft} minutes
                      </p>
                    )}
                    {!isNow && minsLeft < 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Completed</p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* ── Add Class Modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Class">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Subject</label>
            <select
              className="input-field"
              value={form.subjectId}
              onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
              style={{ cursor: 'pointer' }}
            >
              {SUBJECT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Teacher Name</label>
            <input className="input-field" placeholder="e.g., Dr. Smith" value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Room Number</label>
            <input className="input-field" placeholder="e.g., A101" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Day of Week</label>
            <select className="input-field" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))} style={{ cursor: 'pointer' }}>
              {DAYS.map((d, i) => <option key={d} value={DAY_INDEX[i]}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Start Time</label>
              <input type="time" className="input-field" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>End Time</label>
              <input type="time" className="input-field" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleAdd} className="btn-primary" style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', marginTop: '8px' }}>
            Add to Timetable
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
