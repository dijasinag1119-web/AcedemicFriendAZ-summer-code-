'use client';
// app/profile/page.tsx — Profile with avatar, stats, edit, sign out
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import ProgressRing from '@/components/ui/ProgressRing';
import { updateUser } from '@/lib/firestore';
import { calculateLevel, xpInCurrentLevel, xpToNextLevel } from '@/lib/xpSystem';
import {
  Edit3, Save, LogOut, Flame, Zap, Mail, GraduationCap, Moon, Sun, Shield,
} from 'lucide-react';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Freshman', 2: 'Sophomore', 3: 'Junior', 4: 'Senior',
  5: 'Scholar', 6: 'Expert', 7: 'Master', 8: 'Genius', 9: 'Legend', 10: 'Grandmaster',
};

export default function ProfilePage() {
  const { userData, updateUserData, signOut } = useAuth();
  const { addToast, theme, toggleTheme } = useAppContext();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({ name: '', semester: '', branch: '', college: '' });

  useEffect(() => {
    if (userData) {
      setForm({
        name:     userData.name     || '',
        semester: userData.semester || '',
        branch:   userData.branch   || '',
        college:  userData.college  || '',
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!userData?.uid) return;
    setSaving(true);
    try {
      await updateUser(userData.uid, form);
      await updateUserData(form);
      setEditing(false);
      addToast('Profile updated!', 'success');
    } catch { addToast('Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    try { await signOut(); }
    catch { addToast('Sign out failed', 'error'); }
  };

  if (!userData) return null;

  const xp    = userData.xp ?? 0;
  const level = calculateLevel(xp);
  const xpPct = xpInCurrentLevel(xp);
  const toNext = xpToNextLevel(xp);
  const streak = userData.currentStreak ?? 0;
  const title  = LEVEL_TITLES[Math.min(level, 10)] || 'Grandmaster';
  const initial = userData.name?.charAt(0)?.toUpperCase() || '?';

  const joinDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <PageWrapper breadcrumb="Profile">
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            borderRadius: '24px', padding: '32px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'rgba(99,102,241,0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '36px', color: 'white',
                boxShadow: '0 12px 40px rgba(99,102,241,0.4)', overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.15)',
              }}>
                {userData.photoURL
                  ? <img src={userData.photoURL} alt={userData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial}
              </div>
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', background: '#10b981', border: '3px solid var(--surface)' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--text)' }}>
                  {userData.name || 'Student'}
                </h1>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                  Lv.{level} • {title}
                </span>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} /> {userData.email}
              </p>

              {(userData.branch || userData.college) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={13} />
                  {[userData.branch, userData.semester && `Sem ${userData.semester}`, userData.college]
                    .filter(Boolean).join(' · ')}
                </p>
              )}

              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '2px' }}>Joined {joinDate}</p>

              {/* XP Bar */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{xp} XP total</span>
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{toNext} XP to Level {level + 1}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Flame size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '22px', color: '#f59e0b', lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>day streak</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Zap size={18} color="#6366f1" />
                <div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '22px', color: '#6366f1', lineHeight: 1 }}>{xp}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>total XP</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Edit Profile ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Profile Information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditing(false); setForm({ name: userData.name || '', semester: userData.semester || '', branch: userData.branch || '', college: userData.college || '' }); }}
                  className="btn-ghost" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', border: 'none' }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Full Name',            field: 'name',     placeholder: 'Your full name' },
              { label: 'College / University', field: 'college',  placeholder: 'e.g., BITS Pilani' },
              { label: 'Branch / Department',  field: 'branch',   placeholder: 'e.g., Computer Science' },
              { label: 'Current Semester',     field: 'semester', placeholder: 'e.g., 5' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>{label}</label>
                {editing ? (
                  <input
                    className="input-field"
                    placeholder={placeholder}
                    value={(form as any)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                ) : (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '14px', color: (userData as any)[field] ? 'var(--text)' : 'var(--text-dim)' }}>
                    {(userData as any)[field] || <span style={{ fontStyle: 'italic' }}>Not set</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <Mail size={15} color="var(--text-dim)" />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', flex: 1 }}>{userData.email}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Verified</span>
            </div>
          </div>
        </motion.div>

        {/* ── Settings ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', marginBottom: '20px' }}>Settings</h2>

          {/* Dark/Light toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {theme === 'dark' ? <Moon size={18} color="var(--text-muted)" /> : <Sun size={18} color="#f59e0b" />}
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Switch between dark and light themes</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: '52px', height: '28px', borderRadius: '50px', position: 'relative',
                background: theme === 'dark' ? '#6366f1' : 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.3s',
              }}
            >
              <div style={{
                position: 'absolute', top: '4px',
                left: theme === 'dark' ? '26px' : '4px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'white', transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <Shield size={18} color="var(--text-muted)" />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Data & Privacy</p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>All data is encrypted and stored securely in Firebase Firestore.</p>
            </div>
          </div>
        </motion.div>

        {/* ── Sign Out ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card" style={{ borderRadius: '20px', padding: '24px', border: '1px solid rgba(244,63,94,0.12)' }}>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '18px', color: '#f43f5e', marginBottom: '16px' }}>Account</h2>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '13px 20px', borderRadius: '12px', width: '100%',
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
              color: '#f43f5e', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={18} />
            Sign Out of EduPro
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
