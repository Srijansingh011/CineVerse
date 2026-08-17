import { prisma, SeatType, ShowSeatStatus, MovieStatus } from '@repo/database';

export class TheatreService {
  /**
   * Create a new theatre
   */
  public static async createTheatre(name: string, address: string, cityId: string, ownerId: string) {
    // Verify city exists
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new Error('City not found');

    return await prisma.theatre.create({
      data: {
        name,
        address,
        cityId,
        ownerId,
      },
    });
  }

  /**
   * Get theatres owned by a user
   */
  public static async getMyTheatres(ownerId: string) {
    return await prisma.theatre.findMany({
      where: { ownerId },
      include: {
        screens: {
          include: {
            _count: {
              select: { seats: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new screen and generate its seat grid
   * Rows are like ['A', 'B', 'C', 'D', 'E'].
   * Rows A, B, C can be Standard, D can be Premium, E can be Recliner.
   */
  public static async createScreen(
    theatreId: string,
    name: string,
    rows: string[],
    colsCount: number,
    tierMapping: Record<string, SeatType> = {}
  ) {
    // Verify theatre ownership
    const theatre = await prisma.theatre.findUnique({ where: { id: theatreId } });
    if (!theatre) throw new Error('Theatre not found');

    // Create Screen
    const screen = await prisma.screen.create({
      data: {
        name,
        theatreId,
      },
    });

    // Generate seats
    const seatsData = [];
    for (const row of rows) {
      const type = tierMapping[row] || SeatType.STANDARD;
      for (let number = 1; number <= colsCount; number++) {
        seatsData.push({
          screenId: screen.id,
          row,
          number,
          type,
        });
      }
    }

    await prisma.seat.createMany({
      data: seatsData,
    });

    return await prisma.screen.findUnique({
      where: { id: screen.id },
      include: { seats: true },
    });
  }

  /**
   * Create a show with screen schedule overlap check and ShowSeat bulk creation
   */
  public static async createShow(
    movieId: string,
    screenId: string,
    startTimeStr: string,
    priceStandard: number,
    pricePremium: number,
    priceRecliner: number
  ) {
    const startTime = new Date(startTimeStr);
    
    // 1. Fetch movie details to compute end time
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new Error('Movie not found');
    
    const runtimeMinutes = movie.runtime || 120; // default 2 hours if not present
    const endTime = new Date(startTime.getTime() + runtimeMinutes * 60 * 1000);

    // 2. Check for scheduling conflicts on this screen
    const overlappingShow = await prisma.show.findFirst({
      where: {
        screenId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingShow) {
      throw new Error(`Scheduling conflict: Another show is scheduled on this screen from ${overlappingShow.startTime.toLocaleTimeString()} to ${overlappingShow.endTime.toLocaleTimeString()}`);
    }

    // 3. Create the show
    const show = await prisma.show.create({
      data: {
        movieId,
        screenId,
        startTime,
        endTime,
        priceStandard,
        pricePremium,
        priceRecliner,
      },
    });

    // 4. Create ShowSeat records for all seats in the screen
    const seats = await prisma.seat.findMany({
      where: { screenId },
    });

    await prisma.showSeat.createMany({
      data: seats.map(seat => ({
        showId: show.id,
        seatId: seat.id,
        status: ShowSeatStatus.AVAILABLE,
      })),
    });

    return show;
  }

  /**
   * Get theatres and their shows in a city for a specific movie
   */
  public static async getShowsForMovieInCity(movieId: string, cityId: string, dateStr: string) {
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    return await prisma.theatre.findMany({
      where: {
        cityId,
        screens: {
          some: {
            shows: {
              some: {
                movieId,
                startTime: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
      include: {
        screens: {
          include: {
            shows: {
              where: {
                movieId,
                startTime: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
              include: {
                movie: true,
                screen: true,
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get show details including its screen grid and seat statuses
   */
  public static async getShowDetails(showId: string) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
          },
        },
        showSeats: {
          include: {
            seat: true,
          },
          orderBy: [
            { seat: { row: 'asc' } },
            { seat: { number: 'asc' } },
          ],
        },
      },
    });

    if (!show) throw new Error('Show not found');

    return show;
  }

  /**
   * List all cities
   */
  public static async getCities() {
    return await prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
