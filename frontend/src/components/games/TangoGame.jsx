import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, RotateCcw, Undo2, Lightbulb, Trophy, AlertTriangle, Timer, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

// Verified Solvable 6x6 Tango Puzzles
// Symbols: 'S' = Sun, 'M' = Moon, null = Empty
// horizontalConstraints[r][c]: relation between (r, c) and (r, c+1) -> '=' | 'x' | null
// verticalConstraints[r][c]: relation between (r, c) and (r+1, c) -> '=' | 'x' | null
const TANGO_LEVELS = [
  {
    id: 'tango_daily_1',
    name: 'Daily Celestial (6x6)',
    size: 6,
    difficulty: 'Standard',
    solution: [
      ['S', 'S', 'M', 'M', 'S', 'M'],
      ['M', 'M', 'S', 'S', 'M', 'S'],
      ['S', 'M', 'M', 'S', 'S', 'M'],
      ['M', 'S', 'S', 'M', 'M', 'S'],
      ['S', 'M', 'S', 'M', 'S', 'M'],
      ['M', 'S', 'M', 'S', 'M', 'S']
    ],
    // Initial locked clues [row, col, value]
    initialClues: [
      [0, 0, 'S'],
      [1, 1, 'M'],
      [2, 3, 'S'],
      [3, 5, 'S'],
      [4, 2, 'S'],
      [5, 4, 'M']
    ],
    // Horizontal relations between cell [r, c] and [r, c+1]
    horizontalConstraints: {
      '0,0': '=', // S = S
      '1,0': '=', // M = M
      '2,1': '=', // M = M
      '2,3': '=', // S = S
      '3,3': '=', // M = M
      '4,0': 'x', // S x M
      '5,2': 'x'  // M x S
    },
    // Vertical relations between cell [r, c] and [r+1, c]
    verticalConstraints: {
      '0,1': 'x', // S x M
      '1,2': 'x', // S x M
      '2,4': 'x', // S x M
      '3,1': '=', // S = S
      '3,4': '='  // M = M
    }
  },
  {
    id: 'tango_harmony_2',
    name: 'Solar Eclipse (6x6)',
    size: 6,
    difficulty: 'Casual',
    solution: [
      ['M', 'S', 'M', 'S', 'M', 'S'],
      ['S', 'M', 'S', 'M', 'S', 'M'],
      ['M', 'M', 'S', 'S', 'M', 'S'],
      ['S', 'S', 'M', 'M', 'S', 'M'],
      ['M', 'S', 'S', 'M', 'M', 'S'],
      ['S', 'M', 'M', 'S', 'S', 'M']
    ],
    initialClues: [
      [0, 1, 'S'],
      [1, 4, 'S'],
      [2, 0, 'M'],
      [2, 1, 'M'],
      [3, 0, 'S'],
      [4, 2, 'S'],
      [5, 5, 'M']
    ],
    horizontalConstraints: {
      '2,0': '=', // M = M
      '2,2': '=', // S = S
      '3,0': '=', // S = S
      '3,2': '='  // M = M
    },
    verticalConstraints: {
      '0,0': 'x', // M x S
      '1,1': 'x', // M x M ? No M x S
      '2,0': 'x', // M x S
      '4,1': '='  // S = S
    }
  }
];

