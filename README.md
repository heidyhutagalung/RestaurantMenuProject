# 🍽️ Restaurant QR Menu System

Sistem QR Menu restoran lengkap dengan fitur pemesanan dan pembayaran QRIS via Midtrans.

## 📁 Struktur Project

```
restaurant-qr/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # SQLite database setup
│   │   ├── controllers/
│   │   │   ├── menuController.js  # Menu & table info
│   │   │   ├── orderController.js # CRUD pesanan
│   │   │   ├── paymentController.js # Midtrans QRIS
│   │   │   └── qrController.js    # QR code generator
│   │   ├── routes/
│   │   │   └── api.js             # Semua API routes
│   │   ├── utils/
│   │   │   └── seeder.js          # Seed data menu
│   │   └── server.js              # Express + Socket.io server
│   ├── .env.example
│   └── package.json
│
└── frontend/              # React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── menu/
    │   │   │   └── MenuItemCard.jsx
    │   │   ├── cart/
    │   │   │   └── CartBar.jsx
    │   │   └── shared/
    │   │       └── LangSwitcher.jsx  # 🇮🇩/🇺🇸 toggle
    │   ├── hooks/
    │   │   └── useCart.js         # Zustand cart state
    │   ├── i18n/
    │   │   ├── id.js              # Terjemahan Bahasa Indonesia
    │   │   ├── en.js              # English translations
    │   │   └── index.js           # i18next setup
    │   ├── pages/
    │   │   ├── MenuPage.jsx       # Halaman menu utama
    │   │   ├── OrderPage.jsx      # Review & pilih pembayaran
    │   │   ├── QrisPaymentPage.jsx # QRIS via Midtrans Snap
    │   │   ├── CashierPaymentPage.jsx # Bayar ke kasir
    │   │   ├── SuccessPage.jsx    # Konfirmasi berhasil
    │   │   └── AdminPage.jsx      # Dashboard admin + QR manager
    │   ├── utils/
    │   │   ├── api.js             # Axios API calls
    │   │   └── format.js          # Format Rupiah, tanggal
    │   └── styles/index.css
    └── package.json
```

---

## 🚀 Cara Menjalankan

### 1. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Salin dan isi environment variables
cp .env.example .env
# → Edit .env dengan Midtrans key Anda (lihat bagian Midtrans di bawah)

# Seed database (insert menu & 15 meja)
npm run seed

# Jalankan server
npm run dev
# Server berjalan di http://localhost:3001
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
# Buka http://localhost:5173
```

---

## 💳 Setup Midtrans (QRIS)

### Langkah-langkah:

**1. Daftar akun Midtrans**
- Buka https://dashboard.midtrans.com
- Daftar akun (gratis untuk sandbox/testing)

**2. Aktifkan QRIS**
- Login ke dashboard Midtrans
- Pergi ke: Settings → Payment Methods → QRIS → Enable

**3. Ambil API Keys**
- Dashboard → Settings → Access Keys
- Salin **Sandbox Server Key** dan **Sandbox Client Key**
- Paste ke file `backend/.env`:
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

**4. Setup Webhook (Notification URL)**
- Dashboard Midtrans → Settings → Configuration
- Set **Payment Notification URL**:
  - Development: gunakan **ngrok** → `https://xxxx.ngrok.io/api/payment/notification`
  - Production: `https://yourdomain.com/api/payment/notification`

**5. Testing dengan Sandbox**
- Gunakan simulator di: https://simulator.sandbox.midtrans.com
- Atau pakai GoPay/OVO test account dari docs Midtrans

**6. Go Production**
- Ganti ke Production Keys dari dashboard
- Set `MIDTRANS_IS_PRODUCTION=true`
- Pastikan domain sudah HTTPS

---

## 🔌 Alternatif: QRIS langsung tanpa Midtrans

Jika kamu ingin melewati Midtrans dan hanya menampilkan QRIS lokal, tambahkan `QRIS_STATIC_PAYLOAD` ke file `backend/.env`.

Contoh:
```env
QRIS_STATIC_PAYLOAD=000201010212...<payload QRIS kamu>...6304ABCD
```

