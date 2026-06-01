const { getDb } = require('../config/database');

function getMenu(req, res) {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const lang = req.query.lang || 'id';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const categories = db.all2('SELECT * FROM categories ORDER BY sort_order, id') || [];
    const items = db.all2('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY sort_order, id') || [];

    console.log(`📋 Menu request: ${categories?.length || 0} categories, ${items?.length || 0} items`);
    if (items.length > 0) console.log('  First item:', items[0].name_id, 'category_id:', items[0].category_id);

    const result = categories.map(cat => {
      const catItems = items.filter(item => item.category_id === cat.id);
      console.log(`  Category ${cat.name_id}: ${catItems.length} items`);
      return {
        id: cat.id,
        name: lang === 'en' ? cat.name_en : cat.name_id,
        icon: cat.icon,
        items: catItems.map(item => ({
          id: item.id,
          name: lang === 'en' ? item.name_en : item.name_id,
          description: lang === 'en' ? item.description_en : item.description_id,
          price: item.price,
          image_url: item.image_url ? `${backendUrl}${item.image_url}` : null,
          image_emoji: item.image_emoji,
          is_best_seller: item.is_best_seller === 1,
          is_spicy: item.is_spicy === 1,
        }))
      };
    }).filter(cat => cat.items.length > 0);

    console.log(`✓ Returning ${result.length} categories with items`);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Menu error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

function getTableInfo(req, res) {
  try {
    const db = getDb();
    const table = db.get2('SELECT * FROM tables WHERE table_number = ?', [req.params.tableNumber]);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getMenu, getTableInfo };
