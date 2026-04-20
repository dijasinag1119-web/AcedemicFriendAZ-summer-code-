'use client';
// app/subjects/[id]/page.tsx — Subject detail: Chapters, Notes, Quiz, Flashcards
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import FlashCard from '@/components/ui/FlashCard';
import ProgressRing from '@/components/ui/ProgressRing';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getSubjects, updateSubject } from '@/lib/firestore';
import { QUIZ_QUESTIONS, FLASHCARDS } from '@/lib/seedData';
import { XP_REWARDS } from '@/lib/xpSystem';
import { Check, Plus, ChevronLeft, ChevronRight, Clock, Award, BookOpen } from 'lucide-react';
import Link from 'next/link';

type TabType = 'chapters' | 'notes' | 'quiz' | 'flashcards';

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'chapters',   label: 'Chapters',   emoji: '📖' },
  { id: 'notes',      label: 'Notes',      emoji: '📝' },
  { id: 'quiz',       label: 'Quiz',       emoji: '🧠' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
];

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();

  const [subject,  setSubjectData] = useState<any>(null);
  const [loading,  setLoading]     = useState(true);
  const [tab,      setTab]         = useState<TabType>('chapters');
  const [addChapterMode, setAddChapterMode] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [savedNote, setSavedNote]  = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Quiz state
  const [quizStarted,  setQuizStarted]  = useState(false);
  const [quizQ,        setQuizQ]        = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore,    setQuizScore]    = useState(0);
  const [quizDone,     setQuizDone]     = useState(false);
  const [quizTime,     setQuizTime]     = useState(60);
  const [quizTimerId,  setQuizTimerId]  = useState<NodeJS.Timeout | null>(null);
  const [quizAnswers,  setQuizAnswers]  = useState<(number|null)[]>([]);

  // Flashcard state
  const [fcIndex,      setFcIndex]      = useState(0);
  const [remembered,   setRemembered]   = useState<Set<number>>(new Set());

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid || !id) return;
    loadSubject();
  }, [uid, id]);

  const loadSubject = async () => {
    if (!uid) return;
    try {
      const all = await getSubjects(uid) as any[];
      const sub = all.find((s: any) => s.id === id);
      setSubjectData(sub || null);
    } catch { addToast('Failed to load subject', 'error'); }
    finally { setLoading(false); }
  };

  const handleCompleteChapter = useCallback(async (chIdx: number) => {
    if (!uid || !subject) return;
    const chapters = [...(subject.chapters || [])];
    if (chapters[chIdx]?.status === 'done') return;
    chapters[chIdx] = { ...chapters[chIdx], status: 'done' };
    const done     = chapters.filter(c => c.status === 'done').length;
    const progress = chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0;
    try {
      await updateSubject(uid, id as string, { chapters, progress });
      setSubjectData((prev: any) => ({ ...prev, chapters, progress }));
      await awardXP(XP_REWARDS.COMPLETE_CHAPTER);
      triggerXPPopup(XP_REWARDS.COMPLETE_CHAPTER);
      addToast(`+${XP_REWARDS.COMPLETE_CHAPTER} XP! Chapter completed!`, 'success');
      if (progress === 100) {
        await awardXP(XP_REWARDS.COMPLETE_SUBJECT);
        triggerXPPopup(XP_REWARDS.COMPLETE_SUBJECT);
        addToast('🎉 Subject completed! +100 XP!', 'success');
      }
    } catch { addToast('Failed to save chapter', 'error'); }
  }, [uid, id, subject, awardXP, triggerXPPopup, addToast]);

  const handleAddChapter = async () => {
    if (!uid || !newChapterTitle.trim()) return;
    const newCh = { id: `ch_${Date.now()}`, title: newChapterTitle.trim(), status: 'not_started', notes: '' };
    const chapters = [...(subject?.chapters || []), newCh];
    try {
      await updateSubject(uid, id as string, { chapters });
      setSubjectData((prev: any) => ({ ...prev, chapters }));
      setNewChapterTitle('');
      setAddChapterMode(false);
      addToast('Chapter added!', 'success');
    } catch { addToast('Failed to add chapter', 'error'); }
  };

  const handleNoteChange = (chIdx: number, value: string) => {
    const chapters = [...(subject?.chapters || [])];
    chapters[chIdx] = { ...chapters[chIdx], notes: value };
    setSubjectData((prev: any) => ({ ...prev, chapters }));
    setSavedNote('saving');
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(async () => {
      if (!uid) return;
      await updateSubject(uid, id as string, { chapters });
      setSavedNote('saved');
      setTimeout(() => setSavedNote(null), 2000);
    }, 3000);
    setAutoSaveTimer(timer);
  };

  // Quiz logic
  const quizData = QUIZ_QUESTIONS[subject?.name] || [];

  const startQuiz = () => {
    setQuizStarted(true); setQuizQ(0); setQuizSelected(null);
    setQuizAnswered(false); setQuizScore(0); setQuizDone(false);
    setQuizTime(60); setQuizAnswers([]);
    startQuizTimer();
  };

  const startQuizTimer = () => {
    if (quizTimerId) clearInterval(quizTimerId);
    const t = setInterval(() => {
      setQuizTime(prev => {
        if (prev <= 1) { clearInterval(t); handleQuizNext(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    setQuizTimerId(t);
  };

  const handleQuizAnswer = (optIdx: number) => {
    if (quizAnswered) return;
    setQuizSelected(optIdx);
    setQuizAnswered(true);
    if (quizTimerId) clearInterval(quizTimerId);
    const correct = quizData[quizQ]?.answer === optIdx;
    if (correct) setQuizScore(prev => prev + 1);
    setQuizAnswers(prev => [...prev, optIdx]);
  };

  const handleQuizNext = (timeout = false) => {
    if (!timeout && quizAnswers.length <= quizQ) setQuizAnswers(prev => [...prev, null]);
    const nextQ = quizQ + 1;
    if (nextQ >= quizData.length) {
      setQuizDone(true);
      finishQuiz();
      return;
    }
    setQuizQ(nextQ); setQuizSelected(null); setQuizAnswered(false); setQuizTime(60);
    startQuizTimer();
  };

  const finishQuiz = async () => {
    if (!uid) return;
    const xpEarned = quizScore === quizData.length ? XP_REWARDS.QUIZ_PERFECT
      : quizScore / quizData.length >= 0.8 ? XP_REWARDS.QUIZ_GREAT
      : quizScore / quizData.length >= 0.5 ? XP_REWARDS.QUIZ_PASS : 0;
    if (xpEarned > 0) {
      await awardXP(xpEarned);
      triggerXPPopup(xpEarned);
      addToast(`Quiz complete! +${xpEarned} XP`, 'success');
    }
  };

  // Flashcard logic
  const fcData = FLASHCARDS[subject?.name] || [];

  const handleRemember = async (idx: number) => {
    setRemembered(prev => new Set(prev).add(idx));
    if (!uid) return;
    await awardXP(XP_REWARDS.REMEMBER_FLASHCARD);
    triggerXPPopup(XP_REWARDS.REMEMBER_FLASHCARD);
  };

  if (loading) return <PageWrapper><SkeletonCard height={400} /></PageWrapper>;
  if (!subject) return (
    <PageWrapper breadcrumb="Subject">
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Subject not found.</p>
        <Link href="/subjects"><button className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', marginTop: '16px' }}>← Back</button></Link>
      </div>
    </PageWrapper>
  );

  const chapters = subject.chapters || [];
  const doneCount = chapters.filter((c: any) => c.status === 'done').length;

  return (
    <PageWrapper breadcrumb={subject.name}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '20px', padding: '28px',
          background: `linear-gradient(135deg, ${subject.color}20 0%, ${subject.color}08 100%)`,
          border: `1px solid ${subject.color}30`,
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
        }}
      >
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px', flexShrink: 0,
          background: `${subject.color}25`, border: `2px solid ${subject.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
        }}>
          {subject.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--text)', marginBottom: '4px' }}>
            {subject.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {chapters.length} chapters · {subject.credits || 0} credits · {doneCount} completed
          </p>
        </div>
        <ProgressRing percent={subject.progress || 0} size={80} stroke={8} color={subject.color}>
          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '16px', color: subject.color }}>
            {subject.progress || 0}%
          </span>
        </ProgressRing>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              background: tab === t.id ? subject.color : 'transparent',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ─ CHAPTERS TAB ─ */}
      {tab === 'chapters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chapters.length === 0 && !addChapterMode && (
            <div className="glass-card" style={{ borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>No chapters yet</p>
              <button onClick={() => setAddChapterMode(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', fontSize: '14px' }}>
                + Add First Chapter
              </button>
            </div>
          )}

          {chapters.map((ch: any, i: number) => (
            <motion.div
              key={ch.id || i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{
                borderRadius: '14px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '14px',
                borderLeft: ch.status === 'done' ? '3px solid #10b981' : `3px solid ${subject.color}30`,
                opacity: ch.status === 'done' ? 0.7 : 1,
              }}
            >
              {/* Chapter number */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: ch.status === 'done' ? 'rgba(16,185,129,0.15)' : `${subject.color}15`,
                border: `1px solid ${ch.status === 'done' ? '#10b98140' : subject.color + '30'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700,
                color: ch.status === 'done' ? '#10b981' : subject.color,
              }}>
                {i + 1}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '14px', fontWeight: 600, color: 'var(--text)',
                  textDecoration: ch.status === 'done' ? 'line-through' : 'none',
                }}>
                  {ch.title}
                </p>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', marginTop: '4px', display: 'inline-block',
                  background: ch.status === 'done' ? 'rgba(16,185,129,0.1)' : ch.status === 'in_progress' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                  color: ch.status === 'done' ? '#10b981' : ch.status === 'in_progress' ? '#f59e0b' : 'var(--text-dim)',
                }}>
                  {ch.status === 'done' ? '✓ Done' : ch.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>

              {/* Complete button */}
              {ch.status !== 'done' && (
                <button
                  onClick={() => handleCompleteChapter(i)}
                  style={{
                    padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: `1px solid ${subject.color}40`,
                    background: `${subject.color}15`, color: subject.color,
                    display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  <Check size={12} /> Mark Done
                </button>
              )}
            </motion.div>
          ))}

          {/* Add chapter */}
          {addChapterMode ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ borderRadius: '14px', padding: '16px', display: 'flex', gap: '10px' }}>
              <input
                autoFocus
                className="input-field"
                placeholder="Chapter title..."
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setAddChapterMode(false); }}
              />
              <button onClick={handleAddChapter} disabled={!newChapterTitle.trim()} className="btn-primary" style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', fontSize: '13px', flexShrink: 0 }}>Add</button>
              <button onClick={() => setAddChapterMode(false)} className="btn-ghost" style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', flexShrink: 0 }}>Cancel</button>
            </motion.div>
          ) : (
            <button onClick={() => setAddChapterMode(true)} className="btn-ghost" style={{ padding: '12px', borderRadius: '14px', width: '100%', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Plus size={16} /> Add Chapter
            </button>
          )}
        </div>
      )}

      {/* ─ NOTES TAB ─ */}
      {tab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Click any chapter to add notes</p>
            {savedNote && (
              <span style={{ fontSize: '12px', color: savedNote === 'saving' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                {savedNote === 'saving' ? '● Saving...' : '✓ Saved'}
              </span>
            )}
          </div>
          {chapters.map((ch: any, i: number) => (
            <motion.div key={ch.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: subject.color, background: `${subject.color}15`, padding: '2px 8px', borderRadius: '20px' }}>Ch.{i + 1}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{ch.title}</span>
              </div>
              <textarea
                value={ch.notes || ''}
                onChange={e => handleNoteChange(i, e.target.value)}
                placeholder="Write your notes here… supports markdown"
                style={{
                  width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                  color: 'var(--text)', fontSize: '14px', lineHeight: 1.7, resize: 'vertical',
                  minHeight: '120px', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* ─ QUIZ TAB ─ */}
      {tab === 'quiz' && (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '32px' }}>
          {quizData.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No quiz questions available for this subject.</p>
            </div>
          ) : !quizStarted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧠</div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>
                {subject.name} Quiz
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{quizData.length} questions · 60 seconds each</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '28px' }}>
                Score 100% for +20 XP · 80%+ for +10 XP · 50%+ for +5 XP
              </p>
              <button onClick={startQuiz} className="btn-primary" style={{ padding: '14px 36px', borderRadius: '14px', border: 'none', fontSize: '15px' }}>
                Start Quiz
              </button>
            </div>
          ) : quizDone ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '72px', marginBottom: '16px' }}>
                {quizScore === quizData.length ? '🎉' : quizScore >= quizData.length * 0.8 ? '⭐' : quizScore >= quizData.length * 0.5 ? '👍' : '💪'}
              </div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '28px', color: 'var(--text)', marginBottom: '8px' }}>
                {quizScore}/{quizData.length} Correct
              </h2>
              <p style={{ color: subject.color, fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
                {Math.round((quizScore / quizData.length) * 100)}%
              </p>
              {/* Review */}
              <div style={{ textAlign: 'left', marginBottom: '28px' }}>
                {quizData.map((q, i) => {
                  const userAns = quizAnswers[i];
                  const correct = q.answer === userAns;
                  return (
                    <div key={i} style={{ marginBottom: '12px', padding: '12px', borderRadius: '10px', background: correct ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${correct ? '#10b98130' : '#f43f5e30'}` }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{i + 1}. {q.q}</p>
                      <p style={{ fontSize: '12px', color: '#10b981' }}>✓ {q.options[q.answer]}</p>
                      {!correct && userAns !== null && userAns !== undefined && (
                        <p style={{ fontSize: '12px', color: '#f43f5e' }}>✗ Your answer: {q.options[userAns]}</p>
                      )}
                      {(userAns === null || userAns === undefined) && <p style={{ fontSize: '12px', color: '#f59e0b' }}>Time out</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={startQuiz} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>
                Retake Quiz
              </button>
            </motion.div>
          ) : (
            <div>
              {/* Progress + Timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Question {quizQ + 1} of {quizData.length}
                  </p>
                  <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                    <div style={{ width: `${((quizQ + 1) / quizData.length) * 100}%`, height: '100%', background: subject.color, borderRadius: '10px', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  border: `3px solid ${quizTime < 10 ? '#f43f5e' : subject.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px',
                  color: quizTime < 10 ? '#f43f5e' : 'var(--text)',
                  transition: 'border-color 0.3s, color 0.3s',
                }}>
                  {quizTime}
                </div>
              </div>

              {/* Question */}
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '24px', lineHeight: 1.5 }}>
                {quizData[quizQ].q}
              </h3>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {quizData[quizQ].options.map((opt, oi) => {
                  const isCorrect  = quizData[quizQ].answer === oi;
                  const isSelected = quizSelected === oi;
                  let bg = 'rgba(255,255,255,0.04)';
                  let border = 'var(--border)';
                  let color = 'var(--text)';
                  if (quizAnswered) {
                    if (isCorrect) { bg = 'rgba(16,185,129,0.12)'; border = '#10b98140'; color = '#10b981'; }
                    else if (isSelected) { bg = 'rgba(244,63,94,0.12)'; border = '#f43f5e40'; color = '#f43f5e'; }
                  } else if (isSelected) { bg = `${subject.color}18`; border = `${subject.color}50`; color = subject.color; }

                  return (
                    <button
                      key={oi}
                      onClick={() => handleQuizAnswer(oi)}
                      disabled={quizAnswered}
                      style={{
                        padding: '14px 18px', borderRadius: '12px', textAlign: 'left',
                        background: bg, border: `1px solid ${border}`, color,
                        fontSize: '14px', fontWeight: 500, cursor: quizAnswered ? 'default' : 'pointer',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px',
                      }}
                    >
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                        color: 'var(--text-muted)',
                      }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizAnswered && (
                <button onClick={() => handleQuizNext()} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>
                  {quizQ + 1 < quizData.length ? 'Next Question →' : 'Finish Quiz'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─ FLASHCARDS TAB ─ */}
      {tab === 'flashcards' && (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '32px' }}>
          {fcData.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No flashcards available for this subject.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>
                  Flashcards
                </h2>
                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                  {remembered.size}/{fcData.length} remembered
                </span>
              </div>

              <FlashCard
                front={fcData[fcIndex].front}
                back={fcData[fcIndex].back}
                remembered={remembered.has(fcIndex)}
                onRemember={() => handleRemember(fcIndex)}
                cardIndex={fcIndex}
                total={fcData.length}
              />

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setFcIndex(i => Math.max(0, i - 1))}
                  disabled={fcIndex === 0}
                  className="btn-ghost"
                  style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => setFcIndex(i => Math.min(fcData.length - 1, i + 1))}
                  disabled={fcIndex === fcData.length - 1}
                  className="btn-ghost"
                  style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              {/* Dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                {fcData.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFcIndex(i)}
                    style={{
                      width: remembered.has(i) ? '20px' : '8px', height: '8px', borderRadius: '20px',
                      background: i === fcIndex ? subject.color : remembered.has(i) ? '#10b981' : 'rgba(255,255,255,0.15)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
