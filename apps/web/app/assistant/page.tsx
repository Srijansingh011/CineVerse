'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import { Send, Bot, Sparkles, MessageCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  'Recommend an action or sci-fi movie',
  'Show upcoming showtimes at CineVerse cinemas',
  'Tell me about Inception movie details',
  'What is my level and gamification stats?',
];

export default function AssistantPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I am your CineVerse AI Assistant 🍿. Ask me for movie recommendations, theater showtimes, movie details, or your current level and achievements progress. What can I do for you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // Map history format to match API expectations
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: "Sorry, I ran into an error connecting to the CineVerse intelligence layer. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I am your CineVerse AI Assistant 🍿. Ask me for movie recommendations, theater showtimes, movie details, or your current level and achievements progress. What can I do for you today?",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <Bot className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">Please log in to chat with your AI Movie & Booking Assistant.</p>
            <a href="/login" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
              Log In Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6 overflow-hidden">
        {/* Assistant Header */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800/80 backdrop-blur-md px-6 py-5 rounded-t-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-inner ring-2 ring-indigo-500/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-100 flex items-center gap-1.5">
                CineVerse AI <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Intelligence Layer</p>
            </div>
          </div>
          <button 
            onClick={handleClear} 
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            title="Clear Chat History"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Chat Interface Container */}
        <div className="flex-1 flex flex-col bg-slate-950/60 border-x border-b border-slate-800/80 rounded-b-3xl backdrop-blur-sm overflow-hidden min-h-[500px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-[85%] ${
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  m.role === 'user' 
                    ? 'bg-indigo-600/20 border-indigo-500/20 text-indigo-400' 
                    : 'bg-slate-800 border-slate-700 text-indigo-300'
                }`}>
                  {m.role === 'user' ? 'U' : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-slate-100 rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800/80 text-slate-300 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && (
            <div className="px-6 py-3 border-t border-slate-900/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Quick Suggestions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between text-left text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl px-4 py-3 transition text-slate-300 group"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/80">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex gap-3 max-w-3xl mx-auto"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about recommendations, showtimes, or achievements..."
                className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl px-5 flex items-center justify-center transition"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
