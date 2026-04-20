'use client';
// app/leaderboard/page.tsx — Live leaderboard with rank, XP, level, streak
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useAppContext } from '@/context/AppContext';
import PageWrapper from '@/components/layout/PageWrapper';
import ProgressRing from '@/components/ui/ProgressRing';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getLeaderboard } from '@/lib/firestore';
import { calculateLevel, xpInCurrentLevel } from '@/lib/xpSystem';
import { Trophy, Flame, Zap, RefreshCw, Crown } from 'lucide-react';

const RANK_STYLES = [
  { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', icon: '🥇', glow: 'rgba(255,215,0,0.3)' },
  { gradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', icon: '🥈', glow: 'rgba(192,192,192,0.2)' },
  { gradient: 'linear-gradient(135deg, #CD7F32, #B8660B)', icon: '🥉', glow: 'rgba(205,127,50,0.2)' },
];

export default function LeaderboardPage() {
  const { userData } = useAuth();
  const { addToast } = useAppContext();

  const [leaders,   setLeaders]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const uid = userData?.uid;

  const load = async () => {
    try {
      const data = await getLeaderboard(20) as any[];
      setLeaders(data);
    } catch { addToast('Failed to load leaderboard', 'error'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const myEntry    = leaders.find(l => l.uid === uid);
  const myRank     = myEntry ? leaders.indexOf(myEntry) + 1 : null;
  const topThree   = leaders.slice(0, 3);
  const restRanked = leaders.slice(3);

  return (
    <PageWrapper breadcrumb="Leaderboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: '24px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={26} color="#f59e0b" />
            Leaderboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Top students ranked by XP · {leaders.length} players
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-ghost" style={{ padding: '9px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <RefreshCw size={15} style={{ animation: refreshing ? 'spinRing 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* My rank banner */}
      {myEntry && myRank && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '16px', padding: '14px 20px', marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', color: 'white' }}>
              {myEntry.name?.charAt(0) || 'Y'}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>Your Rank: #{myRank}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Level {calculateLevel(myEntry.xp)} · {myEntry.xp} XP
              </p>
            </div>
          </div>
          {myRank <= 3 && <Crown size={24} color="#f59e0b" />}
          <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
            {myRank === 1 ? '👑 #1 Top Student!'
              : myRank <= 5 ? '🔥 Top 5! Amazing!'
              : myRank <= 10 ? '⭐ Top 10!'
              : 'Keep earning XP to climb!'}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3,4,5].map(i => <SkeletonCard key={i} height={72} />)}
        </div>
      ) : leaders.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>
            Be the first on the board!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Complete tasks and quizzes to earn XP and appear in the leaderboard.
          </p>
        </div>
      ) : (
        <div>
          {/* ── Top 3 Podium ── */}
          {topThree.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'flex-end', justifyContent: 'center' }}
            >
              {/* 2nd place */}
              {topThree[1] && (
                <div style={{ flex: 1, maxWidth: '180px', textAlign: 'center' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 8px',
                    background: RANK_STYLES[1].gradient, boxShadow: `0 8px 24px ${RANK_STYLES[1].glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '22px', color: 'white', overflow: 'hidden',
                  }}>
                    {topThree[1].photoURL ? <img src={topThree[1].photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : topThree[1].name?.charAt(0) || '?'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{topThree[1].name?.split(' ')[0]}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{topThree[1].xp} XP</div>
                  <div style={{ height: '100px', background: RANK_STYLES[1].gradient, borderRadius: '12px 12px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: `0 8px 24px ${RANK_STYLES[1].glow}` }}>
                    🥈
                  </div>
                </div>
              )}

              {/* 1st place */}
              {topThree[0] && (
                <div style={{ flex: 1, maxWidth: '200px', textAlign: 'center' }}>
                  <Crown size={20} color="#FFD700" style={{ margin: '0 auto 4px', display: 'block' }} />
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 8px',
                    background: RANK_STYLES[0].gradient, boxShadow: `0 12px 36px ${RANK_STYLES[0].glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '26px', color: 'white', overflow: 'hidden',
                    border: '3px solid rgba(255,215,0,0.5)',
                  }}>
                    {topThree[0].photoURL ? <img src={topThree[0].photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : topThree[0].name?.charAt(0) || '?'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>{topThree[0].name?.split(' ')[0]}</div>
                  <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>{topThree[0].xp} XP</div>
                  <div style={{ height: '130px', background: RANK_STYLES[0].gradient, borderRadius: '12px 12px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', boxShadow: `0 12px 36px ${RANK_STYLES[0].glow}` }}>
                    🥇
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {topThree[2] && (
                <div style={{ flex: 1, maxWidth: '180px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px',
                    background: RANK_STYLES[2].gradient, boxShadow: `0 8px 24px ${RANK_STYLES[2].glow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '20px', color: 'white', overflow: 'hidden',
                  }}>
                    {topThree[2].photoURL ? <img src={topThree[2].photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : topThree[2].name?.charAt(0) || '?'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{topThree[2].name?.split(' ')[0]}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{topThree[2].xp} XP</div>
                  <div style={{ height: '70px', background: RANK_STYLES[2].gradient, borderRadius: '12px 12px 0 0', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: `0 8px 24px ${RANK_STYLES[2].glow}` }}>
                    🥉
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Ranked List ── */}
          <div className="glass-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span style={{ width: '32px' }}>#</span>
              <span style={{ flex: 1 }}>Student</span>
              <span style={{ width: '70px', textAlign: 'right' }}>Level</span>
              <span style={{ width: '80px', textAlign: 'right' }}>XP</span>
              <span style={{ width: '60px', textAlign: 'right' }}>Streak</span>
            </div>

            {leaders.map((leader, i) => {
              const isMe      = leader.uid === uid;
              const lv        = calculateLevel(leader.xp ?? 0);
              const xpInLvl   = xpInCurrentLevel(leader.xp ?? 0);
              const rank       = i + 1;
              const rankStyle  = RANK_STYLES[rank - 1];

              return (
                <motion.div
                  key={leader.uid || i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: isMe ? 'rgba(99,102,241,0.06)' : undefined,
                    borderLeft: isMe ? '3px solid #6366f1' : '3px solid transparent',
                  }}
                >
                  {/* Rank */}
                  <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                    {rank <= 3 ? (
                      <span style={{ fontSize: '20px' }}>{rankStyle.icon}</span>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)' }}>#{rank}</span>
                    )}
                  </div>

                  {/* Avatar + Name */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px', color: 'white', overflow: 'hidden',
                    }}>
                      {leader.photoURL
                        ? <img src={leader.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : leader.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {leader.name || 'Anonymous'}
                        </p>
                        {isMe && <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 700, background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '10px', flexShrink: 0 }}>You</span>}
                      </div>
                      {/* XP progress mini bar */}
                      <div style={{ width: '90px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${xpInLvl}%`, height: '100%', background: '#6366f1', borderRadius: '10px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div style={{ width: '70px', textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>
                      Lv.{lv}
                    </span>
                  </div>

                  {/* XP */}
                  <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <Zap size={12} color="#6366f1" />
                      <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                        {(leader.xp ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Streak */}
                  <div style={{ width: '60px', textAlign: 'right', flexShrink: 0 }}>
                    {(leader.currentStreak ?? 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <Flame size={13} color="#f59e0b" />
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b' }}>
                          {leader.currentStreak}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
