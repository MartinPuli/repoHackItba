"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Bot, Send, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = [
  "¿Conviene subir el colateral en Venus esta semana?",
  "Explicame el Dead Man's Switch en dos frases.",
  "Prepará un envío de 50 USDT a mi contacto frecuente.",
];

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
}

export default function AgentPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hola 👋 Soy tu asistente patrimonial. Estoy listo para ayudarte con yield, compliance y envíos. Escribí abajo o elegí una sugerencia.",
    },
  ]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: input,
    };
    const agentMsg: Message = {
      id: `agent-${Date.now()}`,
      role: "agent",
      text: "Gracias por tu consulta. En esta demo no tengo un backend real, pero en producción analizaría tu portafolio y respondería con datos en tiempo real. 🤖",
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput("");
  }

  return (
    <AppShell topTitle="Asistente patrimonial" unreadAlerts={0}>
      <PageHeader
        title="Agente AI"
        description="Modo asistente: el agente analiza y sugiere; vos firmás las acciones on-chain."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat area */}
        <div
          className="glass-card flex flex-col lg:col-span-2"
          style={{ minHeight: "480px" }}
        >
          {/* Chat header */}
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-agent/15 text-agent">
                <Bot className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Conversación</p>
                <p className="text-[11px] text-ink-faint">
                  Respuestas de demo · sin backend en este build
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green/40 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
                </span>
                <span className="text-[11px] font-medium text-accent-green">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    msg.role === "agent"
                      ? "mr-8 self-start"
                      : "ml-8 self-end"
                  }
                >
                  <div
                    className={
                      msg.role === "agent"
                        ? "rounded-2xl rounded-tl-md border border-line bg-surface-muted/60 px-4 py-3"
                        : "rounded-2xl rounded-tr-md bg-pistachio px-4 py-3 text-white"
                    }
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Suggestions + Input */}
          <div className="border-t border-line p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-line bg-surface-muted/30 px-3 py-1.5 text-left text-[11px] text-ink-muted transition-colors hover:border-pistachio-light hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Preguntá o pedí una acción…"
                className="min-h-[44px] flex-1 rounded-xl border border-line bg-canvas-elevated px-4 text-sm text-ink placeholder:text-ink-faint outline-none ring-brand/0 transition-[box-shadow,border-color] focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
              />
              <PrimaryButton onClick={handleSend} className="shrink-0 px-4">
                <Send className="h-4 w-4" strokeWidth={2} />
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Nivel actual
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-growth/12 text-growth">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="text-lg font-semibold text-growth">Asistente</span>
            </div>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              Solo lectura y sugerencias. Cambiá el nivel desde el dashboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Compliance
            </p>
            <div className="mt-3 flex items-center gap-2 text-brand">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-medium">UIF/CNV activo</span>
            </div>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              En co-piloto y autónomo, las alertas UIF/CNV se procesan antes de
              ejecutar cada transacción.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Capacidades
            </p>
            <div className="mt-3 space-y-2">
              {[
                { icon: TrendingUp, label: "Análisis de mercado" },
                { icon: ShieldCheck, label: "Compliance automático" },
                { icon: Sparkles, label: "Sugerencias de yield" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-ink-muted">
                  <Icon className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
