import React, { useState, useEffect } from 'react';
import {
  Crown, Target, Sun, Layers, Flame, Trophy, Volume2, VolumeX,
  Share2, Sparkles, CheckCircle2, Hash, Brain, Terminal, ArrowLeft,
  Play, Clock, HelpCircle, Star
} from 'lucide-react';
import QueensGame from '../components/games/QueensGame';
import PinpointGame from '../components/games/PinpointGame';
import TangoGame from '../components/games/TangoGame';
import CrossclimbGame from '../components/games/CrossclimbGame';
import SudokuGame from '../components/games/SudokuGame';
import MemoryMatrixGame from '../components/games/MemoryMatrixGame';
import WordleGame from '../components/games/WordleGame';
import { soundFx } from '../utils/audioEffects';

export default function GamesHub({ onNavigate }) {
  // activeGame: null (Lobby Screen) | 'sudoku' | 'queens' | 'memory' | 'wordle' | 'pinpoint' | 'tango' | 'crossclimb'
  const [activeGame, setActiveGame] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [muted, setMuted] = useState(() => soundFx.isMuted());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
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
        sudoku: false,
        queens: false,
        memory: false,
        wordle: false,
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
        setStats(prev => {
          const updated = {
            ...prev,
            streak: 1,
            completedToday: {
              sudoku: false,
              queens: false,
              memory: false,
              wordle: false,
              pinpoint: false,
              tango: false,
              crossclimb: false
            }
          };
          localStorage.setItem('jobagent_games_stats', JSON.stringify(updated));
          return updated;
        });
      } else if (diffDays === 1) {
        setStats(prev => {
          const updated = {
            ...prev,
            completedToday: {
              sudoku: false,
              queens: false,
              memory: false,
              wordle: false,
              pinpoint: false,
              tango: false,
              crossclimb: false
            }
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
      const isAlreadyCompletedToday = prev.completedToday?.[result.game];
      const newCompleted = { ...(prev.completedToday || {}), [result.game]: true };
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
    let text = `JobAgent.ai Daily Brain Studio 🧠 (${todayFormatted})\n`;
    text += `🔥 Streak: ${stats.streak} day${stats.streak > 1 ? 's' : ''}\n`;
    text += `🏆 Total Puzzles Solved: ${stats.totalSolved}\n\n`;
    text += `🔢 Sudoku: ${stats.completedToday?.sudoku ? '✅ Solved' : '⏳ In Progress'}\n`;
    text += `👑 Crowns: ${stats.completedToday?.queens ? '✅ Cleared' : '⏳ In Progress'}\n`;
    text += `🧠 Memory Matrix: ${stats.completedToday?.memory ? '✅ Trained' : '⏳ In Progress'}\n`;
    text += `🔠 Tech Wordle: ${stats.completedToday?.wordle ? '✅ Cracked' : '⏳ In Progress'}\n`;
    text += `🎯 Pinpoint: ${stats.completedToday?.pinpoint ? '✅ Solved' : '⏳ In Progress'}\n`;
    text += `☀️🌙 Tango: ${stats.completedToday?.tango ? '✅ Balanced' : '⏳ In Progress'}\n`;
    text += `🪜 Crossclimb: ${stats.completedToday?.crossclimb ? '✅ Conquered' : '⏳ In Progress'}\n\n`;
    text += `Play daily tech & brain logic games: https://jobagent.ai`;
    return text;
  };

  const handleCopyShare = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFx.playTap();
    setTimeout(() => setCopied(false), 2500);
  };

  const allGameItems = [
    {
      id: 'sudoku',
      title: 'Sudoku Studio',
      subtitle: 'Classic & Mini Grid',
      category: 'LOGIC',
      icon: Hash,
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.4)',
      badge: '9x9 & 6x6',
      description: 'Fill the grid with numbers 1 to 9 so every row, column, and 3x3 block contains each digit uniquely. Features candidate notes & live conflict highlights.'
    },
    {
      id: 'queens',
      title: 'Crowns (Queens)',
      subtitle: 'Territory Logic',
      category: 'LOGIC',
      icon: Crown,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      badge: 'LinkedIn Hit',
      description: 'Place exactly one crown in each row, column, and colored territory. Crowns cannot touch each other—not even diagonally!'
    },
    {
      id: 'memory',
      title: 'Memory Matrix',
      subtitle: 'Neuro Pattern Recall',
      category: 'MEMORY',
      icon: Brain,
      color: '#818cf8',
      glow: 'rgba(129, 140, 248, 0.4)',
      badge: 'Neuro Gym',
      description: 'Test your visuo-spatial memory span! Tiles flash briefly in a glowing pattern. Tap from memory to reproduce the exact matrix layout across 10 levels.'
    },
    {
      id: 'wordle',
      title: 'Tech Wordle',
      subtitle: '5-Letter Code Term',
      category: 'WORDS',
      icon: Terminal,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      badge: 'Code Word',
      description: 'Guess the secret 5-letter technical keyword (ASYNC, QUERY, STACK, REACT, REDIS) in 6 attempts with color-coded clue tiles.'
    },
    {
      id: 'pinpoint',
      title: 'Pinpoint',
      subtitle: 'Tech Association',
      category: 'MEMORY',
      icon: Target,
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.4)',
      badge: '5 Clues',
      description: 'Identify the common umbrella tech category connecting 5 progressive clues. Solve in fewer clues to maximize your score!'
    },
    {
      id: 'tango',
      title: 'Tango Grid',
      subtitle: 'Sun & Moon Balance',
      category: 'LOGIC',
      icon: Sun,
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.4)',
      badge: 'Balance',
      description: 'Balance Suns and Moons across a 6x6 grid. Exactly 3 of each per row and column, strictly no 3-in-a-row, and satisfy equality/difference constraints.'
    },
    {
      id: 'crossclimb',
      title: 'Crossclimb',
      subtitle: 'Word Ladder Trivia',
      category: 'WORDS',
      icon: Layers,
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
      badge: 'Word Climb',
      description: 'Climb from base to summit by guessing words from tech clues. Each successive word differs from the previous by exactly one letter.'
    }
  ];

  const filteredGames = categoryFilter === 'ALL'
    ? allGameItems
    : allGameItems.filter(g => g.category === categoryFilter);

  const currentGameConfig = allGameItems.find(g => g.id === activeGame);

  const GAME_RULES = {
    sudoku: {
      title: 'Sudoku Studio',
      tag: 'Classic & Mini Logic Grid',
      rules: [
        'Fill every cell with digits 1 to 9 (or 1 to 6 in Mini mode).',
        'Every row, column, and sub-box must contain each digit without duplicates.',
        'Tap a cell to highlight related lines and matching numbers.',
        'Toggle pencil "Notes" mode to track candidate numbers.'
      ],
      tips: 'Laptop: Keys 1-9, Backspace, Arrows, and N for notes. Mobile: Tap cell, then tap number pad.'
    },
    queens: {
      title: 'Crowns (Queens)',
      tag: 'Territory Logic',
      rules: [
        'Place exactly ONE Crown in each row, column, and colored territory region.',
        'No two Crowns can touch each other — not even diagonally!',
        'Tap a cell to cycle: Blank → X (Blocked) → 👑 Crown → Blank.',
        'Auto-X automatically marks non-touching cells when a crown is placed.'
      ],
      tips: 'Right-click or double-tap to place or remove a Crown immediately.'
    },
    memory: {
      title: 'Memory Matrix',
      tag: 'Neuro Spatial Recall',
      rules: [
        'Memorize illuminated tiles when they flash brightly.',
        'Tap the tiles from memory to reproduce the exact pattern.',
        'You have 3 lives. Advance through 10 progressive difficulty stages.'
      ],
      tips: 'Group tiles into geometric shapes (corners, clusters) to boost recall.'
    },
    wordle: {
      title: 'Tech Wordle',
      tag: '5-Letter Code Term',
      rules: [
        'Guess the secret 5-letter technical programming word in 6 tries.',
        '🟩 Green: Correct letter in the exact correct position.',
        '🟨 Yellow: Letter is in the word, but in a different position.',
        '⬜ Gray: Letter does not appear in the secret word.'
      ],
      tips: 'Start with vowel-heavy words like ASYNC or STACK to eliminate letters quickly.'
    },
    pinpoint: {
      title: 'Pinpoint',
      tag: 'Tech Association',
      rules: [
        'Uncover the secret tech umbrella category connecting 5 progressive clues.',
        'Type your guess in the box. Fewer clues revealed = higher score!',
        'Each wrong guess unlocks the next clue.'
      ],
      tips: 'Think about broad architectures, frameworks, protocols, and developer toolchains.'
    },
    tango: {
      title: 'Tango Grid',
      tag: 'Sun & Moon Balance',
      rules: [
        'Balance Suns ☀️ and Moons 🌙 across the 6x6 grid.',
        'Each row and column must contain exactly equal Suns and Moons (3 each).',
        'No three consecutive identical symbols (no ☀️☀️☀️ or 🌙🌙🌙).',
        'Satisfy edge constraints: "=" means identical; "x" means opposite!'
      ],
      tips: 'Look for two identical adjacent symbols — the cells on either side must be opposite!'
    },
    crossclimb: {
      title: 'Crossclimb',
      tag: 'Word Ladder Trivia',
      rules: [
        'Climb from the bottom base word to the summit word.',
        'Each rung clue describes a word that differs from adjacent rungs by exactly one letter.',
        'Solve all rungs to conquer the climb!'
      ],
      tips: 'Compare given top/bottom letters to deduce intermediate transitions.'
    }
  };

  const renderRulesModal = () => {
    if (!rulesModalOpen || !activeGame || !GAME_RULES[activeGame]) return null;
    const ruleInfo = GAME_RULES[activeGame];
    const IconComp = currentGameConfig?.icon || HelpCircle;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}
        onClick={() => setRulesModalOpen(false)}
      >
        <div
          style={{
            background: '#0c1220',
            border: `1px solid ${currentGameConfig?.color || '#6366f1'}`,
            boxShadow: `0 0 40px ${currentGameConfig?.glow || 'rgba(99, 102, 241, 0.3)'}`,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${currentGameConfig?.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComp size={20} color={currentGameConfig?.color} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                  How to Play: {ruleInfo.title}
                </h3>
                <span style={{ fontSize: '11px', color: currentGameConfig?.color, fontWeight: '700' }}>
                  {ruleInfo.tag}
                </span>
              </div>
            </div>
            <button
              onClick={() => setRulesModalOpen(false)}
              style={{ background: 'none', color: '#94a3b8', fontSize: '20px', padding: '4px', cursor: 'pointer', border: 'none' }}
            >
              ✕
            </button>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.7' }}>
              {ruleInfo.rules.map((r, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{r}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#a5b4fc', marginBottom: '18px' }}>
            <strong>💡 Pro Tip: </strong>{ruleInfo.tips}
          </div>

          <button
            onClick={() => setRulesModalOpen(false)}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${currentGameConfig?.color || '#6366f1'} 0%, #0369a1 100%)`,
              color: '#ffffff',
              fontWeight: '700',
              padding: '11px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: `0 4px 14px ${currentGameConfig?.glow}`
            }}
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    );
  };

  const renderShareModal = () => {
    if (!shareModalOpen) return null;
    return (
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
        zIndex: 2000,
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
              style={{ background: 'none', color: '#94a3b8', fontSize: '20px', padding: '4px', cursor: 'pointer', border: 'none' }}
            >
              ✕
            </button>
          </div>

          <textarea
            readOnly
            value={generateShareText()}
            rows={12}
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
                gap: '8px',
                border: 'none'
              }}
            >
              {copied ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Results Text'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // SCREEN 2: DEDICATED FULL-SCREEN NON-SCROLLABLE GAME ARENA
  // --------------------------------------------------------------------------
  if (activeGame && currentGameConfig) {
    const IconComponent = currentGameConfig.icon;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: '#070b14',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden'
      }}>
        {/* Persistent Compact Top Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0a0f1d',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 'calc(6px + env(safe-area-inset-top, 0px))',
          paddingBottom: '6px',
          paddingLeft: '10px',
          paddingRight: '10px',
          flexShrink: 0,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          gap: '8px'
        }}>
          {/* Back to Lobby Button */}
          <button
            onClick={() => {
              setActiveGame(null);
              soundFx.playTap();
            }}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '6px 10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <ArrowLeft size={16} />
            <span className="hide-on-mobile">All Games</span>
            <span className="show-on-mobile">Lobby</span>
          </button>

          {/* Center Title Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: `${currentGameConfig.color}22`,
              border: `1px solid ${currentGameConfig.color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={15} color={currentGameConfig.color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentGameConfig.title}
              </span>
              <span className="hide-on-mobile" style={{
                fontSize: '10px',
                color: currentGameConfig.color,
                background: `${currentGameConfig.color}18`,
                border: `1px solid ${currentGameConfig.color}33`,
                padding: '2px 6px',
                borderRadius: '5px',
                fontWeight: '700',
                whiteSpace: 'nowrap'
              }}>
                {currentGameConfig.badge}
              </span>
            </div>
          </div>

          {/* Right Action Controls (Rules, Sound, Share) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <button
              onClick={() => setRulesModalOpen(true)}
              title="How to Play / Rules"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '5px 8px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <HelpCircle size={14} />
              <span className="hide-on-mobile">Rules</span>
            </button>

            <button
              onClick={handleSoundToggle}
              title={muted ? 'Unmute' : 'Mute'}
              style={{
                background: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: muted ? '#64748b' : '#38bdf8',
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              title="Share Score"
              style={{
                background: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Dedicated Game Canvas Arena - RESPONSIVE & MOBILE-SAFE */}
        <div style={{
          flex: 1,
          width: '100%',
          maxWidth: '740px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '6px 10px calc(8px + env(safe-area-inset-bottom, 0px)) 10px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            margin: 'auto 0',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {activeGame === 'sudoku' && <SudokuGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'queens' && <QueensGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'memory' && <MemoryMatrixGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'wordle' && <WordleGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'pinpoint' && <PinpointGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'tango' && <TangoGame onPuzzleComplete={handlePuzzleComplete} />}
            {activeGame === 'crossclimb' && <CrossclimbGame onPuzzleComplete={handlePuzzleComplete} />}
          </div>
        </div>

        {/* Share Results Modal */}
        {renderShareModal()}

        {/* How to Play Rules Modal */}
        {renderRulesModal()}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 1: ALL GAMES LOBBY & CATALOG SCREEN
  // --------------------------------------------------------------------------
  return (
    <div className="games-hub-wrapper">
      {/* Lobby Hero Banner & Stats */}
      <div className="games-hero-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
            }}>
              ⚡ Daily Cognitive Arcade
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Select any game to enter full screen
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: '900', color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Brain Puzzles & Logic Games
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
            Sharpen mental stamina, memory retention, and algorithm intuition with daily brain challenges.
          </p>
        </div>

        {/* Global Stats & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Daily Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '7px 12px'
          }} title="Daily Puzzle Streak">
            <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>
                {stats.streak}
              </div>
              <div style={{ fontSize: '9px', color: '#d97706', textTransform: 'uppercase', fontWeight: '700' }}>
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
            padding: '7px 12px'
          }} title="Total Completed Puzzles">
            <Trophy size={18} color="#10b981" style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
                {stats.totalSolved}
              </div>
              <div style={{ fontSize: '9px', color: '#059669', textTransform: 'uppercase', fontWeight: '700' }}>
                Solved
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            title={muted ? 'Unmute' : 'Mute'}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: muted ? '#64748b' : '#38bdf8',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* Share */}
          <button
            onClick={() => setShareModalOpen(true)}
            title="Share Your Score"
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '8px',
        marginBottom: '18px',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'ALL', label: 'All Puzzles (7)' },
          { id: 'LOGIC', label: '🔢 Logic Grids' },
          { id: 'MEMORY', label: '🧠 Brain & Memory' },
          { id: 'WORDS', label: '🔠 Word & Code' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setCategoryFilter(cat.id);
              soundFx.playTap();
            }}
            style={{
              background: categoryFilter === cat.id ? '#6366f1' : '#0c1220',
              color: categoryFilter === cat.id ? '#ffffff' : '#94a3b8',
              border: `1px solid ${categoryFilter === cat.id ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
              padding: '7px 15px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: categoryFilter === cat.id ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* All Game Cards Grid (Catalog) */}
      <div className="games-grid">
        {filteredGames.map(game => {
          const IconComponent = game.icon;
          const isDoneToday = stats.completedToday?.[game.id];

          return (
            <div
              key={game.id}
              className="game-catalog-card"
              onClick={() => {
                setActiveGame(game.id);
                soundFx.playTap();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = game.color;
                e.currentTarget.style.boxShadow = `0 12px 30px ${game.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${game.color}20`,
                    border: `1px solid ${game.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 12px ${game.glow}`
                  }}>
                    <IconComponent size={22} color={game.color} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: game.color,
                      background: `${game.color}15`,
                      border: `1px solid ${game.color}33`,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {game.badge}
                    </span>
                    {isDoneToday && (
                      <span title="Completed Today" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '5px', fontSize: '10px', color: '#10b981', fontWeight: '700' }}>
                        <CheckCircle2 size={12} color="#10b981" /> Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#f8fafc', margin: '0 0 3px 0' }}>
                  {game.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                  {game.subtitle}
                </div>

                {/* Description */}
                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  {game.description}
                </p>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {isDoneToday ? 'Completed today' : 'Daily puzzle ready'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGame(game.id);
                    soundFx.playTap();
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${game.color} 0%, #0369a1 100%)`,
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${game.glow}`,
                    border: 'none'
                  }}
                >
                  <Play size={12} fill="#ffffff" /> Open Game
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Results Modal */}
      {renderShareModal()}
    </div>
  );
}
