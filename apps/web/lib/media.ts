const TMDB_IMG = "https://image.tmdb.org/t/p";

export function tmdbImage(path?: string | null, size: "w185" | "w342" | "w500" | "w780" | "original" = "w500") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

export function movieRuntime(movie: { duration?: number | null; runtime?: number | null }) {
  return movie.duration || movie.runtime || 0;
}

export function movieOverview(movie: { overview?: string | null; description?: string | null }) {
  return movie.overview || movie.description || "";
}
