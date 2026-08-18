"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { tmdbImage, movieRuntime } from "../../lib/media";
import { formatRuntime, formatYear } from "../../lib/format";
import { cn } from "../../lib/cn";

export interface MovieCardMovie {
  id: string;
  title: string;
  posterUrl?: string | null;
  posterPath?: string | null;
  rating?: number | null;
  duration?: number | null;
  runtime?: number | null;
  genres?: string[];
  language?: string | null;
  releaseDate?: string | null;
  overview?: string | null;
  description?: string | null;
}

interface MovieCardProps {
  movie: MovieCardMovie;
  variant?: "default" | "large" | "compact" | "horizontal";
  className?: string;
  showBook?: boolean;
}

export function MovieCard({
  movie,
  variant = "default",
  className = "",
  showBook = true,
}: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const poster = movie.posterUrl || tmdbImage(movie.posterPath, variant === "compact" ? "w342" : "w500");
  const runtime = formatRuntime(movieRuntime(movie));
  const year = formatYear(movie.releaseDate);
  const genre = movie.genres?.[0];
  const meta = [genre, runtime || year].filter(Boolean).join(" · ");

  if (variant === "horizontal") {
    return (
      <Link
        href={`/movies/${movie.id}`}
        className={cn("flex gap-3 group", className)}
      >
        <div className="relative w-[72px] shrink-0 aspect-[2/3] overflow-hidden rounded-[6px] bg-surface-2">
          {poster && !imageError ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="72px"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted p-1 text-center">
              {movie.title}
            </div>
          )}
        </div>
        <div className="min-w-0 py-0.5">
          <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <p className="text-[13px] text-muted mt-1">{meta || "Title"}</p>
          {movie.rating ? (
            <p className="text-[13px] text-highlight mt-1">★ {movie.rating.toFixed(1)}</p>
          ) : null}
        </div>
      </Link>
    );
  }

  const titleSize = variant === "large" ? "text-[20px]" : "text-[15px] md:text-[16px]";

  return (
    <article className={cn("group min-w-0", className)}>
      <Link href={`/movies/${movie.id}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-surface-2">
          {poster && !imageError ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              sizes={variant === "large" ? "(max-width: 768px) 50vw, 33vw" : "(max-width: 768px) 50vw, 16vw"}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-[13px] text-muted">
              {movie.title}
            </div>
          )}
          {movie.rating ? (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[12px] font-semibold text-white">
              <Star className="h-3 w-3 fill-highlight text-highlight" />
              {movie.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h3 className={cn("mt-2 font-semibold text-white leading-snug line-clamp-2", titleSize)}>
          {movie.title}
        </h3>
        <p className="mt-0.5 text-[13px] text-muted truncate">{meta}</p>
      </Link>
      {showBook && variant !== "compact" ? (
        <Link
          href={`/shows?movie=${movie.id}`}
          className="mt-2 inline-block text-[13px] font-semibold text-primary hover:text-primary-hover"
        >
          Book
        </Link>
      ) : null}
    </article>
  );
}
