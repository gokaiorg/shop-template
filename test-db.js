const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const category = await prisma.category.create({
      data: {
        nameFr: "Catégorie 02",
        nameEn: "Category 02",
        slugFr: "categorie-01",
        slugEn: "category-02",
        introFr: "Oui",
        introEn: "Yes",
        descriptionFr: "Oui",
        descriptionEn: "Yes",
      }
    });
    console.log("Success:", category);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
