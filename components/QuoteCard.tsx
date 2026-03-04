'use client';

import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

const QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { text: "The details are not the details. They make the design.", author: "Charles Eames" },
  { text: "Less is more.", author: "Mies van der Rohe" },
  { text: "Good design is obvious. Great design is transparent.", author: "Joe Sparano" },
];

export function QuoteCard() {
  // Simple random quote for now (stable on client mount ideally, but random is fine for demo)
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-2xl p-8 h-full flex flex-col justify-center relative overflow-hidden"
    >
      <Quote className="absolute top-6 left-6 w-8 h-8 text-white/10" />
      
      <blockquote className="relative z-10 text-center">
        <p className="text-2xl font-serif italic leading-relaxed text-white/90 mb-6">
          "{quote.text}"
        </p>
        <footer className="text-xs font-medium tracking-widest uppercase text-white/50">
          — {quote.author}
        </footer>
      </blockquote>
    </motion.div>
  );
}
