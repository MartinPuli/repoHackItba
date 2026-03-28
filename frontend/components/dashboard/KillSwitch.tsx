"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { OctagonX, ChevronRight } from "lucide-react";

interface KillSwitchProps {
  onActivate?: () => void;
  isVisible?: boolean;
}

export function KillSwitch({ onActivate, isVisible = true }: KillSwitchProps) {
  const [dragX, setDragX] = useState(0);
  const [activated, setActivated] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 200;

  if (!isVisible) return null;

  function handleDragEnd() {
    if (dragX >= THRESHOLD) {
      setActivated(true);
      onActivate?.();
      // Reset after animation
      setTimeout(() => {
        setActivated(false);
        setDragX(0);
      }, 2000);
    } else {
      setDragX(0);
    }
  }

  const progress = Math.min(dragX / THRESHOLD, 1);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        ref={trackRef}
        className="relative h-14 w-72 overflow-hidden rounded-2xl border border-accent-red/30 bg-accent-red/10 backdrop-blur-xl"
        style={{
          boxShadow: `0 0 ${20 + progress * 30}px rgba(255, 68, 68, ${0.1 + progress * 0.3})`,
        }}
      >
        {/* Background progress */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-accent-red/30 to-accent-red/60 transition-all"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-accent-red/70">
            {activated ? "Session Keys Revocadas" : "Desliza para DETENER agente"}
          </span>
        </div>

        {/* Draggable thumb */}
        {!activated && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: THRESHOLD }}
            dragElastic={0}
            onDrag={(_, info) => setDragX(Math.max(0, info.offset.x))}
            onDragEnd={handleDragEnd}
            className="absolute left-1 top-1 flex h-12 w-14 cursor-grab items-center justify-center rounded-xl bg-accent-red active:cursor-grabbing"
            whileTap={{ scale: 0.95 }}
          >
            <OctagonX className="h-5 w-5 text-white" />
          </motion.div>
        )}

        {/* Success checkmark */}
        {activated && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-accent-red/20"
          >
            <OctagonX className="h-6 w-6 text-accent-red" />
          </motion.div>
        )}

        {/* Chevron hints */}
        {!activated && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-0.5 text-accent-red/30">
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
