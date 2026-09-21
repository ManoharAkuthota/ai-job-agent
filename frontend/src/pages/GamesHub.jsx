import React, { useState, useEffect } from 'react';
import { Crown, Target, Sun, Layers, Flame, Trophy, Volume2, VolumeX, HelpCircle, Share2, Sparkles, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import QueensGame from '../components/games/QueensGame';
import PinpointGame from '../components/games/PinpointGame';
import TangoGame from '../components/games/TangoGame';
import CrossclimbGame from '../components/games/CrossclimbGame';
import { soundFx } from '../utils/audioEffects';

export default function GamesHub({ onNavigate }) {
  const [activeGame, setActiveGame] = useState('queens'); // 'queens' | 'pinpoint' | 'tango' | 'crossclimb'
  const [muted, setMuted] = useState(() => soundFx.isMuted());
  const [rulesOpen, setRulesOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Daily Streak & Solved stats persisted in localStorage
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('jobagent_games_stats');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      streak: 1,
      totalSolved: 0,
      lastSolvedDate: null,
      completedToday: {
        queens: false,
        pinpoint: false,
        tango: false,
        crossclimb: false
      }
    };
  });

  // Check if today is a new calendar day to maintain streak
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (stats.lastSolvedDate && stats.lastSolvedDate !== todayStr) {
      const lastDate = new Date(stats.lastSolvedDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak broken
        setStats(prev => {
          const updated = {
            ...prev,
            streak: 1,
            completedToday: { queens: false, pinpoint: false, tango: false, crossclimb: false }
          };
          localStorage.setItem('jobagent_games_stats', JSON.stringify(updated));
          return updated;
        });
      } else if (diffDays === 1) {
        // New day started!
        setStats(prev => {
          const updated = {
            ...prev,
            completedToday: { queens: false, pinpoint: false, tango: false, crossclimb: false }
          };
          localStorage.setItem('jobagent_games_stats', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, []);

  const handleSoundToggle = () => {
    const nextMute = soundFx.toggleMute();
    setMuted(nextMute);
    if (!nextMute) {
      soundFx.playTap();
    }
  };

  const handlePuzzleComplete = (result) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setStats(prev => {
      const isAlreadyCompletedToday = prev.completedToday[result.game];
      const newCompleted = { ...prev.completedToday, [result.game]: true };
      const newTotal = prev.totalSolved + (isAlreadyCompletedToday ? 0 : 1);
      const newStreak = prev.lastSolvedDate === todayStr ? prev.streak : prev.streak + 1;

      const updated = {
        ...prev,
        streak: newStreak,
        totalSolved: newTotal,
        lastSolvedDate: todayStr,
        completedToday: newCompleted
      };
      localStorage.setItem('jobagent_games_stats', JSON.stringify(updated));
      return updated;
    });
  };

  const generateShareText = () => {
    const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let text = `JobAgent.ai Daily Puzzles 🧠 (${todayFormatted})\n`;
    text += `🔥 Streak: ${stats.streak} day${stats.streak > 1 ? 's' : ''}\n`;
    text += `🏆 Total Puzzles Solved: ${stats.totalSolved}\n\n`;
    text += `👑 Queens: ${stats.completedToday.queens ? '✅ Cleared' : '⏳ In Progress'}\n`;
    text += `🎯 Pinpoint: ${stats.completedToday.pinpoint ? '✅ Solved' : '⏳ In Progress'}\n`;
    text += `☀️🌙 Tango: ${stats.completedToday.tango ? '✅ Balanced' : '⏳ In Progress'}\n`;
    text += `🪜 Crossclimb: ${stats.completedToday.crossclimb ? '✅ Conquered' : '⏳ In Progress'}\n\n`;
    text += `Play daily tech & logic puzzles: https://jobagent.ai`;
    return text;
  };

  const handleCopyShare = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFx.playTap();
    setTimeout(() => setCopied(false), 2500);
  };

  const gameNavItems = [
    {
      id: 'queens',
      title: 'Crowns',
      subtitle: 'Territory Logic',
      icon: Crown,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      tag: 'Queens'
    },
    {
      id: 'pinpoint',
      title: 'Pinpoint',
      subtitle: 'Tech Association',
      icon: Target,
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.4)',
      tag: '5 Clues'
    },
    {
      id: 'tango',
      title: 'Tango',
      subtitle: 'Sun & Moon Grid',
      icon: Sun,
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.4)',
      tag: 'Balance'
    },
    {
      id: 'crossclimb',
      title: 'Crossclimb',
      subtitle: 'Word Ladder',
      icon: Layers,
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
      tag: 'Trivia'
    }
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Banner & Profile Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        background: 'linear-gradient(135deg, #090e1a 0%, #111827 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              Daily Mind Gym
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              LinkedIn-Inspired Tech Puzzles
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Puzzles & Games Studio
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Sharpen cognitive stamina, flex algorithmic reasoning, and master daily brain teasers.
          </p>
        </div>

        {/* Global Stats & Sound Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Daily Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '8px 14px'
          }} title="Daily Puzzle Streak">
            <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>
                {stats.streak}
              </div>
              <div style={{ fontSize: '10px', color: '#d97706', textTransform: 'uppercase', fontWeight: '700' }}>
                Streak
              </div>
            </div>
          </div>

          {/* Total Solved */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '8px 14px'
          }} title="Total Completed Puzzles">
            <Trophy size={18} color="#10b981" style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
                {stats.totalSolved}
              </div>
              <div style={{ fontSize: '10px', color: '#059669', textTransform: 'uppercase', fontWeight: '700' }}>
                Solved
              </div>
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleSoundToggle}
            title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: muted ? '#64748b' : '#38bdf8',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            title="Share Your Results"
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Game Selector Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {gameNavItems.map(item => {
          const IconComponent = item.icon;
          const isActive = activeGame === item.id;
          const isDoneToday = stats.completedToday[item.id];

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveGame(item.id);
                soundFx.playTap();
              }}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #111827 0%, #0e1628 100%)'
                  : '#070b14',
                border: `1.5px solid ${isActive ? item.color : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 4px 20px ${item.glow}` : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isActive ? `${item.color}22` : 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconComponent size={20} color={item.color} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                    {item.title}
                  </span>
                  {isDoneToday && (
                    <span title="Completed Today" style={{ display: 'inline-flex' }}>
                      <CheckCircle2 size={14} color="#10b981" />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.subtitle}
                </div>
              </div>

              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '6px',
                  height: '100%',
                  background: item.color
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Puzzle Screen Container */}
      <div style={{
        background: '#070b14',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
      }}>
        {activeGame === 'queens' && <QueensGame onPuzzleComplete={handlePuzzleComplete} />}
        {activeGame === 'pinpoint' && <PinpointGame onPuzzleComplete={handlePuzzleComplete} />}
        {activeGame === 'tango' && <TangoGame onPuzzleComplete={handlePuzzleComplete} />}
        {activeGame === 'crossclimb' && <CrossclimbGame onPuzzleComplete={handlePuzzleComplete} />}
      </div>

      {/* Share / Results Modal */}
      {shareModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#0c1220',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '420px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#818cf8" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  Share Your Daily Score
                </h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{ background: 'none', color: '#94a3b8', fontSize: '20px', padding: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <textarea
              readOnly
              value={generateShareText()}
              rows={9}
              style={{
                background: '#070b14',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'none',
                width: '100%',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCopyShare}
                style={{
                  flex: 1,
                  background: copied
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {copied ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Results Text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
