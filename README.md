# Rent Car App Backend API

Backend API untuk sistem rental mobil — katalog armada, tarif per durasi, cek ketersediaan, kalkulator harga, dan booking via WhatsApp. Dibangun berdasarkan hasil riset pasar yang menunjukkan para vendor rental mobil belum memiliki website/katalog online (lihat `potensi.md`).

## Tech Stack

- **Bun** (Runtime)
- **Express 5** & **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **PostgreSQL** (via Docker Compose)
- **Pino** (Logging)
- **Zod** (Input Validation)
- **JWT** (Autentikasi & Otorisasi)

## Struktur Proyek

```
src/
├── app/index.ts            # Entry point server
├── controllers/            # Handler per modul (auth, vehicles, bookings, ...)
├── routes/                 # Definisi route per modul
├── services/               # Logika bisnis (availability, pricing, booking)
├── models/                 # Tipe DTO & tipe request/response
├── validations/            # Skema Zod per modul
├── middlewares/            # authenticate, authorize, validate, errorHandler
├── utils/                  # jwt, logger, prisma, AppError, catchAsync, dll
└── generated/prisma/       # Prisma Client (hasil generate)
```

## Prasyarat

- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Setup environment variable
cp .env.example .env

# 3. Jalankan PostgreSQL (Docker, port 5433)
bun run db:up

# 4. Generate Prisma Client
bun run db:generate

# 5. Jalankan migrasi database
bun run db:migrate

# 6. Seed data (opsional)
bun run db:seed

# 7. Jalankan development server
bun run dev
```

Server akan berjalan di `http://localhost:3000`.

## Seed Data

```bash
bun run db:seed
```

| Jenis | Data |
|---|---|
| Users | `admin@rentcar.com` / `admin123` (ADMIN), `staff@rentcar.com` / `staff123` (STAFF) |
| Kategori | 6 kategori armada |
| Armada | 7 armada beserta tarif DAILY/WEEKLY/MONTHLY, dengan & tanpa driver |
| Customers | 2 customer contoh |
| Booking | 1 booking contoh (`RC-20260001`, status CONFIRMED) |

## Database Commands

| Command | Fungsi |
|---|---|
| `bun run db:up` | Start PostgreSQL container |
| `bun run db:down` | Stop & hapus container |
| `bun run db:logs` | Lihat logs container |
| `bun run db:restart` | Restart container |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Jalankan migration (dev) |
| `bun run db:migrate:prod` | Jalankan migration (production) |
| `bun run db:push` | Push schema ke DB tanpa migration |
| `bun run db:seed` | Seed data |
| `bun run db:studio` | Buka Prisma Studio (GUI) |
| `bun run db:reset` | Reset DB (drop + migrate + seed) |
| `bun run db:status` | Cek status migration |

## Available Scripts

| Command | Fungsi |
|---|---|
| `bun run dev` | Jalankan server (watch mode) |
| `bun run start` | Jalankan server |
| `bun run build` | Build ke `./dist` |
| `bun run lint` | Lint dengan ESLint |
| `bun run lint:fix` | Lint + auto fix |
| `bun run bundle:docs` | Lint & gabungkan spec OpenAPI ke `docs/bundle/openapi.yaml` |
| `bun run docs` | Sajikan dokumentasi API (Redocly) di `http://localhost:3001` |

## Dokumentasi API

- Panduan manual lengkap: [`docs/API.md`](docs/API.md)
- OpenAPI specs per modul: `docs/spec/**/openapi.yaml`
- Dokumentasi interaktif (Redocly):

```bash
bun run bundle:docs   # gabungkan semua spec
bun run docs          # sajikan di http://localhost:3001
```

## Endpoint Utama

### Publik (tanpa token)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/vehicles/available` | Cek ketersediaan armada per rentang tanggal |
| `GET` | `/api/vehicles` | Katalog armada (filter kategori/transmisi/tanggal) |
| `GET` | `/api/vehicles/:id` | Detail armada + tarif |
| `GET` | `/api/vehicles/:id/rates` | Tarif armada |
| `GET` | `/api/vehicle-categories` | Daftar kategori armada |
| `POST` | `/api/bookings/estimate` | Kalkulator harga (dihitung server-side) |
| `POST` | `/api/bookings` | Buat booking (alur WhatsApp) |
| `POST` | `/api/auth/login` | Login admin/staff |

### Autentikasi (Bearer token)

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Registrasi user |
| `GET` | `/api/auth/me` | ADMIN/STAFF | Profil user saat ini |
| `GET` | `/api/bookings` | ADMIN/STAFF | Daftar booking |
| `PATCH` | `/api/bookings/:id/status` | ADMIN/STAFF | Ubah status booking |
| `DELETE` | `/api/bookings/:id` | ADMIN/STAFF | Hapus booking |
| `GET` | `/api/customers` | ADMIN/STAFF | Daftar customer |
| `GET` | `/api/vehicle-rates` | ADMIN/STAFF | Daftar tarif |
| `GET` | `/api/activity-logs` | ADMIN/STAFF | Log aktivitas |
| `POST/PATCH/DELETE` | `/api/vehicles`, `/api/vehicle-categories`, `/api/vehicle-rates`, `/api/customers` | ADMIN | CRUD data master (PATCH = partial update) |
