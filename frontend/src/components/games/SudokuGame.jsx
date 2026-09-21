import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Hash, RotateCcw, Undo2, Lightbulb, Trophy, AlertTriangle, Timer, Pencil, Eraser, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

// Verified Solvable Boards
// 0 indicates an empty cell
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
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0]
    ],
    solution: [
      [5, 8, 9, 6, 7, 2, 4, 3, 1],
      [7, 1, 2, 8, 4, 3, 6, 5, 9],
      [4, 3, 6, 5, 9, 1, 7, 8, 2],
      [3, 9, 4, 7, 2, 5, 8, 1, 6],
      [6, 5, 7, 1, 8, 4, 9, 2, 3],
      [2, 8, 1, 3, 9, 6, 5, 4, 7],
      [1, 4, 8, 2, 5, 7, 3, 6, 9],
      [9, 7, 3, 4, 1, 8, 2, 6, 5],
      [8, 2, 5, 9, 6, 4, 1, 7, 3]
    ]
  }
];

export default function SudokuGame({ onPuzzleComplete }) {
  const [levelIndex, setLevelIndex] = useState(1); // Default to Classic Easy 9x9
  const currentLevel = SUDOKU_LEVELS[levelIndex];
  const { size, boxRows, boxCols, puzzle, solution } = currentLevel;

  // Track initial locked numbers
  const initialLocked = useRef(new Set());

  // Grid states:
  // grid: 2D array of numbers (0 for empty)
  // notes: 2D array of Sets containing pencil numbers
  const [grid, setGrid] = useState(() => puzzle.map(row => [...row]));
  const [notes, setNotes] = useState(() => Array(size).fill(null).map(() => Array(size).fill(null).map(() => new Set())));
  const [selectedCell, setSelectedCell] = useState([0, 0]); // [row, col]
  const [notesMode, setNotesMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [conflicts, setConflicts] = useState(new Set()); // "r,c"
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
      // Toggle pencil note
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
      // Place actual number
      const nextGrid = grid.map(row => [...row]);
      const currentVal = nextGrid[r][c];

      if (currentVal === num) {
        nextGrid[r][c] = 0;
        soundFx.playRemove();
      } else {
        nextGrid[r][c] = num;
        soundFx.playPlace();

        // Check against solution for immediate mistake feedback
        if (solution && solution[r][c] !== num) {
          setMistakes(m => m + 1);
          soundFx.playError();
        }

        // Auto-clear notes of this number in same row, col, and box
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

  // Erase cell content
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

  // Undo action
  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(prev.grid);
    setNotes(prev.notes);
    evaluateBoard(prev.grid);
    soundFx.playTap();
  };

  // Reset action
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

  // Hint action: Fill current cell with correct answer
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

  // Hardware Keyboard listener for laptop/desktop users
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isWon) return;

      // Digits 1-9
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
        // Arrow navigation
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

  // Selected cell number
  const selectedNumber = selectedCell ? grid[selectedCell[0]][selectedCell[1]] : 0;

  // Remaining count for each digit (1 to size)
  const remainingCounts = {};
  for (let d = 1; d <= size; d++) {
    const placed = grid.reduce((acc, row) => acc + row.filter(v => v === d).length, 0);
    remainingCounts[d] = size - placed;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Top Header & Level Bar */}
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
            <Hash size={20} color="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.7))' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              Sudoku Studio
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Touch keypad for mobile • Keyboard (1-9, Arrows, N) for laptop.
          </p>
        </div>

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
          {SUDOKU_LEVELS.map((lvl, idx) => (
            <option key={lvl.id} value={idx}>
              {lvl.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Bar (Timer, Mistakes, Controls) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        marginBottom: '16px',
        fontSize: '13px'
      }}>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Timer size={16} />
          <span style={{ fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timerSeconds)}</span>
        </div>

        {/* Mistakes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: mistakes > 0 ? '#f87171' : '#94a3b8' }}>
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
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <Pencil size={14} />
          <span>Notes {notesMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Sudoku Grid Container */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            background: '#030712',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            maxWidth: size === 6 ? '380px' : '460px',
            width: '100%',
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

              // Box border markers
              const isBoxRight = (c + 1) % boxCols === 0 && c < size - 1;
              const isBoxBottom = (r + 1) % boxRows === 0 && r < size - 1;

              // Cell Background Tint
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
                        fontSize: size === 6 ? '22px' : '18px',
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
                    /* Pencil Notes Grid */
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

      {/* Number Pad for Mobile Touch & Quick Laptop Clicking */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: '6px',
        marginBottom: '16px'
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
                borderRadius: '8px',
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDone || isWon ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1 }}>{num}</span>
              <span style={{ fontSize: '9px', color: isDone ? '#475569' : '#94a3b8', marginTop: '2px' }}>
                {remaining > 0 ? remaining : '✓'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar (Undo, Erase, Hint, Reset) */}
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
          onClick={handleErase}
          disabled={isWon}
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
          <Eraser size={16} /> Erase
        </button>

        <button
          onClick={handleHint}
          disabled={isWon}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
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
      </div>

      {/* Rules & Shortcut Guide */}
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
          💡 Sudoku Rules & Controls:
        </div>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          <li>Every row, column, and sub-box must contain numbers 1 to {size} without duplicates.</li>
          <li><strong>Laptop</strong>: Use number keys <code>1-{size}</code>, <code>Backspace</code> to erase, arrow keys to move, and <code>N</code> to toggle pencil notes.</li>
          <li><strong>Mobile</strong>: Tap cell to select, then tap the number keypad below.</li>
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
