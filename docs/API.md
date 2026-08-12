# API Documentation

**Base URL:** `http://localhost:3000/api`

**Autentikasi:** Sebagian besar endpoint manajemen membutuhkan token JWT. Kirim pada header:

```
Authorization: Bearer <accessToken>
```

Token didapat dari `POST /api/auth/register` atau `POST /api/auth/login`. Endpoint yang membutuhkan role `ADMIN` akan menolak akses role `STAFF` dengan status `403`.

**Endpoint Publik (tanpa token):** katalog & detail armada, cek ketersediaan, tarif armada, kalkulator harga, dan pembuatan booking (alur WhatsApp).

---

## Auth

### `POST /api/auth/register` — Registrasi User

Membuat akun user baru. Role default: `STAFF`.

**Request Body:**

```json
{
  "name": "Rifaa Fikri",
  "email": "rifaa@example.com",
  "password": "rahasia123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Min 3 karakter |
| `email` | string | ✅ | Format email valid |
| `password` | string | ✅ | Min 6 karakter |

**Response (201):**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "name": "Rifaa Fikri",
      "email": "rifaa@example.com",
      "role": "STAFF",
      "isActive": true,
      "createdAt": "2026-08-12T10:00:00.000Z"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

**Error (409):** Email sudah terdaftar.

### `POST /api/auth/login` — Login

**Request Body:**

```json
{
  "email": "rifaa@example.com",
  "password": "rahasia123"
}
```

**Response (200):** Sama seperti response register, berisi `user`, `accessToken`, dan `refreshToken`.

**Error (401):** Email atau password salah / akun dinonaktifkan.

### `GET /api/auth/me` — Profil User Saat Ini

**Auth:** Bearer token.

**Response (200):** Berisi `user` (`id`, `name`, `email`, `role`, `isActive`, `createdAt`).

---

## Vehicle Categories

### `GET /api/vehicle-categories` — Daftar Kategori Armada

**Publik.** Paginated. Setiap item menyertakan `_count.vehicles`.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Halaman |
| `limit` | integer | `10` | Data per halaman (max 100) |
| `search` | string | — | Cari berdasarkan nama atau deskripsi |
| `sort` | `asc` / `desc` | `asc` | Urutkan berdasarkan nama |
| `isActive` | `true` / `false` | — | Filter status aktif |

### `POST /api/vehicle-categories` — Buat Kategori

**Auth:** Bearer token, role `ADMIN`. Body: `name` (wajib, min 3), `description` (opsional).

**Error (409):** Nama kategori sudah ada.

### `GET /api/vehicle-categories/{id}` — Detail Kategori

**Publik.** Menyertakan `_count.vehicles` dan daftar `vehicles`.

**Error (404):** Kategori tidak ditemukan.

### `PATCH /api/vehicle-categories/{id}` — Update Kategori

**Auth:** role `ADMIN`. **Partial update** — kirim hanya field yang ingin diubah.

| Aturan | Perilaku |
|--------|----------|
| Field tidak dikirim | Nilai tetap (tidak berubah) |
| `description: null` atau `description: ""` | Mengosongkan description |
| `name` | Wajib min 3 karakter bila dikirim |
| `isActive` | Bisa diubah, tidak bisa dikosongkan |

**Error (404 / 409):** Tidak ditemukan / nama dipakai kategori lain.

### `DELETE /api/vehicle-categories/{id}` — Hapus Kategori

**Auth:** role `ADMIN`.

**Error (400):** Kategori masih memiliki kendaraan.

---

## Vehicles

### `GET /api/vehicles/available` — Cek Ketersediaan Armada

**Publik.** Mengembalikan armada yang **tidak sedang dibooking** (status `PENDING`/`CONFIRMED`/`ONGOING` overlap) pada rentang tanggal.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | date-time | ✅ | Tanggal mulai sewa |
| `endDate` | date-time | ✅ | Tanggal selesai sewa |
| `categoryId` | UUID | ❌ | Filter kategori |
| `search` | string | ❌ | Cari nama/brand/plat |

**Response (200):**

```json
{
  "success": true,
  "message": "Kendaraan yang tersedia berhasil diambil",
  "data": [
    {
      "id": "a1b2c3d4-...",
      "name": "Toyota Avanza",
      "plateNumber": "B 1234 ABC",
      "transmission": "AUTOMATIC",
      "category": { "id": "...", "name": "MPV" },
      "rates": [
        { "id": "...", "durationType": "DAILY", "withDriver": false, "price": "400000.00" }
      ]
    }
  ],
  "summary": {
    "startDate": "2026-08-20T00:00:00.000Z",
    "endDate": "2026-08-23T00:00:00.000Z",
    "totalAvailable": 7
  }
}
```

**Error (400):** Format tanggal tidak valid.

### `GET /api/vehicles` — Katalog Armada

**Publik.** Paginated. Jika `startDate` dan `endDate` diisi, armada yang dibooking pada rentang tersebut dikecualikan. Setiap item menyertakan `category` dan `rates` aktif.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Halaman |
| `limit` | integer | `10` | Data per halaman (max 100) |
| `search` | string | — | Cari nama/plat/brand |
| `sort` | `asc` / `desc` | `asc` | Urutkan berdasarkan nama |
| `categoryId` | UUID | — | Filter kategori |
| `transmission` | `MANUAL` / `AUTOMATIC` | — | Filter transmisi |
| `startDate` | date-time | — | Kecualikan yang dibooking sejak tanggal ini |
| `endDate` | date-time | — | Kecualikan yang dibooking hingga tanggal ini |

### `POST /api/vehicles` — Buat Armada

**Auth:** role `ADMIN`.

**Request Body:**

```json
{
  "name": "Toyota Avanza",
  "brand": "Toyota",
  "model": "Avanza Veloz",
  "year": 2022,
  "plateNumber": "B 1234 ABC",
  "categoryId": "a1b2c3d4-...",
  "transmission": "AUTOMATIC",
  "fuelType": "Bensin",
  "seatingCapacity": 7
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Min 2 karakter |
| `plateNumber` | string | ✅ | Harus unik |
| `categoryId` | UUID | ✅ | Kategori harus ada |
| `transmission` | `MANUAL` / `AUTOMATIC` | ❌ | Default `AUTOMATIC` |
| `brand`, `model`, `fuelType` | string | ❌ | |
| `year` | integer | ❌ | 1980–2100 |
| `seatingCapacity` | integer | ❌ | 1–100 |
| `imageUrl` | string (url) | ❌ | |

**Error (400 / 409):** Kategori tidak ditemukan / plat sudah ada.

### `GET /api/vehicles/{id}` — Detail Armada

**Publik.** Menyertakan `category` dan `rates` aktif.

**Error (404):** Kendaraan tidak ditemukan.

### `GET /api/vehicles/{id}/rates` — Tarif Armada

**Publik.** Mengembalikan daftar tarif aktif armada, diurutkan berdasarkan tipe durasi lalu opsi driver.

### `PATCH /api/vehicles/{id}` — Update Armada

**Auth:** role `ADMIN`. **Partial update** — kirim hanya field yang ingin diubah.

| Aturan | Perilaku |
|--------|----------|
| Field tidak dikirim | Nilai tetap (tidak berubah) |
| `brand`, `model`, `fuelType`, `imageUrl`, `year`, `seatingCapacity` | Bisa dikosongkan dengan `null` atau `""` |
| `name`, `plateNumber`, `categoryId`, `transmission`, `isActive` | Tidak bisa dikosongkan |

**Error (404 / 409 / 400):** Tidak ditemukan / plat dipakai armada lain / kategori tidak ditemukan.

### `DELETE /api/vehicles/{id}` — Hapus Armada

**Auth:** role `ADMIN`.

**Error (400):** Armada memiliki riwayat booking.

---

## Vehicle Rates

### `GET /api/vehicle-rates` — Daftar Tarif

**Auth:** Bearer token. Paginated, setiap item menyertakan `vehicle`.

**Query Parameters:** `page`, `limit`, `vehicleId`, `durationType` (`DAILY`/`WEEKLY`/`MONTHLY`), `withDriver` (`true`/`false`).

### `POST /api/vehicle-rates` — Buat Tarif

**Auth:** role `ADMIN`.

```json
{
  "vehicleId": "a1b2c3d4-...",
  "durationType": "DAILY",
  "withDriver": false,
  "price": 400000
}
```

**Error (400 / 409):** Kendaraan tidak ditemukan / kombinasi vehicle-durasi-driver sudah ada.

### `GET /api/vehicle-rates/{id}` — Detail Tarif

**Auth:** Bearer token. **Error (404):** Tidak ditemukan.

### `PATCH /api/vehicle-rates/{id}` — Update Tarif

**Auth:** role `ADMIN`. **Partial update** — kirim hanya field yang ingin diubah (contoh: cukup `{ "price": 450000 }`). Field tidak dikirim = nilai tetap. Semua field (termasuk `withDriver`, `price`) tidak bisa dikosongkan.

### `DELETE /api/vehicle-rates/{id}` — Hapus Tarif

**Auth:** role `ADMIN`.

---

## Bookings

### `POST /api/bookings/estimate` — Kalkulator Harga

**Publik.** Menghitung estimasi harga server-side berdasarkan durasi dan tarif.

**Request Body:**

```json
{
  "items": [{ "vehicleId": "a1b2c3d4-...", "needsDriver": false }],
  "startDate": "2026-09-01",
  "endDate": "2026-09-03"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Estimasi harga berhasil dihitung",
  "data": {
    "items": [
      {
        "vehicleId": "a1b2c3d4-...",
        "vehicleName": "Toyota Avanza",
        "durationType": "DAILY",
        "days": 2,
        "multiplier": 2,
        "unitPrice": 400000,
        "subtotal": 800000,
        "needsDriver": false
      }
    ],
    "basePrice": 800000,
    "totalPrice": 800000
  }
}
```

**Catatan durasi:** sewa ≥ 30 hari memakai tarif `MONTHLY`, ≥ 7 hari memakai `WEEKLY`, selainnya `DAILY`. Harga dihitung ulang di server (nilai klien diabaikan).

### `POST /api/bookings` — Buat Booking

**Publik.** Membuat booking berstatus `PENDING` dan mencari/membuat customer berdasarkan `phone`. Kode booking dibuat otomatis (format `RC-<tahun><bulan><hari>-XXXX`).

**Request Body:**

```json
{
  "customer": {
    "name": "Budi Santoso",
    "phone": "081234567890",
    "email": "budi@mail.com"
  },
  "startDate": "2026-09-01",
  "endDate": "2026-09-03",
  "items": [{ "vehicleId": "a1b2c3d4-...", "needsDriver": false }],
  "pickupLocation": "Bandara Soekarno-Hatta",
  "dropoffLocation": "Hotel Grand",
  "needsFuel": false,
  "notes": "Jemput di terminal 2"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` / `customerId` | object / UUID | ✅ | Salah satu wajib diisi |
| `items` | array | ✅ | Min 1 item |
| `startDate` / `endDate` | date-time | ✅ | `endDate` harus setelah `startDate` |
| `pickupLocation`, `dropoffLocation`, `notes` | string | ❌ | |
| `needsFuel` | boolean | ❌ | Default `false` |

**Response (201):** Data booking (`bookingCode`, `status`, `customer`, `items`) + `priceSummary`.

### `GET /api/bookings` — Daftar Booking

**Auth:** Bearer token. Paginated, setiap item menyertakan `customer` dan `items.vehicle`.

**Query Parameters:** `page`, `limit` (max 100), `search` (kode/customer/phone), `sort` (`asc`/`desc`, default `desc`), `status`, `startDate`, `endDate`.

### `GET /api/bookings/{id}` — Detail Booking

**Auth:** Bearer token. Menyertakan `customer`, `createdByUser`, dan `items.vehicle` (termasuk brand/model).

**Error (404):** Tidak ditemukan.

### `PATCH /api/bookings/{id}/status` — Ubah Status

**Auth:** role `ADMIN` atau `STAFF`.

```json
{ "status": "CONFIRMED" }
```

Transisi yang diizinkan: `PENDING → CONFIRMED/CANCELLED`, `CONFIRMED → ONGOING/CANCELLED`, `ONGOING → COMPLETED`.

**Error (400):** Status sudah sama / transisi tidak valid.

### `DELETE /api/bookings/{id}` — Hapus Booking

**Auth:** role `ADMIN` atau `STAFF`.

**Error (400):** Booking berstatus `ONGOING`/`COMPLETED` tidak bisa dihapus.

---

## Customers

### `GET /api/customers` — Daftar Customer

**Auth:** Bearer token. Paginated, setiap item menyertakan `_count.bookings`.

**Query Parameters:** `page`, `limit`, `search` (nama/phone/perusahaan), `sort`, `isActive`.

### `POST /api/customers` — Buat Customer

**Auth:** role `ADMIN`. Body: `name` (min 2), `phone` (min 8, unik), `email`, `address`, `companyName`, `notes`.

**Error (409):** Nomor HP sudah ada.

### `GET /api/customers/{id}` — Detail Customer

**Auth:** Bearer token. Menyertakan riwayat `bookings` terbaru.

**Error (404):** Tidak ditemukan.

### `PATCH /api/customers/{id}` — Update Customer

**Auth:** role `ADMIN`. **Partial update** — kirim hanya field yang ingin diubah.

| Aturan | Perilaku |
|--------|----------|
| Field tidak dikirim | Nilai tetap (tidak berubah) |
| `email`, `address`, `companyName`, `notes` | Bisa dikosongkan dengan `null` atau `""` |
| `name`, `phone`, `isActive` | Tidak bisa dikosongkan |

**Error (404 / 409):** Tidak ditemukan / nomor HP dipakai customer lain.

### `DELETE /api/customers/{id}` — Hapus Customer

**Auth:** role `ADMIN`.

**Error (400):** Customer memiliki riwayat booking.

---

## Activity Logs

### `GET /api/activity-logs` — Log Aktivitas

**Auth:** Bearer token. Paginated audit trail, setiap item menyertakan `userName` pelaku.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Default `1` |
| `limit` | integer | Default `10`, max 100 |
| `userId` | UUID | Filter user |
| `action` | `CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `LOGOUT` | Filter aksi |
| `entity` | string | Filter entitas (contoh: `Vehicles`, `Bookings`) |
| `startDate` | date-time | Filter sejak (inklusif) |
| `endDate` | date-time | Filter hingga (inklusif) |

**Response (200):**

```json
{
  "success": true,
  "message": "Activity logs berhasil diambil",
  "data": [
    {
      "id": "a1b2c3d4-...",
      "action": "UPDATE",
      "entity": "Bookings",
      "entityId": "a1b2c3d4-...",
      "detail": { "bookingCode": "RC-20260001", "from": "PENDING", "to": "CONFIRMED" },
      "userName": "Admin Rent Car",
      "createdAt": "2026-08-12T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

## Format Respons Umum

| Amplop | Penggunaan |
|--------|-----------|
| `{ success, message, data? }` | Create, Update, Get By ID, Delete |
| `{ success, message, data[], pagination }` | Get All / List |

**Error (validation):**

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "name": ["Nama minimal 3 karakter"]
  }
}
```

**Error (server):**

```json
{
  "success": false,
  "message": "Terjadi kesalahan pada server"
}
```
