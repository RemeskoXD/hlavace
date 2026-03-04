'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Trash2, Circle } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function TaskWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('lumina_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      // Initial demo data
      setTasks([
        { id: '1', text: 'Review design system', completed: false },
        { id: '2', text: 'Meditation session', completed: true },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel rounded-2xl p-8 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-medium tracking-widest uppercase text-white/50">Focus</span>
        <span className="text-xs text-white/30">{tasks.filter(t => !t.completed).length} Remaining</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  task.completed 
                    ? 'bg-white border-white text-black' 
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                {task.completed && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 text-sm font-light transition-all duration-300 ${
                task.completed ? 'text-white/30 line-through' : 'text-white/90'
              }`}>
                {task.text}
              </span>
              <button 
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm font-light italic">
            No tasks for today. Enjoy the silence.
          </div>
        )}
      </div>

      <form onSubmit={addTask} className="relative">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
        />
        <button 
          type="submit"
          disabled={!newTask.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:hover:bg-white/10 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}
