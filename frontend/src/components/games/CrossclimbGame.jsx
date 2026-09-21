import React, { useState, useEffect } from 'react';
import { Layers, HelpCircle, Sparkles, CheckCircle2, RotateCcw, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
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
        clue: 'Individual physical processing unit in modern multi-threaded CPUs'
      },
      {
        word: 'CARE',
        clue: 'Diligent quality assurance applied before pushing to production'
      },
      {
        word: 'CASE',
        clue: 'Branch condition evaluated within a switch statement'
      },
      {
        word: 'BASE',
        clue: 'Initial foundation of a git branch or logarithmic numeral radix'
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
        clue: 'Raw values, attributes and records ingested into databases',
        given: true
      },
      {
        word: 'DATE',
        clue: 'ISO 8601 temporal timestamp format'
      },
      {
        word: 'GATE',
        clue: 'Elementary digital logic circuit (AND, OR, NOT, XOR)'
      },
      {
        word: 'GAME',
        clue: 'Interactive algorithmic puzzle designed to stimulate human logic'
      }
    ]
  }
];

export default function CrossclimbGame({ onPuzzleComplete }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = CROSSCLIMB_PUZZLES[puzzleIndex];
  const { rungs, wordLength } = currentPuzzle;

  // Player answers array: string for each rung
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

  // Check if two words differ by exactly 1 character
  const isOneLetterDiff = (w1, w2) => {
    if (w1.length !== w2.length) return false;
    let diffs = 0;
    for (let i = 0; i < w1.length; i++) {
      if (w1[i] !== w2[i]) diffs++;
    }
    return diffs === 1;
  };

  const handleInputChange = (idx, value) => {
    if (rungs[idx].given || isWon) return;

    const cleaned = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, wordLength);
    const nextAnswers = [...answers];
    nextAnswers[idx] = cleaned;
    setAnswers(nextAnswers);

    if (cleaned.length === wordLength) {
      // Check correctness
      if (cleaned === rungs[idx].word) {
        soundFx.playPlace();

        // Check if entire ladder is complete
        const allCorrect = nextAnswers.every((ans, i) => ans === rungs[i].word);
        if (allCorrect) {
          setIsWon(true);
          soundFx.playWin();
          if (onPuzzleComplete) {
            onPuzzleComplete({
              game: 'crossclimb',
              puzzleId: currentPuzzle.id
            });
          }
        } else {
          // Advance to next unfilled rung
          const nextUnfilled = nextAnswers.findIndex((ans, i) => !rungs[i].given && ans !== rungs[i].word);
          if (nextUnfilled !== -1) {
            setActiveRungIndex(nextUnfilled);
          }
        }
      } else {
        soundFx.playError();
      }
    }
  };

  const handleReset = () => {
    setAnswers(rungs.map(r => (r.given ? r.word : '')));
    setActiveRungIndex(1);
    setIsWon(false);
    soundFx.playTap();
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
            <Layers size={20} color="#a855f7" style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.7))' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              Crossclimb
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Word ladder trivia. Shift 1 letter per rung to reach the summit.
          </p>
        </div>

        <select
          value={puzzleIndex}
          onChange={(e) => setPuzzleIndex(Number(e.target.value))}
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
          {CROSSCLIMB_PUZZLES.map((pz, idx) => (
            <option key={pz.id} value={idx}>
              {pz.title}
            </option>
          ))}
        </select>
      </div>

      {/* Ladder Rungs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {rungs.map((rung, idx) => {
          const isCorrect = answers[idx] === rung.word;
          const isCurrentActive = activeRungIndex === idx;

          return (
            <div
              key={idx}
              onClick={() => !rung.given && !isWon && setActiveRungIndex(idx)}
              style={{
                background: isCorrect
                  ? 'rgba(16, 185, 129, 0.08)'
                  : isCurrentActive
                    ? 'rgba(168, 85, 247, 0.12)'
                    : '#0c1220',
                border: `1px solid ${
                  isCorrect
                    ? '#10b981'
                    : isCurrentActive
                      ? '#a855f7'
                      : 'rgba(255, 255, 255, 0.08)'
                }`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.2s ease',
                cursor: rung.given ? 'default' : 'pointer',
                boxShadow: isCurrentActive ? '0 0 15px rgba(168, 85, 247, 0.2)' : 'none'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Rung #{idx + 1} {rung.given && '• Given Word'}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  {rung.clue}
                </div>
              </div>

              {/* Word Letters Box */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: wordLength }).map((_, charIdx) => {
                  const letter = (answers[idx] || '')[charIdx] || '';
                  return (
                    <span
                      key={charIdx}
                      style={{
                        width: '32px',
                        height: '36px',
                        borderRadius: '6px',
                        background: rung.given ? '#1e293b' : isCorrect ? 'rgba(16, 185, 129, 0.2)' : '#070b14',
                        border: `1px solid ${isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: isCorrect ? '#10b981' : '#f8fafc',
                        fontSize: '16px',
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

      {/* Active Word Typing Input */}
      {!isWon && !rungs[activeRungIndex]?.given && (
        <div style={{
          background: '#0c1220',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
            Enter 4-letter word for Rung #{activeRungIndex + 1}:
          </div>
          <input
            type="text"
            maxLength={wordLength}
            value={answers[activeRungIndex] || ''}
            onChange={(e) => handleInputChange(activeRungIndex, e.target.value)}
            placeholder={`Type ${wordLength}-letter word...`}
            autoFocus
            style={{
              background: '#070b14',
              color: '#f8fafc',
              border: '1px solid #a855f7',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          />
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleReset}
          style={{
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={15} /> Reset Ladder
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
          💡 How to Play Crossclimb:
        </div>
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          <li>Climb the ladder by guessing each tech trivia word.</li>
          <li>Each word differs from the previous word by <strong>exactly one letter</strong>.</li>
          <li>Fill all rungs to conquer the puzzle!</li>
        </ul>
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
              You successfully shifted every letter from base to summit!
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
