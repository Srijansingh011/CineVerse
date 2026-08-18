/**
 * Demo data fallback.
 *
 * This module provides rich, realistic demo content so the CineVerse UI is fully
 * presentable when the real backend API (default http://localhost:4000) is not
 * reachable — for example in preview environments. It is ONLY consulted by
 * `apiFetch` after a genuine network failure, so the live API always takes
 * precedence when it is connected.
 */

export interface DemoMovie {
  id: string;
  title: string;
  posterPath: string;
  backdropPath: string;
  rating: number;
  releaseDate: string;
  duration: number; // minutes (used by home hero/cards)
  runtime: number; // minutes (used by detail page)
  genres: string[];
  language: string;
  description: string;
  overview: string;
  aiSummary?: string;
  reviews?: any[];
}

const review = (
  id: string,
  name: string,
  rating: number,
  content: string,
  daysAgo: number,
  extra?: { comfortRating?: number; soundRating?: number; screenRating?: number }
) => ({
  id,
  rating,
  content,
  comfortRating: extra?.comfortRating ?? 0,
  soundRating: extra?.soundRating ?? 0,
  screenRating: extra?.screenRating ?? 0,
  createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  user: { name, email: `${name.toLowerCase().replace(/\s/g, '')}@cineverse.app` },
});

