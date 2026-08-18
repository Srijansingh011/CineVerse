'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '../../../components/layout/PageShell';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MovieCard } from '../../../components/movie/MovieCard';
import { tmdbImage, movieRuntime, movieOverview } from '../../../lib/media';
import { formatRuntime, formatYear, initials } from '../../../lib/format';
import { cn } from '../../../lib/cn';

export default function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;
  const router = useRouter();

  const { isAuthenticated, user } = useAuthStore();
  const [movie, setMovie] = useState<any | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5.0);
  const [reviewContent, setReviewContent] = useState<string>('');
  const [comfortRating, setComfortRating] = useState<number>(0.0);
  const [soundRating, setSoundRating] = useState<number>(0.0);
  const [screenRating, setScreenRating] = useState<number>(0.0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [listMsg, setListMsg] = useState<string | null>(null);

  const fetchMovieDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/movies/${movieId}`);
      setMovie(res.data);
      try {
        const trend = await apiFetch('/movies/trending');
        const genres: string[] = res.data?.genres || [];
        setSimilar(
          (trend.data || [])
            .filter((m: any) => m.id !== movieId && m.genres?.some((g: string) => genres.includes(g)))
            .slice(0, 6)
        );
      } catch {
        setSimilar([]);
      }
    } catch (err: any) {
      setError('We couldn’t load this title. Try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      await apiFetch(`/movies/${movieId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: reviewRating,
          content: reviewContent,
          comfortRating,
          soundRating,
          screenRating,
        }),
      });
      setReviewContent('');
      setComfortRating(0.0);
      setSoundRating(0.0);
      setScreenRating(0.0);
      fetchMovieDetails();
    } catch (err: any) {
      if (err.message === 'Session expired') {
        router.push(`/login?redirect=/movies/${movieId}`);
        return;
      }
      setReviewError('Couldn’t post your review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      await apiFetch(`/ai/summary/${movieId}`, { method: 'POST' });
      fetchMovieDetails();
    } catch (err: any) {
      if (err.message === 'Session expired') {
        router.push(`/login?redirect=/movies/${movieId}`);
        return;
      }
      setReviewError('Couldn’t generate insights right now.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addToWatchlist = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/movies/${movieId}`);
      return;
    }
    try {
      await apiFetch('/social/watchlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ movieId }),
      });
      setListMsg('Watchlist updated');
    } catch {
      setListMsg('Couldn’t update watchlist');
    }
  };

  const logMovie = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/movies/${movieId}`);
      return;
    }
    try {
      await apiFetch('/social/diary', {
        method: 'POST',
        body: JSON.stringify({
          movieId,
          rating: 4,
          watchedAt: new Date(),
          isRewatch: false,
        }),
      });
      setListMsg('Logged to your diary');
    } catch {
      setListMsg('Couldn’t log this movie');
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <Skeleton className="w-full h-[320px] rounded-none" />
        <div className="cv-container -mt-24 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <Skeleton className="md:col-span-3 aspect-[2/3] rounded-[8px]" />
          <div className="md:col-span-9 space-y-3 pt-28">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !movie) {
    return (
      <PageShell>
        <div className="cv-container cv-page">
          <Alert title="Something went wrong" action={<Link href="/"><Button variant="outline" size="sm">Back home</Button></Link>}>
            {error || 'This movie could not be found.'}
          </Alert>
        </div>
      </PageShell>
    );
  }

  const movieYear = formatYear(movie.releaseDate);
  const poster = tmdbImage(movie.posterPath, "w500");
  const backdrop = tmdbImage(movie.backdropPath, "original");

  return (
    <PageShell>
      <div className="relative w-full h-[280px] sm:h-[360px] overflow-hidden">
        {backdrop ? (
          <Image src={backdrop} alt="" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-black/20" />
      </div>

      <main className="cv-container relative z-10 -mt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-3">
            <div className="relative aspect-[2/3] w-full max-w-[240px] lg:max-w-none rounded-[8px] overflow-hidden bg-surface-2">
              {poster ? (
                <Image src={poster} alt={movie.title} fill className="object-cover" sizes="240px" />
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-9 lg:pt-32">
            <h1 className="font-display text-[36px] md:text-[42px] leading-tight text-white">{movie.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
              {movie.rating ? <span className="text-highlight font-semibold">★ {Number(movie.rating).toFixed(1)}</span> : null}
              {movieYear ? <span>{movieYear}</span> : null}
              {formatRuntime(movieRuntime(movie)) ? <span>{formatRuntime(movieRuntime(movie))}</span> : null}
              {movie.language ? <span className="uppercase">{movie.language}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {movie.genres?.map((genre: string) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-muted max-w-2xl">
              {movieOverview(movie) || 'No synopsis available.'}
            </p>
            {listMsg ? <p className="mt-3 text-[13px] text-muted">{listMsg}</p> : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href={`/shows?movie=${movie.id}`}>
                <Button>Book tickets</Button>
              </Link>
              <Button variant="outline" onClick={addToWatchlist}>Add to watchlist</Button>
              <Button variant="ghost" onClick={logMovie}>Log movie</Button>
            </div>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-[24px] text-white mb-4">Reviews</h2>
          {movie.aiSummary ? (
            <p className="text-[14px] text-muted mb-6 max-w-2xl">{movie.aiSummary}</p>
          ) : isAuthenticated ? (
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={handleGenerateAISummary} disabled={isGeneratingAI}>
                {isGeneratingAI ? 'Analyzing…' : 'Generate community insights'}
              </Button>
            </div>
          ) : null}

          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="max-w-2xl space-y-4 mb-10">
              {reviewError ? <Alert>{reviewError}</Alert> : null}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Overall', val: reviewRating, set: setReviewRating },
                  { label: 'Comfort', val: comfortRating, set: setComfortRating },
                  { label: 'Sound', val: soundRating, set: setSoundRating },
                  { label: 'Screen', val: screenRating, set: setScreenRating },
                ].map((item) => (
                  <label key={item.label} className="text-[12px] text-muted">
                    {item.label}
                    <select
                      value={item.val}
                      onChange={(e) => item.set(parseFloat(e.target.value))}
                      className="mt-1 w-full h-9 rounded-[6px] border border-[var(--border)] bg-surface px-2 text-[13px] text-foreground"
                    >
                      {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0].map((val) => (
                        <option key={val} value={val}>{val === 0 ? 'N/A' : `${val} ★`}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="What stayed with you after the credits?"
                rows={4}
                className="w-full rounded-[8px] border border-[var(--border)] bg-surface p-3 text-[15px] outline-none focus:border-primary/50"
              />
              <Button type="submit" disabled={isSubmittingReview || !reviewContent.trim()}>
                {isSubmittingReview ? 'Posting…' : 'Post review'}
              </Button>
            </form>
          ) : (
            <EmptyState
              title="Be the first to review this movie."
              description="Sign in to write a review."
              action={<Link href="/login"><Button variant="outline" size="sm">Sign in</Button></Link>}
            />
          )}

          <div className="space-y-8 max-w-2xl">
            {movie.reviews?.length > 0 ? movie.reviews.map((review: any) => (
              <article key={review.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-[12px] font-semibold">
                      {initials(review.user?.name, review.user?.email)}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium">{review.user?.name || review.user?.email}</p>
                      <p className="text-[12px] text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-[13px] text-highlight font-semibold">★ {review.rating.toFixed(1)}</span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{review.content}</p>
              </article>
            )) : (
              <p className="text-[14px] text-muted">No reviews yet.</p>
            )}
          </div>
        </section>

        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-[24px] text-white mb-5">Similar movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {similar.map((m) => (
                <MovieCard key={m.id} movie={m} showBook={false} />
              ))}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
