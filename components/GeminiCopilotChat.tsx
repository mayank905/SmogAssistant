"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, HelpCircle, ShieldAlert } from "lucide-react";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";

interface GeminiCopilotChatProps {
  telemetry: AirQualityTelemetry;
  context: UserContextProfile;
  geminiKey: string;
  isGeminiValid: boolean;
  onOpenKeyModal: () => void;
}

interface Message {
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  modelUsed?: string;
  refused?: boolean;
}

const SAMPLE_QUERIES = [
  "Can I take my 6-year-old child to the park this evening?",
  "What type of mask is best for my 35-minute two-wheeler commute today?",
  "How should I run my indoor air purifier in a 250 sq ft bedroom?",
  "Is morning jogging safe with my mild asthma right now?",
];

export const GeminiCopilotChat: React.FC<GeminiCopilotChatProps> = ({
  telemetry,
  context,
  geminiKey,
  isGeminiValid,
  onOpenKeyModal,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "copilot",
      text: `Hello! I am your SmogAssistant GenAI Copilot. With current AQI of ${telemetry.overallAqi} (${telemetry.cpcbCategory}) in ${telemetry.location.city}, ask me any question about your commute, masks, vulnerable family members, or outdoor activity timings.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const newMsg: Message = {
      sender: "user",
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": geminiKey,
        },
        body: JSON.stringify({
          query: userText.trim(),
          telemetry,
          context,
          apiKey: geminiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "copilot",
            text: data.response || "No response received.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            modelUsed: data.modelUsed,
            refused: data.refused,
          },
        ]);
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "copilot",
            text: `Notice: ${errData.details || errData.error || "Failed to generate answer. Check your Gemini API key."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Error connecting to Gemini Copilot service: ${e?.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Interactive GenAI Copilot Advisory
              </h3>
              {isGeminiValid ? (
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200"
                  title="Multi-Model Waterfall Cascade: gemini-3.6-flash → gemini-3.5-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite → gemini-2.5-flash → gemini-1.5-flash"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1 animate-pulse" />
                  Gemini Waterfall (3.6 → 3.5 → Lite → 2.5)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                  Key Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Personalized Q&A tailored to {context.profileName || "your household profile"}
            </p>
          </div>
        </div>

        {!isGeminiValid && (
          <button
            onClick={onOpenKeyModal}
            className="px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors shadow-xs"
          >
            Authenticate Gemini Key
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="p-4 sm:p-6 space-y-4 max-h-[380px] overflow-y-auto bg-slate-50/30">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${
              m.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === "user"
                  ? "bg-slate-800 text-white"
                  : "bg-indigo-600 text-white shadow-xs"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === "user"
                  ? "bg-indigo-600 text-white shadow-xs rounded-tr-none"
                  : "bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-none whitespace-pre-line"
              }`}
            >
              <p>{m.text}</p>
              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {m.refused && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <ShieldAlert className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                      Domain Guard Active (Air Quality Only)
                    </span>
                  )}
                  {m.modelUsed && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                      Tier: {m.modelUsed}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] ${
                    m.sender === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-600 font-medium py-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Gemini Copilot is evaluating environmental factors & household profile...</span>
          </div>
        )}
      </div>

      {/* Sample Quick Questions */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 flex items-center flex-shrink-0">
          <HelpCircle className="w-3 h-3 mr-1" /> Quick Prompts:
        </span>
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            disabled={isLoading || !isGeminiValid}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs transition-colors border border-slate-200 disabled:opacity-50"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(query);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading || !isGeminiValid}
            placeholder={
              isGeminiValid
                ? "Ask Gemini Copilot a custom question (e.g. workout timing, mask type, child exposure)..."
                : "Connect your Gemini API Key above to unlock custom AI Copilot conversations"
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim() || !isGeminiValid}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center"
          >
            <Send className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </button>
        </form>
      </div>
    </div>
  );
};
