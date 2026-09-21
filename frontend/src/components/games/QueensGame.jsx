import React, { useState, useEffect, useCallback } from 'react';
import { Crown, X as XIcon, RotateCcw, Undo2, Lightbulb, Trophy, AlertTriangle, Sparkles, Timer, ChevronRight } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

// 100% Mathematically Verified Solvable Levels with Contiguous Colored Territories
// Exactly 1 queen per row, column, and color region with NO orthogonal or diagonal touching!
const QUEENS_LEVELS = [
  {
    id: 'queens_casual_6x6',
    name: 'Casual Mosaic (6x6)',
    size: 6,
    difficulty: 'Casual',
    regions: [
      [0, 0, 0, 0, 1, 1],
      [2, 2, 0, 1, 1, 1],
      [2, 2, 2, 3, 3, 1],
      [4, 2, 3, 3, 3, 3],
      [4, 4, 4, 5, 3, 3],
      [4, 4, 5, 5, 5, 5]
    ],
    solution: [[0, 2], [1, 5], [2, 1], [3, 4], [4, 0], [5, 3]]
  },
  {
    id: 'queens_standard_6x6',
    name: 'Crown Lattice (6x6)',
    size: 6,
    difficulty: 'Standard',
    regions: [
      [1, 0, 0, 0, 0, 2],
      [1, 1, 0, 0, 2, 2],
      [1, 3, 3, 2, 2, 4],
      [3, 3, 3, 5, 4, 4],
      [3, 3, 5, 5, 4, 4],
      [5, 5, 5, 5, 4, 4]
    ],
    solution: [[0, 3], [1, 0], [2, 4], [3, 1], [4, 5], [5, 2]]
  },
  {
    id: 'queens_daily_7x7',
    name: 'Daily Challenge (7x7)',
    size: 7,
    difficulty: 'Medium',
    regions: [
      [0, 0, 0, 0, 0, 1, 1],
      [2, 2, 0, 0, 1, 1, 1],
      [2, 2, 2, 3, 3, 1, 1],
      [4, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 5, 5, 5, 3],
      [6, 4, 4, 5, 5, 5, 5],
      [6, 6, 6, 6, 5, 5, 5]
    ],
    solution: [[0, 3], [1, 6], [2, 2], [3, 5], [4, 1], [5, 4], [6, 0]]
  },
  {
    id: 'queens_master_8x8',
    name: 'Grand Territory (8x8)',
    size: 8,
    difficulty: 'Master',
    regions: [
      [0, 0, 0, 0, 1, 1, 1, 2],
      [3, 0, 0, 1, 1, 1, 2, 2],
      [3, 3, 0, 4, 4, 1, 2, 2],
      [3, 3, 3, 4, 4, 5, 2, 2],
      [3, 3, 4, 4, 4, 5, 5, 5],
      [7, 3, 4, 4, 6, 6, 5, 5],
      [7, 7, 7, 6, 6, 6, 6, 5],
      [7, 7, 7, 7, 6, 6, 5, 5]
    ],
    solution: [[0, 2], [1, 5], [2, 7], [3, 0], [4, 3], [5, 6], [6, 4], [7, 1]]
  }
];

// High-contrast, color-blind friendly dark OLED palette
const REGION_PALETTES = [
  { bg: 'rgba(5, 150, 105, 0.32)', border: '#059669', name: 'Emerald' },
  { bg: 'rgba(99, 102, 241, 0.32)', border: '#6366f1', name: 'Indigo' },
  { bg: 'rgba(168, 85, 247, 0.32)', border: '#a855f7', name: 'Purple' },
  { bg: 'rgba(245, 158, 11, 0.32)', border: '#f59e0b', name: 'Amber' },
  { bg: 'rgba(236, 72, 153, 0.32)', border: '#ec4899', name: 'Pink' },
  { bg: 'rgba(6, 182, 212, 0.32)', border: '#06b6d4', name: 'Cyan' },
  { bg: 'rgba(239, 68, 68, 0.32)', border: '#ef4444', name: 'Rose' },
  { bg: 'rgba(148, 163, 184, 0.28)', border: '#94a3b8', name: 'Slate' }
];

