'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';
import { cn } from '../lib/cn';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function typeLabel(type: string) {
  if (type.includes('BOOKING')) return 'Booking';
  if (type.includes('PAYMENT') || type.includes('REFUND')) return 'Payment';
  if (type.includes('WATCH_PARTY')) return 'Watch Party';
  if (type.includes('FOLLOW') || type.includes('REVIEW')) return 'Social';
  return 'System';
}

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
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-muted hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-[var(--border)] rounded-[8px] shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[14px]">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[12px] text-muted hover:text-white"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted">
                You&apos;re all caught up.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03]",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted mb-0.5">{typeLabel(n.type)}</p>
                    <p className={cn("text-[13px] truncate", n.isRead ? "text-muted" : "text-white font-medium")}>
                      {n.title}
                    </p>
                    <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--border)] text-center">
            <Link
              href="/notifications"
              className="text-[12px] font-medium text-muted hover:text-white"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