export const DEMO_MOVIES: DemoMovie[] = [
  {
    id: 'demo-neon-horizon',
    title: 'Neon Horizon',
    posterPath: '/demo/poster-neon-horizon.png',
    backdropPath: '/demo/backdrop-neon-horizon.png',
    rating: 8.7,
    releaseDate: '2025-11-14',
    duration: 148,
    runtime: 148,
    genres: ['Sci-Fi', 'Adventure'],
    language: 'EN',
    description:
      'A stranded explorer must cross a luminous alien megacity to send one last signal home before the horizon goes dark.',
    overview:
      'When deep-space cartographer Rennick Vale wakes to find his crew gone and his ship dying, his only hope lies across a sprawling neon megacity that shifts with every heartbeat. Neon Horizon is a breathtaking odyssey about memory, distance, and the impossible pull of home.',
    aiSummary:
      'Critics and fans overwhelmingly praise Neon Horizon for its jaw-dropping visual design and emotional core. The consensus: a rare blockbuster that pairs spectacle with genuine heart, anchored by a career-best lead performance. A few note a slow middle act, but nearly everyone calls the finale unforgettable.',
    reviews: [
      review('r1', 'Priya Menon', 9.0, 'Visually the most stunning film of the year. I forgot to breathe during the third act.', 2, { soundRating: 5, screenRating: 5, comfortRating: 4 }),
      review('r2', 'Daniel Okafor', 8.0, 'A gorgeous, aching sci-fi epic. The score alone is worth the ticket.', 5, { soundRating: 5, screenRating: 4 }),
      review('r3', 'Sana Kapoor', 7.5, 'Slightly long, but the emotional payoff lands hard. Loved it.', 8),
    ],
  },
  {
    id: 'demo-orbital',
    title: 'Orbital',
    posterPath: '/demo/poster-orbital.png',
    backdropPath: '/demo/backdrop-orbital.png',
    rating: 8.2,
    releaseDate: '2025-09-26',
    duration: 121,
    runtime: 121,
    genres: ['Thriller', 'Sci-Fi'],
    language: 'EN',
    description:
      'Two astronauts trapped on a failing station have ninety minutes of oxygen and one shot at survival.',
    overview:
      'High above a sleeping Earth, a routine repair mission turns catastrophic. With systems failing and rescue impossible, engineer Mara Holt must make a choice no training prepared her for. Orbital is a lean, white-knuckle thriller shot in real time.',
    aiSummary:
      'Reviewers call Orbital an relentlessly tense, grounded survival thriller. Praise centers on its claustrophobic pacing and believable science, with the two leads carrying the film. The consensus: edge-of-your-seat filmmaking that respects its audience.',
    reviews: [
      review('r1', 'Marcus Lee', 8.5, 'Gripping from the first minute. I did not relax until the credits rolled.', 3, { soundRating: 5, screenRating: 4 }),
      review('r2', 'Aisha Rahman', 8.0, 'Smart, tense, and surprisingly moving. The silence is used masterfully.', 6),
    ],
  },
  {
    id: 'demo-midnight-circuit',
    title: 'Midnight Circuit',
    posterPath: '/demo/poster-midnight-circuit.png',
    backdropPath: '/demo/backdrop-midnight-circuit.png',
    rating: 7.9,
    releaseDate: '2025-10-31',
    duration: 134,
    runtime: 134,
    genres: ['Action', 'Thriller'],
    language: 'EN',
    description:
      'A getaway driver with a code takes one last job through the rain-soaked streets of a neon city.',
    overview:
      'By day he is nobody. By night, he is the best wheel in the city. When a heist goes sideways, driver Kai Voss has one rule left to break and one night to survive. Midnight Circuit is a pulse-pounding, neon-drenched chase thriller.',
    aiSummary:
      'Audiences love Midnight Circuit for its kinetic practical stunts and killer synth soundtrack. The consensus: style to burn and an irresistible sense of momentum, even if the plot keeps things simple. A crowd-pleasing adrenaline rush.',
    reviews: [
      review('r1', 'Rahul Verma', 8.0, 'The car chases are INSANE. Best sound design I have heard all year.', 1, { soundRating: 5, screenRating: 5 }),
      review('r2', 'Elena Costa', 7.5, 'Pure adrenaline. Turn your brain off and enjoy the ride.', 4),
    ],
  },
  {
    id: 'demo-last-ember',
    title: 'The Last Ember',
    posterPath: '/demo/poster-last-ember.png',
    backdropPath: '/demo/backdrop-verdant.png',
    rating: 8.4,
    releaseDate: '2025-12-05',
    duration: 127,
    runtime: 127,
    genres: ['Drama', 'Romance'],
    language: 'EN',
    description:
      'A grieving botanist returns to her childhood forest and discovers a single flame that refuses to die.',
    overview:
      'After losing everything, Cora returns to the misty woods where she grew up and finds an ember that has burned, impossibly, for decades. A quiet, luminous drama about grief, memory, and the fragile things that keep us warm.',
    aiSummary:
      'The Last Ember is hailed as a delicate, deeply felt drama. Critics single out its luminous cinematography and a restrained, devastating central performance. The consensus: a slow-burn that rewards patience with real emotional catharsis.',
    reviews: [
      review('r1', 'Grace Kim', 9.0, 'I cried three times. Achingly beautiful and never manipulative.', 2),
      review('r2', 'Tomas Novak', 8.0, 'A meditative gem. Every frame looks like a painting.', 7, { screenRating: 5 }),
    ],
  },
  {
    id: 'demo-verdant',
    title: 'Verdant',
    posterPath: '/demo/poster-verdant.png',
    backdropPath: '/demo/backdrop-verdant.png',
    rating: 7.6,
    releaseDate: '2025-08-15',
    duration: 139,
    runtime: 139,
    genres: ['Adventure', 'Fantasy'],
    language: 'EN',
    description:
      'An explorer uncovers a living temple that holds the last seed of a dying world.',
    overview:
      'Deep in an uncharted jungle, archaeologist Nadia Reyes finds a temple that breathes. Verdant is a sweeping, old-fashioned adventure about wonder, greed, and the price of discovery.',
    aiSummary:
      'Verdant earns praise as a lush, ambitious throwback adventure. Fans love its practical sets and sense of wonder; some critics wish the script matched the visuals. The consensus: gorgeous escapism for the big screen.',
    reviews: [
      review('r1', 'Leo Fernandes', 8.0, 'They do not make adventures like this anymore. Saw it twice.', 5, { screenRating: 5 }),
      review('r2', 'Hana Suzuki', 7.0, 'The world is incredible. Wish the pacing were tighter.', 9),
    ],
  },
  {
    id: 'demo-paper-lanterns',
    title: 'Paper Lanterns',
    posterPath: '/demo/poster-paper-lanterns.png',
    backdropPath: '/demo/backdrop-neon-horizon.png',
    rating: 8.0,
    releaseDate: '2025-07-04',
    duration: 112,
    runtime: 112,
    genres: ['Romance', 'Drama'],
    language: 'EN',
    description:
      'Two strangers meet at a lantern festival and share one night that changes everything.',
    overview:
      'On the night of the lantern festival, two people who were never meant to meet share a single, luminous evening. Paper Lanterns is a tender, glowing romance about the moments that quietly rewrite our lives.',
    aiSummary:
      'Paper Lanterns is celebrated as a warm, unabashedly romantic charmer. Reviewers praise the leads chemistry and the festival setting. The consensus: a beautiful, feel-good date-night film with real emotional sincerity.',
    reviews: [
      review('r1', 'Meera Nair', 8.5, 'Swoon. The festival scenes are pure magic.', 3),
      review('r2', 'Chris Bennett', 7.5, 'Sweet and sincere without being saccharine. Loved the ending.', 6),
    ],
  },
];

export const DEMO_CITIES = [
  { id: 'city-mumbai', name: 'Mumbai' },
  { id: 'city-bengaluru', name: 'Bengaluru' },
  { id: 'city-delhi', name: 'Delhi' },
  { id: 'city-hyderabad', name: 'Hyderabad' },
];

const THEATRE_TEMPLATES = [
  { id: 'th-1', name: 'CineVerse IMAX — Phoenix Mall', address: 'Level 4, Phoenix Marketcity', screenName: 'IMAX Laser' },
  { id: 'th-2', name: 'Aurora Luxe Cinemas', address: '12 Marine Drive Promenade', screenName: 'Dolby Atmos 2' },
  { id: 'th-3', name: 'Starlight Grand', address: '88 Central Boulevard', screenName: 'Recliner Premiere' },
];

const SHOW_TIMES = ['10:30', '13:45', '17:00', '20:30', '23:15'];

function buildShowId(movieId: string, theatreId: string, time: string) {
  return `show-${movieId}-${theatreId}-${time.replace(':', '')}`;
}

