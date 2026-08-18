"use client";

import { MovieCard, MovieCardMovie } from "./MovieCard";
import { MovieSkeleton } from "../ui/Skeleton";
import { cn } from "../../lib/cn";

export function MovieRow({
  movies,
  loading,
  className,
}: {
  movies: MovieCardMovie[];
  loading?: boolean;
  className?: string;
}) {
  const items = loading ? Array.from({ length: 6 }) : movies;

  return (
    <div className={cn("flex overflow-x-auto gap-3 md:gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide", className)}>
      {items.map((movie, i) => (
        <div key={loading ? i : (movie as MovieCardMovie).id} className="w-[148px] sm:w-[168px] md:w-[180px] shrink-0">
          {loading ? <MovieSkeleton /> : <MovieCard movie={movie as MovieCardMovie} variant="compact" showBook={false} />}
        </div>
      ))}
    </div>
  );
}
