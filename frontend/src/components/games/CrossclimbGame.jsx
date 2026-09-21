import React, { useState, useEffect, useCallback } from 'react';
import { Layers, RotateCcw, Trophy, ChevronRight, Delete } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

const CROSSCLIMB_PUZZLES = [
  {
    id: 'crossclimb_daily_1',
    title: 'From Silicon to Software',
    wordLength: 4,
    rungs: [
      {
        word: 'CODE',
        clue: 'Instructions written in a programming language',
        given: true
      },
      {
        word: 'CORE',
        clue: 'Individual physical processing unit in modern CPUs'
      },
      {
        word: 'CARE',
        clue: 'Quality assurance and diligence applied before shipping'
      },
      {
        word: 'CASE',
        clue: 'Branch condition evaluated within a switch statement'
      },
      {
        word: 'BASE',
        clue: 'Foundation commit of a git branch or numeric radix'
      }
    ]
  },
  {
    id: 'crossclimb_data_journey',
    title: 'The Algorithmic Ladder',
    wordLength: 4,
    rungs: [
      {
        word: 'DATA',
        clue: 'Raw values and records ingested into relational databases',
        given: true
      },
      {
        word: 'DATE',
        clue: 'ISO 8601 temporal calendar format (YYYY-MM-DD)'
      },
      {
        word: 'GATE',
        clue: 'Elementary digital logic circuit (AND, OR, NOT, XOR)'
      },
      {
        word: 'GAME',
        clue: 'Interactive logic challenge stimulating human reasoning'
      }
    ]
  }
];

