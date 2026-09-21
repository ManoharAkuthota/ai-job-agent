import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, RotateCcw, Trophy, XCircle, Delete, CornerDownLeft, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

const TECH_WORDS = [
  { word: 'ASYNC', clue: 'Non-blocking asynchronous execution model' },
  { word: 'QUERY', clue: 'Database request to fetch or manipulate records' },
  { word: 'STACK', clue: 'LIFO data structure or technology ecosystem' },
  { word: 'REACT', clue: 'Declarative component-based UI library' },
  { word: 'PROXY', clue: 'Intermediary server forwarding network requests' },
  { word: 'REDIS', clue: 'Ultra-fast in-memory key-value cache store' },
  { word: 'BUILD', clue: 'Software compilation and asset packaging pipeline' },
  { word: 'CLOUD', clue: 'On-demand networked compute and storage infrastructure' },
  { word: 'FETCH', clue: 'Modern browser API for performing HTTP requests' },
  { word: 'LOGIC', clue: 'Boolean algorithmic expressions and flow control' },
  { word: 'SCOPE', clue: 'Variable visibility and lifetime boundary' },
  { word: 'CACHE', clue: 'High-speed storage layer to reduce computation latency' },
  { word: 'INDEX', clue: 'Database lookup table for sub-linear query execution' },
  { word: 'ROUTE', clue: 'URL path mapping dispatched to handler controllers' },
  { word: 'TOKEN', clue: 'Signed credential JWT for secure authentication' },
  { word: 'GRAPH', clue: 'Mathematical structure of connected nodes and edges' },
  { word: 'ARRAY', clue: 'Contiguous indexable collection of elements' },
  { word: 'DEBUG', clue: 'Diagnosing and resolving bugs in codebases' }
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export default function WordleGame({ onPuzzleComplete }) {
  const [wordIndex, setWordIndex] = useState(0);
  const currentEntry = TECH_WORDS[wordIndex];
  const targetWord = currentEntry.word;

  const [guesses, setGuesses] = useState([]); // Array of strings (each 5 letters)
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING' | 'WON' | 'LOST'
  const [keyStatuses, setKeyStatuses] = useState({}); // char -> 'green' | 'yellow' | 'gray'

  useEffect(() => {
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('PLAYING');
    setKeyStatuses({});
  }, [wordIndex]);

  // Evaluate colors for a submitted guess
  const evaluateGuess = useCallback((guess) => {
    const statuses = Array(5).fill('gray');
    const targetChars = targetWord.split('');
    const guessChars = guess.split('');

    // Step 1: Greens (Exact matches)
    guessChars.forEach((char, i) => {
      if (char === targetChars[i]) {
        statuses[i] = 'green';
        targetChars[i] = null;
      }
    });

    // Step 2: Yellows (In word but different position)
    guessChars.forEach((char, i) => {
      if (statuses[i] !== 'green') {
        const foundIndex = targetChars.indexOf(char);
        if (foundIndex !== -1) {
          statuses[i] = 'yellow';
          targetChars[foundIndex] = null;
        }
      }
    });

    return statuses;
  }, [targetWord]);

  // Handle letter or action input
  const handleInputChar = useCallback((char) => {
    if (gameStatus !== 'PLAYING') return;

    if (char === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        setCurrentGuess(g => g.slice(0, -1));
        soundFx.playTap();
      }
    } else if (char === 'ENTER') {
      if (currentGuess.length === 5) {
        const rowStatuses = evaluateGuess(currentGuess);
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);

        // Update keyboard key statuses
        const nextKeyStatuses = { ...keyStatuses };
        currentGuess.split('').forEach((c, idx) => {
          const currentStat = nextKeyStatuses[c];
          const newStat = rowStatuses[idx];

          if (newStat === 'green') {
            nextKeyStatuses[c] = 'green';
          } else if (newStat === 'yellow' && currentStat !== 'green') {
            nextKeyStatuses[c] = 'yellow';
          } else if (!currentStat) {
            nextKeyStatuses[c] = 'gray';
          }
        });
        setKeyStatuses(nextKeyStatuses);

        if (currentGuess === targetWord) {
          setGameStatus('WON');
          soundFx.playWin();
          if (onPuzzleComplete) {
            onPuzzleComplete({
              game: 'wordle',
              attempts: newGuesses.length,
              word: targetWord
            });
          }
        } else if (newGuesses.length >= 6) {
          setGameStatus('LOST');
          soundFx.playError();
        } else {
          soundFx.playPlace();
        }

        setCurrentGuess('');
      } else {
        soundFx.playError();
      }
    } else if (/^[A-Z]$/.test(char)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(g => g + char);
        soundFx.playTap();
      }
    }
  }, [gameStatus, currentGuess, evaluateGuess, guesses, targetWord, keyStatuses, onPuzzleComplete]);

  // Hardware Keyboard listener for laptop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'PLAYING') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleInputChar('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleInputChar('BACKSPACE');
      } else {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
          e.preventDefault();
          handleInputChar(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleInputChar]);

  const handleReset = () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('PLAYING');
    setKeyStatuses({});
    soundFx.playTap();
  };

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
      maxHeight: '100%',
      textAlign: 'center'
    }}>
      {/* Compact Word Selector & Stats Bar */}
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
        {/* Word Selector */}
        <select
          value={wordIndex}
          onChange={(e) => setWordIndex(Number(e.target.value))}
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
          {TECH_WORDS.map((tw, idx) => (
            <option key={idx} value={idx}>
              Word #{idx + 1} {idx === 0 ? '(Daily)' : ''}
            </option>
          ))}
        </select>

        {/* Attempt Counter */}
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          Attempts: <strong style={{ color: '#10b981' }}>{guesses.length} / 6</strong>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Wordle Grid (6 rows of 5 letters) - Responsively Clamped */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginBottom: '8px' }}>
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const isSubmitted = rowIdx < guesses.length;
          const isCurrent = rowIdx === guesses.length;
          const word = isSubmitted ? guesses[rowIdx] : isCurrent ? currentGuess : '';
          const statuses = isSubmitted ? evaluateGuess(guesses[rowIdx]) : [];

          return (
            <div key={rowIdx} style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: 5 }).map((_, colIdx) => {
                const letter = word[colIdx] || '';
                const status = statuses[colIdx];

                let tileBg = '#070b14';
                let tileBorder = '1.5px solid rgba(255, 255, 255, 0.1)';
                let tileColor = '#f8fafc';

                if (status === 'green') {
                  tileBg = '#10b981';
                  tileBorder = '1.5px solid #10b981';
                  tileColor = '#ffffff';
                } else if (status === 'yellow') {
                  tileBg = '#f59e0b';
                  tileBorder = '1.5px solid #f59e0b';
                  tileColor = '#ffffff';
                } else if (status === 'gray') {
                  tileBg = '#1e293b';
                  tileBorder = '1.5px solid #334155';
                  tileColor = '#94a3b8';
                } else if (letter) {
                  tileBorder = '1.5px solid rgba(255, 255, 255, 0.3)';
                }

                return (
                  <div
                    key={colIdx}
                    style={{
                      width: 'min(44px, calc((100dvh - 280px) / 7))',
                      height: 'min(44px, calc((100dvh - 280px) / 7))',
                      background: tileBg,
                      border: tileBorder,
                      borderRadius: '6px',
                      color: tileColor,
                      fontSize: '18px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: status === 'green' ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-screen Virtual Keyboard - Compact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', gap: '3px', justifyContent: 'center', width: '100%' }}>
            {row.map((key) => {
              const status = keyStatuses[key];
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';

              let keyBg = '#111827';
              let keyColor = '#f8fafc';

              if (status === 'green') {
                keyBg = '#10b981';
                keyColor = '#ffffff';
              } else if (status === 'yellow') {
                keyBg = '#f59e0b';
                keyColor = '#ffffff';
              } else if (status === 'gray') {
                keyBg = '#1e293b';
                keyColor = '#64748b';
              }

              return (
                <button
                  key={key}
                  onClick={() => handleInputChar(key)}
                  style={{
                    background: keyBg,
                    color: keyColor,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '5px',
                    padding: isSpecial ? '8px 7px' : '8px 9px',
                    fontSize: isSpecial ? '10px' : '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: isSpecial ? '46px' : '26px',
                    flex: isSpecial ? '1.4' : '1',
                    maxWidth: isSpecial ? '58px' : '38px',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {key === 'BACKSPACE' ? <Delete size={14} /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game Over / Won Result */}
      {gameStatus !== 'PLAYING' && (
        <div style={{
          background: gameStatus === 'WON' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${gameStatus === 'WON' ? '#10b981' : '#ef4444'}`,
          borderRadius: '10px',
          padding: '8px 12px',
          marginTop: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>
                {gameStatus === 'WON' ? '🎉 Cracked! ' : 'Word: '}
              </span>
              <strong style={{ color: '#38bdf8', fontSize: '14px' }}>{targetWord}</strong>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{currentEntry.clue}</div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {wordIndex < TECH_WORDS.length - 1 && (
                <button
                  onClick={() => setWordIndex(wordIndex + 1)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: '700',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Next Word →
                </button>
              )}
              <button
                onClick={handleReset}
                style={{
                  background: '#111827',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
