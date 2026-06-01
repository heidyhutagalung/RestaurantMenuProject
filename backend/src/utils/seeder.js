require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initDb } = require('../config/database');

const TABLE_COUNT = parseInt(process.env.RESTAURANT_TABLE_COUNT || '15');

const categories = [
  { name_id: 'Makanan Utama', name_en: 'Main Course',  icon: '🍽️', sort_order: 1 },
  { name_id: 'Minuman',       name_en: 'Beverages',    icon: '🥤', sort_order: 2 },
  { name_id: 'Dessert',       name_en: 'Desserts',     icon: '🍰', sort_order: 3 },
  { name_id: 'Snack',         name_en: 'Snacks',       icon: '🍟', sort_order: 4 },
];

const menuItems = [
  { category_id:1, name_id:'Nasi Goreng Spesial',   name_en:'Special Fried Rice',        description_id:'Nasi goreng dengan telur, ayam, dan bumbu rahasia khas restoran',          description_en:'Fried rice with egg, chicken, and our signature secret spices',          price:35000, image_emoji:'🍳', is_best_seller:1, is_spicy:1 },
  { category_id:1, name_id:'Ayam Bakar Madu',        name_en:'Honey Grilled Chicken',     description_id:'Ayam kampung bakar dengan saus madu pedas manis yang menggugah selera',   description_en:'Free-range grilled chicken with sweet and spicy honey sauce',             price:45000, image_emoji:'🍗', is_best_seller:1, is_spicy:0 },
  { category_id:1, name_id:'Soto Ayam',              name_en:'Chicken Soto Soup',         description_id:'Soto bening gurih dengan tauge, telur, dan kerupuk renyah',               description_en:'Clear savory chicken soup with bean sprouts, egg, and crackers',          price:28000, image_emoji:'🥣', is_best_seller:0, is_spicy:0 },
  { category_id:1, name_id:'Gado-Gado Jakarta',      name_en:'Jakarta Gado-Gado',         description_id:'Sayuran segar dengan bumbu kacang khas Betawi yang kaya rasa',            description_en:'Fresh vegetables with rich Betawi-style peanut sauce',                   price:25000, image_emoji:'🥗', is_best_seller:1, is_spicy:0 },
  { category_id:1, name_id:'Rendang Daging',         name_en:'Beef Rendang',              description_id:'Rendang sapi empuk dengan bumbu rempah Minang yang autentik',             description_en:'Tender beef rendang with authentic Minang herbs and spices',              price:55000, image_emoji:'🥩', is_best_seller:1, is_spicy:1 },
  { category_id:1, name_id:'Mie Goreng Seafood',     name_en:'Seafood Fried Noodle',      description_id:'Mie goreng dengan udang, cumi, dan sayuran segar',                        description_en:'Fried noodles with shrimp, squid, and fresh vegetables',                 price:42000, image_emoji:'🍜', is_best_seller:0, is_spicy:1 },
  { category_id:1, name_id:'Nasi Uduk Komplit',      name_en:'Complete Nasi Uduk',        description_id:'Nasi uduk gurih lengkap dengan lauk pauk dan sambal',                     description_en:'Savory coconut rice with complete side dishes and sambal',                price:38000, image_emoji:'🍚', is_best_seller:0, is_spicy:0 },
  { category_id:2, name_id:'Es Teh Manis',           name_en:'Iced Sweet Tea',            description_id:'Teh manis segar dengan es batu pilihan',                                  description_en:'Fresh sweet tea served with premium ice',                                 price:8000,  image_emoji:'🧋', is_best_seller:0, is_spicy:0 },
  { category_id:2, name_id:'Jus Alpukat',            name_en:'Avocado Juice',             description_id:'Jus alpukat segar dengan susu kental manis yang creamy',                  description_en:'Fresh creamy avocado juice with sweetened condensed milk',                price:18000, image_emoji:'🥑', is_best_seller:1, is_spicy:0 },
  { category_id:2, name_id:'Es Jeruk Peras',         name_en:'Fresh Orange Juice',        description_id:'Jeruk peras segar, manis-asam menyegarkan',                               description_en:'Freshly squeezed orange, sweet and refreshingly sour',                   price:12000, image_emoji:'🍊', is_best_seller:0, is_spicy:0 },
  { category_id:2, name_id:'Kopi Susu Gula Aren',    name_en:'Palm Sugar Coffee Latte',   description_id:'Kopi susu dengan gula aren asli yang harum dan manis',                    description_en:'Coffee latte with authentic fragrant palm sugar',                         price:22000, image_emoji:'☕', is_best_seller:1, is_spicy:0 },
  { category_id:2, name_id:'Es Kelapa Muda',         name_en:'Young Coconut Ice',         description_id:'Kelapa muda segar langsung dari buahnya',                                 description_en:'Fresh young coconut water served in the shell',                          price:20000, image_emoji:'🥥', is_best_seller:0, is_spicy:0 },
  { category_id:3, name_id:'Klepon',                 name_en:'Klepon Rice Cakes',         description_id:'Klepon pandan isi gula merah, taburan kelapa parut',                      description_en:'Pandan rice cakes filled with palm sugar, coated with coconut',          price:15000, image_emoji:'🟢', is_best_seller:1, is_spicy:0 },
  { category_id:3, name_id:'Es Campur',              name_en:'Mixed Shaved Ice',          description_id:'Es campur dengan nangka, cincau, mutiara, dan sirup segar',               description_en:'Shaved ice with jackfruit, grass jelly, pearls, and syrup',              price:22000, image_emoji:'🍧', is_best_seller:0, is_spicy:0 },
  { category_id:3, name_id:'Bubur Sumsum',           name_en:'Rice Flour Porridge',       description_id:'Bubur sumsum lembut dengan kinca gula merah',                             description_en:'Soft rice flour porridge with palm sugar syrup',                         price:18000, image_emoji:'🥛', is_best_seller:0, is_spicy:0 },
  { category_id:4, name_id:'Pisang Goreng Keju',     name_en:'Banana Fritter with Cheese',description_id:'Pisang goreng renyah dengan keju leleh dan coklat',                       description_en:'Crispy fried banana with melted cheese and chocolate',                   price:20000, image_emoji:'🍌', is_best_seller:0, is_spicy:0 },
  { category_id:4, name_id:'Tahu Tempe Goreng',      name_en:'Fried Tofu & Tempeh',       description_id:'Tahu dan tempe goreng renyah dengan sambal kecap',                        description_en:'Crispy fried tofu and tempeh with sweet soy chili sauce',                price:15000, image_emoji:'🧆', is_best_seller:0, is_spicy:1 },
];

