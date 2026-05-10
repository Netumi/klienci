import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.client.count();
  console.log(`Total clients: ${count}`);
  const clients = await prisma.client.findMany({ take: 5 });
  console.log('Sample clients:', JSON.stringify(clients, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
