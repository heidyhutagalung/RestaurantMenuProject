const { initDb } = require('./src/config/database');

initDb().then(db => {
  const cats = db.all2('SELECT * FROM categories');
  const items = db.all2('SELECT * FROM menu_items');
  console.log('=== CATEGORIES ===');
  console.log(cats);
  console.log('=== MENU ITEMS ===');
  console.log(items.map(i => ({ id: i.id, name: i.name_id, category_id: i.category_id })));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
