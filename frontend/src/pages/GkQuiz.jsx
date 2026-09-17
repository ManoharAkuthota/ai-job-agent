import React, { useState, useEffect, useRef } from 'react';
import { getGkNextQuestion, getGkTopics } from '../services/api';
import {
  Sparkles, Award, Flame, CheckCircle2, XCircle, RefreshCw,
  HelpCircle, Volume2, VolumeX, ArrowRight, BookOpen, Lightbulb,
  Landmark, Film, MapPin, Scroll, Atom, Trophy, Shuffle
} from 'lucide-react';

export default function GkQuiz() {
  const [topics, setTopics] = useState([
    { id: 'ALL', name: 'Mixed Trivia', icon: 'Sparkles' },
    { id: 'POLITICS', name: 'Politics & Civics', icon: 'Landmark' },
    { id: 'MOVIES', name: 'Movies & Cinema', icon: 'Film' },
    { id: 'CITIES', name: 'Cities & Geography', icon: 'MapPin' },
    { id: 'HISTORY', name: 'History', icon: 'Scroll' },
    { id: 'SCIENCE', name: 'Science & Space', icon: 'Atom' },
    { id: 'SPORTS', name: 'Sports & Cricket', icon: 'Trophy' }
  ]);

  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Score & Game Stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-advance timer ref
  const autoAdvanceTimer = useRef(null);

  // Web Audio API Synthesizer (Zero asset dependencies)
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'correct') {
        // High-pitched cheerful major chime (C6 -> E6 -> G6)
        const now = ctx.currentTime;
        [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
      } else if (type === 'wrong') {
        // Low warm buzz
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  useEffect(() => {
    loadTopics();
    loadQuestion(selectedTopic, selectedDifficulty);
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const loadTopics = async () => {
    try {
      const res = await getGkTopics();
      if (res.data && res.data.length > 0) {
        setTopics(res.data);
      }
    } catch (e) {
      console.warn("Using fallback topics:", e);
    }
  };

  const loadQuestion = async (topic = selectedTopic, difficulty = selectedDifficulty) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setLoading(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);

    try {
      const res = await getGkNextQuestion(topic, difficulty);
      if (res.data) {
        setCurrentQuestion(res.data);
      }
    } catch (err) {
      console.error("Failed to load question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (newTopic) => {
    setSelectedTopic(newTopic);
    loadQuestion(newTopic, selectedDifficulty);
  };

  const handleDifficultyChange = (newDiff) => {
    setSelectedDifficulty(newDiff);
    loadQuestion(selectedTopic, newDiff);
  };

  const handleSelectOption = (option) => {
    if (isAnswered || loading || !currentQuestion) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setTotalAnswered(prev => prev + 1);

    if (correct) {
      playSound('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const basePoints = selectedDifficulty === 'HARD' ? 30 : selectedDifficulty === 'MEDIUM' ? 20 : 10;
      const streakBonus = Math.min(newStreak * 5, 25);
      setScore(prev => prev + basePoints + streakBonus);
      setTotalCorrect(prev => prev + 1);

      // Auto-advance after 1.6s on victory
      autoAdvanceTimer.current = setTimeout(() => {
        loadQuestion();
      }, 1600);
    } else {
      playSound('wrong');
      setStreak(0);
      // On wrong answer, do NOT auto-advance so user can read explanation
    }
  };

  const renderTopicIcon = (iconName) => {
    switch (iconName) {
      case 'Landmark': return <Landmark size={15} />;
      case 'Film': return <Film size={15} />;
      case 'MapPin': return <MapPin size={15} />;
      case 'Scroll': return <Scroll size={15} />;
      case 'Atom': return <Atom size={15} />;
      case 'Trophy': return <Trophy size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. Header & Live Game Stats */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <Sparkles size={12} />
                AI Real-Time Quiz Studio
              </span>
              <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                Infinite Trivia
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              AI General Knowledge Studio
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Politics, Cinema, Cities, History, Science & Sports. Answer correctly to auto-advance, or explore in-depth explanations.
            </p>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
            style={{
              background: soundEnabled ? 'rgba(99, 102, 241, 0.15)' : '#111827',
              color: soundEnabled ? '#818cf8' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
        </div>

        {/* Live HUD Stats (Score, Streak, Accuracy) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          background: '#070b14',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px'
        }}>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Score</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{score} <span style={{ fontSize: '11px', color: '#818cf8' }}>pts</span></span>
          </div>

          {/* Current Streak */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Current Streak</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: streak > 2 ? '#f59e0b' : '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {streak > 0 && <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' }} />}
              {streak} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🔥</span>
            </span>
          </div>

          {/* Accuracy */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Accuracy</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>{accuracy}%</span>
          </div>

          {/* Total Answered */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Answered</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{totalCorrect} / {totalAnswered}</span>
          </div>
        </div>
      </div>

      {/* 2. Topic Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {topics.map(t => {
          const active = selectedTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTopicChange(t.id)}
              style={{
                background: active ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#0b0f19',
                color: active ? '#ffffff' : '#94a3b8',
                border: active ? '1px solid #818cf8' : '1px solid var(--border)',
                borderRadius: '999px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 0 14px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {renderTopicIcon(t.icon)}
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Difficulty Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Difficulty:</span>
          {['EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              style={{
                background: selectedDifficulty === d ? 'rgba(56, 189, 248, 0.2)' : '#070b14',
                color: selectedDifficulty === d ? '#38bdf8' : '#64748b',
                border: selectedDifficulty === d ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={() => loadQuestion()}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} />
          <span>Skip / New Question</span>
        </button>
      </div>

      {/* 4. Question & Options Display Card */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={28} className="spin" color="#818cf8" />
            <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>Synthesizing fresh AI GK question...</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Querying topic: {selectedTopic}</p>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Question Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  {currentQuestion.topic || selectedTopic}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Difficulty: <strong style={{ color: '#ffffff' }}>{currentQuestion.difficulty || selectedDifficulty}</strong>
                </span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', lineHeight: '1.5' }}>
                {currentQuestion.question}
              </h2>
            </div>

            {/* 4 Clickable Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {currentQuestion.options?.map((option, idx) => {
                const optLetter = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === option;
                const isCorrectOption = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

                let bg = '#070b14';
                let border = '1px solid var(--border)';
                let color = '#f8fafc';
                let shadow = 'none';

                if (isAnswered) {
                  if (isCorrectOption) {
                    bg = 'rgba(16, 185, 129, 0.2)';
                    border = '2px solid #10b981';
                    color = '#34d399';
                    shadow = '0 0 16px rgba(16, 185, 129, 0.4)';
                  } else if (isSelected && !isCorrectOption) {
                    bg = 'rgba(239, 68, 68, 0.2)';
                    border = '2px solid #ef4444';
                    color = '#fca5a5';
                    shadow = '0 0 16px rgba(239, 68, 68, 0.4)';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered}
                    style={{
                      background: bg,
                      border: border,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: isAnswered ? 'default' : 'pointer',
                      boxShadow: shadow,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      transform: isSelected && isCorrect ? 'scale(1.02)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: isAnswered && isCorrectOption ? '#10b981' : isAnswered && isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {optLetter}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: color }}>
                        {option}
                      </span>
                    </div>

                    {isAnswered && (
                      <div>
                        {isCorrectOption && <CheckCircle2 size={20} color="#10b981" />}
                        {isSelected && !isCorrectOption && <XCircle size={20} color="#ef4444" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Auto-Advance Banner */}
            {isAnswered && isCorrect && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 size={18} />
                  <span>Correct! Streak: {streak} 🔥 (+{selectedDifficulty === 'HARD' ? 30 : selectedDifficulty === 'MEDIUM' ? 20 : 10} pts)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a7f3d0' }}>
                  <span>Next question loading in 1.5s...</span>
                  <button
                    type="button"
                    onClick={() => loadQuestion()}
                    className="btn-success"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Next ➜
                  </button>
                </div>
              </div>
            )}

            {/* Wrong Answer Explanation Card */}
            {isAnswered && !isCorrect && (
              <div style={{
                background: '#070b14',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '800', fontSize: '14px' }}>
                    <XCircle size={18} />
                    <span>Incorrect! Correct Answer: <strong style={{ color: '#34d399' }}>{currentQuestion.correctAnswer}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadQuestion()}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Next Question</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#cbd5e1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                    <BookOpen size={15} />
                    <span>Detailed Context & Explanation:</span>
                  </div>
                  <p style={{ margin: 0 }}>{currentQuestion.explanation}</p>
                </div>

                {currentQuestion.funFact && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#fde68a',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Lightbulb size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#ffffff' }}>Did You Know? </strong>
                      <span>{currentQuestion.funFact}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
            <p>No question available right now.</p>
            <button onClick={() => loadQuestion()} className="btn-primary" style={{ marginTop: '10px' }}>
              Load Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
