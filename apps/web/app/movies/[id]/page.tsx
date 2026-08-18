'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { Star, Calendar, Clock, MessageSquare, Plus, Heart, ThumbsUp, Bot, Sparkles, ChevronLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';

export default function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;
  const router = useRouter();
  
  const { isAuthenticated, user } = useAuthStore();
  const [movie, setMovie] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5.0);
  const [reviewContent, setReviewContent] = useState<string>('');
  const [comfortRating, setComfortRating] = useState<number>(0.0);
  const [soundRating, setSoundRating] = useState<number>(0.0);
  const [screenRating, setScreenRating] = useState<number>(0.0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const fetchMovieDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/movies/${movieId}`);
      setMovie(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load movie details');
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
      setReviewError(err.message || 'Failed to submit review');
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
      alert(err.message || 'Failed to generate AI highlights summary');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="w-full h-[60vh] relative">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3 lg:col-span-3 space-y-4">
            <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
          </div>
          <div className="md:col-span-9 lg:col-span-9 space-y-6 pt-32">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center max-w-md">
            <h2 className="text-xl font-bold text-rose-400">Error</h2>
            <p className="mt-2 text-sm text-slate-300">{error || 'Movie not found'}</p>
            <Link href="/"><Button className="mt-6" variant="outline">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const movieYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
  const tmdbPosterUrl = movie.posterPath 
    ? (/^(https?:|\/demo\/)/.test(movie.posterPath) ? movie.posterPath : `https://image.tmdb.org/t/p/w500${movie.posterPath}`) 
    : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop';
  const tmdbBackdropUrl = movie.backdropPath 
    ? (/^(https?:|\/demo\/)/.test(movie.backdropPath) ? movie.backdropPath : `https://image.tmdb.org/t/p/original${movie.backdropPath}`) 
    : '';

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col pb-20 font-sans">
      <Navbar />

      {/* Backdrop Hero Section */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] overflow-hidden">
        {tmdbBackdropUrl ? (
          <div className="absolute inset-0">
            <img 
              src={tmdbBackdropUrl} 
              alt={movie.title}
              className="w-full h-full object-cover opacity-40 mix-blend-screen scale-105 animate-in fade-in duration-1000"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/30 to-[#0A0A12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/20 to-transparent" />
      </div>

      {/* Movie Details Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-64 relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Poster Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0A0A12] overflow-hidden shadow-2xl shadow-black ring-1 ring-white/5">
            <img 
              src={tmdbPosterUrl} 
              alt={movie.title}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/shows?movie=${movie.id}`} className="w-full">
              <Button size="lg" className="w-full h-12 text-base shadow-lg shadow-indigo-500/20">Book Tickets</Button>
            </Link>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-[#0A0A12] hover:bg-[#1E1E2E] border-[#1E1E2E]">
                <Plus className="h-4 w-4 mr-2 text-slate-400" /> Watchlist
              </Button>
              <Button variant="outline" className="flex-1 bg-[#0A0A12] hover:bg-[#1E1E2E] border-[#1E1E2E]">
                <Heart className="h-4 w-4 mr-2 text-slate-400" /> Like
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-9 space-y-12 lg:pt-16">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
              {movie.rating && (
                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {movie.rating.toFixed(1)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {movieYear}
              </div>
              {movie.runtime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </div>
              )}
              <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 uppercase tracking-widest text-[10px]">
                {movie.language || 'EN'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {movie.genres?.map((genre: string) => (
                <Badge key={genre} variant="secondary" className="bg-[#1E1E2E] text-slate-300 hover:bg-[#2A2A3C]">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-w-4xl">
            <h3 className="text-xl font-bold text-white">Storyline</h3>
            <p className="text-base text-slate-400 leading-relaxed font-light">{movie.overview || 'No overview available.'}</p>
          </div>

          {/* Reviews Section */}
          <div className="space-y-8 pt-8 border-t border-[#1E1E2E]">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-indigo-500" />
              <h3 className="text-2xl font-bold text-white">Community Reviews</h3>
            </div>

            {/* AI Review Summary consensus */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-[#0A0A12] border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Bot className="h-24 w-24 text-indigo-400" />
              </div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      CineVerse AI Consensus
                    </h4>
                  </div>
                  {movie.aiSummary ? (
                    <div className="text-sm text-slate-300 leading-relaxed font-light pr-8">
                      {movie.aiSummary}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-400">Generate an intelligent sentiment analysis based on all community reviews.</p>
                      <Button
                        onClick={handleGenerateAISummary}
                        disabled={isGeneratingAI}
                        variant="secondary"
                        size="sm"
                        className="bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/30"
                      >
                        {isGeneratingAI ? 'Analyzing reviews...' : 'Generate Insights'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Input */}
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {user?.name ? user.name.charAt(0) : user?.email.charAt(0)}
                  </div>
                  <h4 className="text-base font-semibold text-white">Write a review</h4>
                </div>
                
                {reviewError && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">{reviewError}</p>}
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#05050A] p-4 rounded-xl border border-[#1E1E2E]">
                  {[
                    { label: 'Overall', val: reviewRating, set: setReviewRating, color: 'text-amber-400' },
                    { label: 'Comfort', val: comfortRating, set: setComfortRating, color: 'text-indigo-400' },
                    { label: 'Sound', val: soundRating, set: setSoundRating, color: 'text-purple-400' },
                    { label: 'Screen', val: screenRating, set: setScreenRating, color: 'text-emerald-400' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                      <select 
                        value={item.val}
                        onChange={(e) => item.set(parseFloat(e.target.value))}
                        className={`rounded-md border border-[#1E1E2E] bg-[#0A0A12] px-3 py-2 text-sm ${item.color} focus:outline-none focus:border-indigo-500 cursor-pointer`}
                      >
                        {[5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0].map((val) => (
                          <option key={val} value={val}>{val === 0.0 && idx !== 0 ? 'N/A' : `${val} ★`}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="What did you think of the film? Share your thoughts..."
                  rows={4}
                  className="w-full rounded-xl border border-[#1E1E2E] bg-[#05050A] p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingReview || !reviewContent.trim()} className="px-8">
                    {isSubmittingReview ? 'Posting...' : 'Post Review'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] p-8 text-center flex flex-col items-center justify-center gap-4">
                <MessageSquare className="h-8 w-8 text-slate-600" />
                <p className="text-slate-400">Join the conversation and share your thoughts.</p>
                <Link href="/login"><Button variant="outline">Sign In to Review</Button></Link>
              </div>
            )}

            {/* List Reviews */}
            <div className="space-y-6 pt-4">
              {movie.reviews && movie.reviews.length > 0 ? (
                movie.reviews.map((review: any) => (
                  <div key={review.id} className="group rounded-2xl border border-[#1E1E2E] bg-[#0A0A12] p-6 space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white uppercase ring-2 ring-[#05050A]">
                          {review.user.name ? review.user.name[0] : review.user.email[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{review.user.name || review.user.email}</div>
                          <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {review.rating.toFixed(1)}
                      </div>
                    </div>

                    <p className="text-base text-slate-300 leading-relaxed font-light">{review.content}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors bg-[#1E1E2E]/50 hover:bg-[#1E1E2E] px-3 py-1.5 rounded-full">
                        <ThumbsUp className="h-3.5 w-3.5" /> <span>0 Likes</span>
                      </button>
                      
                      <div className="w-px h-4 bg-[#1E1E2E] mx-1 hidden sm:block"></div>
                      
                      <div className="flex gap-2">
                        {review.comfortRating > 0 && (
                          <span className="text-[10px] bg-[#05050A] border border-[#1E1E2E] px-2 py-1 rounded-full text-indigo-400 font-medium">
                            Comfort: {review.comfortRating}★
                          </span>
                        )}
                        {review.soundRating > 0 && (
                          <span className="text-[10px] bg-[#05050A] border border-[#1E1E2E] px-2 py-1 rounded-full text-purple-400 font-medium">
                            Sound: {review.soundRating}★
                          </span>
                        )}
                        {review.screenRating > 0 && (
                          <span className="text-[10px] bg-[#05050A] border border-[#1E1E2E] px-2 py-1 rounded-full text-emerald-400 font-medium">
                            Screen: {review.screenRating}★
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-12">
                  No reviews yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