export default function QueensGame({ onPuzzleComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = QUEENS_LEVELS[levelIndex];
  const { size, regions, solution } = currentLevel;

  const [grid, setGrid] = useState(() => Array(size).fill(null).map(() => Array(size).fill(null)));
  const [history, setHistory] = useState([]);
  const [autoCross, setAutoCross] = useState(true);
  const [conflicts, setConflicts] = useState(new Set());
  const [isWon, setIsWon] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [moveCount, setMoveCount] = useState(0);
  const [hintMessage, setHintMessage] = useState('');

  // Reset board when levelIndex changes
  useEffect(() => {
    setGrid(Array(currentLevel.size).fill(null).map(() => Array(currentLevel.size).fill(null)));
    setHistory([]);
    setConflicts(new Set());
    setIsWon(false);
    setTimerSeconds(0);
    setTimerActive(true);
    setMoveCount(0);
    setHintMessage('');
  }, [levelIndex]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (timerActive && !isWon) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isWon]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Conflict calculation & win condition checker
  const evaluateBoard = useCallback((currentGrid) => {
    const n = currentLevel.size;
    const currentRegions = currentLevel.regions;
    const newConflicts = new Set();
    const queens = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (currentGrid[r][c] === 'Q') {
          queens.push({ r, c, region: currentRegions[r][c] });
        }
      }
    }

    // Check pairwise conflicts
    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const q1 = queens[i];
        const q2 = queens[j];

        const sameRow = q1.r === q2.r;
        const sameCol = q1.c === q2.c;
        const sameRegion = q1.region === q2.region;
        const adjacentTouch = Math.abs(q1.r - q2.r) <= 1 && Math.abs(q1.c - q2.c) <= 1;

        if (sameRow || sameCol || sameRegion || adjacentTouch) {
          newConflicts.add(`${q1.r},${q1.c}`);
          newConflicts.add(`${q2.r},${q2.c}`);
        }
      }
    }

    setConflicts(newConflicts);

    // Check win condition: exactly N queens, 0 conflicts, 1 per row, col, region
    if (queens.length === n && newConflicts.size === 0) {
      const rows = new Set(queens.map(q => q.r));
      const cols = new Set(queens.map(q => q.c));
      const regs = new Set(queens.map(q => q.region));

      if (rows.size === n && cols.size === n && regs.size === n) {
        setIsWon(true);
        setTimerActive(false);
        soundFx.playWin();
        if (onPuzzleComplete) {
          onPuzzleComplete({
            game: 'queens',
            levelId: currentLevel.id,
            time: timerSeconds,
            moves: moveCount
          });
        }
      }
    }
  }, [currentLevel, onPuzzleComplete, timerSeconds, moveCount]);

  // Click cell handler: empty -> 'X' -> 'Q' -> empty
  const handleCellClick = (r, c) => {
    if (isWon) return;

    setHistory(prev => [...prev.slice(-30), grid.map(row => [...row])]);
    setMoveCount(m => m + 1);

    const nextGrid = grid.map(row => [...row]);
    const currentVal = nextGrid[r][c];

    if (currentVal === null) {
      nextGrid[r][c] = 'X';
      soundFx.playCross();
    } else if (currentVal === 'X') {
      nextGrid[r][c] = 'Q';
      soundFx.playPlace();

      if (autoCross) {
        const deltas = [-1, 0, 1];
        deltas.forEach(dr => {
          deltas.forEach(dc => {
            if (dr === 0 && dc === 0) return;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (nextGrid[nr][nc] === null) {
                nextGrid[nr][nc] = 'X';
              }
            }
          });
        });
      }
    } else {
      nextGrid[r][c] = null;
      soundFx.playRemove();
    }

    setGrid(nextGrid);
    evaluateBoard(nextGrid);
  };

  // Right-click or long-press for direct Queen
  const handleCellRightClick = (e, r, c) => {
    e.preventDefault();
    if (isWon) return;

    setHistory(prev => [...prev.slice(-30), grid.map(row => [...row])]);
    setMoveCount(m => m + 1);

    const nextGrid = grid.map(row => [...row]);
    if (nextGrid[r][c] === 'Q') {
      nextGrid[r][c] = null;
      soundFx.playRemove();
    } else {
      nextGrid[r][c] = 'Q';
      soundFx.playPlace();

      if (autoCross) {
        const deltas = [-1, 0, 1];
        deltas.forEach(dr => {
          deltas.forEach(dc => {
            if (dr === 0 && dc === 0) return;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (nextGrid[nr][nc] === null) {
                nextGrid[nr][nc] = 'X';
              }
            }
          });
        });
      }
    }

    setGrid(nextGrid);
    evaluateBoard(nextGrid);
  };

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setGrid(previousState);
    evaluateBoard(previousState);
    soundFx.playTap();
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setHistory([]);
    setConflicts(new Set());
    setIsWon(false);
    setTimerSeconds(0);
    setHintMessage('');
    soundFx.playTap();
  };

  const handleHint = () => {
    if (isWon || !solution) return;
    soundFx.playTap();

    const missing = solution.find(([sr, sc]) => grid[sr][sc] !== 'Q');
    if (missing) {
      const [hr, hc] = missing;
      const nextGrid = grid.map(row => [...row]);
      nextGrid[hr][hc] = 'Q';
      if (autoCross) {
        const deltas = [-1, 0, 1];
        deltas.forEach(dr => {
          deltas.forEach(dc => {
            if (dr === 0 && dc === 0) return;
            const nr = hr + dr;
            const nc = hc + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (nextGrid[nr][nc] === null) nextGrid[nr][nc] = 'X';
            }
          });
        });
      }
      setGrid(nextGrid);
      evaluateBoard(nextGrid);
      setHintMessage(`Crown placed at Row ${hr + 1}, Col ${hc + 1}!`);
      setTimeout(() => setHintMessage(''), 4000);
    } else {
      setHintMessage('All solution crowns are already placed!');
      setTimeout(() => setHintMessage(''), 3000);
    }
  };

  const placedQueensCount = grid.reduce(
    (acc, row) => acc + row.filter(cell => cell === 'Q').length,
    0
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Level bar & Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px',
        padding: '12px 16px',
        background: '#0c1220',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crown size={20} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              Crowns (Queens)
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            1 Crown per row, col & region. No touching (even diagonally).
          </p>
        </div>

        {/* Level Selector */}
        <select
          value={levelIndex}
          onChange={(e) => setLevelIndex(Number(e.target.value))}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {QUEENS_LEVELS.map((lvl, idx) => (
            <option key={lvl.id} value={idx}>
              {lvl.name} ({lvl.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Status & Stats Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        marginBottom: '14px',
        fontSize: '13px'
      }}>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Timer size={16} />
          <span style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timerSeconds)}</span>
        </div>

        {/* Queens Count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: placedQueensCount === size ? '#10b981' : '#f8fafc'
        }}>
          <span>Crowns:</span>
          <span style={{
            fontWeight: '800',
            background: placedQueensCount === size ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: `1px solid ${placedQueensCount === size ? '#10b981' : '#6366f1'}`
          }}>
            {placedQueensCount} / {size}
          </span>
        </div>

        {/* Auto-cross toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', color: '#94a3b8' }}>
          <input
            type="checkbox"
            checked={autoCross}
            onChange={(e) => setAutoCross(e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: '#6366f1', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px' }}>Auto-X</span>
        </label>
      </div>

      {/* Hint Alert Notification */}
      {hintMessage && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          color: '#fbbf24',
          fontSize: '12px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={16} />
          {hintMessage}
        </div>
      )}

      {/* Active Conflict Warning */}
      {conflicts.size > 0 && !isWon && (
        <div style={{
          padding: '6px 12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '12px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertTriangle size={15} />
          Conflict detected: Crowns cannot share rows, columns, territories, or touch diagonally!
        </div>
      )}

      {/* The Puzzle Grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '18px'
      }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gap: '2px',
            background: '#030712',
            padding: '6px',
            borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
            maxWidth: size <= 6 ? '380px' : '440px',
            width: '100%',
            aspectRatio: '1 / 1'
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const regId = regions[r][c];
              const palette = REGION_PALETTES[regId % REGION_PALETTES.length];
              const isConflict = conflicts.has(`${r},${c}`);

              // Borders for different regions
              const topDiff = r > 0 && regions[r - 1][c] !== regId;
              const bottomDiff = r < size - 1 && regions[r + 1][c] !== regId;
              const leftDiff = c > 0 && regions[r][c - 1] !== regId;
              const rightDiff = c < size - 1 && regions[r][c + 1] !== regId;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleCellRightClick(e, r, c)}
                  style={{
                    backgroundColor: palette.bg,
                    borderTop: topDiff ? `2.5px solid ${palette.border}` : '1px solid rgba(255, 255, 255, 0.05)',
                    borderBottom: bottomDiff ? `2.5px solid ${palette.border}` : '1px solid rgba(255, 255, 255, 0.05)',
                    borderLeft: leftDiff ? `2.5px solid ${palette.border}` : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRight: rightDiff ? `2.5px solid ${palette.border}` : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    cursor: isWon ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isConflict ? 'inset 0 0 12px rgba(239, 68, 68, 0.9)' : 'none'
                  }}
                  title={`Row ${r + 1}, Col ${c + 1} (${palette.name})`}
                >
                  {cell === 'Q' && (
                    <Crown
                      size={size <= 6 ? 26 : 20}
                      color={isConflict ? '#ef4444' : '#fbbf24'}
                      style={{
                        filter: isConflict
                          ? 'drop-shadow(0 0 8px #ef4444)'
                          : 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9))',
                        transform: 'scale(1.05)'
                      }}
                    />
                  )}
                  {cell === 'X' && (
                    <XIcon
                      size={size <= 6 ? 16 : 12}
                      color="#64748b"
                      style={{ opacity: 0.75 }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || isWon}
          style={{
            background: '#111827',
            color: history.length > 0 ? '#f8fafc' : '#475569',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: history.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Undo2 size={16} />
          Undo
        </button>

        <button
          onClick={handleReset}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>

        <button
          onClick={handleHint}
          disabled={isWon}
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Lightbulb size={16} />
          Get Hint
        </button>

        {levelIndex < QUEENS_LEVELS.length - 1 && (
          <button
            onClick={() => setLevelIndex(levelIndex + 1)}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Next Level <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* Rules */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '12px 14px',
        fontSize: '12px',
        color: '#94a3b8',
        lineHeight: '1.6'
      }}>
        <div style={{ fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
          💡 How to Play Crowns (Queens):
        </div>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          <li>Tap a cell to cycle: <strong>Blank → X (Cross) → 👑 (Crown) → Blank</strong>.</li>
          <li>Right-click or double-click to place or clear a Crown immediately.</li>
          <li>Every row, column, and colored region must contain <strong>exactly one Crown</strong>.</li>
          <li>No two Crowns can touch each other — <strong>not even diagonally</strong>!</li>
        </ul>
      </div>

      {/* Victory Celebration Modal */}
      {isWon && (
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
            border: '1px solid #10b981',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#10b981'
            }}>
              <Trophy size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>
              Crowns Cleared!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              Brilliant logical mastery! You conquered {currentLevel.name}.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Time Taken</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>{formatTime(timerSeconds)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Moves</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>{moveCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (levelIndex < QUEENS_LEVELS.length - 1) {
                    setLevelIndex(levelIndex + 1);
                  } else {
                    handleReset();
                  }
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                {levelIndex < QUEENS_LEVELS.length - 1 ? 'Next Level →' : 'Play Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
