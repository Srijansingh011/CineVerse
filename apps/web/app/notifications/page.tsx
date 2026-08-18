'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { cn } from '../../lib/cn';
import Link from 'next/link';

function typeLabel(type: string) {
  if (type.includes('BOOKING')) return 'Booking';
  if (type.includes('PAYMENT') || type.includes('REFUND')) return 'Payment';
  if (type.includes('WATCH_PARTY')) return 'Watch Party';
  if (type.includes('FOLLOW') || type.includes('REVIEW')) return 'Social';
  return 'System';
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch('/notifications?limit=50')
      .then((res) => setItems(res.data?.notifications || []))
      .catch(() => setItems([]));
  }, [isAuthenticated]);

  const filtered = tab === 'all' ? items : items.filter((n) => typeLabel(n.type).toLowerCase().includes(tab));

  return (
    <PageShell>
      <main className="cv-container cv-page max-w-2xl">
        <h1 className="font-display text-[36px] text-white mb-6">Notifications</h1>
        {!isAuthenticated ? (
          <EmptyState title="Sign in to view notifications" action={<Link href="/login"><Button size="sm">Sign in</Button></Link>} />
        ) : (
          <>
            <Tabs
              items={[
                { id: 'all', label: 'All' },
                { id: 'booking', label: 'Booking' },
                { id: 'payment', label: 'Payment' },
                { id: 'social', label: 'Social' },
                { id: 'watch', label: 'Watch Party' },
                { id: 'system', label: 'System' },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="mt-4 divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <EmptyState title="No notifications" />
              ) : filtered.map((n) => (
                <div key={n.id} className={cn("py-4", !n.isRead && "bg-primary/5 -mx-3 px-3")}>
                  <p className="text-[11px] uppercase tracking-wide text-muted">{typeLabel(n.type)}</p>
                  <p className="text-[15px] font-medium mt-0.5">{n.title}</p>
                  <p className="text-[13px] text-muted mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}
