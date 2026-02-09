import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "@shared/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL. Configure it in .env.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  // Seed users (veterinarians)
  const [vet1] = await db
    .insert(schema.users)
    .values({ name: "Dr. Nguyễn Văn A", email: "vet1@petclinic.com", role: "veterinarian", phone: "0123456780", isActive: true })
    .onConflictDoNothing()
    .returning();

  const [vet2] = await db
    .insert(schema.users)
    .values({ name: "Dr. Trần Thị B", email: "vet2@petclinic.com", role: "veterinarian", phone: "0123456781", isActive: true })
    .onConflictDoNothing()
    .returning();

  // Seed customers
  const [c1] = await db
    .insert(schema.customers)
    .values({ name: "Nguyễn Văn A", email: "customer1@email.com", phone: "0912345678", address: "Hà Nội", isActive: true })
    .returning();

  const [c2] = await db
    .insert(schema.customers)
    .values({ name: "Trần Thị B", email: "customer2@email.com", phone: "0912345679", address: "TP.HCM", isActive: true })
    .returning();

  // Seed pets
  await db.insert(schema.pets).values([
    { customerId: c1.id, name: "Max", species: "Chó", breed: "Golden Retriever", age: 3, weight: "25.5", gender: "Đực", microchip: "123456789", isActive: true },
    { customerId: c1.id, name: "Miu", species: "Mèo", breed: "Persian", age: 2, weight: "4.2", gender: "Cái", isActive: true },
    { customerId: c2.id, name: "Lucky", species: "Chó", breed: "Labrador", age: 1, weight: "20.0", gender: "Đực", microchip: "987654321", isActive: true },
  ]).onConflictDoNothing();

  // Seed medical records (link to first two pets)
  const pets = await db.select().from(schema.pets);
  const petMax = pets.find(p => p.name === "Max");
  const petMiu = pets.find(p => p.name === "Miu");

  if (petMax && vet1) {
    await db.insert(schema.medicalRecords).values({
      petId: petMax.id,
      veterinarianId: vet1.id,
      visitDate: new Date("2025-01-05"),
      symptoms: "Chó bị ho, chảy nước mũi",
      diagnosis: "Cảm lạnh",
      treatment: "Nghỉ ngơi, uống thuốc kháng sinh",
      notes: "Theo dõi nhiệt độ",
    });
  }

  if (petMiu && vet2) {
    await db.insert(schema.medicalRecords).values({
      petId: petMiu.id,
      veterinarianId: vet2.id,
      visitDate: new Date("2025-01-03"),
      symptoms: "Mèo bỏ ăn, nôn mửa",
      diagnosis: "Viêm dạ dày",
      treatment: "Nhịn ăn 24h, uống thuốc",
      notes: "Tái khám sau 3 ngày",
    });
  }

  // Seed invoices
  if (c1 && petMax) {
    const [inv1] = await db.insert(schema.invoices).values({
      customerId: c1.id,
      appointmentId: null,
      invoiceNumber: `I${Date.now()}`,
      totalAmount: "350000",
      status: "paid",
      issuedAt: new Date(),
    }).returning();

    await db.insert(schema.payments).values({
      invoiceId: inv1.id,
      amount: inv1.totalAmount,
      paymentMethod: "cash",
      notes: "Seed payment",
    });
  }

  // Seed camera stream sample
  if (petMax) {
    await db.insert(schema.cameraStreams).values({
      petId: petMax.id,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      roomNumber: "Phòng 1",
      isActive: true,
    }).onConflictDoNothing();
  }

  console.log("✅ Seed completed");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


