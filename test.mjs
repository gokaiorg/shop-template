import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const categories = await prisma.category.findMany();
    console.log("Existing Slugs (EN):", categories.map(c => c.slugEn));
    console.log("Existing Slugs (FR):", categories.map(c => c.slugFr));
  } catch (error) {
    console.error("DEBUG_ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
