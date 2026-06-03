const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { login, verifyToken } = require('../controllers/authController');
const { getMenu, getTableInfo } = require('../controllers/menuController');
const { createOrder, getOrder, getAllOrders, updateOrderStatus, confirmCashierPayment } = require('../controllers/orderController');
const { createQrisPayment, handleMidtransNotification, checkPaymentStatus } = require('../controllers/paymentController');
const { generateAllQRCodes, getTableQR, getAllTablesQR } = require('../controllers/qrController');
const { getCategories, createCategory, updateCategory, deleteCategory, getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailable } = require('../controllers/adminController');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `menu-${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// Auth routes
router.post('/auth/login', login);

// Menu routes
router.get('/menu', getMenu);
router.get('/tables/:tableNumber', getTableInfo);

// Order routes
router.post('/orders', createOrder);
router.get('/orders', getAllOrders);
router.get('/orders/:orderNumber', getOrder);
router.patch('/orders/:orderNumber/status', updateOrderStatus);
router.post('/orders/:orderNumber/confirm-cashier', confirmCashierPayment);

// Payment routes
router.post('/payment/qris', createQrisPayment);
router.post('/payment/notification', handleMidtransNotification);
router.get('/payment/status/:orderNumber', checkPaymentStatus);

// QR routes
router.post('/qr/generate-all', generateAllQRCodes);
router.get('/qr/table/:tableNumber', getTableQR);
router.get('/qr/all', getAllTablesQR);

// Admin - Categories
router.get('/admin/categories', verifyToken, getCategories);
router.post('/admin/categories', verifyToken, createCategory);
router.put('/admin/categories/:id', verifyToken, updateCategory);
router.delete('/admin/categories/:id', verifyToken, deleteCategory);

// Admin - Menu Items
router.get('/admin/menu-items', verifyToken, getAllMenuItems);
router.post('/admin/menu-items', verifyToken, upload.single('image'), createMenuItem);
router.put('/admin/menu-items/:id', verifyToken, upload.single('image'), updateMenuItem);
router.delete('/admin/menu-items/:id', verifyToken, deleteMenuItem);
router.patch('/admin/menu-items/:id/toggle', verifyToken, toggleAvailable);

module.exports = router;
