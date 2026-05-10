import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.client.updateMany({
    where: {
      OR: [
        { phone: "" },
        { email: "" }
      ]
    },
    data: {
      phone: null,
      // email is already required so it shouldn't be empty, but just in case
    }
  });
  console.log(`Updated ${result.count} rows`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
