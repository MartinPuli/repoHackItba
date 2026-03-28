"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ShieldCheck,
  ArrowRightLeft,
  Brain,
  AlertTriangle,
  Clock,
  Undo2,
} from "lucide-react";

type ActionType =
  | "analysis"
  | "suggestion"
  | "compliance"
  | "execute"
  | "yield"
  | "alert"
  | "deadman";

interface ActivityItem {
  id: string;
  type: ActionType;
  message: string;
  timestamp: string;
  status?: "success" | "pending" | "warning";
  canRevert?: boolean;
}

const typeConfig: Record<
  ActionType,
  { icon: React.ReactNode; color: string }
> = {
  analysis: {
    icon: <Brain className="h-4 w-4" />,
    color: "text-indigo-400",
  },
  suggestion: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-accent-cyan",
  },
  compliance: {
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-accent-green",
  },
  execute: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "text-accent-orange",
  },
  yield: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-accent-green",
  },
  alert: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-accent-yellow",
  },
  deadman: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-accent-cyan",
  },
};

interface ActivityFeedProps {
  items?: ActivityItem[];
  maxItems?: number;
}

// Mock data for demo
const mockItems: ActivityItem[] = [
  {
    id: "1",
    type: "analysis",
    message: "rBTC yield subio a 8.2% APY — evaluando rebalanceo",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    status: "success",
  },
  {
    id: "2",
    type: "suggestion",
    message: "Sugerencia: mover +5% a pool Rootstock",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: "pending",
    canRevert: false,
  },
  {
    id: "3",
    type: "compliance",
    message: "Tx aprobada — compliance UIF verificado",
    timestamp: new Date(Date.now() - 480000).toISOString(),
    status: "success",
  },
  {
    id: "4",
    type: "deadman",
    message: "resetTime() ejecutado — Dead Man's Switch activo",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    status: "success",
  },
  {
    id: "5",
    type: "yield",
    message: "Colateral Venus OK — LTV 68.2%",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    status: "success",
  },
  {
    id: "6",
    type: "execute",
    message: "Deposito 100 USDT en Venus Protocol",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "success",
    canRevert: true,
  },
];

export function ActivityFeed({
  items = mockItems,
  maxItems = 10,
}: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="glass-card flex flex-col p-5" style={{ maxHeight: "420px" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-white/40">
          Actividad del Agente
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse-glow" />
          <span className="text-xs font-medium text-accent-green">LIVE</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {displayItems.map((item, index) => {
            const config = typeConfig[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5"
              >
                <div
                  className={cn(
                    "mt-0.5 rounded-md bg-white/5 p-1.5",
                    config.color
                  )}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 leading-tight">
                    {item.message}
                  </p>
                  <span className="text-xs text-white/30">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                {item.canRevert && (
                  <button className="shrink-0 rounded-md p-1 text-white/20 opacity-0 transition-all hover:bg-white/5 hover:text-white/50 group-hover:opacity-100">
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
