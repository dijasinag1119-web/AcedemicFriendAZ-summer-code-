'use client';
// app/analytics/page.tsx — Full analytics dashboard
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import XPLineChart from '@/components/charts/XPLineChart';
import AttendanceBarChart from '@/components/charts/AttendanceBarChart';
import SubjectRadarChart from '@/components/charts/SubjectRadarChart';
import StudyPieChart from '@/components/charts/StudyPieChart';
import StatCard from '@/components/ui/StatCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import {
  getActivity, getAttendance, getSubjects, getTasks,
  getAssignments, getExams,
} from '@/lib/firestore';
import { calcAttendance } from '@/lib/attendanceUtils';
import { formatMinutes } from '@/lib/dateUtils';
import { calculateLevel, xpInCurrentLevel } from '@/lib/xpSystem';
import {
  Zap, Flame, TrendingUp, BookOpen, Clock,
  CalendarCheck, Target, Award,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { userData } = useAuth();
  const { addToast } = useAppContext();

  const [activity,    setActivity]    = useState<any[]>([]);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [subjects,    setSubjects]    = useState<any[]>([]);
  const [tasks,       setTasks]       = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams,       setExams]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [period,      setPeriod]      = useState<7 | 30>(30);

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const [act, att, subs, t, asgn, ex] = await Promise.all([
          getActivity(uid), getAttendance(uid), getSubjects(uid),
          getTasks(uid), getAssignments(uid), getExams(uid),
        ]);
        setActivity(act as any[]);
        setAttendance(att as any[]);
        setSubjects(subs as any[]);
        setTasks(t as any[]);
        setAssignments(asgn as any[]);
        setExams(ex as any[]);
      } catch { addToast('Failed to load analytics', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, [uid]);

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const xp     = userData?.xp ?? 0;
  const level  = calculateLevel(xp);
  const streak = userData?.currentStreak ?? 0;

  // XP Line Chart data (last N days)
  const xpChartData = (() => {
    const days = period;
    const today = new Date();
    const result = [];
    let cumulative = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const act = activity.find((a: any) => a.date === dateStr);
      cumulative += act?.xpGained || 0;
      result.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        xp: act?.xpGained || 0,
      });
    }
    return result;
  })();

  // Attendance bar chart
  const attChartData = attendance.map((a: any) => {
    const summary = calcAttendance(a.records || []);
    return {
      subject: a.subjectId?.toUpperCase() || a.subjectId,
      percent: summary.percent,
    };
  });

  // Radar chart
  const radarData = subjects.map((s: any) => ({
    subject: s.name,
    progress: s.progress || 0,
  }));

  // Study distribution pie
  const studyData = subjects.map((s: any, i: number) => {
    const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e'];
    const totalStudy = activity.reduce((sum: number, act: any) => sum + (act.studyMinutes || 0), 0);
    return {
      name: s.name,
      value: Math.round(totalStudy / (subjects.length || 1)),
      color: colors[i % colors.length],
    };
  });

  // Period stats
  const periodActivity = (() => {
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - period);
    return activity.filter((a: any) => new Date(a.date) >= cutoff);
  })();

  const totalStudyMins  = periodActivity.reduce((s: number, a: any) => s + (a.studyMinutes || 0), 0);
  const totalTasksDone  = periodActivity.reduce((s: number, a: any) => s + (a.tasksCompleted || 0), 0);
  const totalXPGained   = periodActivity.reduce((s: number, a: any) => s + (a.xpGained || 0), 0);
  const activeDays      = periodActivity.filter((a: any) => (a.xpGained || 0) > 0).length;
  const avgDailyXP      = activeDays > 0 ? Math.round(totalXPGained / activeDays) : 0;

  const completedSubj   = subjects.filter((s: any) => (s.progress || 0) >= 100).length;
  const completedAsgn   = assignments.filter((a: any) => a.status === 'submitted').length;
  const totalChapters   = subjects.reduce((s: number, sub: any) => s + (sub.chapters?.length || 0), 0);
  const doneChapters    = subjects.reduce((s: number, sub: any) => s + (sub.chapters?.filter((c: any) => c.status === 'done').length || 0), 0);

  const overallAtt = (() => {
    let p = 0, t = 0;
    attendance.forEach((a: any) => {
      const summary = calcAttendance(a.records || []);
      p += summary.present; t += summary.total;
    });
    return t > 0 ? Math.round((p/t)*100) : 0;
  })();

  return (
    <PageWrapper breadcrumb="Analytics">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)' }}>Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Your academic performance at a glance</p>
        </div>
        {/* Period filter */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
          {([7, 30] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: period === p ? '#6366f1' : 'transparent',
              color: period === p ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
            }}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} height={100} />)}
          </div>
          <SkeletonCard height={280} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── KPI Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <StatCard icon={<Zap size={18} />}         label="XP This Period"    value={totalXPGained}           sub={`~${avgDailyXP}/day avg`}         color="#6366f1" delay={0}    />
            <StatCard icon={<Clock size={18} />}        label="Study Time"        value={formatMinutes(totalStudyMins)} sub={`${activeDays} active days`}  color="#8b5cf6" delay={0.06} />
            <StatCard icon={<Target size={18} />}       label="Tasks Completed"   value={totalTasksDone}          sub={`${completedAsgn} assignments`}   color="#10b981" delay={0.12} />
            <StatCard icon={<CalendarCheck size={18} />} label="Attendance"       value={`${overallAtt}%`}        sub="Overall"                          color="#06b6d4" delay={0.18} />
            <StatCard icon={<BookOpen size={18} />}     label="Chapters Done"     value={`${doneChapters}/${totalChapters}`} sub={`${completedSubj} subjects`} color="#f59e0b" delay={0.24} />
            <StatCard icon={<Flame size={18} />}        label="Current Streak"    value={`${streak}🔥`}           sub="days in a row"                    color="#f43f5e" delay={0.3}  />
          </div>

          {/* ── XP Line Chart ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>XP Earned Over Time</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last {period} days</span>
            </div>
            {xpChartData.some(d => d.xp > 0) ? (
              <XPLineChart data={xpChartData} />
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Complete tasks and attend classes to earn XP!</p>
              </div>
            )}
          </motion.div>

          {/* ── Two column: Attendance + Radar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="lg:grid block">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '16px' }}>Attendance by Subject</h2>
              {attChartData.length > 0 ? <AttendanceBarChart data={attChartData} /> : <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>No attendance data</div>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '16px' }}>Subject Progress Radar</h2>
              {radarData.length > 0 ? <SubjectRadarChart data={radarData} /> : <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>Add subjects to see radar</div>}
            </motion.div>
          </div>

          {/* ── Study Distribution ── */}
          {studyData.length > 0 && studyData.some(d => d.value > 0) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '16px' }}>Study Time Distribution</h2>
              <StudyPieChart data={studyData} />
            </motion.div>
          )}

          {/* ── Level Progress ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>XP Progression</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '56px', color: '#6366f1', lineHeight: 1 }}>
                  {level}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Current Level</div>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Level {level}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Level {level + 1}</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpInCurrentLevel(xp)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{xpInCurrentLevel(xp)} XP in level</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{xp} total XP</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Achieved Badges ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>
              Achievement Badges
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {[
                { icon: '🔥', name: 'Streak Starter',      desc: '7-day streak',       unlocked: streak >= 7,     color: '#f59e0b' },
                { icon: '🎯', name: 'Perfect Attendance',  desc: '90%+ attendance',     unlocked: overallAtt >= 90, color: '#10b981' },
                { icon: '📚', name: 'Subject Master',      desc: 'Complete a subject',  unlocked: completedSubj > 0, color: '#6366f1' },
                { icon: '⚡', name: 'XP Hunter',           desc: 'Earn 500 XP',         unlocked: xp >= 500,        color: '#8b5cf6' },
                { icon: '🏆', name: 'Level 10',            desc: 'Reach level 10',      unlocked: level >= 10,      color: '#f43f5e' },
                { icon: '✅', name: 'Task Master',         desc: 'Complete 20 tasks',   unlocked: totalTasksDone >= 20, color: '#06b6d4' },
                { icon: '📝', name: 'Note Taker',          desc: 'Create 10 notes',     unlocked: false,             color: '#ec4899' },
                { icon: '🧠', name: 'Quiz Champion',       desc: 'Perfect quiz score',  unlocked: false,             color: '#84cc16' },
              ].map((badge, i) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.04, type: 'spring', stiffness: 200 }}
                  className={badge.unlocked ? 'glass-card card-hover' : ''}
                  style={{
                    borderRadius: '14px', padding: '14px', textAlign: 'center',
                    border: badge.unlocked ? `1px solid ${badge.color}40` : '1px solid var(--border)',
                    background: badge.unlocked ? `${badge.color}0d` : 'rgba(255,255,255,0.02)',
                    cursor: 'default',
                  }}
                  title={badge.desc}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 8px',
                    background: badge.unlocked ? `${badge.color}22` : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                    filter: badge.unlocked ? 'none' : 'grayscale(1) opacity(0.4)',
                  }}>
                    {badge.icon}
                  </div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: badge.unlocked ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.3 }}>
                    {badge.name}
                  </p>
                  {badge.unlocked && <p style={{ fontSize: '10px', color: badge.color, fontWeight: 600, marginTop: '3px' }}>✓ Earned</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
