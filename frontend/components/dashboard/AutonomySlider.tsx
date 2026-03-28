"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Compass, Bot, AlertTriangle } from "lucide-react";

type AutonomyLevel = "asistente" | "copiloto" | "autonomo";

const levels: {
  key: AutonomyLevel;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  permissions: string[];
}[] = [
  {
    key: "asistente",
    label: "Asistente",
    description: "El agente sugiere, tu decides todo",
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "text-accent-green",
    bgColor: "bg-accent-green",
    permissions: [
      "Ver sugerencias de inversion",
      "Ver analisis de mercado",
    ],
  },
  {
    key: "copiloto",
    label: "Co-Piloto",
    description: "El agente prepara, tu apruebas con 1 click",
    icon: <Compass className="h-5 w-5" />,
    color: "text-accent-yellow",
    bgColor: "bg-accent-yellow",
    permissions: [
      "Compliance UIF/CNV automatico",
      "Preparar transacciones",
      "Notificaciones proactivas",
    ],
  },
  {
    key: "autonomo",
    label: "Autonomo",
    description: "El agente ejecuta con Session Keys",
    icon: <Bot className="h-5 w-5" />,
    color: "text-accent-orange",
    bgColor: "bg-accent-orange",
    permissions: [
      "Session Keys activas",
      "Rebalanceo automatico",
      "Yield optimization",
      "Agentic Commerce",
    ],
  },
];

interface AutonomySliderProps {
  value?: AutonomyLevel;
  onChange?: (level: AutonomyLevel) => void;
}

export function AutonomySlider({
  value = "asistente",
  onChange,
}: AutonomySliderProps) {
  const [currentLevel, setCurrentLevel] = useState<AutonomyLevel>(value);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<AutonomyLevel | null>(null);

  const currentIndex = levels.findIndex((l) => l.key === currentLevel);
  const activeLevel = levels[currentIndex];

  function handleSelect(level: AutonomyLevel) {
    if (level === currentLevel) return;

    // Require confirmation to go to Autonomo
    if (level === "autonomo") {
      setPendingLevel(level);
      setShowConfirm(true);
      return;
    }

    setCurrentLevel(level);
    onChange?.(level);
  }

  function confirmAutonomo() {
    if (pendingLevel) {
      setCurrentLevel(pendingLevel);
      onChange?.(pendingLevel);
    }
    setShowConfirm(false);
    setPendingLevel(null);
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-white/40">
          Nivel de Autonomia
        </h3>
        <div className={cn("flex items-center gap-2", activeLevel.color)}>
          {activeLevel.icon}
          <span className="text-sm font-semibold">{activeLevel.label}</span>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative mb-6">
        <div className="flex h-12 items-center rounded-xl bg-white/5 p-1">
          {levels.map((level, index) => (
            <button
              key={level.key}
              onClick={() => handleSelect(level.key)}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-300",
                currentLevel === level.key
                  ? "text-black"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {level.icon}
              <span className="hidden sm:inline">{level.label}</span>
            </button>
          ))}

          {/* Sliding indicator */}
          <motion.div
            className={cn(
              "absolute top-1 h-10 rounded-lg",
              activeLevel.bgColor
            )}
            initial={false}
            animate={{
              left: `calc(${currentIndex * 33.33}% + 4px)`,
              width: "calc(33.33% - 8px)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="space-y-3"
        >
          <p className="text-sm text-white/60">{activeLevel.description}</p>
          <div className="space-y-1.5">
            {activeLevel.permissions.map((perm) => (
              <div key={perm} className="flex items-center gap-2 text-xs">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    activeLevel.bgColor
                  )}
                />
                <span className="text-white/50">{perm}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card mx-4 max-w-md p-6"
            >
              <div className="mb-4 flex items-center gap-3 text-accent-orange">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold">Activar Modo Autonomo</h3>
              </div>
              <p className="mb-2 text-sm text-white/60">
                El agente podra ejecutar transacciones automaticamente usando
                Session Keys. Esto incluye:
              </p>
              <ul className="mb-6 space-y-1 text-sm text-white/50">
                <li>- Rebalanceo automatico del portafolio</li>
                <li>- Optimizacion de yield (Venus + Rootstock)</li>
                <li>- Pagos via Agentic Commerce</li>
              </ul>
              <p className="mb-6 text-xs text-accent-yellow">
                Siempre podes desactivar con el Kill Switch.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAutonomo}
                  className="flex-1 rounded-xl bg-accent-orange px-4 py-2.5 text-sm font-bold text-black transition-all hover:brightness-110"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
