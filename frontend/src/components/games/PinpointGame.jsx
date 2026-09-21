import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, Sparkles, CheckCircle2, XCircle, ArrowRight, Trophy, Lock, Unlock, RotateCcw } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

// Rich tech & engineering themes for Pinpoint
const PINPOINT_PUZZLES = [
  {
    id: 'pinpoint_daily_1',
    category: 'Containerization & DevOps',
    aliases: ['container', 'containers', 'containerization', 'devops', 'docker', 'kubernetes', 'container orchestration'],
    clues: [
      { text: 'Docker', hint: 'Pioneered container standard' },
      { text: 'Kubernetes', hint: 'The cloud orchestration giant' },
      { text: 'Podman', hint: 'Rootless container alternative' },
      { text: 'Containerd', hint: 'Core OCI industry runtime' },
      { text: 'Helm Charts', hint: 'Package manager for cloud manifests' }
    ],
    explanation: 'All clues represent modern Containerization and DevOps orchestration technologies powering distributed cloud systems.'
  },
  {
    id: 'pinpoint_react_hooks',
    category: 'React Hooks',
    aliases: ['react hooks', 'hooks', 'react hook', 'react state hooks', 'react built-in hooks'],
    clues: [
      { text: 'useState', hint: 'Local component state manager' },
      { text: 'useEffect', hint: 'Handles side effects & subscriptions' },
      { text: 'useMemo', hint: 'Caches expensive computation results' },
      { text: 'useCallback', hint: 'Preserves function references across re-renders' },
      { text: 'useRef', hint: 'Persists mutable values without re-rendering' }
    ],
    explanation: 'Introduced in React 16.8, React Hooks allow functional components to manage state, lifecycle side-effects, and memoization.'
  },
  {
    id: 'pinpoint_sql_clauses',
    category: 'SQL Clauses',
    aliases: ['sql', 'sql clauses', 'sql keywords', 'sql statements', 'sql query clauses', 'database query clauses'],
    clues: [
      { text: 'SELECT', hint: 'Retrieves column attributes from tables' },
      { text: 'INNER JOIN', hint: 'Combines records matching predicates' },
      { text: 'GROUP BY', hint: 'Aggregates rows sharing common values' },
      { text: 'HAVING', hint: 'Filters aggregated grouping results' },
      { text: 'ORDER BY', hint: 'Sorts final result set ascending or descending' }
    ],
    explanation: 'Standard SQL query clauses executed logically from FROM to SELECT and ORDER BY across relational database management systems.'
  },
  {
    id: 'pinpoint_http_methods',
    category: 'HTTP Request Methods',
    aliases: ['http methods', 'http verbs', 'rest verbs', 'http request methods', 'rest methods'],
    clues: [
      { text: 'GET', hint: 'Safe & idempotent resource retrieval' },
      { text: 'POST', hint: 'Submits payload data to create entities' },
      { text: 'PUT', hint: 'Idempotently replaces target resource representation' },
      { text: 'PATCH', hint: 'Applies partial modifications to a resource' },
      { text: 'DELETE', hint: 'Removes designated resource URI' }
    ],
    explanation: 'Core HTTP/1.1 and HTTP/2 request methods defining CRUD semantics for web APIs and RESTful architectures.'
  },
  {
    id: 'pinpoint_cloud_aws',
    category: 'AWS Cloud Services',
    aliases: ['aws', 'amazon web services', 'aws services', 'cloud services', 'aws cloud'],
    clues: [
      { text: 'Amazon S3', hint: 'Highly scalable blob object storage' },
      { text: 'Amazon EC2', hint: 'Elastic virtual compute instances' },
      { text: 'AWS Lambda', hint: 'Serverless event-driven compute engine' },
      { text: 'Amazon DynamoDB', hint: 'Ultra-fast managed NoSQL key-value database' },
      { text: 'Amazon CloudFront', hint: 'Global low-latency content delivery network (CDN)' }
    ],
    explanation: 'Foundational cloud services in the Amazon Web Services ecosystem used globally to build resilient, distributed systems.'
  },
  {
    id: 'pinpoint_agile_rituals',
    category: 'Agile & Scrum Ceremonies',
    aliases: ['agile', 'scrum', 'agile ceremonies', 'scrum ceremonies', 'agile rituals', 'scrum rituals', 'sprint ceremonies'],
    clues: [
      { text: 'Daily Standup', hint: '15-minute sync on blockers and daily progress' },
      { text: 'Sprint Planning', hint: 'Defining sprint backlog & commitment goals' },
      { text: 'Sprint Review', hint: 'Demonstrating working software to stakeholders' },
      { text: 'Sprint Retrospective', hint: 'Inspect and adapt team processes' },
      { text: 'Backlog Refinement', hint: 'Decomposing user stories & estimating points' }
    ],
    explanation: 'The five fundamental Scrum events designed to enable transparency, inspection, and adaptation in iterative product development.'
  }
];

