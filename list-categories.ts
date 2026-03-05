import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const categories = await prisma.category.findMany();
    console.log("CATEGORIES_COUNT:", categories.length);
    console.log("CATEGORIES_JSON:", JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error("LIST_CATEGORIES_ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