/** Theatres + screens + showtimes for a given movie/city/date. */
export function demoShowsForMovie(movieId: string, dateStr?: string) {
  const baseDate = dateStr ? new Date(dateStr) : new Date();

  return THEATRE_TEMPLATES.map((t, ti) => ({
    id: t.id,
    name: t.name,
    address: t.address,
    screens: [
      {
        id: `${t.id}-screen`,
        name: t.screenName,
        shows: SHOW_TIMES.filter((_, i) => (i + ti) % 2 === 0 || ti === 0).map((time) => {
          const [h, m] = time.split(':').map(Number);
          const start = new Date(baseDate);
          start.setHours(h ?? 0, m ?? 0, 0, 0);
          return {
            id: buildShowId(movieId, t.id, time),
            startTime: start.toISOString(),
            priceStandard: 220 + ti * 30,
            pricePremium: 340 + ti * 30,
            priceRecliner: 520 + ti * 40,
          };
        }),
      },
    ],
  }));
}

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
const SEATS_PER_ROW = 14;

function seatType(row: string): 'STANDARD' | 'PREMIUM' | 'RECLINER' {
  if (row === 'J' || row === 'K') return 'RECLINER';
  if (['E', 'F', 'G', 'H'].includes(row)) return 'PREMIUM';
  return 'STANDARD';
}

/** Full seat-map show payload for the seat-selection page. */
export function demoShowDetail(showId: string) {
  // showId format: show-<movieId>-<theatreId>-<time>
  const parts = showId.split('-');
  // movieId is "demo-xxx"; reconstruct by matching known ids
  const movie =
    DEMO_MOVIES.find((m) => showId.includes(m.id)) ?? DEMO_MOVIES[0]!;
  const theatreTemplate =
    THEATRE_TEMPLATES.find((t) => showId.includes(t.id)) ?? THEATRE_TEMPLATES[0]!;

  const start = new Date();
  start.setHours(20, 30, 0, 0);

  // Deterministic pseudo-random so a given seat is consistently booked/available.
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };

  const showSeats: any[] = [];
  SEAT_ROWS.forEach((row) => {
    for (let n = 1; n <= SEATS_PER_ROW; n++) {
      const seatId = `${showId}-${row}${n}`;
      const roll = hash(seatId) % 100;
      let status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' = 'AVAILABLE';
      if (roll < 22) status = 'BOOKED';
      else if (roll < 27) status = 'LOCKED';
      showSeats.push({
        id: seatId,
        status,
        lockedById: null,
        seat: { row, number: n, type: seatType(row) },
      });
    }
  });

  return {
    id: showId,
    startTime: start.toISOString(),
    priceStandard: 240,
    pricePremium: 360,
    priceRecliner: 560,
    movie: { id: movie.id, title: movie.title },
    screen: {
      id: `${theatreTemplate.id}-screen`,
      name: theatreTemplate.screenName,
      theatre: { id: theatreTemplate.id, name: theatreTemplate.name },
    },
    showSeats,
  };
}

/**
 * Resolve a demo response for a given endpoint. Returns `{ data }` when the
 * endpoint is supported, otherwise `undefined` so the caller can decide how to
 * handle unknown endpoints.
 */
export function getDemoResponse(endpoint: string): { data: any } | undefined {
  // Strip query string for matching, keep it available for parsing.
  const [path, query = ''] = endpoint.split('?');
  const params = new URLSearchParams(query);

  if (path === '/movies/trending') {
    return { data: DEMO_MOVIES };
  }

  if (path === '/movies/search') {
    const q = (params.get('q') || '').toLowerCase().trim();
    if (!q) return { data: DEMO_MOVIES };
    return {
      data: DEMO_MOVIES.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.overview.toLowerCase().includes(q)
      ),
    };
  }

  if (path === '/movies/recommendations') {
    // Shape expected by home page: [{ movie, score }]
    return {
      data: DEMO_MOVIES.slice(0, 4).map((m, i) => ({ movie: m, score: 0.95 - i * 0.07 })),
    };
  }

  // /movies/:id
  const movieMatch = path?.match(/^\/movies\/([^/]+)$/);
  if (movieMatch) {
    const found = DEMO_MOVIES.find((m) => m.id === movieMatch[1]);
    return { data: found ?? DEMO_MOVIES[0] };
  }

  if (path === '/theatres/cities') {
    return { data: DEMO_CITIES };
  }

  // /theatres/shows/movie/:id
  const showsForMovie = path?.match(/^\/theatres\/shows\/movie\/([^/]+)$/);
  if (showsForMovie) {
    return { data: demoShowsForMovie(showsForMovie[1]!, params.get('date') ?? undefined) };
  }

  // /theatres/shows/:showId
  const showDetail = path?.match(/^\/theatres\/shows\/([^/]+)$/);
  if (showDetail) {
    return { data: demoShowDetail(showDetail[1]!) };
  }

  // Notifications — keep the bell empty rather than erroring.
  if (path === '/notifications') {
    return { data: { notifications: [], unreadCount: 0 } };
  }

  return undefined;
}
