const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/database');

const QR_DIR = path.join(__dirname, '../../public/qr-codes');

async function generateAllQRCodes(req, res) {
  try {
    const db = getDb();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tableCount = parseInt(process.env.RESTAURANT_TABLE_COUNT || '15');
    if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

    const results = [];
    for (let n = 1; n <= tableCount; n++) {
      const menuUrl = `${frontendUrl}/menu?table=${n}`;
      const fileName = `table-${String(n).padStart(2,'0')}.png`;
      await QRCode.toFile(path.join(QR_DIR, fileName), menuUrl, {
        errorCorrectionLevel: 'H', type: 'png', margin: 2,
        color: { dark: '#1a1a1a', light: '#FFFFFF' }, width: 400,
      });
      db.run2('UPDATE tables SET qr_code = ? WHERE table_number = ?', [`/qr-codes/${fileName}`, n]);
      results.push({ table_number: n, url: menuUrl, qr_file: fileName });
    }
    res.json({ success: true, message: `Generated ${tableCount} QR codes`, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getTableQR(req, res) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const menuUrl = `${frontendUrl}/menu?table=${req.params.tableNumber}`;
    const qrDataUrl = await QRCode.toDataURL(menuUrl, { errorCorrectionLevel: 'H', margin: 2, width: 300 });
    res.json({ success: true, data: { table_number: parseInt(req.params.tableNumber), menu_url: menuUrl, qr_data_url: qrDataUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllTablesQR(req, res) {
  try {
    const db = getDb();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const tables = db.all2('SELECT * FROM tables ORDER BY table_number');

    const results = await Promise.all(tables.map(async (table) => {
      const menuUrl = `${frontendUrl}/menu?table=${table.table_number}`;
      const qrDataUrl = await QRCode.toDataURL(menuUrl, { errorCorrectionLevel: 'H', margin: 2, width: 200 });
      return { table_number: table.table_number, status: table.status, menu_url: menuUrl, qr_data_url: qrDataUrl };
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { generateAllQRCodes, getTableQR, getAllTablesQR };
