const midtransClient = require('midtrans-client');
const QRCode = require('qrcode');
const { getDb } = require('../config/database');

function getSnap() {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });
}

const QRIS_STATIC_PAYLOAD = process.env.QRIS_STATIC_PAYLOAD?.trim();

async function createQrisPayment(req, res) {
  try {
    const db = getDb();
    const { order_number } = req.body;
    if (!order_number) return res.status(400).json({ success: false, message: 'order_number required' });

    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (order.payment_status === 'paid') return res.status(400).json({ success: false, message: 'Pembayaran sudah diproses' });

    // Reuse existing Midtrans transaction token if it exists
    if (order.midtrans_transaction_id && order.payment_status === 'pending' && !QRIS_STATIC_PAYLOAD) {
      return res.json({
        success: true,
        data: {
          token: order.midtrans_transaction_id,
          order_number,
          total: order.total,
          client_key: process.env.MIDTRANS_CLIENT_KEY,
          is_production: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        }
      });
    }

    if (QRIS_STATIC_PAYLOAD) {
      const payload = QRIS_STATIC_PAYLOAD;
      const qrDataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
      });

      db.run2(
        'UPDATE orders SET payment_status=?, updated_at=CURRENT_TIMESTAMP WHERE order_number=?',
        ['pending', order_number]
      );

      return res.json({
        success: true,
        data: {
          qr_data_url: qrDataUrl,
          qr_payload: payload,
          payment_method: 'qris_direct',
          order_number,
          total: order.total,
        }
      });
    }

    // Validate Midtrans config
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      return res.status(500).json({ success: false, message: 'Konfigurasi payment gateway tidak lengkap' });
    }

    const items = db.all2(
      `SELECT oi.*, mi.name_id as name FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?`, [order.id]
    );

    const parameter = {
      transaction_details: { order_id: order_number, gross_amount: order.total },
      item_details: [
        ...items.map(i => ({ id: String(i.menu_item_id), price: i.unit_price, quantity: i.quantity, name: i.name.substring(0,50) })),
        { id: 'TAX', price: order.tax, quantity: 1, name: 'Tax (10%)' },
      ],
      customer_details: { first_name: `Meja ${order.table_number}`, email: `table${order.table_number}@restaurant.local` },
      enabled_payments: ['gopay', 'qris', 'shopeepay'],
      expiry: { unit: 'minutes', duration: 15 },
      callbacks: {
        finish:   `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success`,
        unfinish: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/qris`,
        error:    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/qris`,
      },
    };

    const transaction = await getSnap().createTransaction(parameter);
    db.run2('UPDATE orders SET midtrans_transaction_id=?, payment_status=?, updated_at=CURRENT_TIMESTAMP WHERE order_number=?',
      [transaction.token, 'pending', order_number]);

    res.json({
      success: true,
      data: {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        order_number,
        total: order.total,
        client_key: process.env.MIDTRANS_CLIENT_KEY,
        is_production: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      }
    });
  } catch (err) {
    console.error('Midtrans error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat transaksi: ' + (err.message || 'Unknown error') });
  }
}

async function handleMidtransNotification(req, res) {
  try {
    const db = getDb();
    const statusResponse = await getSnap().transaction.notification(req.body);
    const { order_id, transaction_status, fraud_status, payment_type } = statusResponse;

    console.log(`Midtrans: ${order_id} → ${transaction_status} (${fraud_status})`);

    let paymentStatus = 'pending', orderStatus = 'pending';
    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') { paymentStatus = 'paid'; orderStatus = 'confirmed'; }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'; orderStatus = 'confirmed';
    } else if (['cancel','deny','expire'].includes(transaction_status)) {
      paymentStatus = 'failed'; orderStatus = 'cancelled';
    }

    db.run2(
      'UPDATE orders SET payment_status=?, status=?, midtrans_payment_type=?, updated_at=CURRENT_TIMESTAMP WHERE order_number=?',
      [paymentStatus, orderStatus, payment_type, order_id]
    );

    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [order_id]);
    const io = req.app.get('io');
    if (io && paymentStatus === 'paid') {
      io.emit('payment_confirmed', order);
      io.emit('order_updated', order);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function checkPaymentStatus(req, res) {
  try {
    const db = getDb();
    const order = db.get2('SELECT * FROM orders WHERE order_number = ?', [req.params.orderNumber]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { order_number: order.order_number, payment_status: order.payment_status, order_status: order.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createQrisPayment, handleMidtransNotification, checkPaymentStatus };
