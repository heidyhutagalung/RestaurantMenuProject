require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const apiRoutes = require('./routes/api');
const { initDb } = require('./config/database');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true }));
// Bypass ngrok interstitial warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/qr-codes', express.static(path.join(__dirname, '../public/qr-codes')));
app.use('/uploads',  express.static(path.join(__dirname, '../public/uploads')));

app.use('/api', apiRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', socket => {
  console.log(`🔌 Connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
});

// Start server after DB is ready
initDb().then(() => {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running: http://localhost:${PORT}`);
    console.log(`💳 Midtrans: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION ⚠️' : 'SANDBOX ✅'}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/menu`);
    console.log(`  POST /api/orders`);
    console.log(`  POST /api/payment/qris`);
    console.log(`  GET  /api/admin/menu-items`);
    console.log(`  POST /api/qr/generate-all\n`);
  });
}).catch(err => {
  console.error('❌ Failed to init database:', err);
  process.exit(1);
});
