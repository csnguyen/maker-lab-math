import { motion } from 'framer-motion'

const BUTTONS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['⌫', '0', '✓'],
]

export default function NumPad({ value, onChange, onSubmit, disabled = false }) {
  function handlePress(key) {
    if (disabled) return
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === '✓') {
      if (value) onSubmit(value)
    } else {
      if (value.length < 6) onChange(value + key)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {/* Display */}
      <div
        className="rounded-2xl px-4 py-3 text-center text-3xl font-black text-white mb-1"
        style={{ background: 'rgba(255,255,255,0.1)', minHeight: 60, letterSpacing: 4 }}
      >
        {value || <span style={{ opacity: 0.3 }}>?</span>}
      </div>

      {/* Buttons */}
      {BUTTONS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-2">
          {row.map(key => {
            const isSubmit = key === '✓'
            const isDel = key === '⌫'
            return (
              <motion.button
                key={key}
                onPointerDown={() => handlePress(key)}
                whileTap={{ scale: 0.88 }}
                disabled={disabled}
                className="rounded-2xl font-black text-2xl select-none cursor-pointer"
                style={{
                  minHeight: 64,
                  background: isSubmit
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : isDel
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(255,255,255,0.12)',
                  color: isSubmit ? '#fff' : isDel ? '#fca5a5' : '#e2e8f0',
                  boxShadow: isSubmit ? '0 4px 15px rgba(34,197,94,0.4)' : 'none',
                  opacity: disabled ? 0.4 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {key}
              </motion.button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
