'use client';

import { ClockHero } from '@/components/ClockHero';
import { WeatherWidget } from '@/components/WeatherWidget';
import { TaskWidget } from '@/components/TaskWidget';
import { QuoteCard } from '@/components/QuoteCard';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12 lg:p-24 flex flex-col relative">
      {/* Background Ambient Light */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <header className="flex justify-between items-center mb-16">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-3 h-3 bg-white rounded-full" />
          <span className="text-sm font-medium tracking-widest uppercase">Lumina OS</span>
        </motion.div>
        
        <motion.nav 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-6 text-sm text-white/50"
        >
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Analytics</a>
          <a href="#" className="hover:text-white transition-colors">Settings</a>
        </motion.nav>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Main Hero Section - Time */}
        <div className="lg:col-span-8 lg:row-span-2 min-h-[300px]">
          <ClockHero />
        </div>

        {/* Weather Widget */}
        <div className="lg:col-span-4 lg:row-span-1 min-h-[200px]">
          <WeatherWidget />
        </div>

        {/* Quote Card */}
        <div className="lg:col-span-4 lg:row-span-1 min-h-[200px]">
          <QuoteCard />
        </div>

        {/* Task Widget - Spans full width on mobile, partial on desktop */}
        <div className="lg:col-span-12 min-h-[300px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 h-full">
              <TaskWidget />
            </div>
            
            {/* Quick Stats / Additional Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel rounded-2xl p-8 flex flex-col justify-between"
            >
              <span className="text-xs font-medium tracking-widest uppercase text-white/50">System Status</span>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Focus Score</span>
                    <span className="text-white">87%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[87%]" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Energy</span>
                    <span className="text-white">High</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[92%]" />
                  </div>
                </div>
              </div>

              <button className="w-full py-3 mt-4 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
                Start Focus Session
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
