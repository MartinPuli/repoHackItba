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
        className="relative h-14 w-72 overflow-hidden rounded-2xl border border-accent-red/30 bg-white backdrop-blur-xl"
        style={{
          boxShadow: `0 4px 24px rgba(212, 107, 107, ${0.08 + progress * 0.2}), 0 0 ${10 + progress * 20}px rgba(212, 107, 107, ${0.05 + progress * 0.15})`,
        }}
      >
        {/* Background progress */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-accent-red/15 to-accent-red/40 transition-all"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-accent-red/80">
            {activated ? "Session Keys Revocadas ✓" : "Deslizá para DETENER agente"}
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
            className="absolute left-1 top-1 flex h-12 w-14 cursor-grab items-center justify-center rounded-xl bg-accent-red shadow-md active:cursor-grabbing"
            whileTap={{ scale: 0.95 }}
          >
            <OctagonX className="h-5 w-5 text-white" />
          </motion.div>
        )}

        {/* Success animation */}
        {activated && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-accent-red/15"
          >
            <OctagonX className="h-6 w-6 text-accent-red" />
          </motion.div>
        )}

        {/* Chevron hints */}
        {!activated && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-0.5 text-accent-red/30">
            <ChevronRight className="h-4 w-4 animate-pulse" />
            <ChevronRight className="h-4 w-4 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <ChevronRight className="h-4 w-4 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>
    </div>
  );
}