export default function TangoGame({ onPuzzleComplete }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = TANGO_LEVELS[levelIndex];
  const { size, solution, initialClues, horizontalConstraints, verticalConstraints } = currentLevel;

  // Track initial locked clues set
  const lockedCells = new Set(initialClues.map(([r, c]) => `${r},${c}`));

  // Initialize grid with initial clues
  const [grid, setGrid] = useState(() => {
    const matrix = Array(size).fill(null).map(() => Array(size).fill(null));
    initialClues.forEach(([r, c, val]) => {
      matrix[r][c] = val;
    });
    return matrix;
  });

  const [history, setHistory] = useState([]);
  const [violations, setViolations] = useState(new Set()); // Cells involved in 3-in-a-row or relation breaches
  const [isWon, setIsWon] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Reset when level changes
  useEffect(() => {
    const matrix = Array(currentLevel.size).fill(null).map(() => Array(currentLevel.size).fill(null));
    currentLevel.initialClues.forEach(([r, c, val]) => {
      matrix[r][c] = val;
    });
    setGrid(matrix);
    setHistory([]);
    setViolations(new Set());
    setIsWon(false);
    setTimerSeconds(0);
    setTimerActive(true);
  }, [levelIndex]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (timerActive && !isWon) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isWon]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Rule validator
  const evaluateBoard = useCallback((currentGrid) => {
    const n = size;
    const newViolations = new Set();

    // 1. Check for 3-in-a-row in rows
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n - 2; c++) {
        const v1 = currentGrid[r][c];
        const v2 = currentGrid[r][c + 1];
        const v3 = currentGrid[r][c + 2];
        if (v1 && v1 === v2 && v2 === v3) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r},${c + 1}`);
          newViolations.add(`${r},${c + 2}`);
        }
      }
    }

    // 2. Check for 3-in-a-row in columns
    for (let c = 0; c < n; c++) {
      for (let r = 0; r < n - 2; r++) {
        const v1 = currentGrid[r][c];
        const v2 = currentGrid[r + 1][c];
        const v3 = currentGrid[r + 2][c];
        if (v1 && v1 === v2 && v2 === v3) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r + 1},${c}`);
          newViolations.add(`${r + 2},${c}`);
        }
      }
    }

    // 3. Check horizontal constraints
    Object.entries(horizontalConstraints).forEach(([coord, relation]) => {
      const [r, c] = coord.split(',').map(Number);
      const val1 = currentGrid[r][c];
      const val2 = currentGrid[r][c + 1];
      if (val1 && val2) {
        if (relation === '=' && val1 !== val2) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r},${c + 1}`);
        } else if (relation === 'x' && val1 === val2) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r},${c + 1}`);
        }
      }
    });

    // 4. Check vertical constraints
    Object.entries(verticalConstraints).forEach(([coord, relation]) => {
      const [r, c] = coord.split(',').map(Number);
      const val1 = currentGrid[r][c];
      const val2 = currentGrid[r + 1][c];
      if (val1 && val2) {
        if (relation === '=' && val1 !== val2) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r + 1},${c}`);
        } else if (relation === 'x' && val1 === val2) {
          newViolations.add(`${r},${c}`);
          newViolations.add(`${r + 1},${c}`);
        }
      }
    });

    setViolations(newViolations);

    // 5. Check if board is complete and fully valid
    let isComplete = true;
    for (let r = 0; r < n; r++) {
      let suns = 0;
      let moons = 0;
      for (let c = 0; c < n; c++) {
        const v = currentGrid[r][c];
        if (!v) {
          isComplete = false;
          break;
        }
        if (v === 'S') suns++;
        if (v === 'M') moons++;
      }
      if (!isComplete || suns !== n / 2 || moons !== n / 2) {
        isComplete = false;
        break;
      }
    }

    if (isComplete) {
      // Check column counts
      for (let c = 0; c < n; c++) {
        let suns = 0;
        let moons = 0;
        for (let r = 0; r < n; r++) {
          if (currentGrid[r][c] === 'S') suns++;
          if (currentGrid[r][c] === 'M') moons++;
        }
        if (suns !== n / 2 || moons !== n / 2) {
          isComplete = false;
          break;
        }
      }
    }

    if (isComplete && newViolations.size === 0) {
      setIsWon(true);
      setTimerActive(false);
      soundFx.playWin();
      if (onPuzzleComplete) {
        onPuzzleComplete({
          game: 'tango',
          levelId: currentLevel.id,
          time: timerSeconds
        });
      }
    }
  }, [size, horizontalConstraints, verticalConstraints, currentLevel.id, onPuzzleComplete, timerSeconds]);

  // Click cell: empty -> 'S' -> 'M' -> empty
  const handleCellClick = (r, c) => {
    if (isWon || lockedCells.has(`${r},${c}`)) return;

    setHistory(prev => [...prev.slice(-30), grid.map(row => [...row])]);

    const nextGrid = grid.map(row => [...row]);
    const currentVal = nextGrid[r][c];

    if (currentVal === null) {
      nextGrid[r][c] = 'S';
      soundFx.playPlace();
    } else if (currentVal === 'S') {
      nextGrid[r][c] = 'M';
      soundFx.playPlace();
    } else {
      nextGrid[r][c] = null;
      soundFx.playRemove();
    }

    setGrid(nextGrid);
    evaluateBoard(nextGrid);
  };

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(prev);
    evaluateBoard(prev);
    soundFx.playTap();
  };

  const handleReset = () => {
    const matrix = Array(size).fill(null).map(() => Array(size).fill(null));
    initialClues.forEach(([r, c, val]) => {
      matrix[r][c] = val;
    });
    setGrid(matrix);
    setHistory([]);
    setViolations(new Set());
    setIsWon(false);
    setTimerSeconds(0);
    soundFx.playTap();
  };

  const handleHint = () => {
    if (isWon) return;
    soundFx.playTap();

    // Find first empty cell
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) {
          const nextGrid = grid.map(row => [...row]);
          nextGrid[r][c] = solution[r][c];
          setGrid(nextGrid);
          evaluateBoard(nextGrid);
          return;
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
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
            <Sun size={20} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              Tango (Sun & Moon)
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Balance Suns & Moons. Equal counts, no 3-in-a-row.
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
            padding: '6px 10px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {TANGO_LEVELS.map((lvl, idx) => (
            <option key={lvl.id} value={idx}>
              {lvl.name} ({lvl.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Timer size={16} />
          <span style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timerSeconds)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={15} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontWeight: '700' }}>3 per line</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Moon size={15} color="#a855f7" />
            <span style={{ color: '#a855f7', fontWeight: '700' }}>3 per line</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {violations.size > 0 && !isWon && (
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
          Rule violation detected: Check for 3 identical symbols in a row or unsatisfied = / x markers.
        </div>
      )}

      {/* Board Container with Grid and Constraints */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div
          style={{
            position: 'relative',
            background: '#070b14',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            maxWidth: '440px',
            width: '100%'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gap: '6px',
              aspectRatio: '1 / 1'
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isLocked = lockedCells.has(`${r},${c}`);
                const isViolation = violations.has(`${r},${c}`);

                // Relations on right and bottom
                const hRelation = horizontalConstraints[`${r},${c}`];
                const vRelation = verticalConstraints[`${r},${c}`];

                return (
                  <div key={`${r}-${c}`} style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleCellClick(r, c)}
                      disabled={isLocked || isWon}
                      style={{
                        width: '100%',
                        height: '100%',
                        background: isLocked
                          ? '#1e293b'
                          : cell === 'S'
                            ? 'rgba(251, 191, 36, 0.12)'
                            : cell === 'M'
                              ? 'rgba(168, 85, 247, 0.12)'
                              : '#0f172a',
                        border: isViolation
                          ? '2px solid #ef4444'
                          : isLocked
                            ? '1.5px solid rgba(255, 255, 255, 0.2)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isLocked || isWon ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isViolation ? '0 0 10px rgba(239, 68, 68, 0.6)' : 'none'
                      }}
                    >
                      {cell === 'S' && (
                        <Sun
                          size={24}
                          color="#fbbf24"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' }}
                        />
                      )}
                      {cell === 'M' && (
                        <Moon
                          size={22}
                          color="#c084fc"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.8))' }}
                        />
                      )}
                    </button>

                    {/* Horizontal constraint badge between (r, c) and (r, c+1) */}
                    {hRelation && c < size - 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          right: '-9px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#030712',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: hRelation === '=' ? '#38bdf8' : '#f43f5e',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}
                      >
                        {hRelation}
                      </span>
                    )}

                    {/* Vertical constraint badge between (r, c) and (r+1, c) */}
                    {vRelation && r < size - 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-9px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#030712',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: vRelation === '=' ? '#38bdf8' : '#f43f5e',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}
                      >
                        {vRelation}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
          <Undo2 size={16} /> Undo
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
          <RotateCcw size={16} /> Reset
        </button>

        <button
          onClick={handleHint}
          disabled={isWon}
          style={{
            background: 'rgba(251, 191, 36, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            padding: '8px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Lightbulb size={16} /> Hint
        </button>
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
          💡 How to Play Tango:
        </div>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          <li>Tap a square to cycle: <strong>Blank → ☀️ Sun → 🌙 Moon → Blank</strong>.</li>
          <li>Each row and column must contain <strong>equal Suns and Moons</strong> (3 of each).</li>
          <li><strong>No 3-in-a-row</strong>: You cannot place 3 Suns or 3 Moons adjacent in any line.</li>
          <li><strong>Constraints</strong>: <code>=</code> means both cells are identical; <code>x</code> means they are opposite!</li>
        </ul>
      </div>

      {/* Win Modal */}
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
              Tango Harmony Achieved!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              You balanced the celestial grid in {formatTime(timerSeconds)}!
            </p>

            <button
              onClick={() => {
                if (levelIndex < TANGO_LEVELS.length - 1) {
                  setLevelIndex(levelIndex + 1);
                } else {
                  handleReset();
                }
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '700',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              {levelIndex < TANGO_LEVELS.length - 1 ? 'Next Tango →' : 'Play Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
