'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const typeEmoji: Record<string, string> = {
  BOOKING_CONFIRMED: '🎫',
  BOOKING_CANCELLED: '❌',
  PAYMENT_SUCCESS: '✅',
  PAYMENT_FAILED: '❌',
  REFUND_ISSUED: '💸',
  NEW_FOLLOWER: '👤',
  REVIEW_LIKED: '❤️',
  REVIEW_COMMENTED: '💬',
  WATCH_PARTY_INVITE: '🎉',
  WATCH_PARTY_VOTE: '🗳️',
  CHALLENGE_COMPLETED: '🏆',
  SHOW_CANCELLED: '🚫',
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiFetch('/notifications?limit=10');
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-800/40 ${
                    !n.isRead ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <span className="text-lg shrink-0">{typeEmoji[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                      {n.title}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-800 text-center">
            <Link
              href="/notifications"
              className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
