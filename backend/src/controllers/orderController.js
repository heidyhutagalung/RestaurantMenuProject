const { getDb } = require('../config/database');

function generateOrderNumber() {
  const d = new Date().toISOString().slice(2,10).replace(/-/g,'');
  return `ORD-${d}-${Math.floor(Math.random()*9000)+1000}`;
}

function createOrder(req, res) {
  try {
    const db = getDb();
    const { table_number, items, payment_method, customer_notes } = req.body;
    if (!table_number || !items?.length || !payment_method)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    let subtotal = 0;
    const enriched = [];
    for (const item of items) {
      const mi = db.get2('SELECT * FROM menu_items WHERE id = ? AND is_available = 1', [item.menu_item_id]);
      if (!mi) return res.status(400).json({ success: false, message: `Item ${item.menu_item_id} not found` });
      const lineTotal = mi.price * item.quantity;
      subtotal += lineTotal;
      enriched.push({ ...item, unit_price: mi.price, subtotal: lineTotal });
    }

    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const order_number = generateOrderNumber();

    const { lastInsertRowid: orderId } = db.run2(
      `INSERT INTO orders (order_number,table_number,payment_method,subtotal,tax,total,customer_notes,status,payment_status)
       VALUES (?,?,?,?,?,?,?,'pending','unpaid')`,
      [order_number, table_number, payment_method, subtotal, tax, total, customer_notes || null]
    );

    for (const item of enriched) {
      db.run2(
        'INSERT INTO order_items (order_id,menu_item_id,quantity,unit_price,subtotal,notes) VALUES (?,?,?,?,?,?)',
        [orderId, item.menu_item_id, item.quantity, item.unit_price, item.subtotal, item.notes || null]
      );
    }

    const order = db.get2('SELECT * FROM orders WHERE id = ?', [orderId]);
    const io = req.app.get('io');
    if (io) io.emit('new_order', { order, items: enriched });

    res.status(201).json({ success: true, data: { order, items: enriched } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function getOrder(req, res) {
  try {
    const db = getDb();
    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [req.params.orderNumber]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const items = db.all2(
      `SELECT oi.*, mi.name_id, mi.name_en, mi.image_emoji
       FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`, [order.id]
    );
    res.json({ success: true, data: { order, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function getAllOrders(req, res) {
  try {
    const db = getDb();
    const { status, date } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (date)   { sql += " AND DATE(created_at) = ?"; params.push(date); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    res.json({ success: true, data: db.all2(sql, params) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function updateOrderStatus(req, res) {
  try {
    const db = getDb();
    const valid = ['pending','confirmed','preparing','ready','completed','cancelled'];
    if (!valid.includes(req.body.status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    db.run2('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_number = ?',
      [req.body.status, req.params.orderNumber]);

    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [req.params.orderNumber]);
    const io = req.app.get('io');
    if (io) io.emit('order_updated', order);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function confirmCashierPayment(req, res) {
  try {
    const db = getDb();
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Order number required' });
    }

    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'Pembayaran sudah diproses' });
    }

    db.run2(
      "UPDATE orders SET payment_status='paid', status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE order_number=?",
      [orderNumber]
    );

    const updatedOrder = db.get2('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_confirmed', updatedOrder);
      io.emit('order_updated', updatedOrder);
    }

    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    console.error('Cashier payment error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses pembayaran: ' + err.message });
  }
}

module.exports = { createOrder, getOrder, getAllOrders, updateOrderStatus, confirmCashierPayment };
