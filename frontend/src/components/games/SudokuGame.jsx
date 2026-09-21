import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hash, RotateCcw, Undo2, Lightbulb, Trophy, Timer, Pencil, Eraser, ChevronRight } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

// 100% Mathematically Verified Solvable Sudoku Boards
const SUDOKU_LEVELS = [
  {
    id: 'sudoku_mini_6x6',
    name: 'Mini Sudoku (6x6)',
    size: 6,
    boxRows: 2,
    boxCols: 3,
    difficulty: 'Casual',
    puzzle: [
      [0, 0, 3, 0, 1, 0],
      [5, 6, 0, 3, 2, 0],
      [0, 5, 4, 2, 0, 3],
      [2, 0, 6, 4, 5, 0],
      [0, 1, 2, 0, 4, 5],
      [0, 4, 0, 1, 0, 0]
    ],
    solution: [
      [4, 2, 3, 5, 1, 6],
      [5, 6, 1, 3, 2, 4],
      [1, 5, 4, 2, 6, 3],
      [2, 3, 6, 4, 5, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 1, 3, 2]
    ]
  },
  {
    id: 'sudoku_easy_9x9',
    name: 'Classic Easy (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    difficulty: 'Easy',
    puzzle: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ]
  },
  {
    id: 'sudoku_medium_9x9',
    name: 'Classic Medium (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    difficulty: 'Medium',
    puzzle: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0]
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9]
    ]
  },
  {
    id: 'sudoku_hard_9x9',
    name: 'Classic Hard (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    difficulty: 'Hard',
    puzzle: [
      [0, 0, 2, 0, 0, 0, 0, 0, 0],
      [7, 0, 0, 0, 5, 6, 0, 0, 1],
      [0, 0, 8, 3, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 4, 6, 0, 0],
      [0, 9, 1, 7, 6, 0, 0, 2, 8],
      [0, 0, 6, 0, 0, 5, 7, 0, 0],
      [0, 0, 4, 0, 0, 7, 0, 0, 2],
      [6, 0, 0, 9, 0, 0, 0, 0, 7],
      [0, 0, 0, 0, 1, 2, 0, 6, 0]
    ],
    solution: [
      [1, 5, 2, 4, 8, 9, 3, 7, 6],
      [7, 3, 9, 2, 5, 6, 8, 4, 1],
      [4, 6, 8, 3, 7, 1, 2, 9, 5],
      [3, 8, 7, 1, 2, 4, 6, 5, 9],
      [5, 9, 1, 7, 6, 3, 4, 2, 8],
      [2, 4, 6, 8, 9, 5, 7, 1, 3],
      [9, 1, 4, 6, 3, 7, 5, 8, 2],
      [6, 2, 5, 9, 4, 8, 1, 3, 7],
      [8, 7, 3, 5, 1, 2, 9, 6, 4]
    ]
  }
];

