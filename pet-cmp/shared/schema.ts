import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "veterinarian", "receptionist", "customer"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "urgent", "cancelled", "completed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "e_wallet"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pets table
export const pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  name: text("name").notNull(),
  species: text("species").notNull(), // dog, cat, bird, etc.
  breed: text("breed"),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  gender: text("gender"),
  microchip: text("microchip").unique(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  veterinarianId: varchar("veterinarian_id").references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Medical Records table
export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  veterinarianId: varchar("veterinarian_id").notNull().references(() => users.id),
  visitDate: timestamp("visit_date").notNull().defaultNow(),
  symptoms: text("symptoms"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicalRecordId: varchar("medical_record_id").notNull().references(() => medicalRecords.id),
  medicineId: varchar("medicine_id").notNull().references(() => inventory.id),
  quantity: integer("quantity").notNull(),
  dosage: text("dosage"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Stock Batches table
export const stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inventoryId: varchar("inventory_id").notNull().references(() => inventory.id),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Camera Streams table
export const cameraStreams = pgTable("camera_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  streamUrl: text("stream_url").notNull(),
  roomNumber: text("room_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPetSchema = createInsertSchema(pets).omit({ id: true, createdAt: true, updatedAt: true });
// Base schema - create a simpler version that accepts the data we need
export const insertAppointmentSchema = z.object({
  petId: z.string().min(1),
  customerId: z.string().min(1),
  veterinarianId: z.string().nullable().optional(),
  appointmentDate: z.preprocess((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    if (val instanceof Date) {
      return val;
    }
    return val;
  }, z.date()),
  appointmentType: z.string().min(1),
  status: z.enum(["pending", "confirmed", "urgent", "cancelled", "completed"]).default("pending"),
  notes: z.string().nullable().optional(),
});
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true, createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStockBatchSchema = createInsertSchema(stockBatches).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertCameraStreamSchema = createInsertSchema(cameraStreams).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type StockBatch = typeof stockBatches.$inferSelect;
export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type CameraStream = typeof cameraStreams.$inferSelect;
export type InsertCameraStream = z.infer<typeof insertCameraStreamSchema>;