const ON_SCREEN_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export default function CrossclimbGame({ onPuzzleComplete }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = CROSSCLIMB_PUZZLES[puzzleIndex];
  const { rungs, wordLength } = currentPuzzle;

  const [answers, setAnswers] = useState(() =>
    rungs.map(r => (r.given ? r.word : ''))
  );

  const [activeRungIndex, setActiveRungIndex] = useState(1);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    setAnswers(currentPuzzle.rungs.map(r => (r.given ? r.word : '')));
    setActiveRungIndex(1);
    setIsWon(false);
  }, [puzzleIndex]);

  const handleKeyInput = useCallback((char) => {
    if (isWon || rungs[activeRungIndex]?.given) return;

    if (char === 'BACKSPACE') {
      const currentVal = answers[activeRungIndex] || '';
      if (currentVal.length > 0) {
        const nextAnswers = [...answers];
        nextAnswers[activeRungIndex] = currentVal.slice(0, -1);
        setAnswers(nextAnswers);
        soundFx.playTap();
      }
    } else if (/^[A-Z]$/.test(char)) {
      const currentVal = answers[activeRungIndex] || '';
      if (currentVal.length < wordLength) {
        const updated = currentVal + char;
        const nextAnswers = [...answers];
        nextAnswers[activeRungIndex] = updated;
        setAnswers(nextAnswers);

        if (updated.length === wordLength) {
          if (updated === rungs[activeRungIndex].word) {
            soundFx.playPlace();

            // Check if all rungs complete
            const allDone = nextAnswers.every((ans, i) => ans === rungs[i].word);
            if (allDone) {
              setIsWon(true);
              soundFx.playWin();
              if (onPuzzleComplete) {
                onPuzzleComplete({
                  game: 'crossclimb',
                  puzzleId: currentPuzzle.id
                });
              }
            } else {
              // Find next unfilled rung
              const nextUnfilled = nextAnswers.findIndex((ans, i) => !rungs[i].given && ans !== rungs[i].word);
              if (nextUnfilled !== -1) {
                setActiveRungIndex(nextUnfilled);
              }
            }
          } else {
            soundFx.playError();
          }
        } else {
          soundFx.playTap();
        }
      }
    }
  }, [isWon, rungs, activeRungIndex, answers, wordLength, currentPuzzle.id, onPuzzleComplete]);

  // Hardware typing listener for laptops
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isWon) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyInput('BACKSPACE');
      } else {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
          e.preventDefault();
          handleKeyInput(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWon, handleKeyInput]);

  const handleReset = () => {
    setAnswers(rungs.map(r => (r.given ? r.word : '')));
    setActiveRungIndex(1);
    setIsWon(false);
    soundFx.playTap();
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '460px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      maxHeight: '100%'
    }}>
      {/* Compact Header & Progress Bar */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        marginBottom: '6px',
        fontSize: '12px'
      }}>
        {/* Puzzle Selector */}
        <select
          value={puzzleIndex}
          onChange={(e) => setPuzzleIndex(Number(e.target.value))}
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
          {CROSSCLIMB_PUZZLES.map((pz, idx) => (
            <option key={pz.id} value={idx}>
              {pz.title}
            </option>
          ))}
        </select>

        {/* Active Rung Indicator */}
        <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: '700' }}>
          Rung #{activeRungIndex + 1} of {rungs.length}
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '4px 8px',
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

      {/* Ladder Rungs - Compact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px', width: '100%' }}>
        {rungs.map((rung, idx) => {
          const isCorrect = answers[idx] === rung.word;
          const isCurrentActive = activeRungIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => !rung.given && !isWon && setActiveRungIndex(idx)}
              style={{
                background: isCorrect
                  ? 'rgba(16, 185, 129, 0.1)'
                  : isCurrentActive
                    ? 'rgba(168, 85, 247, 0.15)'
                    : '#0c1220',
                border: `1.5px solid ${
                  isCorrect
                    ? '#10b981'
                    : isCurrentActive
                      ? '#a855f7'
                      : 'rgba(255, 255, 255, 0.08)'
                }`,
                borderRadius: '8px',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                cursor: rung.given ? 'default' : 'pointer',
                boxShadow: isCurrentActive ? '0 0 12px rgba(168, 85, 247, 0.25)' : 'none'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rung #{idx + 1} {rung.given && '• Given'}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rung.clue}
                </div>
              </div>

              {/* Word Letters Box */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {Array.from({ length: wordLength }).map((_, charIdx) => {
                  const letter = (answers[idx] || '')[charIdx] || '';
                  return (
                    <span
                      key={charIdx}
                      style={{
                        width: '26px',
                        height: '28px',
                        borderRadius: '5px',
                        background: rung.given ? '#1e293b' : isCorrect ? 'rgba(16, 185, 129, 0.2)' : '#070b14',
                        border: `1px solid ${isCorrect ? '#10b981' : isCurrentActive ? '#a855f7' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: isCorrect ? '#10b981' : '#f8fafc',
                        fontSize: '14px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* On-screen touch keypad - Compact */}
      {!isWon && (
        <div style={{
          background: '#0c1220',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '6px 4px',
          marginBottom: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
            {ON_SCREEN_KEYS.map((row, rIdx) => (
              <div key={rIdx} style={{ display: 'flex', gap: '3px', justifyContent: 'center', width: '100%' }}>
                {row.map((key) => {
                  const isBack = key === 'BACKSPACE';
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyInput(key)}
                      style={{
                        background: '#111827',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '5px',
                        padding: isBack ? '7px 8px' : '7px 9px',
                        fontSize: isBack ? '10px' : '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: isBack ? '46px' : '26px',
                        flex: isBack ? '1.4' : '1',
                        maxWidth: isBack ? '56px' : '36px',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      {isBack ? <Delete size={14} /> : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {puzzleIndex < CROSSCLIMB_PUZZLES.length - 1 && (
          <button
            onClick={() => setPuzzleIndex(puzzleIndex + 1)}
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '6px 14px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Next Climb <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Victory Modal */}
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
              Ladder Conquered!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              You shifted every letter from base to summit!
            </p>

            <button
              onClick={() => {
                if (puzzleIndex < CROSSCLIMB_PUZZLES.length - 1) {
                  setPuzzleIndex(puzzleIndex + 1);
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
              {puzzleIndex < CROSSCLIMB_PUZZLES.length - 1 ? 'Next Crossclimb →' : 'Play Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
