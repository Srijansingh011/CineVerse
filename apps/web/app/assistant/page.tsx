'use client';

import { useState, useRef, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import { Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import Link from 'next/link';
import { cn } from '../../lib/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  'What should I watch tonight?',
  'Find a movie for my group.',
  "What's playing near me?",
  'Recommend something like Interstellar.',
];

export default function AssistantPage() {
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Your personal movie companion. Ask for something to watch, a cinema near you, or a film for the group.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMessage: Message = { id: Math.random().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    try {
      const historyPayload = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history: historyPayload }),
      });
      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'I couldn’t reach the companion service. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="cv-container cv-page">
          <EmptyState
            title="Sign in to use CineVerse AI"
            description="Recommendations and nearby showtimes need an account."
            action={<Link href="/login"><Button size="sm">Sign in</Button></Link>}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell footer={false}>
      <main className="cv-container pt-8 pb-8 max-w-3xl flex flex-col min-h-[calc(100vh-8rem)]">
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">CineVerse AI</p>
          <h1 className="font-display text-[32px] text-white mt-1">Your personal movie companion.</h1>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto pb-4">
          {messages.map((m) => (
            <div key={m.id} className={cn('max-w-[85%]', m.role === 'user' && 'ml-auto')}>
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">{m.role === 'user' ? 'You' : 'Companion'}</p>
              <p className={cn('text-[15px] leading-relaxed whitespace-pre-wrap', m.role === 'user' ? 'text-white' : 'text-muted')}>
                {m.content}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-left text-[13px] border border-[var(--border)] rounded-[8px] px-4 py-3 hover:border-white/25 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
          className="flex gap-2 border-t border-[var(--border)] pt-4"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about a film, a night out, or what’s on nearby…"
            className="flex-1 h-11 rounded-[6px] border border-[var(--border)] bg-surface px-3 text-[15px] outline-none focus:border-primary/50"
            disabled={loading}
          />
          <Button type="submit" disabled={!inputValue.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
    </PageShell>
  );
}
