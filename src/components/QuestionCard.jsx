import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NumPad from './NumPad.jsx'
import ChoicePad from './ChoicePad.jsx'
import Robot from './Robot.jsx'

export default function QuestionCard({ question, onAnswer, questionNum, totalQuestions, timedMode = false }) {
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('question') // question | result
  const [correct, setCorrect] = useState(null)
  const [timeLeft, setTimeLeft] = useState(timedMode ? 15 : null)
  const [showHint, setShowHint] = useState(false)
  const startTime = useRef(Date.now())
  const timerRef = useRef(null)

  useEffect(() => {
    startTime.current = Date.now()
    setInput('')
    setSelected(null)
    setPhase('question')
    setCorrect(null)
    setShowHint(false)
    if (timedMode) setTimeLeft(15)
  }, [question])

  useEffect(() => {
    if (!timedMode || phase !== 'question') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(input || selected, true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, timedMode, question])

  function handleSubmit(val, timedOut = false) {
    clearInterval(timerRef.current)
    const responseMs = Date.now() - startTime.current
    const userAnswer = val !== null && val !== undefined ? String(val).trim() : ''
    const correctAnswer = String(question.answer).trim()
    const isCorrect = userAnswer === correctAnswer && !timedOut
    setCorrect(isCorrect)
    setPhase('result')
    setTimeout(() => {
      onAnswer({ correct: isCorrect, responseMs, skillId: question.skill })
    }, 1200)
  }

  const robotMood = phase === 'result' ? (correct ? 'celebrate' : 'sad') : timedMode ? 'excited' : 'thinking'
  const robotMsg = phase === 'result'
    ? (correct ? '🎉 Awesome work!' : `The answer was ${question.answer}`)
    : timedMode ? 'Go go go!' : 'You got this!'

  const isBoss = question.style === 'boss'

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto"
    >
      {/* Progress + timer */}
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} className="w-8 h-2 rounded-full" style={{
              background: i < questionNum ? '#6366f1' : i === questionNum ? '#a5b4fc' : 'rgba(255,255,255,0.15)'
            }} />
          ))}
        </div>
        {timedMode && timeLeft !== null && (
          <motion.div
            className="text-lg font-black px-3 py-1 rounded-xl"
            style={{
              background: timeLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
              color: timeLeft <= 5 ? '#fca5a5' : '#e2e8f0',
            }}
            animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ⏱ {timeLeft}s
          </motion.div>
        )}
      </div>

      {/* Robot */}
      <Robot mood={robotMood} message={robotMsg} size="sm" />

      {/* Question bubble */}
      <div
        className="w-full rounded-3xl p-5"
        style={{
          background: isBoss
            ? 'linear-gradient(135deg, #7c2d12, #9a3412)'
            : 'rgba(255,255,255,0.08)',
          border: isBoss ? '2px solid #f97316' : '2px solid rgba(255,255,255,0.1)',
        }}
      >
        {isBoss && <p className="text-xs font-black text-orange-400 mb-2">🔥 BOSS CHALLENGE</p>}
        <p className="text-white font-black text-lg leading-snug whitespace-pre-line">{question.prompt}</p>

        {question.hints?.length > 0 && !showHint && phase === 'question' && (
          <button
            onClick={() => setShowHint(true)}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          >
            💡 Need a hint?
          </button>
        )}
        <AnimatePresence>
          {showHint && question.hints?.[0] && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm"
              style={{ color: '#a5b4fc' }}
            >
              💡 {question.hints[0]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div
              className="text-6xl font-black rounded-full w-28 h-28 flex items-center justify-center"
              style={{
                background: correct ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                boxShadow: correct ? '0 0 40px rgba(34,197,94,0.6)' : '0 0 40px rgba(239,68,68,0.6)',
              }}
            >
              {correct ? '✓' : '✗'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      {phase === 'question' && (
        question.type === 'choice' ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <ChoicePad
              choices={question.choices}
              selected={selected}
              onSelect={c => { setSelected(c); setTimeout(() => handleSubmit(c), 300) }}
              disabled={false}
            />
          </div>
        ) : (
          <NumPad
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={false}
          />
        )
      )}
    </motion.div>
  )
}
