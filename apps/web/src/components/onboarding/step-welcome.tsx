'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepWelcomeProps {
  onNext: () => void
  userName?: string | null
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const floatingOrb = {
  animate: {
    y: [-8, 8, -8],
    rotate: [0, 5, -5, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
}

export function StepWelcome({ onNext, userName }: StepWelcomeProps) {
  const firstName = userName?.split(' ')[0]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center text-center px-4"
    >
      {/* Animated orbs background */}
      <div className="relative mb-8">
        <motion.div
          variants={floatingOrb}
          animate="animate"
          className="absolute -top-6 -left-10 w-20 h-20 rounded-full bg-primary/10 blur-2xl"
        />
        <motion.div
          variants={floatingOrb}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute -bottom-4 -right-8 w-16 h-16 rounded-full bg-violet-400/10 blur-2xl"
        />

        {/* Logo icon */}
        <motion.div
          variants={item}
          className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <Sparkles size={36} className="text-white" />
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Greeting */}
      <motion.h1
        variants={item}
        className="text-3xl font-bold text-foreground tracking-tight"
      >
        {firstName ? `${firstName}, добро пожаловать!` : 'Добро пожаловать!'}
      </motion.h1>

      <motion.p
        variants={item}
        className="text-muted-foreground mt-3 text-base max-w-sm leading-relaxed"
      >
        Настроим приложение под вас за пару минут. Расскажите немного о себе — и
        вперёд!
      </motion.p>

      {/* Feature pills */}
      <motion.div variants={item} className="flex flex-wrap justify-center gap-2 mt-8">
        {['Расписание', 'Оплаты', 'ДЗ', 'Telegram'].map((label, i) => (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
            className="px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary"
          >
            {label}
          </motion.span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="mt-10 w-full max-w-xs">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full group"
        >
          Поехали
          <ArrowRight
            size={18}
            className="ml-2 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </motion.div>
  )
}