export default function SudokuGame({ onPuzzleComplete }) {
  const [levelIndex, setLevelIndex] = useState(1);
  const currentLevel = SUDOKU_LEVELS[levelIndex];
  const { size, boxRows, boxCols, puzzle, solution } = currentLevel;

  const initialLocked = useRef(new Set());

  const [grid, setGrid] = useState(() => puzzle.map(row => [...row]));
  const [notes, setNotes] = useState(() => Array(size).fill(null).map(() => Array(size).fill(null).map(() => new Set())));
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [notesMode, setNotesMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [conflicts, setConflicts] = useState(new Set());
  const [isWon, setIsWon] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Initialize/reset board when level changes
  useEffect(() => {
    const locked = new Set();
    currentLevel.puzzle.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val !== 0) locked.add(`${r},${c}`);
      });
    });
    initialLocked.current = locked;

    setGrid(currentLevel.puzzle.map(row => [...row]));
    setNotes(Array(currentLevel.size).fill(null).map(() => Array(currentLevel.size).fill(null).map(() => new Set())));
    setSelectedCell([0, 0]);
    setHistory([]);
    setMistakes(0);
    setConflicts(new Set());
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

  // Evaluate conflicts and win condition
  const evaluateBoard = useCallback((currentGrid) => {
    const newConflicts = new Set();

    // Check Rows
    for (let r = 0; r < size; r++) {
      const seen = new Map();
      for (let c = 0; c < size; c++) {
        const val = currentGrid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            newConflicts.add(`${r},${c}`);
            newConflicts.add(`${r},${seen.get(val)}`);
          } else {
            seen.set(val, c);
          }
        }
      }
    }

    // Check Columns
    for (let c = 0; c < size; c++) {
      const seen = new Map();
      for (let r = 0; r < size; r++) {
        const val = currentGrid[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            newConflicts.add(`${r},${c}`);
            newConflicts.add(`${seen.get(val)},${c}`);
          } else {
            seen.set(val, r);
          }
        }
      }
    }

    // Check Boxes
    for (let br = 0; br < size; br += boxRows) {
      for (let bc = 0; bc < size; bc += boxCols) {
        const seen = new Map();
        for (let r = br; r < br + boxRows; r++) {
          for (let c = bc; c < bc + boxCols; c++) {
            const val = currentGrid[r][c];
            if (val !== 0) {
              if (seen.has(val)) {
                newConflicts.add(`${r},${c}`);
                newConflicts.add(seen.get(val));
              } else {
                seen.set(val, `${r},${c}`);
              }
            }
          }
        }
      }
    }

    setConflicts(newConflicts);

    // Win condition: full board, 0 conflicts
    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] === 0) {
          isFull = false;
          break;
        }
      }
      if (!isFull) break;
    }

    if (isFull && newConflicts.size === 0) {
      setIsWon(true);
      setTimerActive(false);
      soundFx.playWin();
      if (onPuzzleComplete) {
        onPuzzleComplete({
          game: 'sudoku',
          levelId: currentLevel.id,
          time: timerSeconds,
          mistakes
        });
      }
    }
  }, [size, boxRows, boxCols, currentLevel.id, mistakes, onPuzzleComplete, timerSeconds]);

  // Set digit in selected cell
  const handleDigitInput = useCallback((num) => {
    if (isWon || !selectedCell) return;
    const [r, c] = selectedCell;
    if (initialLocked.current.has(`${r},${c}`)) return;

    // Snapshot for undo
    setHistory(prev => [
      ...prev.slice(-30),
      {
        grid: grid.map(row => [...row]),
        notes: notes.map(row => row.map(s => new Set(s)))
      }
    ]);

    if (notesMode) {
      const nextNotes = notes.map(row => row.map(s => new Set(s)));
      if (nextNotes[r][c].has(num)) {
        nextNotes[r][c].delete(num);
        soundFx.playRemove();
      } else {
        nextNotes[r][c].add(num);
        soundFx.playCross();
      }
      setNotes(nextNotes);
    } else {
      const nextGrid = grid.map(row => [...row]);
      const currentVal = nextGrid[r][c];

      if (currentVal === num) {
        nextGrid[r][c] = 0;
        soundFx.playRemove();
      } else {
        nextGrid[r][c] = num;
        soundFx.playPlace();

        if (solution && solution[r][c] !== num) {
          setMistakes(m => m + 1);
          soundFx.playError();
        }

        // Auto-clear notes
        const nextNotes = notes.map(row => row.map(s => new Set(s)));
        for (let i = 0; i < size; i++) {
          nextNotes[r][i].delete(num);
          nextNotes[i][c].delete(num);
        }
        const startR = Math.floor(r / boxRows) * boxRows;
        const startC = Math.floor(c / boxCols) * boxCols;
        for (let br = startR; br < startR + boxRows; br++) {
          for (let bc = startC; bc < startC + boxCols; bc++) {
            nextNotes[br][bc].delete(num);
          }
        }
        setNotes(nextNotes);
      }

      setGrid(nextGrid);
      evaluateBoard(nextGrid);
    }
  }, [isWon, selectedCell, grid, notes, notesMode, solution, size, boxRows, boxCols, evaluateBoard]);

  const handleErase = useCallback(() => {
    if (isWon || !selectedCell) return;
    const [r, c] = selectedCell;
    if (initialLocked.current.has(`${r},${c}`)) return;

    if (grid[r][c] !== 0 || notes[r][c].size > 0) {
      setHistory(prev => [
        ...prev.slice(-30),
        {
          grid: grid.map(row => [...row]),
          notes: notes.map(row => row.map(s => new Set(s)))
        }
      ]);

      const nextGrid = grid.map(row => [...row]);
      nextGrid[r][c] = 0;
      const nextNotes = notes.map(row => row.map(s => new Set(s)));
      nextNotes[r][c].clear();

      setGrid(nextGrid);
      setNotes(nextNotes);
      soundFx.playRemove();
      evaluateBoard(nextGrid);
    }
  }, [isWon, selectedCell, grid, notes, evaluateBoard]);

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(prev.grid);
    setNotes(prev.notes);
    evaluateBoard(prev.grid);
    soundFx.playTap();
  };

  const handleReset = () => {
    setGrid(puzzle.map(row => [...row]));
    setNotes(Array(size).fill(null).map(() => Array(size).fill(null).map(() => new Set())));
    setHistory([]);
    setMistakes(0);
    setConflicts(new Set());
    setIsWon(false);
    setTimerSeconds(0);
    soundFx.playTap();
  };

  const handleHint = () => {
    if (isWon || !selectedCell || !solution) return;
    const [r, c] = selectedCell;
    if (initialLocked.current.has(`${r},${c}`)) return;

    const correctNum = solution[r][c];
    const nextGrid = grid.map(row => [...row]);
    nextGrid[r][c] = correctNum;
    setGrid(nextGrid);
    evaluateBoard(nextGrid);
    soundFx.playWin();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isWon) return;

      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= size) {
        e.preventDefault();
        handleDigitInput(digit);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNotesMode(prev => !prev);
        soundFx.playTap();
      } else if (selectedCell) {
        const [r, c] = selectedCell;
        if (e.key === 'ArrowUp' && r > 0) {
          e.preventDefault();
          setSelectedCell([r - 1, c]);
        } else if (e.key === 'ArrowDown' && r < size - 1) {
          e.preventDefault();
          setSelectedCell([r + 1, c]);
        } else if (e.key === 'ArrowLeft' && c > 0) {
          e.preventDefault();
          setSelectedCell([r, c - 1]);
        } else if (e.key === 'ArrowRight' && c < size - 1) {
          e.preventDefault();
          setSelectedCell([r, c + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWon, selectedCell, size, handleDigitInput, handleErase]);

  const selectedNumber = selectedCell ? grid[selectedCell[0]][selectedCell[1]] : 0;

  const remainingCounts = {};
  for (let d = 1; d <= size; d++) {
    const placed = grid.reduce((acc, row) => acc + row.filter(v => v === d).length, 0);
    remainingCounts[d] = size - placed;
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '440px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      maxHeight: '100%'
    }}>
      {/* Compact Top Header & Level Bar */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        marginBottom: '8px',
        fontSize: '12px'
      }}>
        {/* Level Selector */}
        <select
          value={levelIndex}
          onChange={(e) => setLevelIndex(Number(e.target.value))}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {SUDOKU_LEVELS.map((lvl, idx) => (
            <option key={lvl.id} value={idx}>
              {lvl.name} ({lvl.difficulty})
            </option>
          ))}
        </select>

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
          <Timer size={14} />
          <span style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timerSeconds)}</span>
        </div>

        {/* Mistakes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: mistakes > 0 ? '#f87171' : '#94a3b8' }}>
          <span>Mistakes:</span>
          <span style={{ fontWeight: '800', color: mistakes > 0 ? '#ef4444' : '#10b981' }}>{mistakes}</span>
        </div>

        {/* Notes Mode Toggle */}
        <button
          onClick={() => {
            setNotesMode(prev => !prev);
            soundFx.playTap();
          }}
          style={{
            background: notesMode ? 'rgba(56, 189, 248, 0.2)' : '#111827',
            border: `1px solid ${notesMode ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
            color: notesMode ? '#38bdf8' : '#94a3b8',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <Pencil size={12} />
          <span>Notes {notesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Sudoku Grid Container - Responsively Clamped */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            background: '#030712',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '10px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.8)',
            width: 'min(88vw, 340px, calc(100dvh - 240px))',
            height: 'min(88vw, 340px, calc(100dvh - 240px))',
            aspectRatio: '1 / 1',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isLocked = initialLocked.current.has(`${r},${c}`);
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const isSameRowOrCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
              const isSameBox = selectedCell &&
                Math.floor(selectedCell[0] / boxRows) === Math.floor(r / boxRows) &&
                Math.floor(selectedCell[1] / boxCols) === Math.floor(c / boxCols);
              const isSameNumber = val !== 0 && selectedNumber !== 0 && val === selectedNumber;
              const isConflict = conflicts.has(`${r},${c}`);

              const isBoxRight = (c + 1) % boxCols === 0 && c < size - 1;
              const isBoxBottom = (r + 1) % boxRows === 0 && r < size - 1;

              let cellBg = '#0b0f19';
              if (isSelected) {
                cellBg = 'rgba(56, 189, 248, 0.35)';
              } else if (isSameNumber) {
                cellBg = 'rgba(99, 102, 241, 0.3)';
              } else if (isSameRowOrCol || isSameBox) {
                cellBg = 'rgba(255, 255, 255, 0.04)';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => {
                    setSelectedCell([r, c]);
                    soundFx.playTap();
                  }}
                  style={{
                    backgroundColor: cellBg,
                    borderRight: isBoxRight ? '2px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: isBoxBottom ? '2px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.1s ease',
                    boxShadow: isConflict ? 'inset 0 0 10px rgba(239, 68, 68, 0.8)' : isSelected ? 'inset 0 0 0 2px #38bdf8' : 'none'
                  }}
                >
                  {val !== 0 ? (
                    <span
                      style={{
                        fontSize: size === 6 ? '22px' : '17px',
                        fontWeight: isLocked ? '800' : '700',
                        color: isConflict
                          ? '#ef4444'
                          : isLocked
                            ? '#f8fafc'
                            : '#38bdf8',
                        filter: isSameNumber && !isLocked ? 'drop-shadow(0 0 6px #38bdf8)' : 'none'
                      }}
                    >
                      {val}
                    </span>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      width: '90%',
                      height: '90%',
                      pointerEvents: 'none'
                    }}>
                      {Array.from({ length: size }).map((_, nIdx) => {
                        const noteNum = nIdx + 1;
                        const hasNote = notes[r][c].has(noteNum);
                        return (
                          <span
                            key={noteNum}
                            style={{
                              fontSize: '8px',
                              fontWeight: '600',
                              color: hasNote ? '#94a3b8' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1
                            }}
                          >
                            {noteNum}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Number Pad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: '4px',
        marginBottom: '8px',
        width: '100%'
      }}>
        {Array.from({ length: size }).map((_, idx) => {
          const num = idx + 1;
          const remaining = remainingCounts[num];
          const isDone = remaining <= 0;

          return (
            <button
              key={num}
              onClick={() => handleDigitInput(num)}
              disabled={isDone || isWon}
              style={{
                background: isDone ? '#070b14' : '#111827',
                border: `1px solid ${isDone ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.12)'}`,
                color: isDone ? '#475569' : '#f8fafc',
                borderRadius: '6px',
                padding: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDone || isWon ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: '800', lineHeight: 1 }}>{num}</span>
              <span style={{ fontSize: '8px', color: isDone ? '#475569' : '#94a3b8', marginTop: '1px' }}>
                {remaining > 0 ? remaining : '✓'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || isWon}
          style={{
            background: '#111827',
            color: history.length > 0 ? '#f8fafc' : '#475569',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            cursor: history.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Undo2 size={13} /> Undo
        </button>

        <button
          onClick={handleErase}
          disabled={isWon}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <Eraser size={13} /> Erase
        </button>

        <button
          onClick={handleHint}
          disabled={isWon}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <Lightbulb size={13} /> Hint
        </button>

        <button
          onClick={handleReset}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>

        {levelIndex < SUDOKU_LEVELS.length - 1 && (
          <button
            onClick={() => setLevelIndex(levelIndex + 1)}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '5px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Next Sudoku <ChevronRight size={13} />
          </button>
        )}
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
              Sudoku Solved!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              Masterful deduction! You completed {currentLevel.name}.
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
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mistakes</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: mistakes === 0 ? '#10b981' : '#f87171' }}>
                  {mistakes}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (levelIndex < SUDOKU_LEVELS.length - 1) {
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
              {levelIndex < SUDOKU_LEVELS.length - 1 ? 'Next Level →' : 'Play Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
