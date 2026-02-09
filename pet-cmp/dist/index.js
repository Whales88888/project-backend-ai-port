var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appointmentStatusEnum: () => appointmentStatusEnum,
  appointments: () => appointments,
  cameraStreams: () => cameraStreams,
  customers: () => customers,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertCameraStreamSchema: () => insertCameraStreamSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertInvoiceItemSchema: () => insertInvoiceItemSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertMedicalRecordSchema: () => insertMedicalRecordSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertPetSchema: () => insertPetSchema,
  insertPrescriptionSchema: () => insertPrescriptionSchema,
  insertStockBatchSchema: () => insertStockBatchSchema,
  insertUserSchema: () => insertUserSchema,
  inventory: () => inventory,
  invoiceItems: () => invoiceItems,
  invoices: () => invoices,
  medicalRecords: () => medicalRecords,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  pets: () => pets,
  prescriptions: () => prescriptions,
  stockBatches: () => stockBatches,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var userRoleEnum = pgEnum("user_role", ["admin", "veterinarian", "receptionist", "customer"]);
var appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "urgent", "cancelled", "completed"]);
var paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled"]);
var paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "e_wallet"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  name: text("name").notNull(),
  species: text("species").notNull(),
  // dog, cat, bird, etc.
  breed: text("breed"),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  gender: text("gender"),
  microchip: text("microchip").unique(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  veterinarianId: varchar("veterinarian_id").references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  veterinarianId: varchar("veterinarian_id").notNull().references(() => users.id),
  visitDate: timestamp("visit_date").notNull().defaultNow(),
  symptoms: text("symptoms"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicalRecordId: varchar("medical_record_id").notNull().references(() => medicalRecords.id),
  medicineId: varchar("medicine_id").notNull().references(() => inventory.id),
  quantity: integer("quantity").notNull(),
  dosage: text("dosage"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inventoryId: varchar("inventory_id").notNull().references(() => inventory.id),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull()
});
var payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var cameraStreams = pgTable("camera_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id),
  streamUrl: text("stream_url").notNull(),
  roomNumber: text("room_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
var insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
var insertPetSchema = createInsertSchema(pets).omit({ id: true, createdAt: true, updatedAt: true });
var insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
var insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true, createdAt: true });
var insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
var insertInventorySchema = createInsertSchema(inventory).omit({ id: true, createdAt: true, updatedAt: true });
var insertStockBatchSchema = createInsertSchema(stockBatches).omit({ id: true, createdAt: true });
var insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
var insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
var insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
var insertCameraStreamSchema = createInsertSchema(cameraStreams).omit({ id: true, createdAt: true, updatedAt: true });

// server/storage.ts
import { eq, desc, like, and, lt, gte, sql as sql2, or, ne } from "drizzle-orm";

// server/mockStorage.ts
var mockUsers = [
  { id: "1", email: "admin@petclinic.com", name: "Admin", role: "admin", phone: "0123456789", isActive: true, createdAt: /* @__PURE__ */ new Date() },
  { id: "2", email: "vet1@petclinic.com", name: "Dr. Nguy\u1EC5n V\u0103n A", role: "veterinarian", phone: "0123456780", isActive: true, createdAt: /* @__PURE__ */ new Date() },
  { id: "3", email: "vet2@petclinic.com", name: "Dr. Tr\u1EA7n Th\u1ECB B", role: "veterinarian", phone: "0123456781", isActive: true, createdAt: /* @__PURE__ */ new Date() }
];
var mockCustomers = [
  { id: "1", userId: null, name: "Nguy\u1EC5n V\u0103n A", email: "customer1@email.com", phone: "0912345678", address: "H\xE0 N\u1ED9i", isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
  { id: "2", userId: null, name: "Tr\u1EA7n Th\u1ECB B", email: "customer2@email.com", phone: "0912345679", address: "TP.HCM", isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
var mockPets = [
  { id: "1", customerId: "1", name: "Max", species: "Ch\xF3", breed: "Golden Retriever", age: 3, weight: "25.5", gender: "\u0110\u1EF1c", microchip: "123456789", imageUrl: null, isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
  { id: "2", customerId: "1", name: "Miu", species: "M\xE8o", breed: "Persian", age: 2, weight: "4.2", gender: "C\xE1i", microchip: null, imageUrl: null, isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
  { id: "3", customerId: "2", name: "Lucky", species: "Ch\xF3", breed: "Labrador", age: 1, weight: "20.0", gender: "\u0110\u1EF1c", microchip: "987654321", imageUrl: null, isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
var mockMedicalRecords = [
  { id: "1", petId: "1", appointmentId: null, veterinarianId: "2", visitDate: /* @__PURE__ */ new Date("2025-01-05"), symptoms: "Ch\xF3 b\u1ECB ho, ch\u1EA3y n\u01B0\u1EDBc m\u0169i", diagnosis: "C\u1EA3m l\u1EA1nh", treatment: "Ngh\u1EC9 ng\u01A1i, u\u1ED1ng thu\u1ED1c kh\xE1ng sinh", notes: "Theo d\xF5i nhi\u1EC7t \u0111\u1ED9", createdAt: /* @__PURE__ */ new Date() },
  { id: "2", petId: "2", appointmentId: null, veterinarianId: "3", visitDate: /* @__PURE__ */ new Date("2025-01-03"), symptoms: "M\xE8o b\u1ECF \u0103n, n\xF4n m\u1EEDa", diagnosis: "Vi\xEAm d\u1EA1 d\xE0y", treatment: "Nh\u1ECBn \u0103n 24h, u\u1ED1ng thu\u1ED1c", notes: "T\xE1i kh\xE1m sau 3 ng\xE0y", createdAt: /* @__PURE__ */ new Date() }
];
var mockInvoices = [
  { id: "1", customerId: "1", appointmentId: null, invoiceNumber: "I0001", totalAmount: "350000", status: "paid", issuedAt: /* @__PURE__ */ new Date(), createdAt: /* @__PURE__ */ new Date() },
  { id: "2", customerId: "2", appointmentId: null, invoiceNumber: "I0002", totalAmount: "450000", status: "pending", issuedAt: /* @__PURE__ */ new Date(), createdAt: /* @__PURE__ */ new Date() }
];
var mockPayments = [
  { id: "1", invoiceId: "1", amount: "350000", paymentMethod: "cash", paymentDate: /* @__PURE__ */ new Date(), notes: "", createdAt: /* @__PURE__ */ new Date() }
];
var mockInventory = [
  { id: "1", code: "MED-001", name: "Kh\xE1ng sinh A", category: "Thu\u1ED1c", unit: "h\u1ED9p", stock: 5, minStock: 10, price: "45000", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() },
  { id: "2", code: "VAC-001", name: "V\u1EAFc-xin B", category: "V\u1EAFc-xin", unit: "li\u1EC1u", stock: 25, minStock: 10, price: "120000", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
var mockCameraStreams = [
  { id: "1", petId: "1", streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", roomNumber: "Ph\xF2ng 1", isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
var MockStorage = class {
  // Users
  async getUsers(role) {
    if (role) {
      return mockUsers.filter((user) => user.role === role);
    }
    return mockUsers;
  }
  async getUserById(id) {
    return mockUsers.find((user) => user.id === id);
  }
  async getUserByEmail(email) {
    return mockUsers.find((user) => user.email === email);
  }
  async createUser(user) {
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      ...user,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  }
  // Customers
  async getCustomers(limit = 100, offset = 0, search) {
    let filtered = mockCustomers;
    if (search) {
      filtered = mockCustomers.filter(
        (customer) => customer.name.toLowerCase().includes(search.toLowerCase()) || customer.email.toLowerCase().includes(search.toLowerCase()) || customer.phone.includes(search)
      );
    }
    return filtered.slice(offset, offset + limit);
  }
  async getCustomerById(id) {
    return mockCustomers.find((customer) => customer.id === id);
  }
  async createCustomer(customer) {
    const newCustomer = {
      id: (mockCustomers.length + 1).toString(),
      userId: null,
      ...customer,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  }
  async updateCustomer(id, customer) {
    const index = mockCustomers.findIndex((c) => c.id === id);
    if (index === -1) return void 0;
    mockCustomers[index] = { ...mockCustomers[index], ...customer, updatedAt: /* @__PURE__ */ new Date() };
    return mockCustomers[index];
  }
  // Pets
  async getPets(customerId) {
    if (customerId) {
      return mockPets.filter((pet) => pet.customerId === customerId);
    }
    return mockPets;
  }
  async getPetById(id) {
    return mockPets.find((pet) => pet.id === id);
  }
  async createPet(pet) {
    const newPet = {
      id: (mockPets.length + 1).toString(),
      ...pet,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    mockPets.push(newPet);
    return newPet;
  }
  async updatePet(id, pet) {
    const index = mockPets.findIndex((p) => p.id === id);
    if (index === -1) return void 0;
    mockPets[index] = { ...mockPets[index], ...pet, updatedAt: /* @__PURE__ */ new Date() };
    return mockPets[index];
  }
  // Appointments
  async getAppointments(date, status) {
    return [];
  }
  async getAppointmentById(id) {
    return void 0;
  }
  async createAppointment(appointment) {
    const newAppointment = {
      id: "1",
      ...appointment,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    return newAppointment;
  }
  async updateAppointment(id, appointment) {
    return void 0;
  }
  // Medical Records
  async getMedicalRecords(petId) {
    if (petId) {
      return mockMedicalRecords.filter((record) => record.petId === petId);
    }
    return mockMedicalRecords;
  }
  async getMedicalRecordById(id) {
    return mockMedicalRecords.find((record) => record.id === id);
  }
  async createMedicalRecord(record) {
    const newRecord = {
      id: (mockMedicalRecords.length + 1).toString(),
      ...record,
      createdAt: /* @__PURE__ */ new Date()
    };
    mockMedicalRecords.push(newRecord);
    return newRecord;
  }
  // Prescriptions
  async getPrescriptions(medicalRecordId) {
    return [];
  }
  async createPrescription(prescription) {
    const newPrescription = {
      id: "1",
      ...prescription,
      createdAt: /* @__PURE__ */ new Date()
    };
    return newPrescription;
  }
  // Inventory
  async getInventory(search) {
    if (search) {
      return mockInventory.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    return mockInventory;
  }
  async getInventoryById(id) {
    return mockInventory.find((i) => i.id === id);
  }
  async createInventoryItem(item) {
    const newItem = {
      id: (mockInventory.length + 1).toString(),
      ...item,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    mockInventory.push(newItem);
    return newItem;
  }
  async updateInventoryItem(id, item) {
    const idx = mockInventory.findIndex((i) => i.id === id);
    if (idx === -1) return void 0;
    mockInventory[idx] = { ...mockInventory[idx], ...item, updatedAt: /* @__PURE__ */ new Date() };
    return mockInventory[idx];
  }
  async updateInventoryStock(id, quantity) {
    const idx = mockInventory.findIndex((i) => i.id === id);
    if (idx === -1) return;
    mockInventory[idx].stock = Math.max(0, (mockInventory[idx].stock || 0) + quantity);
    mockInventory[idx].updatedAt = /* @__PURE__ */ new Date();
  }
  async getLowStockItems() {
    return mockInventory.filter((i) => (i.stock || 0) <= (i.minStock || 0));
  }
  // Stock Batches
  async getStockBatches(inventoryId) {
    return [];
  }
  async createStockBatch(batch) {
    const newBatch = {
      id: "1",
      ...batch,
      createdAt: /* @__PURE__ */ new Date()
    };
    return newBatch;
  }
  async getExpiringBatches(daysUntilExpiry) {
    return [];
  }
  // Invoices
  async getInvoices(customerId) {
    if (customerId) return mockInvoices.filter((i) => i.customerId === customerId);
    return mockInvoices;
  }
  async getInvoiceById(id) {
    return mockInvoices.find((i) => i.id === id);
  }
  async createInvoice(invoice) {
    const newInvoice = {
      id: (mockInvoices.length + 1).toString(),
      ...invoice,
      createdAt: /* @__PURE__ */ new Date()
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  }
  async updateInvoiceStatus(id, status) {
    const inv = mockInvoices.find((i) => i.id === id);
    if (inv) inv.status = status;
  }
  // Invoice Items
  async getInvoiceItems(invoiceId) {
    return [];
  }
  async createInvoiceItem(item) {
    const newItem = {
      id: "1",
      ...item
    };
    return newItem;
  }
  // Payments
  async getPayments(invoiceId) {
    return mockPayments.filter((p) => p.invoiceId === invoiceId);
  }
  async createPayment(payment) {
    const newPayment = {
      id: (mockPayments.length + 1).toString(),
      ...payment,
      paymentDate: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    };
    mockPayments.push(newPayment);
    const inv = mockInvoices.find((i) => i.id === payment.invoiceId);
    if (inv && parseFloat(newPayment.amount) >= parseFloat(inv.totalAmount)) {
      inv.status = "paid";
    }
    return newPayment;
  }
  // Camera Streams
  async getCameraStreams(petId) {
    if (petId) return mockCameraStreams.filter((s) => s.petId === petId);
    return mockCameraStreams;
  }
  async createCameraStream(stream) {
    const newStream = {
      id: (mockCameraStreams.length + 1).toString(),
      ...stream,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    mockCameraStreams.push(newStream);
    return newStream;
  }
  async updateCameraStream(id, stream) {
    const idx = mockCameraStreams.findIndex((s) => s.id === id);
    if (idx === -1) return void 0;
    mockCameraStreams[idx] = { ...mockCameraStreams[idx], ...stream, updatedAt: /* @__PURE__ */ new Date() };
    return mockCameraStreams[idx];
  }
};

// server/storage.ts
neonConfig.webSocketConstructor = ws;
var DatabaseStorage = class {
  db;
  constructor() {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      this.db = drizzle(pool, { schema: schema_exports });
    } catch (error) {
      console.warn("Database connection failed, using mock storage:", error);
      throw new Error("Database not available");
    }
  }
  // Users
  async getUsers(role) {
    if (role) {
      return await this.db.select().from(users).where(eq(users.role, role));
    }
    return await this.db.select().from(users);
  }
  async getUserById(id) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }
  async createUser(insertUser) {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }
  // Customers
  async getCustomers(limit = 100, offset = 0, search, active) {
    let whereExpr = void 0;
    if (search) {
      const pattern = `%${search}%`;
      whereExpr = or(
        like(customers.name, pattern),
        like(customers.email, pattern),
        like(customers.phone, pattern)
      );
    }
    if (typeof active === "boolean") {
      whereExpr = whereExpr ? and(whereExpr, eq(customers.isActive, active)) : eq(customers.isActive, active);
    }
    const query = this.db.select().from(customers);
    const finalQuery = whereExpr ? query.where(whereExpr) : query;
    return await finalQuery.limit(limit).offset(offset);
  }
  async getCustomerById(id) {
    const [customer] = await this.db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return customer;
  }
  async createCustomer(customer) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (!emailRegex.test(customer.email)) {
      throw new Error("Email kh\xF4ng h\u1EE3p l\u1EC7");
    }
    if (!phoneRegex.test(customer.phone)) {
      throw new Error("S\u1ED1 \u0111i\u1EC7n tho\u1EA1i ph\u1EA3i g\u1ED3m 10 ch\u1EEF s\u1ED1");
    }
    const [dupByEmail] = await this.db.select().from(customers).where(eq(customers.email, customer.email)).limit(1);
    if (dupByEmail) {
      throw new Error("Email \u0111\xE3 t\u1ED3n t\u1EA1i");
    }
    const [dupByPhone] = await this.db.select().from(customers).where(eq(customers.phone, customer.phone)).limit(1);
    if (dupByPhone) {
      throw new Error("S\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u0111\xE3 t\u1ED3n t\u1EA1i");
    }
    const [newCustomer] = await this.db.insert(customers).values(customer).returning();
    return newCustomer;
  }
  async updateCustomer(id, customer) {
    if (customer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) {
        throw new Error("Email kh\xF4ng h\u1EE3p l\u1EC7");
      }
      const [dupEmail] = await this.db.select().from(customers).where(and(eq(customers.email, customer.email), ne(customers.id, id))).limit(1);
      if (dupEmail) {
        throw new Error("Email \u0111\xE3 t\u1ED3n t\u1EA1i");
      }
    }
    if (customer.phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(customer.phone)) {
        throw new Error("S\u1ED1 \u0111i\u1EC7n tho\u1EA1i ph\u1EA3i g\u1ED3m 10 ch\u1EEF s\u1ED1");
      }
      const [dupPhone] = await this.db.select().from(customers).where(and(eq(customers.phone, customer.phone), ne(customers.id, id))).limit(1);
      if (dupPhone) {
        throw new Error("S\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u0111\xE3 t\u1ED3n t\u1EA1i");
      }
    }
    const [updated] = await this.db.update(customers).set({ ...customer, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id)).returning();
    return updated;
  }
  // Pets
  async getPets(customerId) {
    if (customerId) {
      return await this.db.select().from(pets).where(eq(pets.customerId, customerId));
    }
    return await this.db.select().from(pets);
  }
  async getPetById(id) {
    const [pet] = await this.db.select().from(pets).where(eq(pets.id, id)).limit(1);
    return pet;
  }
  async createPet(pet) {
    if (pet.microchip) {
      const [dupChip] = await this.db.select().from(pets).where(eq(pets.microchip, pet.microchip)).limit(1);
      if (dupChip) {
        throw new Error("Microchip \u0111\xE3 t\u1ED3n t\u1EA1i, vui l\xF2ng ki\u1EC3m tra l\u1EA1i");
      }
    }
    const [newPet] = await this.db.insert(pets).values(pet).returning();
    return newPet;
  }
  async updatePet(id, pet) {
    const [updated] = await this.db.update(pets).set({ ...pet, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pets.id, id)).returning();
    return updated;
  }
  // Appointments
  async getAppointments(date, status) {
    let query = this.db.select().from(appointments);
    const conditions = [];
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lt(appointments.appointmentDate, endOfDay)
        )
      );
    }
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(appointments.appointmentDate);
    }
    return await query.orderBy(appointments.appointmentDate);
  }
  async getAppointmentById(id) {
    const [appointment] = await this.db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return appointment;
  }
  async createAppointment(appointment) {
    if (appointment.veterinarianId) {
      const [conflictVet] = await this.db.select().from(appointments).where(and(
        eq(appointments.veterinarianId, appointment.veterinarianId),
        eq(appointments.appointmentDate, appointment.appointmentDate)
      )).limit(1);
      if (conflictVet) {
        throw new Error("Khung gi\u1EDD \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1EB7t cho b\xE1c s\u0129, vui l\xF2ng ch\u1ECDn gi\u1EDD kh\xE1c");
      }
    }
    const [conflictPet] = await this.db.select().from(appointments).where(and(
      eq(appointments.petId, appointment.petId),
      eq(appointments.appointmentDate, appointment.appointmentDate)
    )).limit(1);
    if (conflictPet) {
      throw new Error("Th\xFA c\u01B0ng \u0111\xE3 c\xF3 l\u1ECBch t\u1EA1i khung gi\u1EDD n\xE0y");
    }
    const [newAppointment] = await this.db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }
  async updateAppointment(id, appointment) {
    const [existing] = await this.db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (!existing) return void 0;
    if (appointment.appointmentDate && existing.appointmentDate) {
      const now = /* @__PURE__ */ new Date();
      const original = new Date(existing.appointmentDate);
      const diffMs = original.getTime() - now.getTime();
      const diffMinutes = diffMs / (60 * 1e3);
      const isTimeChanged = new Date(appointment.appointmentDate).getTime() !== original.getTime();
      if (isTimeChanged && diffMinutes < 60) {
        throw new Error("Kh\xF4ng th\u1EC3 thay \u0111\u1ED5i l\u1ECBch h\u1EB9n khi c\xF2n d\u01B0\u1EDBi 1 gi\u1EDD tr\u01B0\u1EDBc gi\u1EDD h\u1EB9n");
      }
    }
    if (appointment.appointmentDate && existing.veterinarianId) {
      const [conflictVet] = await this.db.select().from(appointments).where(and(
        eq(appointments.veterinarianId, existing.veterinarianId),
        eq(appointments.appointmentDate, appointment.appointmentDate),
        ne(appointments.id, id)
      )).limit(1);
      if (conflictVet) {
        throw new Error("Khung gi\u1EDD \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1EB7t cho b\xE1c s\u0129, vui l\xF2ng ch\u1ECDn gi\u1EDD kh\xE1c");
      }
    }
    if (appointment.appointmentDate) {
      const [conflictPet] = await this.db.select().from(appointments).where(and(
        eq(appointments.petId, existing.petId),
        eq(appointments.appointmentDate, appointment.appointmentDate),
        ne(appointments.id, id)
      )).limit(1);
      if (conflictPet) {
        throw new Error("Th\xFA c\u01B0ng \u0111\xE3 c\xF3 l\u1ECBch t\u1EA1i khung gi\u1EDD n\xE0y");
      }
    }
    const [updated] = await this.db.update(appointments).set({ ...appointment, updatedAt: /* @__PURE__ */ new Date() }).where(eq(appointments.id, id)).returning();
    return updated;
  }
  // Medical Records
  async getMedicalRecords(petId) {
    if (petId) {
      return await this.db.select().from(medicalRecords).where(eq(medicalRecords.petId, petId)).orderBy(desc(medicalRecords.visitDate));
    }
    return await this.db.select().from(medicalRecords).orderBy(desc(medicalRecords.visitDate));
  }
  async getMedicalRecordById(id) {
    const [record] = await this.db.select().from(medicalRecords).where(eq(medicalRecords.id, id)).limit(1);
    return record;
  }
  async createMedicalRecord(record) {
    const [newRecord] = await this.db.insert(medicalRecords).values(record).returning();
    return newRecord;
  }
  // Prescriptions
  async getPrescriptions(medicalRecordId) {
    return await this.db.select().from(prescriptions).where(eq(prescriptions.medicalRecordId, medicalRecordId));
  }
  async createPrescription(prescription) {
    const [newPrescription] = await this.db.insert(prescriptions).values(prescription).returning();
    return newPrescription;
  }
  // Inventory
  async getInventory(search) {
    if (search) {
      return await this.db.select().from(inventory).where(like(inventory.name, `%${search}%`));
    }
    return await this.db.select().from(inventory);
  }
  async getInventoryById(id) {
    const [item] = await this.db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
    return item;
  }
  async createInventoryItem(item) {
    const [newItem] = await this.db.insert(inventory).values(item).returning();
    return newItem;
  }
  async updateInventoryItem(id, item) {
    const [updated] = await this.db.update(inventory).set({ ...item, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inventory.id, id)).returning();
    return updated;
  }
  async updateInventoryStock(id, quantity) {
    await this.db.update(inventory).set({ stock: sql2`${inventory.stock} + ${quantity}`, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inventory.id, id));
  }
  async getLowStockItems() {
    return await this.db.select().from(inventory).where(sql2`${inventory.stock} <= ${inventory.minStock}`);
  }
  // Stock Batches
  async getStockBatches(inventoryId) {
    return await this.db.select().from(stockBatches).where(eq(stockBatches.inventoryId, inventoryId));
  }
  async createStockBatch(batch) {
    const [newBatch] = await this.db.insert(stockBatches).values(batch).returning();
    return newBatch;
  }
  async getExpiringBatches(daysUntilExpiry) {
    const futureDate = /* @__PURE__ */ new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);
    return await this.db.select().from(stockBatches).where(lt(stockBatches.expiryDate, futureDate));
  }
  // Invoices
  async getInvoices(customerId) {
    if (customerId) {
      return await this.db.select().from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.issuedAt));
    }
    return await this.db.select().from(invoices).orderBy(desc(invoices.issuedAt));
  }
  async getInvoiceById(id) {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return invoice;
  }
  async createInvoice(invoice) {
    const [newInvoice] = await this.db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }
  async updateInvoiceStatus(id, status) {
    await this.db.update(invoices).set({ status }).where(eq(invoices.id, id));
  }
  // Invoice Items
  async getInvoiceItems(invoiceId) {
    return await this.db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }
  async createInvoiceItem(item) {
    const [newItem] = await this.db.insert(invoiceItems).values(item).returning();
    return newItem;
  }
  // Payments
  async getPayments(invoiceId) {
    return await this.db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }
  async createPayment(payment) {
    const [newPayment] = await this.db.insert(payments).values(payment).returning();
    return newPayment;
  }
  // Camera Streams
  async getCameraStreams(petId) {
    if (petId) {
      return await this.db.select().from(cameraStreams).where(eq(cameraStreams.petId, petId));
    }
    return await this.db.select().from(cameraStreams).where(eq(cameraStreams.isActive, true));
  }
  async createCameraStream(stream) {
    const [newStream] = await this.db.insert(cameraStreams).values(stream).returning();
    return newStream;
  }
  async updateCameraStream(id, stream) {
    const [updated] = await this.db.update(cameraStreams).set({ ...stream, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cameraStreams.id, id)).returning();
    return updated;
  }
};
var storage;
try {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== "postgresql://username:password@localhost:5432/petclinic") {
    storage = new DatabaseStorage();
    console.log("Using database storage");
  } else {
    throw new Error("No valid database URL");
  }
} catch (error) {
  console.log("Using mock storage for development");
  storage = new MockStorage();
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/customers", async (req, res) => {
    try {
      const { limit, offset, search, active } = req.query;
      console.log("Fetching customers with params:", { limit, offset, search });
      const customers2 = await storage.getCustomers(
        limit ? parseInt(limit) : void 0,
        offset ? parseInt(offset) : void 0,
        search,
        typeof active === "string" ? active === "true" : void 0
      );
      console.log("Customers found:", customers2.length);
      res.json(customers2);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });
  app2.post("/api/customers", async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: error?.message || "Invalid customer data" });
    }
  });
  app2.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Failed to update customer" });
    }
  });
  app2.post("/api/customers/:id/approve", async (req, res) => {
    try {
      const approved = await storage.updateCustomer(req.params.id, { isActive: true });
      if (!approved) return res.status(404).json({ error: "Customer not found" });
      res.json(approved);
    } catch (error) {
      res.status(400).json({ error: error?.message || "Failed to approve customer" });
    }
  });
  app2.post("/api/customers/:id/deactivate", async (req, res) => {
    try {
      const updated = await storage.updateCustomer(req.params.id, { isActive: false });
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error?.message || "Failed to deactivate customer" });
    }
  });
  app2.get("/api/pets", async (req, res) => {
    try {
      const { customerId } = req.query;
      const pets2 = await storage.getPets(customerId);
      res.json(pets2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pets" });
    }
  });
  app2.get("/api/pets/:id", async (req, res) => {
    try {
      const pet = await storage.getPetById(req.params.id);
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
      res.json(pet);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pet" });
    }
  });
  app2.post("/api/pets", async (req, res) => {
    try {
      const validated = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(validated);
      res.status(201).json(pet);
    } catch (error) {
      res.status(400).json({ error: error?.message || "Invalid pet data" });
    }
  });
  app2.patch("/api/pets/:id", async (req, res) => {
    try {
      const pet = await storage.updatePet(req.params.id, req.body);
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
      res.json(pet);
    } catch (error) {
      res.status(400).json({ error: "Failed to update pet" });
    }
  });
  app2.get("/api/appointments", async (req, res) => {
    try {
      const { date, status } = req.query;
      const appointments2 = await storage.getAppointments(
        date ? new Date(date) : void 0,
        status
      );
      res.json(appointments2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointmentById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });
  app2.post("/api/appointments", async (req, res) => {
    try {
      const validated = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validated);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });
  app2.patch("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update appointment" });
    }
  });
  app2.get("/api/medical-records", async (req, res) => {
    try {
      const { petId } = req.query;
      const records = await storage.getMedicalRecords(petId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical records" });
    }
  });
  app2.get("/api/medical-records/:id", async (req, res) => {
    try {
      const record = await storage.getMedicalRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical record" });
    }
  });
  app2.post("/api/medical-records", async (req, res) => {
    try {
      const validated = insertMedicalRecordSchema.parse(req.body);
      const record = await storage.createMedicalRecord(validated);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: "Invalid medical record data" });
    }
  });
  app2.get("/api/inventory", async (req, res) => {
    try {
      const { search } = req.query;
      const inventory2 = await storage.getInventory(search);
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });
  app2.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });
  app2.get("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });
  app2.post("/api/inventory", async (req, res) => {
    try {
      const validated = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });
  app2.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to update inventory item" });
    }
  });
  app2.post("/api/inventory/:id/adjust-stock", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== "number") {
        return res.status(400).json({ error: "Quantity must be a number" });
      }
      await storage.updateInventoryStock(req.params.id, quantity);
      const updated = await storage.getInventoryById(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to adjust stock" });
    }
  });
  app2.get("/api/stock-batches", async (req, res) => {
    try {
      const { inventoryId } = req.query;
      if (!inventoryId) {
        return res.status(400).json({ error: "inventoryId is required" });
      }
      const batches = await storage.getStockBatches(inventoryId);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock batches" });
    }
  });
  app2.get("/api/stock-batches/expiring", async (req, res) => {
    try {
      const { days = 60 } = req.query;
      const batches = await storage.getExpiringBatches(parseInt(days));
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiring batches" });
    }
  });
  app2.post("/api/stock-batches", async (req, res) => {
    try {
      const validated = insertStockBatchSchema.parse(req.body);
      const batch = await storage.createStockBatch(validated);
      res.status(201).json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock batch data" });
    }
  });
  app2.get("/api/invoices", async (req, res) => {
    try {
      const { customerId } = req.query;
      const invoices2 = await storage.getInvoices(customerId);
      res.json(invoices2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });
  app2.post("/api/invoices", async (req, res) => {
    try {
      const validated = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validated);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });
  app2.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateInvoiceStatus(req.params.id, status);
      const updated = await storage.getInvoiceById(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update invoice status" });
    }
  });
  app2.get("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(req.params.invoiceId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice items" });
    }
  });
  app2.post("/api/invoice-items", async (req, res) => {
    try {
      const validated = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice item data" });
    }
  });
  app2.get("/api/invoices/:invoiceId/payments", async (req, res) => {
    try {
      const payments2 = await storage.getPayments(req.params.invoiceId);
      res.json(payments2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payments", async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validated);
      const invoice = await storage.getInvoiceById(validated.invoiceId);
      if (invoice && parseFloat(payment.amount) >= parseFloat(invoice.totalAmount)) {
        await storage.updateInvoiceStatus(invoice.id, "paid");
      }
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });
  app2.get("/api/camera-streams", async (req, res) => {
    try {
      const { petId } = req.query;
      const streams = await storage.getCameraStreams(petId);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch camera streams" });
    }
  });
  app2.post("/api/camera-streams", async (req, res) => {
    try {
      const validated = insertCameraStreamSchema.parse(req.body);
      const stream = await storage.createCameraStream(validated);
      res.status(201).json(stream);
    } catch (error) {
      res.status(400).json({ error: "Invalid camera stream data" });
    }
  });
  app2.patch("/api/camera-streams/:id", async (req, res) => {
    try {
      const stream = await storage.updateCameraStream(req.params.id, req.body);
      if (!stream) {
        return res.status(404).json({ error: "Camera stream not found" });
      }
      res.json(stream);
    } catch (error) {
      res.status(400).json({ error: "Failed to update camera stream" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      const users2 = await storage.getUsers(role);
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/export/customers", async (req, res) => {
    try {
      const customers2 = await storage.getCustomers(1e4, 0);
      const headers = ["CustomerID", "Name", "Email", "Phone", "Address", "Active", "CreatedAt"];
      const csvRows = [headers.join(",")].concat(
        customers2.map((c) => [
          c.id,
          JSON.stringify(c.name),
          c.email,
          c.phone,
          JSON.stringify(c.address || ""),
          c.isActive ? "true" : "false",
          c.createdAt
        ].join(","))
      );
      const csv = csvRows.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export customers" });
    }
  });
  app2.get("/api/export/pets", async (req, res) => {
    try {
      const pets2 = await storage.getPets();
      const headers = ["PetID", "CustomerID", "Name", "Species", "Breed", "Age", "Gender", "Microchip", "Active", "CreatedAt"];
      const csvRows = [headers.join(",")].concat(
        pets2.map((p) => [
          p.id,
          p.customerId,
          JSON.stringify(p.name),
          JSON.stringify(p.species),
          JSON.stringify(p.breed || ""),
          p.age ?? "",
          JSON.stringify(p.gender || ""),
          JSON.stringify(p.microchip || ""),
          p.isActive ? "true" : "false",
          p.createdAt
        ].join(","))
      );
      const csv = csvRows.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="pets.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export pets" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const customers2 = await storage.getCustomers();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const appointments2 = await storage.getAppointments(today);
      const lowStock = await storage.getLowStockItems();
      const invoices2 = await storage.getInvoices();
      const now = /* @__PURE__ */ new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = invoices2.filter((inv) => inv.status === "paid").filter((inv) => {
        const d = new Date(inv.issuedAt ?? inv.createdAt ?? now);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      res.json({
        totalCustomers: customers2.length,
        todayAppointments: appointments2.length,
        lowStockCount: lowStock.length,
        monthlyRevenue
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server }
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
