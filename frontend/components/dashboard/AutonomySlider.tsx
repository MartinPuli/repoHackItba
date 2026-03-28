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
  textColor: string;
  dotColor: string;
  bgColor: string;
  permissions: string[];
}[] = [
  {
    key: "asistente",
    label: "Asistente",
    description: "El agente sugiere, vos decidís todo",
    icon: <ShieldCheck className="h-5 w-5" />,
    textColor: "text-accent-green",
    dotColor: "bg-accent-green",
    bgColor: "bg-accent-green",
    permissions: [
      "Ver sugerencias de inversión",
      "Ver análisis de mercado",
    ],
  },
  {
    key: "copiloto",
    label: "Co-Piloto",
    description: "El agente prepara, vos aprobás con 1 click",
    icon: <Compass className="h-5 w-5" />,
    textColor: "text-accent-yellow",
    dotColor: "bg-accent-yellow",
    bgColor: "bg-accent-yellow",
    permissions: [
      "Compliance UIF/CNV automático",
      "Preparar transacciones",
      "Notificaciones proactivas",
    ],
  },
  {
    key: "autonomo",
    label: "Autónomo",
    description: "El agente ejecuta con Session Keys",
    icon: <Bot className="h-5 w-5" />,
    textColor: "text-accent-orange",
    dotColor: "bg-accent-orange",
    bgColor: "bg-accent-orange",
    permissions: [
      "Session Keys activas",
      "Rebalanceo automático",
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
        <h3 className="section-label">Autonomía del asistente</h3>
        <div className={cn("flex items-center gap-2", activeLevel.textColor)}>
          {activeLevel.icon}
          <span className="text-sm font-semibold">{activeLevel.label}</span>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative mb-6">
        <div className="flex h-12 items-center rounded-lg border border-line bg-surface-muted p-1">
          {levels.map((level) => (
            <button
              key={level.key}
              onClick={() => handleSelect(level.key)}
              className={cn(
                "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-300",
                currentLevel === level.key
                  ? "text-white"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {level.icon}
              <span className="hidden sm:inline">{level.label}</span>
            </button>
          ))}

          {/* Sliding indicator */}
          <motion.div
            className={cn(
              "absolute top-1 h-10 rounded-lg shadow-sm",
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
          <p className="text-sm text-ink-muted">{activeLevel.description}</p>
          <div className="space-y-1.5">
            {activeLevel.permissions.map((perm) => (
              <div key={perm} className="flex items-center gap-2 text-xs">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    activeLevel.dotColor
                  )}
                />
                <span className="text-ink-muted">{perm}</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
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
                <h3 className="text-lg font-bold text-ink">
                  Activar Modo Autónomo
                </h3>
              </div>
              <p className="mb-2 text-sm text-ink-muted">
                El agente podrá ejecutar transacciones automáticamente usando
                Session Keys. Esto incluye:
              </p>
              <ul className="mb-6 space-y-1 text-sm text-ink-muted">
                <li>— Rebalanceo automático del portafolio</li>
                <li>— Optimización de yield (Venus + Rootstock)</li>
                <li>— Pagos via Agentic Commerce</li>
              </ul>
              <p className="mb-6 text-xs text-accent-yellow font-medium">
                Siempre podés desactivar con el Kill Switch.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAutonomo}
                  className="flex-1 rounded-xl bg-accent-orange px-4 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105"
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
