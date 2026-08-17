import { prisma } from '@repo/database';

export class AIService {
  /**
   * Generates a sentiment-enriched summary of reviews for a movie and saves it to the Movie model
   */
  public static async generateReviewSummary(movieId: string): Promise<string> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        reviews: {
          select: {
            rating: true,
            content: true,
            comfortRating: true,
            soundRating: true,
            screenRating: true,
          },
        },
      },
    });

    if (!movie) {
      throw new Error('Movie not found');
    }

    if (movie.reviews.length === 0) {
      const emptySummary = 'No user reviews are available yet. Be the first to share your thoughts on the movie and theatre experience!';
      await prisma.movie.update({
        where: { id: movieId },
        data: { aiSummary: emptySummary },
      });
      return emptySummary;
    }

    // Advanced Local NLP analysis
    const reviews = movie.reviews;
    const totalReviews = reviews.length;
    let avgRating = 0;
    let avgComfort = 0;
    let avgSound = 0;
    let avgScreen = 0;

    const positiveKeywords = ['great', 'excellent', 'amazing', 'masterpiece', 'loved', 'perfect', 'beautiful', 'must watch', 'best', 'good', 'incredible', 'stunning'];
    const negativeKeywords = ['boring', 'slow', 'bad', 'worst', 'waste', 'disappointed', 'poor', 'mediocre', 'horrible', 'dreadful', 'meh', 'dislike'];

    let positiveCount = 0;
    let negativeCount = 0;
    const highlights: string[] = [];
    const lowlights: string[] = [];

    for (const r of reviews) {
      avgRating += r.rating;
      avgComfort += r.comfortRating;
      avgSound += r.soundRating;
      avgScreen += r.screenRating;

      const contentLower = r.content.toLowerCase();
      let posScore = 0;
      let negScore = 0;

      positiveKeywords.forEach((k) => {
        if (contentLower.includes(k)) posScore++;
      });
      negativeKeywords.forEach((k) => {
        if (contentLower.includes(k)) negScore++;
      });

      if (posScore > negScore || r.rating >= 4) {
        positiveCount++;
      } else if (negScore > posScore || r.rating <= 2.5) {
        negativeCount++;
      }
    }

    avgRating /= totalReviews;
    avgComfort /= totalReviews;
    avgSound /= totalReviews;
    avgScreen /= totalReviews;

    // Consensus deduction
    let consensus = '';
    if (positiveCount / totalReviews >= 0.7) {
      consensus = `Viewers are overwhelmingly positive about "${movie.title}". It is highly praised as a must-watch experience.`;
    } else if (negativeCount / totalReviews >= 0.6) {
      consensus = `Community reception for "${movie.title}" is generally critical, with common issues raised around pacing or script quality.`;
    } else {
      consensus = `Community opinion is divided on "${movie.title}". Audiences appreciate several elements but remain mixed on the overall execution.`;
    }

    // Multi-dimensional rating highlights
    if (avgComfort >= 4.0) {
      highlights.push('Exceptional seating comfort and auditorium design.');
    } else if (avgComfort > 0 && avgComfort <= 2.5) {
      lowlights.push('Seating comfort has received some complaints.');
    }

    if (avgSound >= 4.0) {
      highlights.push('Stellar acoustic engineering and powerful, immersive sound mix.');
    } else if (avgSound > 0 && avgSound <= 2.5) {
      lowlights.push('Acoustics or audio levels were sub-optimal.');
    }

    if (avgScreen >= 4.0) {
      highlights.push('Crystal-clear projection and screen brightness.');
    } else if (avgScreen > 0 && avgScreen <= 2.5) {
      lowlights.push('Screen clarity or brightness did not meet expectations.');
    }

    // Default highlights if empty
    if (highlights.length === 0) {
      highlights.push('Solid general feedback for local showings.');
    }

    const summaryParts = [
      `🤖 **CineVerse AI Review Consensus**`,
      consensus,
      `⭐️ **Community Rating:** ${avgRating.toFixed(1)}/5.0 based on ${totalReviews} reviews.`,
      `\n🌟 **Key Highlights:**`,
      ...highlights.map((h) => `- ${h}`),
    ];

    if (lowlights.length > 0) {
      summaryParts.push(`\n⚠️ **Areas for Improvement:**`);
      lowlights.forEach((l) => summaryParts.push(`- ${l}`));
    }

    // Add general specs
    summaryParts.push(`\n🎬 **Cinema Stats:** Seating Comfort: ${avgComfort.toFixed(1)}/5 | Audio Fidelity: ${avgSound.toFixed(1)}/5 | Visual Clarity: ${avgScreen.toFixed(1)}/5`);

    const finalSummary = summaryParts.join('\n');

    // Update in Database
    await prisma.movie.update({
      where: { id: movieId },
      data: { aiSummary: finalSummary },
    });

    return finalSummary;
  }

  /**
   * Conversational Assistant: returns a smart response by querying DB content contextually
   */
  public static async chatWithMovieAssistant(
    userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const text = message.toLowerCase();

    // 1. RECOMMENDATIONS query
    if (text.includes('recommend') || text.includes('suggest') || text.includes('what should i watch')) {
      let genreQuery = '';
      if (text.includes('action')) genreQuery = 'Action';
      else if (text.includes('sci-fi') || text.includes('science fiction') || text.includes('space')) genreQuery = 'Science Fiction';
      else if (text.includes('adventure')) genreQuery = 'Adventure';
      else if (text.includes('drama')) genreQuery = 'Drama';
      else if (text.includes('comedy')) genreQuery = 'Comedy';

      let movies = [];
      if (genreQuery) {
        movies = await prisma.movie.findMany({
          where: {
            genres: {
              has: genreQuery,
            },
          },
          take: 3,
        });
      } else {
        movies = await prisma.movie.findMany({
          orderBy: { rating: 'desc' },
          take: 3,
        });
      }

      if (movies.length === 0) {
        return "I couldn't find any specific matching movies right now. Try asking for popular, action, sci-fi, or adventure recommendations!";
      }

      const list = movies.map((m) => `🎬 **${m.title}** (${m.rating}⭐) - ${m.overview.substring(0, 100)}...`).join('\n\n');
      return `Here are some ${genreQuery ? genreQuery + ' ' : ''}recommendations for you:\n\n${list}\n\nWould you like me to find showtimes for any of these?`;
    }

    // 2. SHOWTIMES / THEATRE query
    if (text.includes('show') || text.includes('time') || text.includes('theater') || text.includes('theatre') || text.includes('ticket')) {
      const shows = await prisma.show.findMany({
        where: {
          startTime: { gte: new Date() },
        },
        include: {
          movie: true,
          screen: {
            include: { theatre: true },
          },
        },
        take: 3,
      });

      if (shows.length === 0) {
        return 'There are currently no upcoming showtimes scheduled. Check back soon!';
      }

      const showList = shows
        .map((s) => {
          const timeString = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
          return `- **${s.movie.title}** at **${s.screen.theatre.name}** (${s.screen.name}) on **${dateString}** at **${timeString}** (Standard: ₹${s.priceStandard})`;
        })
        .join('\n');

      return `Here are some upcoming showtimes at CineVerse cinemas:\n\n${showList}\n\nWould you like me to help you book seats?`;
    }

    // 3. MOVIE DETAILS query
    if (text.includes('about') || text.includes('who') || text.includes('info') || text.includes('what is')) {
      const allMovies = await prisma.movie.findMany();
      let matchedMovie = null;

      for (const m of allMovies) {
        if (text.includes(m.title.toLowerCase())) {
          matchedMovie = m;
          break;
        }
      }

      if (matchedMovie) {
        return `🎬 **${matchedMovie.title}**\n\n⭐️ **Rating:** ${matchedMovie.rating ?? 'N/A'}/5.0\n⏱️ **Runtime:** ${matchedMovie.runtime} mins\n📝 **Synopsis:** ${matchedMovie.overview}\n\nWould you like to book a ticket for this movie?`;
      }
    }

    // 4. LEVEL / PROGRESS query
    if (text.includes('level') || text.includes('xp') || text.includes('badge') || text.includes('rank') || text.includes('stats')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { badges: { include: { badge: true } } },
      });

      if (!user) return 'Could not fetch your profile details.';

      const badgeNames = user.badges.map((b) => b.badge.name).join(', ') || 'No badges unlocked yet';
      const xpNeeded = user.level * 100;

      return `📊 **Your Gamification Profile**\n\n⭐ **Level:** ${user.level}\n⚡ **XP:** ${user.xp}/${xpNeeded} XP to next level\n🏅 **Badges Unlocked:** ${badgeNames}\n\nYou can earn more XP by logging movies, writing reviews, and participating in watch parties!`;
    }

    // 5. Default Response
    return `Hello! I am your CineVerse AI Assistant 🍿. I can help you with:\n\n1. 🎬 **Recommendations:** "Recommend an action/sci-fi movie"\n2. 📅 **Showtimes:** "Show me what's playing today"\n3. ℹ️ **Movie Info:** "Tell me about Inception"\n4. 📊 **Progress:** "What is my current level?"\n\nHow can I help you today?`;
  }
}
