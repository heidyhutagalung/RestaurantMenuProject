const { initDb } = require('./src/config/database');

initDb().then(db => {
  const cats = db.all2('SELECT * FROM categories');
  const items = db.all2('SELECT * FROM menu_items WHERE is_available = 1');
  const tables = db.all2('SELECT * FROM tables');

  console.log('✓ Categories:', cats.length);
  console.log('✓ Available Menu Items:', items.length);
  if (items.length > 0) console.log('  First item:', items[0].name_id);
  console.log('✓ Tables:', tables.length);

  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
