'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import FlashCard from '@/components/ui/FlashCard';
import ProgressRing from '@/components/ui/ProgressRing';
import SkeletonCard from '@/components/ui/SkeletonCard';
import Modal from '@/components/ui/Modal';
import {
  getSubjects, updateSubject,
  getMarks, addMark, deleteMark,
  getMaterials, addMaterial, deleteMaterial,
} from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { QUIZ_QUESTIONS, FLASHCARDS } from '@/lib/seedData';
import { XP_REWARDS } from '@/lib/xpSystem';
import {
  Check, Plus, ChevronLeft, ChevronRight, Trash2,
  FileText, Image as ImageIcon, Music, Video, Link2,
  BookOpen, Upload, Search, X, Award,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabType = 'chapters' | 'notes' | 'marks' | 'vault' | 'quiz' | 'flashcards';
type ExamType = 'Test' | 'Mid Sem' | 'End Sem' | 'Assignment' | 'Practical';
type MaterialType = 'pdf' | 'image' | 'audio' | 'video_link' | 'resource_link' | 'other';

interface Mark {
  id: string;
  examType: ExamType;
  examName: string;
  obtained: number;
  maxMarks: number;
  date: string;
  notes?: string;
}

interface Material {
  id: string;
  title: string;
  type: MaterialType;
  chapter: string;
  url: string;
  storagePath?: string;
  fileSize?: string;
  notes?: string;
  uploadedAt?: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'chapters',   label: 'Chapters',   emoji: '📖' },
  { id: 'notes',      label: 'Notes',      emoji: '📝' },
  { id: 'marks',      label: 'Marks',      emoji: '📊' },
  { id: 'vault',      label: 'Study Vault',emoji: '📁' },
  { id: 'quiz',       label: 'Quiz',       emoji: '🧠' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
];

const EXAM_TYPES: ExamType[] = ['Test', 'Mid Sem', 'End Sem', 'Assignment', 'Practical'];

const EXAM_COLORS: Record<ExamType, string> = {
  'Test':       '#6366f1',
  'Mid Sem':    '#06b6d4',
  'End Sem':    '#f43f5e',
  'Assignment': '#10b981',
  'Practical':  '#f59e0b',
};

const MATERIAL_TYPES: { id: MaterialType; label: string; icon: React.ReactNode; accept?: string; isLink?: boolean }[] = [
  { id: 'pdf',          label: 'PDF',          icon: <FileText size={16} />,  accept: '.pdf,application/pdf' },
  { id: 'image',        label: 'Image/Screenshot', icon: <ImageIcon size={16} />, accept: 'image/*' },
  { id: 'audio',        label: 'Audio Note',   icon: <Music size={16} />,    accept: 'audio/*' },
  { id: 'other',        label: 'PPT / Other',  icon: <Upload size={16} />,   accept: '.ppt,.pptx,.doc,.docx,.txt,.zip,*' },
  { id: 'video_link',   label: 'YouTube Link', icon: <Video size={16} />,    isLink: true },
  { id: 'resource_link',label: 'Resource URL', icon: <Link2 size={16} />,    isLink: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPercent(obtained: number, max: number) {
  if (!max) return 0;
  return Math.round((obtained / max) * 100);
}

function getGrade(pct: number) {
  if (pct >= 90) return { label: 'A+', color: '#10b981' };
  if (pct >= 80) return { label: 'A',  color: '#10b981' };
  if (pct >= 70) return { label: 'B',  color: '#06b6d4' };
  if (pct >= 60) return { label: 'C',  color: '#f59e0b' };
  if (pct >= 50) return { label: 'D',  color: '#f59e0b' };
  return { label: 'F', color: '#f43f5e' };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getYtThumbnail(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userData, awardXP } = useAuth();
  const { addToast, triggerXPPopup } = useAppContext();

  const [subject, setSubjectData]     = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<TabType>('chapters');
  const [addChapterMode, setAddChapterMode] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [savedNote, setSavedNote]     = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Marks state
  const [marks, setMarks]             = useState<Mark[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [markModal, setMarkModal]     = useState(false);
  const [markForm, setMarkForm]       = useState<{
    examType: ExamType; examName: string; obtained: string; maxMarks: string; date: string; notes: string;
  }>({ examType: 'Test', examName: '', obtained: '', maxMarks: '', date: new Date().toISOString().slice(0,10), notes: '' });
  const [savingMark, setSavingMark]   = useState(false);

  // Vault state
  const [materials, setMaterials]     = useState<Material[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultModal, setVaultModal]   = useState(false);
  const [vaultFilter, setVaultFilter] = useState<MaterialType | 'all'>('all');
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultChapterFilter, setVaultChapterFilter] = useState('all');
  const [materialForm, setMaterialForm] = useState<{
    title: string; type: MaterialType; chapter: string; url: string; notes: string;
  }>({ title: '', type: 'pdf', chapter: '', url: '', notes: '' });
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // Quiz state
  const [quizStarted, setQuizStarted]   = useState(false);
  const [quizQ, setQuizQ]               = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore]       = useState(0);
  const [quizDone, setQuizDone]         = useState(false);
  const [quizTime, setQuizTime]         = useState(60);
  const [quizTimerId, setQuizTimerId]   = useState<NodeJS.Timeout | null>(null);
  const [quizAnswers, setQuizAnswers]   = useState<(number|null)[]>([]);

  // Flashcard state
  const [fcIndex, setFcIndex]           = useState(0);
  const [remembered, setRemembered]     = useState<Set<number>>(new Set());

  const uid = userData?.uid;

  useEffect(() => { if (uid && id) { loadSubject(); } }, [uid, id]);
  useEffect(() => { if (uid && id && tab === 'marks') loadMarks(); }, [uid, id, tab]);
  useEffect(() => { if (uid && id && tab === 'vault') loadMaterials(); }, [uid, id, tab]);

  const loadSubject = async () => {
    if (!uid) return;
    try {
      const all = await getSubjects(uid) as any[];
      const sub = all.find((s: any) => s.id === id);
      setSubjectData(sub || null);
    } catch { addToast('Failed to load subject', 'error'); }
    finally { setLoading(false); }
  };

  const loadMarks = async () => {
    if (!uid || !id) return;
    setMarksLoading(true);
    try {
      const data = await getMarks(uid, id as string) as Mark[];
      setMarks(data);
    } catch { addToast('Failed to load marks', 'error'); }
    finally { setMarksLoading(false); }
  };

  const loadMaterials = async () => {
    if (!uid || !id) return;
    setVaultLoading(true);
    try {
      const data = await getMaterials(uid, id as string) as Material[];
      setMaterials(data);
    } catch { addToast('Failed to load materials', 'error'); }
    finally { setVaultLoading(false); }
  };

  // ─── Chapter handlers ────────────────────────────────────────────────────────

  const handleCompleteChapter = useCallback(async (chIdx: number) => {
    if (!uid || !subject) return;
    const chapters = [...(subject.chapters || [])];
    if (chapters[chIdx]?.status === 'done') return;
    chapters[chIdx] = { ...chapters[chIdx], status: 'done' };
    const done = chapters.filter(c => c.status === 'done').length;
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

  // ─── Marks handlers ──────────────────────────────────────────────────────────

  const handleAddMark = async () => {
    if (!uid || !id || !markForm.examName.trim() || !markForm.obtained || !markForm.maxMarks) return;
    setSavingMark(true);
    try {
      const data = {
        examType: markForm.examType,
        examName: markForm.examName.trim(),
        obtained: Number(markForm.obtained),
        maxMarks: Number(markForm.maxMarks),
        date: markForm.date,
        notes: markForm.notes,
      };
      const docRef = await addMark(uid, id as string, data);
      setMarks(prev => [...prev, { id: (docRef as any).id, ...data } as Mark]);
      setMarkModal(false);
      setMarkForm({ examType: 'Test', examName: '', obtained: '', maxMarks: '', date: new Date().toISOString().slice(0,10), notes: '' });
      addToast('Mark added!', 'success');
    } catch { addToast('Failed to add mark', 'error'); }
    finally { setSavingMark(false); }
  };

  const handleDeleteMark = async (markId: string) => {
    if (!uid || !id) return;
    if (!confirm('Delete this mark entry?')) return;
    try {
      await deleteMark(uid, id as string, markId);
      setMarks(prev => prev.filter(m => m.id !== markId));
      addToast('Mark deleted', 'success');
    } catch { addToast('Failed to delete mark', 'error'); }
  };

  // ─── Marks summary calculations ───────────────────────────────────────────

  const marksSummary = EXAM_TYPES.map(et => {
    const group = marks.filter(m => m.examType === et);
    if (!group.length) return null;
    const avg = Math.round(group.reduce((a, m) => a + getPercent(m.obtained, m.maxMarks), 0) / group.length);
    return { type: et, count: group.length, avg };
  }).filter(Boolean);

  // ─── Vault handlers ───────────────────────────────────────────────────────────

  const handleUploadMaterial = async () => {
    if (!uid || !id || !materialForm.title.trim()) return;
    const isLink = materialForm.type === 'video_link' || materialForm.type === 'resource_link';
    if (!isLink && !uploadFile) { addToast('Please select a file', 'error'); return; }
    if (isLink && !materialForm.url.trim()) { addToast('Please enter a URL', 'error'); return; }
    setSavingMaterial(true);
    try {
      let finalUrl = materialForm.url;
      let storagePath: string | undefined;
      let fileSize: string | undefined;

      if (!isLink && uploadFile) {
        storagePath = `users/${uid}/subjects/${id}/materials/${Date.now()}_${uploadFile.name}`;
        const storageRef = ref(storage, storagePath);
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, uploadFile);
          task.on(
            'state_changed',
            (snap) => {
              const pct = snap.totalBytes > 0
                ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
                : 0;
              setUploadProgress(pct);
            },
            (error: any) => {
              let msg = 'Upload failed';
              if (error?.code === 'storage/unauthorized') {
                msg = '🔒 Storage rules blocking upload. In Firebase Console → Storage → Rules, set: allow read, write: if request.auth != null;';
              } else if (error?.code === 'storage/unauthenticated') {
                msg = 'You must be logged in to upload.';
              } else if (error?.code === 'storage/quota-exceeded') {
                msg = 'Firebase Storage quota exceeded.';
              } else if (error?.message) {
                msg = `Upload error: ${error.message}`;
              }
              addToast(msg, 'error');
              console.error('Firebase Storage error:', error?.code, error?.message);
              reject(error);
            },
            async () => {
              finalUrl = await getDownloadURL(task.snapshot.ref);
              resolve();
            }
          );
        });
        fileSize = formatFileSize(uploadFile.size);
      }

      const data: Record<string, unknown> = {
        title: materialForm.title.trim(),
        type: materialForm.type,
        chapter: materialForm.chapter || 'General',
        url: finalUrl,
        notes: materialForm.notes,
        ...(storagePath && { storagePath }),
        ...(fileSize && { fileSize }),
      };
      const docRef = await addMaterial(uid, id as string, data);
      setMaterials(prev => [...prev, { id: (docRef as any).id, ...data } as Material]);
      setVaultModal(false);
      resetVaultForm();
      addToast('Material added!', 'success');
    } catch (err: any) {
      if (!String(err?.code).startsWith('storage/')) {
        addToast(`Failed: ${err?.message || 'Unknown error'}`, 'error');
        console.error('Upload error:', err);
      }
    } finally {
      setSavingMaterial(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMaterial = async (mat: Material) => {
    if (!uid || !id) return;
    if (!confirm('Delete this material?')) return;
    try {
      // Delete from Firebase Storage if it's an uploaded file
      if (mat.storagePath) {
        try { await deleteObject(ref(storage, mat.storagePath)); } catch { /* ignore */ }
      }
      await deleteMaterial(uid, id as string, mat.id);
      setMaterials(prev => prev.filter(m => m.id !== mat.id));
      addToast('Material deleted', 'success');
    } catch { addToast('Failed to delete material', 'error'); }
  };

  const resetVaultForm = () => {
    setMaterialForm({ title: '', type: 'pdf', chapter: '', url: '', notes: '' });
    setUploadFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Quiz logic ───────────────────────────────────────────────────────────────

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
    setQuizSelected(optIdx); setQuizAnswered(true);
    if (quizTimerId) clearInterval(quizTimerId);
    if (quizData[quizQ]?.answer === optIdx) setQuizScore(prev => prev + 1);
    setQuizAnswers(prev => [...prev, optIdx]);
  };
  const handleQuizNext = (timeout = false) => {
    if (!timeout && quizAnswers.length <= quizQ) setQuizAnswers(prev => [...prev, null]);
    const nextQ = quizQ + 1;
    if (nextQ >= quizData.length) { setQuizDone(true); finishQuiz(); return; }
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

  // ─── Flashcard logic ──────────────────────────────────────────────────────────

  const fcData = FLASHCARDS[subject?.name] || [];
  const handleRemember = async (idx: number) => {
    setRemembered(prev => new Set(prev).add(idx));
    if (!uid) return;
    await awardXP(XP_REWARDS.REMEMBER_FLASHCARD);
    triggerXPPopup(XP_REWARDS.REMEMBER_FLASHCARD);
  };

  // ─── Vault filtered list ──────────────────────────────────────────────────────

  const chapters = subject?.chapters || [];
  const chapterNames = ['General', ...chapters.map((c: any) => c.title)];

  const filteredMaterials = materials.filter(m => {
    const matchType = vaultFilter === 'all' || m.type === vaultFilter;
    const matchChapter = vaultChapterFilter === 'all' || m.chapter === vaultChapterFilter;
    const matchSearch = !vaultSearch || m.title.toLowerCase().includes(vaultSearch.toLowerCase()) || m.chapter.toLowerCase().includes(vaultSearch.toLowerCase());
    return matchType && matchChapter && matchSearch;
  });

  const groupedMaterials: Record<string, Material[]> = {};
  filteredMaterials.forEach(m => {
    if (!groupedMaterials[m.chapter]) groupedMaterials[m.chapter] = [];
    groupedMaterials[m.chapter].push(m);
  });

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <PageWrapper><SkeletonCard height={400} /></PageWrapper>;
  if (!subject) return (
    <PageWrapper breadcrumb="Subject">
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Subject not found.</p>
        <Link href="/subjects"><button className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', marginTop: '16px' }}>← Back</button></Link>
      </div>
    </PageWrapper>
  );

  const doneCount = chapters.filter((c: any) => c.status === 'done').length;

  return (
    <PageWrapper breadcrumb={subject.name}>

      {/* ── Subject header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '20px', padding: '24px 28px',
          background: `linear-gradient(135deg, ${subject.color}20 0%, ${subject.color}08 100%)`,
          border: `1px solid ${subject.color}30`,
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
        }}
      >
        <div style={{
          width: '68px', height: '68px', borderRadius: '18px', flexShrink: 0,
          background: `${subject.color}25`, border: `2px solid ${subject.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
        }}>
          {subject.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)', marginBottom: '4px' }}>
            {subject.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {chapters.length} chapters · {subject.credits || 0} credits · {doneCount} completed
          </p>
        </div>
        <ProgressRing percent={subject.progress || 0} size={76} stroke={8} color={subject.color}>
          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '15px', color: subject.color }}>
            {subject.progress || 0}%
          </span>
        </ProgressRing>
      </motion.div>

      {/* ── Tab bar ── */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', width: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                background: tab === t.id ? subject.color : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─ CHAPTERS TAB ─ */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
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
                opacity: ch.status === 'done' ? 0.75 : 1,
              }}
            >
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
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', textDecoration: ch.status === 'done' ? 'line-through' : 'none' }}>
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
              {ch.status !== 'done' && (
                <button onClick={() => handleCompleteChapter(i)} style={{
                  padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${subject.color}40`,
                  background: `${subject.color}15`, color: subject.color,
                  display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', flexShrink: 0,
                }}>
                  <Check size={12} /> Mark Done
                </button>
              )}
            </motion.div>
          ))}
          {addChapterMode ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ borderRadius: '14px', padding: '16px', display: 'flex', gap: '10px' }}>
              <input autoFocus className="input-field" placeholder="Chapter title..." value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setAddChapterMode(false); }} />
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─ NOTES TAB ─ */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
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
                placeholder="Write your notes here…"
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '14px', lineHeight: 1.7, resize: 'vertical', minHeight: '120px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
            </motion.div>
          ))}
          {chapters.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Add chapters first to write notes.</p>}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─ MARKS TAB ─ */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'marks' && (
        <div>
          {/* Summary cards */}
          {marksSummary.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {marksSummary.map(s => {
                const grade = getGrade(s!.avg);
                return (
                  <motion.div
                    key={s!.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card"
                    style={{ borderRadius: '16px', padding: '16px', textAlign: 'center', border: `1px solid ${EXAM_COLORS[s!.type as ExamType]}30` }}
                  >
                    <div style={{ fontSize: '22px', fontWeight: 800, color: grade.color, fontFamily: 'Sora,sans-serif' }}>{s!.avg}%</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: grade.color, background: `${grade.color}15`, padding: '2px 8px', borderRadius: '20px', display: 'inline-block', margin: '4px 0' }}>{grade.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{s!.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s!.count} entries</div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Add mark button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setMarkModal(true)} className="btn-primary" style={{ padding: '9px 20px', borderRadius: '11px', border: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Plus size={15} /> Add Mark
            </button>
          </div>

          {/* Marks table */}
          {marksLoading ? (
            <SkeletonCard height={200} />
          ) : marks.length === 0 ? (
            <div className="glass-card" style={{ borderRadius: '18px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>No marks recorded yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Track your Test, Mid Sem, and End Sem scores here.</p>
              <button onClick={() => setMarkModal(true)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '13px' }}>+ Add First Mark</button>
            </div>
          ) : (
            <div className="glass-card" style={{ borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                      {['Exam', 'Type', 'Date', 'Score', '%', 'Grade', 'Notes', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marks.sort((a, b) => b.date.localeCompare(a.date)).map((m, i) => {
                      const pct = getPercent(m.obtained, m.maxMarks);
                      const grade = getGrade(pct);
                      return (
                        <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{m.examName}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: `${EXAM_COLORS[m.examType]}18`, color: EXAM_COLORS[m.examType] }}>
                              {m.examType}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.date}</td>
                          <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{m.obtained}/{m.maxMarks}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', minWidth: '60px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: grade.color, borderRadius: '10px', transition: 'width 0.6s' }} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: grade.color }}>{pct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: grade.color, fontFamily: 'Sora,sans-serif' }}>{grade.label}</span>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => handleDeleteMark(m.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─ STUDY VAULT TAB ─ */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'vault' && (
        <div>
          {/* Controls row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                className="input-field"
                placeholder="Search materials…"
                value={vaultSearch}
                onChange={e => setVaultSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>
            {/* Chapter filter */}
            <select className="input-field" value={vaultChapterFilter} onChange={e => setVaultChapterFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '13px', minWidth: '140px' }}>
              <option value="all">All Chapters</option>
              {chapterNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Type filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {([['all','All'], ['pdf','PDF'], ['image','Images'], ['audio','Audio'], ['video_link','YouTube'], ['resource_link','Links'], ['other','Other']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setVaultFilter(key as any)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    background: vaultFilter === key ? subject.color : 'rgba(255,255,255,0.05)',
                    color: vaultFilter === key ? 'white' : 'var(--text-muted)',
                    border: `1px solid ${vaultFilter === key ? subject.color : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>
            <button onClick={() => setVaultModal(true)} className="btn-primary" style={{ padding: '9px 18px', borderRadius: '11px', border: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
              <Upload size={15} /> Add Material
            </button>
          </div>

          {/* Materials grouped by chapter */}
          {vaultLoading ? (
            <div style={{ display: 'grid', gap: '12px' }}>{[1,2,3].map(i => <SkeletonCard key={i} height={80} />)}</div>
          ) : Object.keys(groupedMaterials).length === 0 ? (
            <div className="glass-card" style={{ borderRadius: '18px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>Study Vault is empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Upload PDFs, images, audio, PPTs, or add YouTube links — organized by chapter.</p>
              <button onClick={() => setVaultModal(true)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '13px' }}>+ Add First Material</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {Object.entries(groupedMaterials).map(([chapter, mats]) => (
                <div key={chapter}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <BookOpen size={15} color={subject.color} />
                    <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '14px', color: subject.color }}>{chapter}</h3>
                    <div style={{ flex: 1, height: '1px', background: `${subject.color}20` }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{mats.length} items</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {mats.map(mat => (
                      <MaterialCard key={mat.id} mat={mat} subjectColor={subject.color} onDelete={() => handleDeleteMaterial(mat)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─ QUIZ TAB ─ */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'quiz' && (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '32px' }}>
          {quizData.length === 0 ? (
            <div style={{ textAlign: 'center' }}><p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No quiz questions available for this subject.</p></div>
          ) : !quizStarted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧠</div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>{subject.name} Quiz</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>{quizData.length} questions · 60 seconds each</p>
              <button onClick={startQuiz} className="btn-primary" style={{ padding: '14px 36px', borderRadius: '14px', border: 'none', fontSize: '15px' }}>Start Quiz</button>
            </div>
          ) : quizDone ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '72px', marginBottom: '16px' }}>{quizScore === quizData.length ? '🎉' : quizScore >= quizData.length * 0.8 ? '⭐' : '👍'}</div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '28px', color: 'var(--text)', marginBottom: '4px' }}>{quizScore}/{quizData.length} Correct</h2>
              <p style={{ color: subject.color, fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>{Math.round((quizScore / quizData.length) * 100)}%</p>
              <button onClick={startQuiz} className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px' }}>Retake Quiz</button>
            </motion.div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '6px' }}>Question {quizQ + 1} of {quizData.length}</p>
                  <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                    <div style={{ width: `${((quizQ + 1) / quizData.length) * 100}%`, height: '100%', background: subject.color, borderRadius: '10px', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: `3px solid ${quizTime < 10 ? '#f43f5e' : subject.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '16px', color: quizTime < 10 ? '#f43f5e' : 'var(--text)', transition: 'border-color 0.3s, color 0.3s' }}>
                  {quizTime}
                </div>
              </div>
              <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '24px', lineHeight: 1.5 }}>{quizData[quizQ].q}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {quizData[quizQ].options.map((opt: string, oi: number) => {
                  const isCorrect = quizData[quizQ].answer === oi;
                  const isSelected = quizSelected === oi;
                  let bg = 'rgba(255,255,255,0.04)', border = 'var(--border)', color = 'var(--text)';
                  if (quizAnswered) {
                    if (isCorrect) { bg = 'rgba(16,185,129,0.12)'; border = '#10b98140'; color = '#10b981'; }
                    else if (isSelected) { bg = 'rgba(244,63,94,0.12)'; border = '#f43f5e40'; color = '#f43f5e'; }
                  } else if (isSelected) { bg = `${subject.color}18`; border = `${subject.color}50`; color = subject.color; }
                  return (
                    <button key={oi} onClick={() => handleQuizAnswer(oi)} disabled={quizAnswered}
                      style={{ padding: '14px 18px', borderRadius: '12px', textAlign: 'left', background: bg, border: `1px solid ${border}`, color, fontSize: '14px', fontWeight: 500, cursor: quizAnswered ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
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
            <div style={{ textAlign: 'center' }}><p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No flashcards available for this subject.</p></div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Flashcards</h2>
                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '20px' }}>{remembered.size}/{fcData.length} remembered</span>
              </div>
              <FlashCard front={fcData[fcIndex].front} back={fcData[fcIndex].back} remembered={remembered.has(fcIndex)} onRemember={() => handleRemember(fcIndex)} cardIndex={fcIndex} total={fcData.length} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setFcIndex(i => Math.max(0, i - 1))} disabled={fcIndex === 0} className="btn-ghost" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><ChevronLeft size={16} /> Previous</button>
                <button onClick={() => setFcIndex(i => Math.min(fcData.length - 1, i + 1))} disabled={fcIndex === fcData.length - 1} className="btn-ghost" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>Next <ChevronRight size={16} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                {fcData.map((_: any, i: number) => (
                  <button key={i} onClick={() => setFcIndex(i)} style={{ width: remembered.has(i) ? '20px' : '8px', height: '8px', borderRadius: '20px', background: i === fcIndex ? subject.color : remembered.has(i) ? '#10b981' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Add Mark Modal */}
      <Modal open={markModal} onClose={() => setMarkModal(false)} title="Add Exam Mark">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Exam Type</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EXAM_TYPES.map(et => (
                <button key={et} onClick={() => setMarkForm(f => ({ ...f, examType: et }))}
                  style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${markForm.examType === et ? EXAM_COLORS[et] : 'var(--border)'}`, background: markForm.examType === et ? `${EXAM_COLORS[et]}20` : 'transparent', color: markForm.examType === et ? EXAM_COLORS[et] : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {et}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Exam Name *</label>
            <input className="input-field" placeholder="e.g., Unit 1 Test, Midterm" value={markForm.examName} onChange={e => setMarkForm(f => ({ ...f, examName: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Marks Obtained *</label>
              <input type="number" className="input-field" placeholder="e.g., 42" value={markForm.obtained} onChange={e => setMarkForm(f => ({ ...f, obtained: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Max Marks *</label>
              <input type="number" className="input-field" placeholder="e.g., 50" value={markForm.maxMarks} onChange={e => setMarkForm(f => ({ ...f, maxMarks: e.target.value }))} />
            </div>
          </div>
          {markForm.obtained && markForm.maxMarks && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: `${getGrade(getPercent(Number(markForm.obtained), Number(markForm.maxMarks))).color}15`, border: `1px solid ${getGrade(getPercent(Number(markForm.obtained), Number(markForm.maxMarks))).color}30`, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Sora,sans-serif', fontSize: '22px', fontWeight: 800, color: getGrade(getPercent(Number(markForm.obtained), Number(markForm.maxMarks))).color }}>
                {getPercent(Number(markForm.obtained), Number(markForm.maxMarks))}%
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: getGrade(getPercent(Number(markForm.obtained), Number(markForm.maxMarks))).color }}>
                Grade: {getGrade(getPercent(Number(markForm.obtained), Number(markForm.maxMarks))).label}
              </span>
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
            <input type="date" className="input-field" value={markForm.date} onChange={e => setMarkForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
            <input className="input-field" placeholder="e.g., Lost marks in Q3" value={markForm.notes} onChange={e => setMarkForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleAddMark} disabled={!markForm.examName.trim() || !markForm.obtained || !markForm.maxMarks || savingMark} className="btn-primary" style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', marginTop: '4px' }}>
            {savingMark ? 'Saving…' : 'Save Mark'}
          </button>
        </div>
      </Modal>

      {/* Add Material Modal */}
      <Modal open={vaultModal} onClose={() => { setVaultModal(false); resetVaultForm(); }} title="Add Study Material">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Material Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {MATERIAL_TYPES.map(mt => (
                <button key={mt.id} onClick={() => { setMaterialForm(f => ({ ...f, type: mt.id })); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  style={{ padding: '10px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexDirection: 'column', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${materialForm.type === mt.id ? subject.color : 'var(--border)'}`, background: materialForm.type === mt.id ? `${subject.color}18` : 'rgba(255,255,255,0.02)', color: materialForm.type === mt.id ? subject.color : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {mt.icon}
                  <span style={{ fontSize: '11px' }}>{mt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input className="input-field" placeholder="e.g., Chapter 3 Notes, Calculus Lecture" value={materialForm.title} onChange={e => setMaterialForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Chapter / Topic</label>
            <select className="input-field" value={materialForm.chapter} onChange={e => setMaterialForm(f => ({ ...f, chapter: e.target.value }))}>
              <option value="">General</option>
              {chapterNames.filter(c => c !== 'General').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* File or URL input */}
          {(materialForm.type === 'video_link' || materialForm.type === 'resource_link') ? (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {materialForm.type === 'video_link' ? 'YouTube URL' : 'Resource URL'} *
              </label>
              <input className="input-field" placeholder={materialForm.type === 'video_link' ? 'https://youtube.com/watch?v=...' : 'https://...'} value={materialForm.url} onChange={e => setMaterialForm(f => ({ ...f, url: e.target.value }))} />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>File *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '1px dashed var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                {uploadFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <FileText size={16} color={subject.color} />
                    <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{uploadFile.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>({formatFileSize(uploadFile.size)})</span>
                    <button onClick={e => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}><X size={13} /></button>
                  </div>
                ) : (
                  <div>
                    <Upload size={20} style={{ margin: '0 auto 8px', color: 'var(--text-dim)' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click to browse or drag & drop</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>PDF, Images, PPT, Audio, and more</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={MATERIAL_TYPES.find(m => m.id === materialForm.type)?.accept || '*'}
                style={{ display: 'none' }}
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              {/* Upload progress */}
              {savingMaterial && uploadProgress > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: subject.color, borderRadius: '10px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', textAlign: 'right' }}>{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
            <input className="input-field" placeholder="Quick description or tag" value={materialForm.notes} onChange={e => setMaterialForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <button onClick={handleUploadMaterial} disabled={!materialForm.title.trim() || savingMaterial} className="btn-primary" style={{ padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', marginTop: '4px' }}>
            {savingMaterial ? `Uploading… ${uploadProgress}%` : 'Add to Vault'}
          </button>
        </div>
      </Modal>

    </PageWrapper>
  );
}

// ─── Material Card Component ──────────────────────────────────────────────────

function MaterialCard({ mat, subjectColor, onDelete }: { mat: Material; subjectColor: string; onDelete: () => void }) {
  const TYPE_INFO: Record<MaterialType, { icon: React.ReactNode; color: string; label: string }> = {
    pdf:           { icon: <FileText size={18} />,    color: '#f43f5e', label: 'PDF' },
    image:         { icon: <ImageIcon size={18} />,   color: '#06b6d4', label: 'Image' },
    audio:         { icon: <Music size={18} />,       color: '#10b981', label: 'Audio' },
    video_link:    { icon: <Video size={18} />,       color: '#f59e0b', label: 'YouTube' },
    resource_link: { icon: <Link2 size={18} />,       color: '#8b5cf6', label: 'Link' },
    other:         { icon: <FileText size={18} />,    color: '#94a3b8', label: 'File' },
  };

  const info = TYPE_INFO[mat.type] || TYPE_INFO.other;
  const ytThumb = mat.type === 'video_link' ? getYtThumbnail(mat.url) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${info.color}20` }}
    >
      {/* YouTube thumbnail */}
      {ytThumb && (
        <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
          <img src={ytThumb} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color="white" />
            </div>
          </div>
        </div>
      )}

      {/* Audio inline player */}
      {mat.type === 'audio' && (
        <div style={{ padding: '12px 16px 0', background: `${info.color}08` }}>
          <audio controls style={{ width: '100%', height: '32px' }} src={mat.url} />
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Type badge + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: `${info.color}15`, border: `1px solid ${info.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
            {info.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: `${info.color}15`, color: info.color }}>{info.label}</span>
              {mat.fileSize && <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{mat.fileSize}</span>}
            </div>
          </div>
        </div>

        {mat.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.notes}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <a href={mat.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '7px 12px', borderRadius: '9px', background: `${info.color}15`, border: `1px solid ${info.color}30`, color: info.color, fontSize: '12px', fontWeight: 600, textDecoration: 'none', textAlign: 'center', transition: 'background 0.15s' }}>
            {mat.type === 'video_link' ? '▶ Watch' : mat.type === 'resource_link' ? '🔗 Open' : mat.type === 'audio' ? '🎵 Download' : '📥 Open'}
          </a>
          <button onClick={onDelete} style={{ padding: '7px 10px', borderRadius: '9px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
