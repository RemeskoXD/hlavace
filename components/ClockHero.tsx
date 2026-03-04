'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export function ClockHero() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-48" />; // Prevent hydration mismatch

  const hours = format(time, 'HH');
  const minutes = format(time, 'mm');
  const date = format(time, 'EEEE, MMMM do');

  return (
    <div className="flex flex-col justify-center h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline gap-4"
      >
        <h1 className="text-[8rem] leading-none font-serif font-light tracking-tighter">
          {hours}
          <span className="animate-pulse text-white/50">:</span>
          {minutes}
        </h1>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-white/60 font-light tracking-widest uppercase mt-4 ml-2"
      >
        {date}
      </motion.p>
    </div>
  );
}
