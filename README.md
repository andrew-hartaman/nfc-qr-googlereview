# Dynamic Review Card Engine (V2 - High Scalability & Edge Caching)

Backend routing engine berkinerja tinggi berbasis **Hono.js** di **Cloudflare Workers** dengan **Cloudflare KV** edge caching dan **Supabase PostgreSQL** untuk memetakan kartu fisik NFC / QR Code ke URL Google Review dengan latensi **< 50ms**.

---

## 🚀 Fitur Utama

- ⚡ **Sub-50ms Edge Redirection (`GET /r/:short_code`)**: Menggunakan Cloudflare KV sebagai cache lapis pertama.
- 🔄 **Smart Cache Invalidation (`PATCH /api/cards/:id`)**: Otomatis menghapus cache di KV setiap kali link Google Review diperbarui dari dashboard/admin.
- 📊 **Non-Blocking Background Logging**: Pencatatan ke tabel `tap_logs` (device type, IP, timestamp) berjalan di background via `c.executionCtx.waitUntil()`.
- 🛡️ **Free-Tier Optimized**: Menggunakan REST API Supabase (`@supabase/supabase-js`) untuk mencegah connection pool exhaustion dan menghemat batas gratis.
- 🔒 **HTTP 302 Found Redirect**: Mencegah browser HP menyimpan cache secara permanen sehingga link selalu dinamis.

---

## 📁 Struktur Proyek

```
.
├── .env.example              # Template environment variables
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config untuk Workers
├── wrangler.toml             # Konfigurasi Cloudflare Workers & KV Namespace
├── supabase/
│   └── schema.sql            # Schema SQL Supabase (users, cards, tap_logs)
└── src/
    ├── index.ts              # Entrypoint utama Hono App
    ├── types/
    │   └── index.ts          # TypeScript interfaces & bindings
    ├── lib/
    │   ├── supabase.ts       # Supabase REST client factory
    │   ├── device.ts         # Lightweight User-Agent parser (Android, iOS, Desktop)
    │   └── cache.ts          # Cloudflare KV cache helper
    └── routes/
        ├── redirect.ts       # Route GET /r/:short_code (Edge routing & async logging)
        └── admin.ts          # Route Admin CRUD & Cache Invalidation
```

---

## 🛠️ Panduan Instalasi & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database Supabase
1. Buka dashboard proyek **Supabase**.
2. Masuk ke menu **SQL Editor**.
3. Salin dan jalankan seluruh query dari file [supabase/schema.sql](file:///d:/Godot%20Game/Google%20Review%20tap%20card/supabase/schema.sql).

### 3. Setup Cloudflare KV
Jalankan perintah berikut untuk membuat KV Namespace di Cloudflare:

```bash
# 1. Buat KV Namespace untuk Production
npx wrangler kv:namespace create CARD_CACHE

# 2. Buat KV Namespace untuk Preview / Development
npx wrangler kv:namespace create CARD_CACHE --preview
```

Salin nilai `id` dan `preview_id` yang dihasilkan ke dalam file `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CARD_CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

### 4. Konfigurasi Environment Variables Lokal
Buat file `.dev.vars` di root folder (salin dari `.env.example`):
```ini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
DEFAULT_FALLBACK_URL=https://google.com
ADMIN_API_KEY=your_optional_secret_api_key
```

---

## 🧪 Menjalankan Secara Lokal

```bash
npm run dev
```
Worker akan berjalan di `http://localhost:8787`.

---

## 📡 Dokumentasi Endpoint API

### 1. Edge Redirection (NFC / QR Tap)
```http
GET /r/:short_code
```
- **Deskripsi**: Mengarahkan pengguna ke Google Review URL dalam status `302 Found`.
- **Contoh URL**: `http://localhost:8787/r/k-001`
- **Response**: HTTP 302 Redirect ke `target_url` milik kartu.

### 2. Update Target URL & Invalidate Cache (Admin)
```http
PATCH /api/cards/:id
Content-Type: application/json
x-api-key: your_optional_secret_api_key

{
  "target_url": "https://maps.app.goo.gl/new-google-review-link",
  "is_active": true
}
```

### 3. Create Card Baru
```http
POST /api/cards
Content-Type: application/json
x-api-key: your_optional_secret_api_key

{
  "short_code": "k-001",
  "target_url": "https://maps.app.goo.gl/sample-review-link",
  "is_active": true
}
```

### 4. List Semua Kartu
```http
GET /api/cards?page=1&limit=20
```

### 5. Lihat Analitik Tap Kartu
```http
GET /api/cards/:id/analytics
```

---

## 🚀 Deploy ke Cloudflare Workers

1. Set secret keys di Cloudflare Workers:
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_API_KEY # (opsional)
```

2. Deploy:
```bash
npm run deploy
```
