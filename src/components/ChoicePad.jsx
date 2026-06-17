import { motion } from 'framer-motion'

export default function ChoicePad({ choices, onSelect, selected, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
      {choices.map((choice, i) => {
        const isSelected = selected === choice
        return (
          <motion.button
            key={i}
            onPointerDown={() => !disabled && onSelect(choice)}
            whileTap={{ scale: 0.9 }}
            className="rounded-2xl font-black text-xl select-none cursor-pointer px-3 py-4"
            style={{
              minHeight: 64,
              background: isSelected
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.6)' : 'none',
              border: isSelected ? '2px solid #818cf8' : '2px solid transparent',
              opacity: disabled && !isSelected ? 0.5 : 1,
              touchAction: 'manipulation',
            }}
          >
            {choice}
          </motion.button>
        )
      })}
    </div>
  )
}