async function seed() {
  const db = await initDb();
  console.log('🌱 Seeding database...');

  db.exec2(`
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM menu_items;
    DELETE FROM categories;
    DELETE FROM tables;
    DELETE FROM sqlite_sequence WHERE name IN ('categories', 'menu_items', 'tables', 'orders', 'order_items');
  `);

  const catIds = [];
  for (const cat of categories) {
    const { lastInsertRowid } = db.run2('INSERT INTO categories (name_id, name_en, icon, sort_order) VALUES (?,?,?,?)',
      [cat.name_id, cat.name_en, cat.icon, cat.sort_order]);
    catIds.push(lastInsertRowid);
  }
  console.log(`✅ ${categories.length} categories`);

  const catIdMap = {
    1: catIds[0],
    2: catIds[1],
    3: catIds[2],
    4: catIds[3]
  };

  for (const item of menuItems) {
    const mappedCategoryId = catIdMap[item.category_id];
    db.run2(`INSERT INTO menu_items (category_id,name_id,name_en,description_id,description_en,price,image_emoji,is_best_seller,is_spicy)
             VALUES (?,?,?,?,?,?,?,?,?)`,
      [mappedCategoryId, item.name_id, item.name_en, item.description_id, item.description_en,
       item.price, item.image_emoji, item.is_best_seller, item.is_spicy]);
  }
  console.log(`✅ ${menuItems.length} menu items`);

  for (let i = 1; i <= TABLE_COUNT; i++) {
    db.run2('INSERT INTO tables (table_number, status) VALUES (?,?)', [i, 'available']);
  }
  console.log(`✅ ${TABLE_COUNT} tables`);

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
