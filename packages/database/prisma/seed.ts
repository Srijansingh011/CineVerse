import { PrismaClient, Role, SeatType, MovieStatus, ShowSeatStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Hash of "password123" generated via bcrypt
const TEST_PASSWORD_HASH = '$2b$10$EPY9LSLp8a436a/Vw2r.NuB5/g7h5N.4k.6J6iWdM7J.Wf0hN1w3G';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Cities
  const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai'];
  const seededCities = [];
  
  for (const cityName of cities) {
    const city = await prisma.city.upsert({
      where: { name: cityName },
      update: {},
      create: { name: cityName },
    });
    seededCities.push(city);
  }
  console.log(`✅ Seeded ${seededCities.length} cities.`);

  // 2. Seed Users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@cineverse.com' },
    update: {},
    create: {
      email: 'owner@cineverse.com',
      name: 'Theatre Owner John',
      password: TEST_PASSWORD_HASH,
      role: Role.THEATRE_OWNER,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@cineverse.com' },
    update: {},
    create: {
      email: 'user@cineverse.com',
      name: 'Alice Movie Lover',
      password: TEST_PASSWORD_HASH,
      role: Role.USER,
    },
  });

  console.log(`✅ Seeded users (Owner: owner@cineverse.com, User: user@cineverse.com).`);

  // 3. Seed Movies
  const moviesData = [
    {
      tmdbId: 157336,
      title: 'Interstellar',
      overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
      posterPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500',
      backdropPath: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1280',
      releaseDate: new Date('2014-11-05'),
      runtime: 169,
      rating: 4.8,
      language: 'en',
      genres: ['Adventure', 'Drama', 'Science Fiction'],
      status: MovieStatus.NOW_SHOWING,
    },
    {
      tmdbId: 27205,
      title: 'Inception',
      overview: 'Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is offered a chance to have his history erased as payment for a seemingly impossible task.',
      posterPath: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=500',
      backdropPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1280',
      releaseDate: new Date('2010-07-15'),
      runtime: 148,
      rating: 4.7,
      language: 'en',
      genres: ['Action', 'Science Fiction', 'Adventure'],
      status: MovieStatus.NOW_SHOWING,
    },
    {
      tmdbId: 968051,
      title: 'Dune: Part Two',
      overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
      posterPath: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=500',
      backdropPath: 'https://images.unsplash.com/photo-1682687982501-1e58b814714c?q=80&w=1280',
      releaseDate: new Date('2024-02-27'),
      runtime: 166,
      rating: 4.8,
      language: 'en',
      genres: ['Science Fiction', 'Adventure'],
      status: MovieStatus.NOW_SHOWING,
    },
  ];

  const seededMovies = [];
  for (const movieData of moviesData) {
    const movie = await prisma.movie.upsert({
      where: { tmdbId: movieData.tmdbId },
      update: movieData,
      create: movieData,
    });
    seededMovies.push(movie);
  }
  console.log(`✅ Seeded ${seededMovies.length} movies.`);

  // 4. Clean up existing relational data for idempotency
  console.log('🧹 Cleaning up old theatres, screens, shows, and seats for idempotency...');
  await prisma.showSeat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.theatre.deleteMany();

  // 5. Seed Theatres & Screens (Bengaluru & Mumbai)
  const mumbai = seededCities[0];
  const blr = seededCities[2]; // Bengaluru is index 2

  const theatresData = [
    { name: 'CineVerse IMAX, Lower Parel', address: 'High Street Phoenix, Mumbai', cityId: mumbai.id },
    { name: 'CineVerse IMAX, Koramangala', address: 'Forum Mall, Koramangala, Bengaluru', cityId: blr.id },
    { name: 'CineVerse PVR, Indiranagar', address: '100ft Road, Indiranagar, Bengaluru', cityId: blr.id }
  ];

  const createdTheatres = [];
  const createdScreens = [];

  for (const tData of theatresData) {
    const theatre = await prisma.theatre.create({
      data: {
        name: tData.name,
        address: tData.address,
        cityId: tData.cityId,
        ownerId: ownerUser.id,
      },
    });
    createdTheatres.push(theatre);

    // Create 2 screens for each theatre
    const screen1 = await prisma.screen.create({ data: { name: 'IMAX Screen 1', theatreId: theatre.id } });
    const screen2 = await prisma.screen.create({ data: { name: 'Audi 2 (Gold Class)', theatreId: theatre.id } });
    createdScreens.push(screen1, screen2);
  }
  console.log(`✅ Seeded ${createdTheatres.length} theatres with 2 screens each.`);

  // 5. Seed Seats for Screens (5 rows, 10 columns = 50 seats)
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  for (const screen of createdScreens) {
    const seatsToCreate = [];
    for (const r of rows) {
      for (const c of cols) {
        let type: SeatType = SeatType.STANDARD;
        if (r === 'C' || r === 'D') type = SeatType.PREMIUM;
        if (r === 'E') type = SeatType.RECLINER;

        seatsToCreate.push({
          screenId: screen.id,
          row: r,
          number: c,
          type,
        });
      }
    }

    // Create seats in bulk if they don't exist
    // Delete existing seats first for cleanliness in seeding
    await prisma.seat.deleteMany({ where: { screenId: screen.id } });
    await prisma.seat.createMany({ data: seatsToCreate });
  }
  console.log(`✅ Seeded 50 seats (Standard, Premium, Recliner) for each of the ${createdScreens.length} screens.`);

  // 6. Seed Shows (for today and tomorrow)
  const today = new Date();
  today.setHours(14, 0, 0, 0); // 2:00 PM today

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 30, 0, 0); // 6:30 PM tomorrow

  const showsToCreate = [];

  for (const screen of createdScreens) {
    // Alternate movies per screen
    const isImax = screen.name.includes('IMAX');
    
    // Show 1: Today
    showsToCreate.push({
      movieId: isImax ? seededMovies[0].id : seededMovies[1].id, // Interstellar for IMAX, Inception for Audi 2
      screenId: screen.id,
      startTime: today,
      endTime: new Date(today.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      priceStandard: 250,
      pricePremium: 400,
      priceRecliner: 600,
    });
    
    // Show 2: Tomorrow
    showsToCreate.push({
      movieId: seededMovies[2].id, // Dune Part Two everywhere tomorrow
      screenId: screen.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      priceStandard: 300,
      pricePremium: 450,
      priceRecliner: 700,
    });
  }

  console.log(`⌛ Creating ${showsToCreate.length} show screenings & generating show seats...`);
  for (const showData of showsToCreate) {
    const show = await prisma.show.create({ data: showData });

    // Fetch seats for this screen to generate ShowSeat rows
    const seats = await prisma.seat.findMany({ where: { screenId: show.screenId } });
    
    const showSeatsToCreate = seats.map((seat) => ({
      showId: show.id,
      seatId: seat.id,
      status: ShowSeatStatus.AVAILABLE,
    }));

    await prisma.showSeat.createMany({ data: showSeatsToCreate });
  }

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    (globalThis as any).process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