- Backend akan menghasilkan QR image (`qr_data_url`) langsung dari payload ini
- Frontend akan menampilkan QR tersebut tanpa memuat Midtrans Snap
- Status pembayaran masih harus dikonfirmasi secara manual di kasir atau melalui sistem lain

> Catatan: payload ini harus berupa string QRIS valid yang sudah berisi data merchant / nomor merchant.

### Flow Pembayaran QRIS langsung:
```
Customer pilih QRIS
  → Backend membuat QR image dari QRIS_STATIC_PAYLOAD
  → Frontend menampilkan QR lokal
  → Customer scan QR dengan aplikasi e-wallet
  → Kasir/hard process konfirmasi pembayaran secara manual
```

### Flow Pembayaran QRIS via Midtrans:
```
Customer pilih QRIS
  → Backend request ke Midtrans (POST /snap/v1/transactions)
  → Midtrans return Snap token
  → Frontend load Midtrans Snap popup
  → Customer scan QR dari aplikasi e-wallet
  → Midtrans kirim webhook ke /api/payment/notification
  → Backend update status pesanan
  → Frontend dapat notifikasi via Socket.io → redirect ke halaman sukses
```

---

## 📱 Halaman & URL

| URL | Keterangan |
|-----|-----------|
| `/menu?table=1` | Menu untuk meja 1 (URL di dalam QR code) |
| `/order` | Review pesanan & pilih pembayaran |
| `/payment/qris` | Halaman pembayaran QRIS |
| `/payment/cashier` | Halaman bayar ke kasir |
| `/success` | Konfirmasi pesanan berhasil |
| `/admin` | Dashboard admin (QR manager + pesanan) |

---

## 🔲 Generate & Print QR Code (15 Meja)

### Via Admin Dashboard:
1. Buka `/admin`
2. Tab "QR Manager"
3. Klik **"Generate Semua QR"**
4. Download atau Print per meja

### Via API:
```bash
# Generate semua QR sekaligus (simpan ke /backend/public/qr-codes/)
curl -X POST http://localhost:3001/api/qr/generate-all

# Lihat QR untuk meja tertentu
curl http://localhost:3001/api/qr/table/5
```

Setiap QR berisi URL: `http://localhost:5173/menu?table=1`

Di production, ganti `FRONTEND_URL` di `.env` dengan domain Anda:
```env
FRONTEND_URL=https://menu.restoransaya.com
```

---

## 🌐 Multi Bahasa (ID/EN)

Toggle bahasa ada di pojok kanan atas halaman menu.
- Pilihan tersimpan di `localStorage`
- Menu dari backend otomatis ikut bahasa yang dipilih
- Tambah bahasa baru di `frontend/src/i18n/`

---

## 📡 API Endpoints

```
GET  /api/menu?lang=id          Daftar menu (lang: id/en)
GET  /api/tables/:num           Info meja

POST /api/orders                Buat pesanan baru
GET  /api/orders                Semua pesanan (admin)
GET  /api/orders/:orderNumber   Detail pesanan
PATCH /api/orders/:num/status   Update status pesanan
POST /api/orders/:num/confirm-cashier  Konfirmasi bayar kasir

POST /api/payment/qris          Buat transaksi Midtrans
POST /api/payment/notification  Webhook dari Midtrans ⚠️
GET  /api/payment/status/:num   Cek status pembayaran

POST /api/qr/generate-all       Generate semua QR PNG
GET  /api/qr/table/:num         QR satu meja (base64)
GET  /api/qr/all                Semua QR (base64)
```

---

## 🔧 Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Zustand |
| Routing | React Router v6 |
| i18n | i18next + react-i18next |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Realtime | Socket.io |
| Payment | Midtrans Snap (QRIS) |
| QR Generate | node-qrcode |

---

## 🏗️ Pengembangan Selanjutnya

- [ ] Autentikasi admin (JWT)
- [ ] Upload foto menu asli
- [ ] Kitchen Display System (KDS)
- [ ] Laporan penjualan harian/bulanan
- [ ] Notifikasi push saat pesanan siap
- [ ] Multiple restaurant support
- [ ] Deploy ke VPS + domain HTTPS
