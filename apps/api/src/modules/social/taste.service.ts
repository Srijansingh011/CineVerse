import { prisma } from '@repo/database';

export class TasteService {
  /**
   * Calculate Jaccard & Cosine movie taste similarity between two users
   */
  public static async calculateSimilarity(userAId: string, userBId: string) {
    if (userAId === userBId) {
      return { matchPercentage: 100, jaccard: 1.0, cosine: 1.0, commonCount: 0 };
    }

    // 1. Fetch ratings/reviews for both users
    const [ratingsA, ratingsB] = await Promise.all([
      prisma.review.findMany({ where: { userId: userAId }, select: { movieId: true, rating: true, movie: { select: { genres: true } } } }),
      prisma.review.findMany({ where: { userId: userBId }, select: { movieId: true, rating: true, movie: { select: { genres: true } } } }),
    ]);

    // 2. Jaccard Similarity on Movie Genres
    const genresA = new Set<string>();
    const genresB = new Set<string>();

    ratingsA.forEach((r) => r.movie?.genres.forEach((g) => genresA.add(g)));
    ratingsB.forEach((r) => r.movie?.genres.forEach((g) => genresB.add(g)));

    let jaccardSimilarity = 0;
    if (genresA.size > 0 || genresB.size > 0) {
      const intersection = new Set([...genresA].filter((g) => genresB.has(g)));
      const union = new Set([...genresA, ...genresB]);
      jaccardSimilarity = intersection.size / union.size;
    }

    // 3. Cosine Similarity on Shared Movie Ratings
    const ratingsMapB = new Map<string, number>();
    ratingsB.forEach((r) => ratingsMapB.set(r.movieId, r.rating));

    const vectorA: number[] = [];
    const vectorB: number[] = [];

    ratingsA.forEach((r) => {
      if (ratingsMapB.has(r.movieId)) {
        vectorA.push(r.rating);
        vectorB.push(ratingsMapB.get(r.movieId)!);
      }
    });

    let cosineSimilarity = 0;
    const commonCount = vectorA.length;

    if (commonCount > 0) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < commonCount; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }

      const denominator = Math.sqrt(normA) * Math.sqrt(normB);
      cosineSimilarity = denominator > 0 ? dotProduct / denominator : 0;
    } else {
      // Default to genre jaccard similarity if no overlapping reviews exist
      cosineSimilarity = jaccardSimilarity;
    }

    // Combined taste compatibility (weighted: 60% rating ratings vector, 40% genre overlap)
    const weightCosine = commonCount > 0 ? 0.6 : 0.0;
    const weightJaccard = commonCount > 0 ? 0.4 : 1.0;
    
    const combinedScore = (cosineSimilarity * weightCosine) + (jaccardSimilarity * weightJaccard);
    const matchPercentage = Math.min(Math.max(Math.round(combinedScore * 100), 0), 100);

    return {
      matchPercentage,
      jaccard: parseFloat(jaccardSimilarity.toFixed(2)),
      cosine: parseFloat(cosineSimilarity.toFixed(2)),
      commonCount,
    };
  }

  /**
   * Fetch comprehensive watch profile statistics & graphs
   */
  public static async getUserAnalytics(userId: string) {
    const [reviews, diary] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: { movie: true },
      }),
      prisma.movieDiary.findMany({
        where: { userId },
        include: { movie: true },
      }),
    ]);

    // 1. Basic counts
    const totalWatched = diary.length;
    const totalReviewed = reviews.length;
    const avgRating = reviews.length > 0 
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    // 2. Rating distribution (0.5 to 5.0 steps)
    const ratingDistribution: Record<string, number> = {
      '0.5': 0, '1.0': 0, '1.5': 0, '2.0': 0, '2.5': 0,
      '3.0': 0, '3.5': 0, '4.0': 0, '4.5': 0, '5.0': 0
    };

    reviews.forEach((r) => {
      const key = r.rating.toFixed(1);
      if (ratingDistribution[key] !== undefined) {
        ratingDistribution[key]++;
      }
    });

    // 3. Favorite genres
    const genreCounts: Record<string, number> = {};
    diary.forEach((d) => {
      d.movie?.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const favoriteGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Monthly watch activity (last 6 months)
    const monthlyActivity: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyActivity[key] = 0;
    }

    diary.forEach((d) => {
      const date = new Date(d.watchedAt);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyActivity[key] !== undefined) {
        monthlyActivity[key]++;
      }
    });

    const activityData = Object.entries(monthlyActivity).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      stats: {
        totalWatched,
        totalReviewed,
        avgRating,
      },
      ratingDistribution: Object.entries(ratingDistribution).map(([rating, count]) => ({
        rating: parseFloat(rating),
        count,
      })),
      favoriteGenres,
      monthlyActivity: activityData,
    };
  }
}
