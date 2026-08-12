import 'dotenv/config';
import { PrismaClient, type Transmission } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { genSaltSync, hashSync } from 'bcrypt';
import { buildReachablePgConfig } from '../../src/utils/neonConnection';

const adapter = new PrismaPg(await buildReachablePgConfig(process.env.DATABASE_URL!));
const prisma = new PrismaClient({ adapter });

const salt = genSaltSync(10);

async function main() {
  console.log('🌱 Mulai melakukan seeding data...');

  const admin = await prisma.users.upsert({
    where: { email: 'admin@rentcar.com' },
    update: {},
    create: {
      name: 'Admin Rent Car',
      email: 'admin@rentcar.com',
      password: hashSync('admin123', salt),
      role: 'ADMIN',
    },
  });

  const staff = await prisma.users.upsert({
    where: { email: 'staff@rentcar.com' },
    update: {},
    create: {
      name: 'Staff Rent Car',
      email: 'staff@rentcar.com',
      password: hashSync('staff123', salt),
      role: 'STAFF',
    },
  });

  const categories = ['Sedan', 'MPV', 'SUV', 'Pickup', 'Hiace', 'Elf'];
  const seededCategories: Record<string, { id: string }> = {};

  for (const name of categories) {
    const category = await prisma.vehicleCategories.upsert({
      where: { name },
      update: {},
      create: { name, description: `Kategori kendaraan ${name}` },
    });
    seededCategories[name] = category;
  }

  const vehicles: Array<{
    name: string;
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    categoryId: string;
    transmission: Transmission;
    fuelType: string;
    seatingCapacity: number;
  }> = [
    {
      name: 'Toyota Avanza',
      brand: 'Toyota',
      model: 'Avanza Veloz',
      year: 2022,
      plateNumber: 'B 1234 ABC',
      categoryId: seededCategories['MPV']!.id,
      transmission: 'AUTOMATIC',
      fuelType: 'Bensin',
      seatingCapacity: 7,
    },
    {
      name: 'Toyota Innova Reborn',
      brand: 'Toyota',
      model: 'Innova Reborn',
      year: 2021,
      plateNumber: 'B 5678 DEF',
      categoryId: seededCategories['MPV']!.id,
      transmission: 'AUTOMATIC',
      fuelType: 'Diesel',
      seatingCapacity: 7,
    },
    {
      name: 'Honda Brio',
      brand: 'Honda',
      model: 'Brio Satya',
      year: 2023,
      plateNumber: 'B 9012 GHI',
      categoryId: seededCategories['Sedan']!.id,
      transmission: 'AUTOMATIC',
      fuelType: 'Bensin',
      seatingCapacity: 5,
    },
    {
      name: 'Toyota Fortuner',
      brand: 'Toyota',
      model: 'Fortuner VRZ',
      year: 2022,
      plateNumber: 'B 3456 JKL',
      categoryId: seededCategories['SUV']!.id,
      transmission: 'AUTOMATIC',
      fuelType: 'Diesel',
      seatingCapacity: 7,
    },
    {
      name: 'Toyota Hilux Pickup',
      brand: 'Toyota',
      model: 'Hilux Double Cabin',
      year: 2020,
      plateNumber: 'B 7890 MNO',
      categoryId: seededCategories['Pickup']!.id,
      transmission: 'MANUAL',
      fuelType: 'Diesel',
      seatingCapacity: 5,
    },
    {
      name: 'Hiace Premio',
      brand: 'Toyota',
      model: 'Hiace Premio',
      year: 2021,
      plateNumber: 'B 1122 PQR',
      categoryId: seededCategories['Hiace']!.id,
      transmission: 'MANUAL',
      fuelType: 'Diesel',
      seatingCapacity: 14,
    },
    {
      name: 'Isuzu Elf Long',
      brand: 'Isuzu',
      model: 'Elf Long',
      year: 2019,
      plateNumber: 'B 3344 STU',
      categoryId: seededCategories['Elf']!.id,
      transmission: 'MANUAL',
      fuelType: 'Diesel',
      seatingCapacity: 18,
    },
  ];

  const seededVehicles = [];
  for (const vehicle of vehicles) {
    const seeded = await prisma.vehicles.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {},
      create: vehicle,
    });

    await prisma.vehicleRates.createMany({
      data: [
        { vehicleId: seeded.id, durationType: 'DAILY', withDriver: false, price: 400000 },
        { vehicleId: seeded.id, durationType: 'DAILY', withDriver: true, price: 550000 },
        { vehicleId: seeded.id, durationType: 'WEEKLY', withDriver: false, price: 2400000 },
        { vehicleId: seeded.id, durationType: 'WEEKLY', withDriver: true, price: 3400000 },
        { vehicleId: seeded.id, durationType: 'MONTHLY', withDriver: false, price: 9000000 },
        { vehicleId: seeded.id, durationType: 'MONTHLY', withDriver: true, price: 12500000 },
      ],
      skipDuplicates: true,
    });

    seededVehicles.push(seeded);
  }

  const customer = await prisma.customers.upsert({
    where: { phone: '081234567890' },
    update: {},
    create: {
      name: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@example.com',
      address: 'Jl. Merdeka No. 10, Jakarta',
      notes: 'Customer setia',
    },
  });

  const corporate = await prisma.customers.upsert({
    where: { phone: '081298765432' },
    update: {},
    create: {
      name: 'Siti Rahayu',
      phone: '081298765432',
      email: 'corporate@perusahaan.co.id',
      address: 'Jl. Sudirman Kav. 45, Jakarta',
      companyName: 'PT Maju Bersama',
      notes: 'Booking rombongan karyawan',
    },
  });

  const today = new Date();
  const startDate = new Date(today.getTime() + 2 * 86400000);
  const endDate = new Date(startDate.getTime() + 3 * 86400000);

  const booking = await prisma.bookings.upsert({
    where: { bookingCode: 'RC-20260001' },
    update: {},
    create: {
      bookingCode: 'RC-20260001',
      customerId: customer.id,
      createdBy: staff.id,
      status: 'CONFIRMED',
      startDate,
      endDate,
      pickupLocation: 'Jakarta',
      needsDriver: true,
      needsFuel: true,
      basePrice: 1650000,
      totalPrice: 1650000,
      items: {
        create: [
          {
            vehicleId: seededVehicles[0]!.id,
            durationType: 'DAILY',
            days: 3,
            unitPrice: 550000,
            subtotal: 1650000,
          },
        ],
      },
    },
  });

  console.log('✅ Seeding selesai! Data yang dibuat:');
  console.log({
    users: [admin.email, staff.email],
    categories: categories.map((name) => name),
    vehicles: seededVehicles.map((vehicle) => vehicle.name),
    customers: [customer.name, corporate.name],
    booking: booking.bookingCode,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
