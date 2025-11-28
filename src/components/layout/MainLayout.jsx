import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import MiniPlayer from './MiniPlayer';
import { usePlayerStore } from '../../store';
import { cn } from '../../lib/utils';

export default function MainLayout() {
  const { isMiniPlayerVisible } = usePlayerStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            isMiniPlayerVisible && 'pb-24'
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mini Player */}
      <MiniPlayer />
    </div>
  );
}
