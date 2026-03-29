const fs = require('fs');

const shopPagePath = 'src/app/[lang]/(shop)/shop/page.tsx';
let shopPageContent = fs.readFileSync(shopPagePath, 'utf8');

// Replace the O(n) find in categories
const newProductsMapLogic = `
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const products = productsList.map(product => ({
        ...product,
        category: categoryMap.get(product.categoryId) || null
    }));
`;

shopPageContent = shopPageContent.replace(/const products = productsList\.map\(product => \(\{[\s\S]*?\.\.\.product,[\s\S]*?category: categories\.find\(\(c: any\) => c\.id === product\.categoryId\)![\s\S]*?\}\)\);/m, newProductsMapLogic.trim());

fs.writeFileSync(shopPagePath, shopPageContent, 'utf8');

const adminProductsPagePath = 'src/app/[lang]/admin/products/page.tsx';
let adminProductsPageContent = fs.readFileSync(adminProductsPagePath, 'utf8');

const newAdminProductsMapLogic = `
    const categoryMap = new Map(categoriesList.map(c => [c.id, c]));

    const productsSnapshot = await adminDb.collection("products").orderBy("createdAt", "desc").get();
    const products = productsSnapshot.docs.map(doc => {
       const data = doc.data();
       const prod: any = {
           id: doc.id,
           ...data,
           createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
           updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
       };
       return { ...prod, category: categoryMap.get(prod.categoryId) || null };
    });
`;

adminProductsPageContent = adminProductsPageContent.replace(/\/\/ Fetch products[\s\S]*?return \{ \.\.\.prod, category: categoriesList\.find\(\(c: any\) => c\.id === prod\.categoryId\)! \};[\s\S]*?\}\);/m, '// Fetch products\n' + newAdminProductsMapLogic.trim());

fs.writeFileSync(adminProductsPagePath, adminProductsPageContent, 'utf8');
