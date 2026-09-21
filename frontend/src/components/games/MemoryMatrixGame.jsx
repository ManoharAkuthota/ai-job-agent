import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Heart, Trophy, RotateCcw, Zap, Sparkles, Play, ChevronRight } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

const LEVEL_CONFIGS = [
  { level: 1, size: 3, tilesCount: 3, flashMs: 1300 },
  { level: 2, size: 3, tilesCount: 4, flashMs: 1200 },
  { level: 3, size: 4, tilesCount: 4, flashMs: 1200 },
  { level: 4, size: 4, tilesCount: 5, flashMs: 1100 },
  { level: 5, size: 4, tilesCount: 6, flashMs: 1100 },
  { level: 6, size: 5, tilesCount: 6, flashMs: 1000 },
  { level: 7, size: 5, tilesCount: 7, flashMs: 1000 },
  { level: 8, size: 5, tilesCount: 8, flashMs: 950 },
  { level: 9, size: 6, tilesCount: 8, flashMs: 900 },
  { level: 10, size: 6, tilesCount: 9, flashMs: 850 }
];

export default function MemoryMatrixGame({ onPuzzleComplete }) {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('jobagent_memory_high_score') || 0);
    } catch (e) {
      return 0;
    }
  });

  // Game phases: 'IDLE' | 'FLASHING' | 'RECALL' | 'ROUND_SUCCESS' | 'GAME_OVER'
  const [phase, setPhase] = useState('IDLE');
  const [targetTiles, setTargetTiles] = useState(new Set());
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [wrongTiles, setWrongTiles] = useState(new Set());

  const timerRef = useRef(null);

  const currentConfig = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
  const { size, tilesCount, flashMs } = currentConfig;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Launch a round when level changes (if game is active)
  useEffect(() => {
    if (phase === 'IDLE' || phase === 'GAME_OVER') return;

    // Generate random target pattern for current level
    const totalCells = size * size;
    const targets = new Set();
    while (targets.size < tilesCount) {
      const rand = Math.floor(Math.random() * totalCells);
      targets.add(rand);
    }

    setTargetTiles(targets);
    setSelectedTiles(new Set());
    setWrongTiles(new Set());
    setPhase('FLASHING');
    soundFx.playTap();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase('RECALL');
    }, flashMs);
  }, [level]); // Reliably triggered on every level change!

  const startNewGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLevel(1);
    setLives(3);
    setScore(0);

    const config = LEVEL_CONFIGS[0];
    const totalCells = config.size * config.size;
    const targets = new Set();
    while (targets.size < config.tilesCount) {
      const rand = Math.floor(Math.random() * totalCells);
      targets.add(rand);
    }

    setTargetTiles(targets);
    setSelectedTiles(new Set());
    setWrongTiles(new Set());
    setPhase('FLASHING');
    soundFx.playTap();

    timerRef.current = setTimeout(() => {
      setPhase('RECALL');
    }, config.flashMs);
  };

  const advanceToNextLevel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLevel(l => l + 1);
  };

  const handleTileClick = (index) => {
    if (phase !== 'RECALL') return;
    if (selectedTiles.has(index) || wrongTiles.has(index)) return;

    if (targetTiles.has(index)) {
      const nextSelected = new Set(selectedTiles);
      nextSelected.add(index);
      setSelectedTiles(nextSelected);
      soundFx.playPlace();

      if (nextSelected.size === targetTiles.size) {
        // Round won!
        const roundPts = level * 150 + tilesCount * 50;
        const newScore = score + roundPts;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('jobagent_memory_high_score', newScore.toString());
        }

        setPhase('ROUND_SUCCESS');
        soundFx.playWin();

        // Auto-advance safely
        timerRef.current = setTimeout(() => {
          advanceToNextLevel();
        }, 1100);
      }
    } else {
      const nextWrong = new Set(wrongTiles);
      nextWrong.add(index);
      setWrongTiles(nextWrong);
      soundFx.playError();

      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives <= 0) {
        setPhase('GAME_OVER');
        if (onPuzzleComplete) {
          onPuzzleComplete({
            game: 'memory',
            level,
            score
          });
        }
      }
    }
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
      {/* Compact Level & Stats Bar */}
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
        {/* Level & Highscore */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid #6366f1',
            color: '#818cf8',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '5px'
          }}>
            Lvl {level}
          </span>
          <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700' }}>
            Best: {highScore}
          </span>
        </div>

        {/* Lives */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={15}
              color={i < lives ? '#ef4444' : '#475569'}
              fill={i < lives ? '#ef4444' : 'transparent'}
            />
          ))}
        </div>

        {/* Target Count */}
        <div style={{ color: '#94a3b8', fontSize: '11px' }}>
          Tiles: <strong style={{ color: '#38bdf8' }}>{selectedTiles.size}/{tilesCount}</strong>
        </div>

        {/* Current Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '800', fontSize: '12px' }}>
          <Zap size={14} />
          <span>{score}</span>
        </div>
      </div>

      {/* Matrix Grid Container - Responsively Clamped */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', width: '100%' }}>
        <div
          style={{
            position: 'relative',
            background: '#070b14',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.8)',
            width: 'min(88vw, 340px, calc(100dvh - 190px))',
            height: 'min(88vw, 340px, calc(100dvh - 190px))',
            aspectRatio: '1 / 1'
          }}
        >
          {phase === 'IDLE' ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px'
            }}>
              <Brain size={48} color="#818cf8" style={{ filter: 'drop-shadow(0 0 12px rgba(129, 140, 248, 0.8))' }} />
              <div style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '280px' }}>
                Tiles will flash briefly. Tap to recall the exact pattern!
              </div>
              <button
                onClick={startNewGame}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '15px'
                }}
              >
                <Play size={18} /> Start Training
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gap: '8px',
                width: '100%',
                height: '100%'
              }}
            >
              {Array.from({ length: size * size }).map((_, idx) => {
                const isTarget = targetTiles.has(idx);
                const isSelected = selectedTiles.has(idx);
                const isWrong = wrongTiles.has(idx);
                const isFlashing = phase === 'FLASHING' && isTarget;

                let tileBg = '#0f172a';
                let tileBorder = '1px solid rgba(255, 255, 255, 0.08)';
                let tileShadow = 'none';

                if (isFlashing) {
                  tileBg = 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
                  tileBorder = '1px solid #38bdf8';
                  tileShadow = '0 0 16px rgba(56, 189, 248, 0.9)';
                } else if (isSelected) {
                  tileBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  tileBorder = '1px solid #10b981';
                  tileShadow = '0 0 16px rgba(16, 185, 129, 0.9)';
                } else if (isWrong) {
                  tileBg = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  tileBorder = '1px solid #ef4444';
                  tileShadow = '0 0 16px rgba(239, 68, 68, 0.9)';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(idx)}
                    disabled={phase !== 'RECALL' || isSelected || isWrong}
                    style={{
                      background: tileBg,
                      border: tileBorder,
                      borderRadius: '8px',
                      boxShadow: tileShadow,
                      cursor: phase === 'RECALL' ? 'pointer' : 'default',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isFlashing || isSelected ? 'scale(0.96)' : 'scale(1)'
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Phase status indicator & manual advance */}
      <div style={{ minHeight: '36px', marginBottom: '16px' }}>
        {phase === 'FLASHING' && (
          <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>
            Memorizing pattern ({flashMs / 1000}s)...
          </div>
        )}
        {phase === 'RECALL' && (
          <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
            Tap the {tilesCount} tiles from memory!
          </div>
        )}
        {phase === 'ROUND_SUCCESS' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '800' }}>
              ⭐ Level {level} Cleared!
            </span>
            <button
              onClick={advanceToNextLevel}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Continue <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>



      {/* Game Over Modal */}
      {phase === 'GAME_OVER' && (
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
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
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
              background: 'rgba(99, 102, 241, 0.15)',
              border: '2px solid #6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#818cf8'
            }}>
              <Brain size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>
              Memory Session Complete
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              Great cognitive workout! You reached <strong>Level {level}</strong>.
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
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Final Score</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{score}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>High Score</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>{highScore}</div>
              </div>
            </div>

            <button
              onClick={startNewGame}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
              <RotateCcw size={16} /> Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
