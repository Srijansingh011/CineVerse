'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { initials } from '../../lib/format';
import Link from 'next/link';
import { tmdbImage } from '../../lib/media';
import Image from 'next/image';

const TABS = [
  { id: 'following', label: 'Following' },
  { id: 'discover', label: 'Discover' },
  { id: 'trending', label: 'Trending' },
  { id: 'friends', label: 'Friends' },
];

export default function CommunityPage() {
  const { isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState('following');
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/social/feed');
        setFeed(Array.isArray(res.data) ? res.data : res.data?.items || []);
      } catch {
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, tab]);

  const like = async (id: string) => {
    try {
      await apiFetch(`/social/reviews/${id}/like`, { method: 'POST' });
    } catch {
      // ignore
    }
  };

  return (
    <PageShell>
      <main className="cv-container cv-page max-w-2xl">
        <h1 className="font-display text-[36px] text-white">Community</h1>
        <p className="mt-1 text-[15px] text-muted mb-6">What people are watching and rating.</p>
        <Tabs items={TABS} value={tab} onChange={setTab} />

        {!isAuthenticated ? (
          <EmptyState
            title="Join the conversation"
            description="Sign in to follow friends and see reviews."
            action={<Link href="/login"><Button size="sm">Sign in</Button></Link>}
          />
        ) : loading ? (
          <p className="text-[14px] text-muted mt-8">Loading feed…</p>
        ) : feed.length === 0 ? (
          <EmptyState title="Nothing in this feed yet" description="Follow friends or write a review to get started." />
        ) : (
          <div className="mt-6 space-y-8">
            {feed.map((item: any) => {
              const poster = tmdbImage(item.movie?.posterPath, "w185");
              return (
                <article key={item.id || `${item.user?.id}-${item.createdAt}`} className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center text-[12px] font-semibold shrink-0">
                    {initials(item.user?.name, item.user?.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-muted">
                      <span className="text-white font-medium">{item.user?.name || 'Member'}</span>
                      {item.rating ? ` rated` : ' posted'}
                    </p>
                    <div className="mt-2 flex gap-3">
                      {poster ? (
                        <div className="relative w-14 aspect-[2/3] rounded-[4px] overflow-hidden shrink-0">
                          <Image src={poster} alt="" fill className="object-cover" sizes="56px" />
                        </div>
                      ) : null}
                      <div>
                        {item.movie?.title ? <p className="font-semibold">{item.movie.title}</p> : null}
                        {item.rating ? <p className="text-highlight text-[13px] mt-0.5">{'★'.repeat(Math.round(item.rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(item.rating)))}</p> : null}
                        {item.content ? <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.content}</p> : null}
                      </div>
                    </div>
                    {item.id ? (
                      <div className="mt-3 flex gap-4 text-[13px] text-muted">
                        <button type="button" onClick={() => like(item.id)} className="hover:text-white">Like {item._count?.likes ?? item.likes ?? ''}</button>
                        <span>Comments {item._count?.comments ?? item.comments ?? ''}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
}
