import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, Ticket } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  duration?: number;
  genres?: string[];
  language?: string;
}

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export function MovieCard({ movie, className = "" }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (mins?: number) => {
    if (!mins) return 'TBA';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <Link
      href={`/movies/${movie.id}`}
      className={`group block relative rounded-xl overflow-hidden bg-[#0A0A14] transition-all duration-500 ease-out hover-lift glow-border ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] w-full relative overflow-hidden">
        {!imageError && movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className={`object-cover transition-all duration-700 ease-out ${isHovered ? 'scale-110 brightness-75' : 'scale-100 brightness-100'}`}
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0A0A14] via-[#12121F] to-[#1A1A2E] flex items-center justify-center p-4 text-center">
            <span className="text-slate-500 font-medium text-sm">{movie.title}</span>
          </div>
        )}

        {/* Permanent bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A0A14] to-transparent pointer-events-none" />

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 flex flex-col justify-end p-3 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`transform transition-all duration-500 ease-out ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            {/* Wishlist button */}
            <button
              className="absolute top-3 right-3 p-2 rounded-full glass text-white/70 hover:text-rose-400 transition-colors duration-200"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Book CTA */}
            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 text-xs"
              onClick={(e) => e.preventDefault()}
            >
              <Ticket className="h-4 w-4" />
              Book Tickets
            </button>
          </div>
        </div>

        {/* Rating Badge — glossy glass */}
        {movie.rating && (
          <div className="absolute top-2 left-2 glass px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400 animate-twinkle" />
            <span className="text-white text-[11px] font-bold tracking-wide">{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-slate-100 truncate text-[13px] group-hover:text-white transition-colors" title={movie.title}>
          {movie.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>{movie.language || 'Multiple'}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{formatDuration(movie.duration)}</span>
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-0.5">
            {movie.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-[9px] uppercase tracking-wider font-semibold text-indigo-300/70 bg-indigo-500/[0.08] px-2 py-px rounded-full border border-indigo-500/15"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
