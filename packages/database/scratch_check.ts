import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('--- Step 1: Checking Dune ---');
  const dune = await prisma.movie.findFirst({ where: { title: { contains: 'Dune' } } });
  console.log(dune);

  console.log('\n--- Step 2: Checking Bengaluru ---');
  const blr = await prisma.city.findFirst({ where: { name: 'Bengaluru' } });
  console.log(blr);
  if (blr) {
    const theatres = await prisma.theatre.findMany({ where: { cityId: blr.id } });
    console.log(`Theatres in Bengaluru:`, theatres);
  }

  console.log('\n--- Step 3: Checking Shows for Dune in Bengaluru ---');
  if (dune && blr) {
    const shows = await prisma.show.findMany({
      where: {
        movieId: dune.id,
        screen: {
          theatre: {
            cityId: blr.id
          }
        }
      }
    });
    console.log(`Shows for Dune in Bengaluru:`, shows);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