export default function PinpointGame({ onPuzzleComplete }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = PINPOINT_PUZZLES[puzzleIndex];

  const [revealedCount, setRevealedCount] = useState(1);
  const [guesses, setGuesses] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING' | 'WON' | 'LOST'
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    setRevealedCount(1);
    setGuesses([]);
    setInputVal('');
    setGameStatus('PLAYING');
    setFeedbackMsg(null);
  }, [puzzleIndex]);

  // Clean and normalize strings for fuzzy comparison
  const normalize = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const checkAnswerMatch = (guess) => {
    const normGuess = normalize(guess);
    const normCategory = normalize(currentPuzzle.category);

    if (normGuess === normCategory) return true;

    // Check alias list
    for (const alias of currentPuzzle.aliases) {
      const normAlias = normalize(alias);
      if (normGuess === normAlias) return true;
      if (normGuess.length >= 3 && (normAlias.includes(normGuess) || normGuess.includes(normAlias))) return true;
    }

    // Split category into word tokens (e.g. "sql", "clauses", "http", "methods")
    const words = currentPuzzle.category.toLowerCase().split(/[\s&/]+/);
    for (const w of words) {
      const normW = normalize(w);
      if (normW.length >= 3 && (normGuess.includes(normW) || normW.includes(normGuess))) {
        return true;
      }
    }

    return false;
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || gameStatus !== 'PLAYING') return;

    const trimmed = inputVal.trim();
    const isCorrect = checkAnswerMatch(trimmed);

    const newGuesses = [...guesses, { text: trimmed, correct: isCorrect }];
    setGuesses(newGuesses);
    setInputVal('');

    if (isCorrect) {
      setGameStatus('WON');
      soundFx.playWin();
      if (onPuzzleComplete) {
        onPuzzleComplete({
          game: 'pinpoint',
          puzzleId: currentPuzzle.id,
          cluesUsed: revealedCount,
          score: (6 - revealedCount) * 100
        });
      }
    } else {
      soundFx.playError();
      setFeedbackMsg(`"${trimmed}" is not the secret theme.`);
      setTimeout(() => setFeedbackMsg(null), 3000);

      // Reveal next clue if available
      if (revealedCount < 5) {
        setRevealedCount(r => r + 1);
      } else {
        // Failed after 5 clues
        setGameStatus('LOST');
      }
    }
  };

  const handleRevealNextClue = () => {
    if (revealedCount < 5 && gameStatus === 'PLAYING') {
      soundFx.playTap();
      setRevealedCount(r => r + 1);
    }
  };

  const handleReset = () => {
    setRevealedCount(1);
    setGuesses([]);
    setInputVal('');
    setGameStatus('PLAYING');
    setFeedbackMsg(null);
    soundFx.playTap();
  };

  // Score calculation
  const score = gameStatus === 'WON' ? (6 - revealedCount) * 100 : 0;
  const starsCount = gameStatus === 'WON' ? 6 - revealedCount : 0;

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
      {/* Compact Top Header & Clues Progress */}
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
          {PINPOINT_PUZZLES.map((pz, idx) => (
            <option key={pz.id} value={idx}>
              Puzzle #{idx + 1} {idx === 0 ? '(Daily)' : ''}
            </option>
          ))}
        </select>

        {/* Clues Count & Progress Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
            Clues: <strong style={{ color: '#38bdf8' }}>{revealedCount}/5</strong>
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(step => (
              <div
                key={step}
                style={{
                  width: '14px',
                  height: '6px',
                  borderRadius: '3px',
                  background: step <= revealedCount
                    ? (gameStatus === 'WON' ? '#10b981' : '#38bdf8')
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Clues List Cards - Compact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', width: '100%' }}>
        {currentPuzzle.clues.map((clue, idx) => {
          const isRevealed = idx < revealedCount;

          return (
            <div
              key={idx}
              style={{
                background: isRevealed ? '#0e1628' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isRevealed ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                borderRadius: '8px',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: isRevealed ? '0 2px 10px rgba(0, 0, 0, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isRevealed ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isRevealed ? '#38bdf8' : '#64748b',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {idx + 1}
                </span>

                {isRevealed ? (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                      {clue.text}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {clue.hint}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={12} /> Locked Clue
                  </div>
                )}
              </div>

              {isRevealed ? (
                <Sparkles size={14} color="#38bdf8" />
              ) : (
                <span style={{ fontSize: '10px', color: '#475569' }}>Clue #{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '13px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <XCircle size={16} />
          {feedbackMsg}
        </div>
      )}

      {/* Guess Input & Controls */}
      {gameStatus === 'PLAYING' ? (
        <form onSubmit={handleGuessSubmit} style={{ marginBottom: '10px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Guess the secret tech theme..."
              style={{
                flex: 1,
                background: '#0c1220',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                minWidth: 0
              }}
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="game-touch-key"
              style={{
                background: inputVal.trim()
                  ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)'
                  : '#1e293b',
                color: inputVal.trim() ? '#030712' : '#64748b',
                fontWeight: '700',
                padding: '0 16px',
                borderRadius: '8px',
                cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              Guess <ArrowRight size={15} />
            </button>
          </div>

          {/* Reveal Next Clue button */}
          {revealedCount < 5 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleRevealNextClue}
                style={{
                  background: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                Need another hint? Reveal Clue #{revealedCount + 1}
              </button>
            </div>
          )}
        </form>
      ) : (
        /* Game Over / Won State Card */
        <div style={{
          background: gameStatus === 'WON' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${gameStatus === 'WON' ? '#10b981' : '#ef4444'}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: gameStatus === 'WON' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: gameStatus === 'WON' ? '#10b981' : '#ef4444',
            marginBottom: '10px'
          }}>
            {gameStatus === 'WON' ? <Trophy size={26} /> : <XCircle size={26} />}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>
            {gameStatus === 'WON' ? 'Category Solved!' : 'Puzzle Completed'}
          </h3>

          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
            Secret Theme:
            <span style={{ color: '#38bdf8', fontWeight: '800', marginLeft: '6px', fontSize: '16px' }}>
              {currentPuzzle.category}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', maxWidth: '440px', margin: '0 auto 16px auto' }}>
            {currentPuzzle.explanation}
          </p>

          {gameStatus === 'WON' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  style={{
                    fontSize: '20px',
                    color: star <= starsCount ? '#fbbf24' : '#475569'
                  }}
                >
                  ★
                </span>
              ))}
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24', marginLeft: '8px' }}>
                +{score} pts
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {puzzleIndex < PINPOINT_PUZZLES.length - 1 ? (
              <button
                onClick={() => setPuzzleIndex(puzzleIndex + 1)}
                style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  color: '#030712',
                  fontWeight: '700',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Next Puzzle →
              </button>
            ) : (
              <button
                onClick={handleReset}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={15} /> Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previous Guesses */}
      {guesses.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Your Guesses ({guesses.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {guesses.map((g, idx) => (
              <span
                key={idx}
                style={{
                  background: g.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${g.correct ? '#10b981' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: g.correct ? '#10b981' : '#f87171',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {g.text}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
