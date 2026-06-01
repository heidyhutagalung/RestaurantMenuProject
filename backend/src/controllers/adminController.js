const { getDb } = require('../config/database');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Categories ─────────────────────────────────────────────────────────────────
function getCategories(req, res) {
  try {
    const db = getDb();
    res.json({ success: true, data: db.all2('SELECT * FROM categories ORDER BY sort_order, id') });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function createCategory(req, res) {
  try {
    const db = getDb();
    const { name_id, name_en, icon, sort_order } = req.body;
    if (!name_id || !name_en) return res.status(400).json({ success: false, message: 'name_id and name_en required' });
    const { lastInsertRowid } = db.run2(
      'INSERT INTO categories (name_id, name_en, icon, sort_order) VALUES (?,?,?,?)',
      [name_id, name_en, icon || '🍽️', sort_order || 0]
    );
    res.status(201).json({ success: true, data: db.get2('SELECT * FROM categories WHERE id=?', [lastInsertRowid]) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function updateCategory(req, res) {
  try {
    const db = getDb();
    const { name_id, name_en, icon, sort_order } = req.body;
    db.run2('UPDATE categories SET name_id=?, name_en=?, icon=?, sort_order=? WHERE id=?',
      [name_id, name_en, icon, sort_order, req.params.id]);
    res.json({ success: true, data: db.get2('SELECT * FROM categories WHERE id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function deleteCategory(req, res) {
  try {
    const db = getDb();
    const cnt = db.get2('SELECT COUNT(*) as cnt FROM menu_items WHERE category_id=?', [req.params.id]);
    if (cnt.cnt > 0) return res.status(400).json({ success: false, message: 'Category has items, delete them first' });
    db.run2('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

// ── Menu Items ─────────────────────────────────────────────────────────────────
function getAllMenuItems(req, res) {
  try {
    const db = getDb();
    const items = db.all2(`
      SELECT mi.*, c.name_id as cat_name_id, c.name_en as cat_name_en
      FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id
      ORDER BY mi.category_id, mi.sort_order, mi.id
    `);
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function createMenuItem(req, res) {
  try {
    const db = getDb();
    const { category_id, name_id, name_en, description_id, description_en, price, image_emoji, is_available, is_best_seller, is_spicy } = req.body;
    if (!name_id || !price) return res.status(400).json({ success: false, message: 'name_id and price required' });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const { lastInsertRowid } = db.run2(
      `INSERT INTO menu_items (category_id,name_id,name_en,description_id,description_en,price,image_url,image_emoji,is_available,is_best_seller,is_spicy)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id, name_id, name_en || name_id, description_id || null, description_en || null,
       parseInt(price), image_url, image_emoji || '🍽️',
       is_available === 'false' ? 0 : 1,
       is_best_seller === 'true' ? 1 : 0,
       is_spicy === 'true' ? 1 : 0]
    );
    res.status(201).json({ success: true, data: db.get2('SELECT * FROM menu_items WHERE id=?', [lastInsertRowid]) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function updateMenuItem(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const existing = db.get2('SELECT * FROM menu_items WHERE id=?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    const { category_id, name_id, name_en, description_id, description_en, price, image_emoji, is_available, is_best_seller, is_spicy } = req.body;

    let image_url = existing.image_url;
    if (req.file) {
      if (existing.image_url) {
        const old = path.join(__dirname, '../../public', existing.image_url);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    db.run2(
      `UPDATE menu_items SET category_id=?,name_id=?,name_en=?,description_id=?,description_en=?,
       price=?,image_url=?,image_emoji=?,is_available=?,is_best_seller=?,is_spicy=? WHERE id=?`,
      [category_id, name_id, name_en || name_id, description_id || null, description_en || null,
       parseInt(price), image_url, image_emoji || '🍽️',
       is_available === 'false' ? 0 : 1,
       is_best_seller === 'true' ? 1 : 0,
       is_spicy === 'true' ? 1 : 0, id]
    );
    res.json({ success: true, data: db.get2('SELECT * FROM menu_items WHERE id=?', [id]) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function deleteMenuItem(req, res) {
  try {
    const db = getDb();
    const item = db.get2('SELECT * FROM menu_items WHERE id=?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (item.image_url) {
      const imgPath = path.join(__dirname, '../../public', item.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    db.run2('DELETE FROM menu_items WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

function toggleAvailable(req, res) {
  try {
    const db = getDb();
    const item = db.get2('SELECT * FROM menu_items WHERE id=?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    db.run2('UPDATE menu_items SET is_available=? WHERE id=?', [item.is_available ? 0 : 1, req.params.id]);
    res.json({ success: true, data: db.get2('SELECT * FROM menu_items WHERE id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailable };
