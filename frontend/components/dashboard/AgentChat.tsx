"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Wifi, WifiOff } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tool?: string;
  data?: Record<string, unknown>;
}

interface AgentChatProps {
  walletAddress?: string;
  userId?: string;
  apiUrl?: string;
}

export function AgentChat({
  walletAddress,
  userId = "web-user",
  apiUrl = "http://localhost:3001",
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola! Soy tu asistente financiero. Podés preguntarme lo que quieras: ver tu balance, invertir, pedir un préstamo, o hacer pagos. Escribí en español, yo entiendo.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          wallet_address: walletAddress,
          user_id: userId,
        }),
      });

      const data = await res.json();
      setConnected(true);

      const assistantMsg: Message = {
        role: "assistant",
        content: data.text || "Operación completada.",
        timestamp: new Date().toISOString(),
        tool: data.tool,
        data: data.data,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No pude conectarme al servidor. Verificá que el MCP server esté corriendo (npm run dev en mcp-server/).",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickActions = [
    { label: "Balance", message: "cuánto tengo" },
    { label: "Invertir", message: "qué estrategias de inversión hay" },
    { label: "Préstamo", message: "opciones de préstamo" },
    { label: "Historial", message: "mis últimos movimientos" },
  ];

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Agente Smart Wallet</p>
            <p className="text-xs text-white/40">
              {connected ? "Conectado" : "Desconectado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {connected ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-white/10"
                  : "bg-gradient-to-br from-blue-500 to-violet-600"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-white/60" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600/30 text-white border border-blue-500/20"
                  : "bg-white/[0.05] text-white/90 border border-white/5"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.tool && (
                <p className="text-[10px] text-white/30 mt-1.5">
                  tool: {msg.tool}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
            <div className="bg-white/[0.05] border border-white/5 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setInput(action.message);
                setTimeout(() => sendMessage(), 50);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50 transition-colors"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white disabled:opacity-30 hover:from-blue-500 hover:to-violet-500 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
