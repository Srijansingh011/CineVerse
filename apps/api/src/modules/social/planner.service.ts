import { prisma } from '@repo/database';
import { TasteService } from './taste.service.js';
import { WatchPartyService } from '../watchparty/watchparty.service.js';

export class MovieNightPlannerService {
  /**
   * Plans a movie night for a group of friends by combining taste similarity,
   * genre overlap, pricing filters, showtimes, and adjacent seat verification.
   */
  public static async planMovieNight(
    userId: string,
    friendIds: string[],
    cityId: string,
    maxPrice: number,
    startTimeMin: Date
  ) {
    const allUserIds = [userId, ...friendIds];
    const memberCount = allUserIds.length;

    // 1. Calculate average taste compatibility matching scores for the group
    const compatibilityPromises = friendIds.map((friendId) =>
      TasteService.calculateSimilarity(userId, friendId)
    );
    const compatibilities = await Promise.all(compatibilityPromises);
    const avgMatchPercentage = compatibilities.length > 0
      ? Math.round(compatibilities.reduce((sum, c) => sum + c.matchPercentage, 0) / compatibilities.length)
      : 100;

    // 2. Aggregate genre preferences of all members
    const diaryEntries = await prisma.movieDiary.findMany({
      where: { userId: { in: allUserIds } },
      include: { movie: true },
    });

    const genreCounts: Record<string, number> = {};
    diaryEntries.forEach((entry) => {
      entry.movie.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Sort genres by popularity within the group
    const topGroupGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3); // Top 3 genres

    // 3. Find movies matching the group's top genres that are NOW_SHOWING
    const candidateMovies = await prisma.movie.findMany({
      where: {
        status: 'NOW_SHOWING',
        genres: {
          hasSome: topGroupGenres.length > 0 ? topGroupGenres : undefined,
        },
      },
      take: 10,
    });

    // 4. Query available shows for candidate movies in the target city under max price
    const candidateMovieIds = candidateMovies.map((m) => m.id);
    const shows = await prisma.show.findMany({
      where: {
        movieId: { in: candidateMovieIds },
        startTime: { gte: startTimeMin },
        priceStandard: { lte: maxPrice },
        screen: {
          theatre: {
            cityId: cityId,
          },
        },
      },
      include: {
        movie: true,
        screen: {
          include: { theatre: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // 5. Rank shows and find adjacent seat availability
    const options: any[] = [];

    for (const show of shows) {
      try {
        const adjacentSeats = await WatchPartyService.findAdjacentSeats(show.id, memberCount);
        
        // Calculate dynamic ranking score based on:
        // - Movie rating (higher is better)
        // - Price (cheaper is better)
        // - Match compatibility
        const ratingScore = show.movie.rating * 10;
        const priceScore = ((maxPrice - show.priceStandard) / maxPrice) * 30;
        const compatibilityScore = avgMatchPercentage * 0.6;
        const rankingScore = Math.round(ratingScore + priceScore + compatibilityScore);

        options.push({
          showId: show.id,
          movie: {
            id: show.movie.id,
            title: show.movie.title,
            posterPath: show.movie.posterPath,
            rating: show.movie.rating,
            genres: show.movie.genres,
          },
          theatre: {
            id: show.screen.theatre.id,
            name: show.screen.theatre.name,
            address: show.screen.theatre.address,
          },
          screen: show.screen.name,
          startTime: show.startTime,
          pricePerSeat: show.priceStandard,
          totalGroupPrice: show.priceStandard * memberCount,
          adjacentSeats,
          rankingScore,
        });
      } catch (err) {
        // Skip shows that don't have enough adjacent seats
        continue;
      }
    }

    // Sort options by ranking score descending
    options.sort((a, b) => b.rankingScore - a.rankingScore);

    return {
      groupSize: memberCount,
      groupGenres: topGroupGenres,
      averageTasteCompatibility: avgMatchPercentage,
      recommendations: options.slice(0, 5), // Return top 5 plans
    };
  }
}
