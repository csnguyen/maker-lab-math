import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionCard from './QuestionCard.jsx'
import Robot from './Robot.jsx'
import { getZPDQuestions, updateMastery, saveProfile, unlockNextSkills } from '../engine/mastery.js'
import { QUESTIONS } from '../data/curriculum.js'

const PHASES = ['intro', 'warmup', 'warmup_result', 'quest', 'quest_result', 'boss', 'boss_result', 'complete']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SessionScreen({ profile, onComplete, onUpdateProfile }) {
  const [phase, setPhase] = useState('intro')
  const [questionIdx, setQuestionIdx] = useState(0)
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState([])
  const [sessionResults, setSessionResults] = useState({ correct: 0, total: 0, boltsEarned: 0, bricksEarned: 0 })
  const [warmupTimer, setWarmupTimer] = useState(90)
  const [warmupActive, setWarmupActive] = useState(false)
  const timerRef = useRef(null)
  const warmupResults = useRef([])
  const questResults = useRef([])

  // Build question sets
  const warmupQs = shuffle(getZPDQuestions(profile, 'warmup'))
  const questQs = shuffle(getZPDQuestions(profile, 'quest'))
  const bossQs = QUESTIONS.filter(q => q.style === 'boss')
  const bossQ = shuffle(bossQs)[0]

  function startPhase(p) {
    setPhase(p)
    setQuestionIdx(0)
    setResults([])
    if (p === 'warmup') {
      setQuestions(warmupQs.slice(0, 12))
      setWarmupTimer(90)
      setWarmupActive(true)
    } else if (p === 'quest') {
      setQuestions(questQs.slice(0, 4))
    } else if (p === 'boss') {
      setQuestions(bossQ ? [bossQ] : [])
    }
  }

  // Warmup countdown
  useEffect(() => {
    if (phase !== 'warmup' || !warmupActive) return
    timerRef.current = setInterval(() => {
      setWarmupTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setWarmupActive(false)
          setPhase('warmup_result')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, warmupActive])

  function handleAnswer({ correct, responseMs, skillId }) {
    // Update mastery
    const updatedProfile = updateMastery(profile, skillId, correct, responseMs)
    onUpdateProfile(updatedProfile)
    saveProfile(updatedProfile)

    const res = { correct, skillId, responseMs }

    if (phase === 'warmup') {
      warmupResults.current.push(res)
      if (questionIdx + 1 >= questions.length) {
        clearInterval(timerRef.current)
        setWarmupActive(false)
        setPhase('warmup_result')
      } else {
        setQuestionIdx(i => i + 1)
      }
    } else if (phase === 'quest') {
      questResults.current.push(res)
      if (questionIdx + 1 >= questions.length) {
        setPhase('quest_result')
      } else {
        setQuestionIdx(i => i + 1)
      }
    } else if (phase === 'boss') {
      const bossCorrect = correct
      const bolts = warmupResults.current.filter(r => r.correct).length * 2
        + questResults.current.filter(r => r.correct).length * 3
        + (bossCorrect ? 10 : 0)
      const bricks = Math.floor(bolts / 5)
      setSessionResults({ correct: bolts, boltsEarned: bolts, bricksEarned: bricks })
      setPhase('boss_result')
    }
  }

  function calcWarmupStats() {
    const r = warmupResults.current
    const correct = r.filter(x => x.correct).length
    const pct = r.length ? Math.round(correct / r.length * 100) : 0
    return { correct, total: r.length, pct }
  }

  function calcQuestStats() {
    const r = questResults.current
    const correct = r.filter(x => x.correct).length
    return { correct, total: r.length }
  }

  // Finish session
  function finishSession() {
    const bolts = warmupResults.current.filter(r => r.correct).length * 2
      + questResults.current.filter(r => r.correct).length * 3
      + (sessionResults.boltsEarned > 0 ? 10 : 0)
    const bricks = Math.floor(bolts / 5)
    onComplete({ boltsEarned: bolts, bricksEarned: bricks })
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8 max-w-sm mx-auto text-center">
        <Robot mood="excited" message="Mission briefing!" size="lg" />
        <div>
          <h1 className="text-3xl font-black text-white mb-2">DAILY SPRINT</h1>
          <p className="text-base" style={{ color: '#94a3b8' }}>3 challenges await, Maker. Let's see what you've got!</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          {[
            { icon: '⚡', label: 'Warm-Up Speed Run', desc: '90 seconds of arithmetic', color: '#fbbf24' },
            { icon: '🔍', label: 'The Quest', desc: '4 logic challenges', color: '#34d399' },
            { icon: '👾', label: 'Boss Level', desc: '1 epic mind-bender', color: '#f87171' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <span className="text-3xl">{item.icon}</span>
              <div className="text-left">
                <p className="font-black text-white">{item.label}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <motion.button
          onClick={() => startPhase('warmup')}
          whileTap={{ scale: 0.95 }}
          className="w-full py-5 rounded-2xl text-xl font-black text-white"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 8px 24px rgba(251,191,36,0.4)' }}
        >
          ⚡ START WARM-UP!
        </motion.button>
      </div>
    )
  }

  if (phase === 'warmup') {
    const timerPct = (warmupTimer / 90) * 100
    return (
      <div className="flex flex-col items-center min-h-screen px-4 py-4 gap-4 max-w-sm mx-auto">
        {/* Timer ring */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <p className="text-xs font-bold mb-1" style={{ color: '#fbbf24' }}>⚡ SPEED RUN</p>
            <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #fbbf24, #f59e0b)`, width: `${timerPct}%` }}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="text-2xl font-black" style={{ color: warmupTimer <= 20 ? '#f87171' : '#fbbf24', minWidth: 48 }}>
            {warmupTimer}s
          </div>
        </div>

        <AnimatePresence mode="wait">
          {questions[questionIdx] && (
            <QuestionCard
              key={questions[questionIdx].id + questionIdx}
              question={questions[questionIdx]}
              onAnswer={handleAnswer}
              questionNum={questionIdx}
              totalQuestions={Math.min(questions.length, 12)}
              timedMode={true}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'warmup_result') {
    const { correct, total, pct } = calcWarmupStats()
    const excellent = pct >= 80
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 max-w-sm mx-auto text-center">
        <Robot mood={excellent ? 'celebrate' : 'happy'} message={excellent ? 'LIGHTNING FAST!' : 'Good speed!'} size="lg" />
        <div className="w-full rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-2xl font-black text-white mb-1">⚡ Speed Run Complete!</h2>
          <div className="text-5xl font-black my-4" style={{ color: excellent ? '#fbbf24' : '#94a3b8' }}>{pct}%</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>{correct} / {total} correct</p>
          {excellent && <p className="mt-2 text-sm font-bold text-yellow-400">🔓 Advanced questions unlocked mid-session!</p>}
        </div>
        <motion.button
          onClick={() => startPhase('quest')}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 rounded-2xl text-xl font-black text-white"
          style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', boxShadow: '0 8px 24px rgba(52,211,153,0.4)' }}
        >
          🔍 START THE QUEST!
        </motion.button>
      </div>
    )
  }

  if (phase === 'quest') {
    return (
      <div className="flex flex-col items-center min-h-screen px-4 py-4 gap-4 max-w-sm mx-auto">
        <div className="w-full">
          <p className="text-xs font-bold mb-1" style={{ color: '#34d399' }}>🔍 THE QUEST</p>
        </div>
        <AnimatePresence mode="wait">
          {questions[questionIdx] && (
            <QuestionCard
              key={questions[questionIdx].id + questionIdx}
              question={questions[questionIdx]}
              onAnswer={handleAnswer}
              questionNum={questionIdx}
              totalQuestions={questions.length}
              timedMode={false}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'quest_result') {
    const { correct, total } = calcQuestStats()
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 max-w-sm mx-auto text-center">
        <Robot mood="celebrate" message="Quest complete!" size="lg" />
        <div className="w-full rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-2xl font-black text-white mb-4">🔍 Quest Complete!</h2>
          <div className="text-5xl font-black mb-2" style={{ color: '#34d399' }}>{correct}/{total}</div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>problems solved</p>
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{
                background: i < correct ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'
              }}>
                {i < correct ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
        <motion.button
          onClick={() => startPhase('boss')}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 rounded-2xl text-xl font-black text-white"
          style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', boxShadow: '0 8px 24px rgba(248,113,113,0.4)' }}
        >
          👾 FACE THE BOSS!
        </motion.button>
      </div>
    )
  }

  if (phase === 'boss') {
    return (
      <div className="flex flex-col items-center min-h-screen px-4 py-4 gap-4 max-w-sm mx-auto"
        style={{ background: 'linear-gradient(180deg, rgba(124,45,18,0.3), transparent)' }}>
        <div className="w-full">
          <p className="text-xs font-bold mb-1" style={{ color: '#f87171' }}>👾 BOSS LEVEL</p>
        </div>
        <AnimatePresence mode="wait">
          {questions[0] && (
            <QuestionCard
              key={questions[0].id}
              question={questions[0]}
              onAnswer={handleAnswer}
              questionNum={0}
              totalQuestions={1}
              timedMode={false}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'boss_result') {
    const bolts = warmupResults.current.filter(r => r.correct).length * 2
      + questResults.current.filter(r => r.correct).length * 3
    const bossQ = QUESTIONS.filter(q => q.style === 'boss')

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6 max-w-sm mx-auto text-center">
        <Robot mood="celebrate" message="Mission complete!" size="lg" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-full rounded-3xl p-6"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '2px solid rgba(99,102,241,0.4)' }}
        >
          <h2 className="text-3xl font-black text-white mb-4">🏆 MISSION COMPLETE!</h2>
          <div className="flex justify-center gap-8 mb-4">
            <div>
              <div className="text-4xl font-black text-yellow-400">{bolts}</div>
              <div className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>⚡ Bolts</div>
            </div>
            <div>
              <div className="text-4xl font-black text-pink-400">{Math.floor(bolts / 5)}</div>
              <div className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>🧱 Bricks</div>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Head to the Build Room to spend your rewards!</p>
        </motion.div>

        <motion.button
          onClick={() => onComplete({ boltsEarned: bolts, bricksEarned: Math.floor(bolts / 5) })}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 rounded-2xl text-xl font-black text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.5)' }}
        >
          🏗️ GO TO BUILD ROOM
        </motion.button>
      </div>
    )
  }

  return null
}
