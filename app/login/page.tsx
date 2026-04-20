'use client';
// app/login/page.tsx — Split layout login with Google Auth
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import {
  Shield, Users, Zap, BookOpen, Trophy,
  TrendingUp, CheckCircle, Star,
} from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const { addToast } = useAppContext();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
      router.replace('/dashboard');
    } catch (err: any) {
      setSigningIn(false);
      addToast(
        err?.code === 'auth/popup-closed-by-user'
          ? 'Sign-in cancelled. Try again.'
          : 'Sign-in failed. Enable Google Auth in Firebase Console.',
        'error'
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* ── Left: Brand Hero (desktop only) ── */}
      <div
        style={{
          flex: '1', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0d1139 0%, #1a0a2e 50%, #0a1a30 100%)',
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
        }}
        className="lg-flex"
      >
        {/* Animated blobs */}
        {[
          { size: 300, top: '5%',  left: '5%',   color: 'rgba(99,102,241,0.15)',  anim: 'blobFloat1', dur: '10s' },
          { size: 240, top: '55%', right: '10%',  color: 'rgba(139,92,246,0.12)', anim: 'blobFloat2', dur: '13s' },
          { size: 160, top: '30%', right: '25%',  color: 'rgba(6,182,212,0.1)',   anim: 'blobFloat3', dur: '8s' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: b.size, height: b.size,
            top: b.top, left: (b as any).left, right: (b as any).right,
            borderRadius: '50%', background: b.color,
            filter: 'blur(60px)',
            animation: `${b.anim} ${b.dur} ease-in-out infinite`,
          }} />
        ))}

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '24px', color: 'white',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}>E</div>
            <div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '28px', color: 'white', display: 'block' }}>EduPro</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Student Management Platform</span>
            </div>
          </div>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 800,
            fontSize: '44px', lineHeight: 1.15, color: 'white', marginBottom: '20px',
          }}>
            Level up your{' '}
            <span style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>academic</span>{' '}journey
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: 1.7, maxWidth: '440px', marginBottom: '36px' }}>
            Track attendance, manage assignments, build study streaks, and compete on leaderboards — all in one beautiful platform.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Smart attendance calculator with skip/needed counter',
              'Gamified XP system with levels & achievements',
              'Pomodoro timer, flashcards, and timed quiz mode',
              'Real-time CGPA calculator and analytics charts',
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <CheckCircle size={16} color="#10b981" />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '20px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex' }}>
            {['#6366f1','#8b5cf6','#06b6d4','#10b981'].map((c, i) => (
              <div key={i} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${c}, ${c}88)`,
                border: '2px solid rgba(255,255,255,0.2)',
                marginLeft: i > 0 ? '-10px' : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: 'white', fontWeight: 700,
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '3px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              <strong style={{ color: 'white' }}>10,000+</strong> students trust EduPro daily
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Right: Login Card ── */}
      <div style={{
        width: '100%', maxWidth: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
          style={{ width: '100%', maxWidth: '360px' }}
        >
          {/* Mobile brand */}
          <div style={{ marginBottom: '36px', textAlign: 'center' }} className="lg-hidden">
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '28px', color: 'white',
              margin: '0 auto 14px',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}>E</div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--text)' }}>EduPro</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Your academic companion</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '26px', color: 'var(--text)', marginBottom: '8px' }}>
              Welcome back 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7 }}>
              Sign in to track attendance, manage assignments, and level up your academic life.
            </p>
          </div>

          {/* Google Sign In */}
          <motion.button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '15px 20px', borderRadius: '14px',
              background: 'white', border: '1.5px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', cursor: signingIn ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              opacity: signingIn ? 0.7 : 1,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px', fontWeight: 600, color: '#1a1a2e',
              transition: 'all 0.2s',
            }}
          >
            {signingIn ? (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spinRing 0.8s linear infinite' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {signingIn ? 'Signing in...' : 'Continue with Google'}
          </motion.button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Secure sign-in via Firebase</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
            {[
              { icon: <Shield size={12} />, text: 'Secure' },
              { icon: <Zap size={12} />, text: 'XP System' },
              { icon: <Trophy size={12} />, text: 'Leaderboard' },
              { icon: <TrendingUp size={12} />, text: 'Analytics' },
              { icon: <BookOpen size={12} />, text: 'Study Tools' },
            ].map(({ icon, text }, i) => (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '20px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                fontSize: '12px', fontWeight: 500, color: 'var(--primary)',
              }}>
                {icon} {text}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div style={{
            padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Users size={16} color="#10b981" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>10,000+</strong> students already using EduPro
            </p>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your data is synced securely with Firebase.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
