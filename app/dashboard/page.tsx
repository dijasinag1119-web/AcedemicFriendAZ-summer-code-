'use client';
// app/dashboard/page.tsx — Main hub dashboard
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import TaskCard from '@/components/ui/TaskCard';
import DeadlineCard from '@/components/ui/DeadlineCard';
import PomodoroTimer from '@/components/ui/PomodoroTimer';
import SkeletonCard from '@/components/ui/SkeletonCard';
import {
  CalendarCheck, ClipboardList, GraduationCap, Zap,
  BookOpen, Clock, ChevronRight, Flame, Target,
} from 'lucide-react';
import {
  getGreeting, formatDateLong, toDateStr, formatTime12, minutesUntil,
} from '@/lib/dateUtils';
import { calculateLevel, xpInCurrentLevel, xpToNextLevel, XP_REWARDS } from '@/lib/xpSystem';
import {
  getTasks, updateTask, getSubjects, getMarks,
  getAttendance, getTimetable, getAssignments, getExams, updateActivity, updateUser,
} from '@/lib/firestore';
import { calcAttendance } from '@/lib/attendanceUtils';
import { formatCountdown } from '@/lib/dateUtils';
import Link from 'next/link';

const SUB_COLORS: Record<string, string> = {
  dsa: '#6366f1', dbms: '#8b5cf6', os: '#06b6d4', cn: '#10b981', se: '#f59e0b', maths: '#f43f5e',
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function DashboardPage() {
  const { userData, updateUserData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();

  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [academicStats, setAcademicStats] = useState<{
    avgScore: number;
    topSubject: any;
    focusSubject: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const [t, s, a, tt, asgn, ex] = await Promise.all([
          getTasks(uid), getSubjects(uid), getAttendance(uid),
          getTimetable(uid), getAssignments(uid), getExams(uid),
        ]);
        
        setTasks(t as any[]);
        setSubjects(s as any[]);
        setAttendance(a as any[]);
        setTimetable(tt as any[]);
        setAssignments(asgn as any[]);
        setExams(ex as any[]);

        // Fetch marks for all subjects to calculate insights
        const subjectsList = s as any[];
        if (subjectsList.length > 0) {
          const marksPromises = subjectsList.map(sub => getMarks(uid, sub.id));
          const allMarksResults = await Promise.all(marksPromises);
          
          let totalPct = 0;
          let count = 0;
          let highest = { pct: -1, sub: null as any };
          let lowest = { pct: 101, sub: null as any };

          allMarksResults.forEach((mList, idx) => {
            if (mList.length > 0) {
              const subPct = mList.reduce((acc, m: any) => acc + (m.obtained / m.maxMarks), 0) / mList.length;
              const pct100 = Math.round(subPct * 100);
              totalPct += pct100;
              count++;
              if (pct100 > highest.pct) highest = { pct: pct100, sub: subjectsList[idx] };
              if (pct100 < lowest.pct) lowest = { pct: pct100, sub: subjectsList[idx] };
            }
          });

          setAcademicStats({
            avgScore: count > 0 ? Math.round(totalPct / count) : 0,
            topSubject: highest.sub,
            focusSubject: lowest.sub
          });
        }
      } catch (err) {
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    if (!uid) return;
    try {
      await updateTask(uid, taskId, { done: true });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true } : t));
      await awardXP(XP_REWARDS.COMPLETE_TASK);
      await updateActivity(uid, toDateStr(), { tasksCompleted: 1 });
      triggerXPPopup(XP_REWARDS.COMPLETE_TASK);
      addToast('+10 XP! Task completed 🎉', 'success');
    } catch {
      addToast('Failed to complete task', 'error');
    }
  }, [uid, awardXP, triggerXPPopup, addToast]);

  const handlePomodoroComplete = useCallback(async () => {
    if (!uid) return;
    await awardXP(XP_REWARDS.COMPLETE_POMODORO);
    triggerXPPopup(XP_REWARDS.COMPLETE_POMODORO);
    addToast('+5 XP! Focus session complete! 🍅', 'success');
    await updateActivity(uid, toDateStr(), { studyMinutes: 25 });
  }, [uid, awardXP, triggerXPPopup, addToast]);

  // Time-aware data
  const today = new Date();
  const todayDow = today.getDay(); // 0-6
  const todayStr = toDateStr();

  const todayClasses = timetable
    .filter(t => t.dayOfWeek === todayDow)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Next class
  const nextClass = todayClasses.find(c => minutesUntil(c.endTime) > 0);
  const minsUntilNext = nextClass ? minutesUntil(nextClass.startTime) : null;

  // Attendance summary
  const overallAttendance = (() => {
    let p = 0, t = 0;
    attendance.forEach((a: any) => { p += (a.presentCount || 0); t += (a.totalClasses || 0); });
    return t > 0 ? Math.round((p / t) * 100) : 0;
  })();

  // Assignments due this week
  const dueThisWeek = assignments.filter((a: any) => {
    const diff = formatCountdown(a.dueDate).days;
    return diff >= 0 && diff <= 7 && a.status === 'pending';
  }).length;

  // Next exam
  const nextExam = exams
    .filter((e: any) => e.date >= todayStr)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))[0];
  const examCountdown = nextExam ? formatCountdown(nextExam.date).days : null;

  // Upcoming deadlines (next 3)
  const upcoming = [
    ...assignments.filter((a: any) => a.status === 'pending' && a.dueDate >= todayStr).map(a => ({ ...a, type: 'Assignment' })),
    ...exams.filter((e: any) => e.date >= todayStr).map(e => ({ ...e, title: `${e.subjectName} ${e.examType}`, dueDate: e.date, type: 'Exam' })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);

  const xp = userData?.xp ?? 0;
  const level = calculateLevel(xp);
  const xpInLvl = xpInCurrentLevel(xp);
  const toNext = xpToNextLevel(xp);
  const streak = userData?.currentStreak ?? 0;

  const completedToday = tasks.filter(t => t.done).length;

  return (
    <PageWrapper breadcrumb="Dashboard">
      {/* ── Greeting Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '20px', padding: '24px 28px', marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 50%, rgba(6,182,212,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
              {getGreeting()} • {formatDateLong()}
            </p>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '28px', color: 'var(--text)', marginBottom: '8px' }}>
              Hi, {userData?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              You've completed <span style={{ color: '#6366f1', fontWeight: 700 }}>{completedToday}/{tasks.length}</span> tasks today.{' '}
              {completedToday === tasks.length && tasks.length > 0 ? 'Amazing! 🔥' : 'Keep going!'}
            </p>
          </div>

          {/* XP + Streak block */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* XP card */}
            <div className="glass-card" style={{ borderRadius: '14px', padding: '14px 18px', minWidth: '160px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="level-badge" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', color: 'white', fontWeight: 700 }}>
                  Lv.{level}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{xp} XP total</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                {xpInLvl}/100 XP · {toNext} to Level {level + 1}
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLvl}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="glass-card" style={{ borderRadius: '14px', padding: '14px 18px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={22} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '22px', fontFamily: 'Sora,sans-serif', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                    {streak}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>day streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon={<CalendarCheck size={18} />} label="Attendance" value={`${overallAttendance}%`} sub="This month" color="#10b981" delay={0} />
        <StatCard icon={<ClipboardList size={18} />} label="Due this week" value={dueThisWeek} sub="assignments" color="#f59e0b" delay={0.06} />
        <StatCard icon={<GraduationCap size={18} />} label="Next exam in" value={examCountdown !== null ? `${examCountdown}d` : 'N/A'} sub={nextExam?.subjectName || 'No exams'} color="#f43f5e" delay={0.12} />
        <StatCard icon={<Zap size={18} />} label="Total XP" value={xp} sub={`Level ${level}`} color="#6366f1" delay={0.18} />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }} className="lg:grid block">

        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* Today's Timetable */}
          <div className="glass-card" style={{ borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                Today's Classes
              </h2>
              <Link href="/timetable" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Full schedule <ChevronRight size={14} />
              </Link>
            </div>

            {todayClasses.length > 0 ? (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                {todayClasses.map((c: any, i) => {
                  const minsLeft = minutesUntil(c.startTime);
                  const isNext = c.id === nextClass?.id;
                  const isNow = minutesUntil(c.startTime) <= 0 && minutesUntil(c.endTime) > 0;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        minWidth: '150px', borderRadius: '14px', padding: '14px',
                        background: isNow ? `${c.color}22` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isNow ? c.color + '60' : 'var(--border)'}`,
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                        {isNow && <span style={{ fontSize: '10px', color: c.color, fontWeight: 700, background: `${c.color}20`, padding: '2px 8px', borderRadius: '20px' }}>LIVE</span>}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{c.subjectName}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime12(c.startTime)} – {formatTime12(c.endTime)}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Room {c.room}</p>
                      {isNext && minsLeft > 0 && (
                        <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>
                          In {minsLeft} min
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                🎉 No classes today!
              </div>
            )}
          </div>

          {/* Today's Tasks */}
          <div className="glass-card" style={{ borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                Today's Tasks
              </h2>
              <span style={{
                fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
              }}>
                {completedToday}/{tasks.length}
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={56} />)}
              </div>
            ) : tasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map((task: any, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <TaskCard task={task} onComplete={handleCompleteTask} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No tasks yet. <Link href="/assignments" style={{ color: 'var(--primary)' }}>Add some →</Link>
              </div>
            )}
          </div>

          {/* Academic Intelligence Section */}
          <div className="glass-card" style={{ borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(139,92,246,0.05)', borderRadius: '50%', filter: 'blur(30px)' }} />
             
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
               <div>
                  <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--text)', marginBottom: '4px' }}>
                    Academic Intelligence
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Performance analysis across all subjects</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Sora,sans-serif' }}>{academicStats?.avgScore || 0}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Avg</div>
               </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="sm:grid-cols-2 grid-cols-1">
                {/* Top Subject */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: 'rgba(16,185,129,0.2)', padding: '6px', borderRadius: '10px' }}><Target size={16} color="#10b981" /></div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Top Performing</span>
                   </div>
                   {academicStats?.topSubject ? (
                      <div>
                         <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{academicStats.topSubject.name}</p>
                         <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Consistency is key! 🙌</p>
                      </div>
                   ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Add some marks to see! 📈</p>
                   )}
                </div>

                {/* Focus Subject */}
                <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '16px', padding: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: 'rgba(244,63,94,0.2)', padding: '6px', borderRadius: '10px' }}><Zap size={16} color="#f43f5e" /></div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>Needs Focus</span>
                   </div>
                   {academicStats?.focusSubject ? (
                      <div>
                         <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{academicStats.focusSubject.name}</p>
                         <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Check the vault for help! 📚</p>
                      </div>
                   ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Tracking your progress... 🔍</p>
                   )}
                </div>
             </div>

             <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={20} color="var(--primary)" />
                   </div>
                   <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Suggested next action:</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                         {academicStats?.focusSubject 
                           ? `Review chapter notes for ${academicStats.focusSubject.name} to boost your internal score.` 
                           : "Upload some study materials to the vault to earn more XP!"}
                      </p>
                   </div>
                   <Link href="/subjects">
                      <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}>Review</button>
                   </Link>
                </div>
             </div>
          </div>

          {/* Subject Progress Strip */}
          {subjects.length > 0 && (
            <div className="glass-card" style={{ borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                  Subject Progress
                </h2>
                <Link href="/subjects" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  All subjects <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                {subjects.map((s: any, i) => (
                  <Link key={s.id} href={`/subjects/${s.id}`} style={{ textDecoration: 'none', minWidth: '130px' }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="card-hover"
                      style={{
                        borderRadius: '14px', padding: '14px',
                        background: `${s.color}10`,
                        border: `1px solid ${s.color}30`,
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{s.name}</p>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${s.progress || 0}%`, height: '100%', background: s.color, borderRadius: '10px', transition: 'width 0.8s' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: s.color, fontWeight: 600, marginTop: '4px' }}>{s.progress || 0}%</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Pomodoro Timer */}
          <div className="glass-card" style={{ borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '16px', textAlign: 'left' }}>
              Focus Timer 🍅
            </h2>
            <PomodoroTimer onComplete={handlePomodoroComplete} />
          </div>

          {/* Upcoming Deadlines */}
          {upcoming.length > 0 && (
            <div className="glass-card" style={{ borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                  Upcoming Deadlines
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcoming.map((item: any, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <DeadlineCard
                      title={item.title}
                      subject={item.subjectName || item.subjectId}
                      subjectColor={SUB_COLORS[item.subjectId] || '#6366f1'}
                      dueDate={item.dueDate}
                      type={item.type}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass-card" style={{ borderRadius: '18px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text)', marginBottom: '14px' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { href: '/attendance', icon: <CalendarCheck size={18} />, label: 'Attendance', color: '#10b981' },
                { href: '/notes', icon: <BookOpen size={18} />, label: 'New Note', color: '#6366f1' },
                { href: '/subjects', icon: <Target size={18} />, label: 'Study', color: '#8b5cf6' },
                { href: '/timetable', icon: <Clock size={18} />, label: 'Timetable', color: '#06b6d4' },
              ].map(({ href, icon, label, color }) => (
                <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                  <button
                    className="btn-ghost card-hover"
                    style={{
                      width: '100%', padding: '12px',
                      borderRadius: '12px', display: 'flex',
                      flexDirection: 'column', alignItems: 'center',
                      gap: '6px', fontSize: '12px', fontWeight: 600,
                      color: color, border: `1px solid ${color}30`,
                      background: `${color}08`,
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
