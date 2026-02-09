import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { eq, desc, like, and, lt, gte, sql, or, ne } from "drizzle-orm";
import type {
  User, InsertUser,
  Customer, InsertCustomer,
  Pet, InsertPet,
  Appointment, InsertAppointment,
  MedicalRecord, InsertMedicalRecord,
  Prescription, InsertPrescription,
  Inventory, InsertInventory,
  StockBatch, InsertStockBatch,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  Payment, InsertPayment,
  CameraStream, InsertCameraStream,
} from "@shared/schema";
import { MockStorage } from "./mockStorage";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Users
  getUsers(role?: string): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customers
  getCustomers(limit?: number, offset?: number, search?: string, active?: boolean): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Pets
  getPets(customerId?: string): Promise<Pet[]>;
  getPetById(id: string): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  
  // Appointments
  getAppointments(date?: Date, status?: string): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  
  // Medical Records
  getMedicalRecords(petId?: string): Promise<MedicalRecord[]>;
  getMedicalRecordById(id: string): Promise<MedicalRecord | undefined>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  
  // Prescriptions
  getPrescriptions(medicalRecordId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  
  // Inventory
  getInventory(search?: string): Promise<Inventory[]>;
  getInventoryById(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateInventoryStock(id: string, quantity: number): Promise<void>;
  getLowStockItems(): Promise<Inventory[]>;
  
  // Stock Batches
  getStockBatches(inventoryId: string): Promise<StockBatch[]>;
  createStockBatch(batch: InsertStockBatch): Promise<StockBatch>;
  getExpiringBatches(daysUntilExpiry: number): Promise<StockBatch[]>;
  
  // Invoices
  getInvoices(customerId?: string): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<void>;
  
  // Invoice Items
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  
  // Payments
  getPayments(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Camera Streams
  getCameraStreams(petId?: string): Promise<CameraStream[]>;
  createCameraStream(stream: InsertCameraStream): Promise<CameraStream>;
  updateCameraStream(id: string, stream: Partial<InsertCameraStream>): Promise<CameraStream | undefined>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
      this.db = drizzle(pool, { schema });
    } catch (error) {
      console.warn("Database connection failed, using mock storage:", error);
      throw new Error("Database not available");
    }
  }

  // Users
  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return await this.db.select().from(schema.users).where(eq(schema.users.role, role as any));
    }
    return await this.db.select().from(schema.users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Customers
  async getCustomers(limit = 100, offset = 0, search?: string, active?: boolean): Promise<Customer[]> {
    let whereExpr: any = undefined;
    if (search) {
      const pattern = `%${search}%`;
      whereExpr = or(
        like(schema.customers.name, pattern),
        like(schema.customers.email, pattern),
        like(schema.customers.phone, pattern)
      );
    }
    if (typeof active === 'boolean') {
      whereExpr = whereExpr ? and(whereExpr, eq(schema.customers.isActive, active)) : eq(schema.customers.isActive, active);
    }
    const query = this.db.select().from(schema.customers);
    const finalQuery = whereExpr ? query.where(whereExpr) : query;
    return await finalQuery.limit(limit).offset(offset);
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await this.db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (!emailRegex.test(customer.email)) {
      throw new Error("Email không hợp lệ");
    }
    if (!phoneRegex.test(customer.phone)) {
      throw new Error("Số điện thoại phải gồm 10 chữ số");
    }

    const [dupByEmail] = await this.db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.email, customer.email))
      .limit(1);
    if (dupByEmail) {
      throw new Error("Email đã tồn tại");
    }

    const [dupByPhone] = await this.db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.phone, customer.phone))
      .limit(1);
    if (dupByPhone) {
      throw new Error("Số điện thoại đã tồn tại");
    }

    const [newCustomer] = await this.db.insert(schema.customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    if (customer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) {
        throw new Error("Email không hợp lệ");
      }
      const [dupEmail] = await this.db
        .select()
        .from(schema.customers)
        .where(and(eq(schema.customers.email, customer.email), ne(schema.customers.id, id)))
        .limit(1);
      if (dupEmail) {
        throw new Error("Email đã tồn tại");
      }
    }
    if (customer.phone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(customer.phone)) {
        throw new Error("Số điện thoại phải gồm 10 chữ số");
      }
      const [dupPhone] = await this.db
        .select()
        .from(schema.customers)
        .where(and(eq(schema.customers.phone, customer.phone), ne(schema.customers.id, id)))
        .limit(1);
      if (dupPhone) {
        throw new Error("Số điện thoại đã tồn tại");
      }
    }

    const [updated] = await this.db
      .update(schema.customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(schema.customers.id, id))
      .returning();
    return updated;
  }

  // Pets
  async getPets(customerId?: string): Promise<Pet[]> {
    if (customerId) {
      return await this.db.select().from(schema.pets).where(eq(schema.pets.customerId, customerId));
    }
    return await this.db.select().from(schema.pets);
  }

  async getPetById(id: string): Promise<Pet | undefined> {
    const [pet] = await this.db.select().from(schema.pets).where(eq(schema.pets.id, id)).limit(1);
    return pet;
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    if ((pet as any).microchip) {
      const [dupChip] = await this.db
        .select()
        .from(schema.pets)
        .where(eq(schema.pets.microchip, (pet as any).microchip as string))
        .limit(1);
      if (dupChip) {
        throw new Error("Microchip đã tồn tại, vui lòng kiểm tra lại");
      }
    }
    const [newPet] = await this.db.insert(schema.pets).values(pet).returning();
    return newPet;
  }

  async updatePet(id: string, pet: Partial<InsertPet>): Promise<Pet | undefined> {
    const [updated] = await this.db.update(schema.pets)
      .set({ ...pet, updatedAt: new Date() })
      .where(eq(schema.pets.id, id))
      .returning();
    return updated;
  }

  // Appointments
  async getAppointments(date?: Date, status?: string): Promise<Appointment[]> {
    let query = this.db.select().from(schema.appointments);
    
    const conditions = [];
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(
        and(
          gte(schema.appointments.appointmentDate, startOfDay),
          lt(schema.appointments.appointmentDate, endOfDay)
        )
      );
    }
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(schema.appointments.appointmentDate);
    }
    
    return await query.orderBy(schema.appointments.appointmentDate);
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const [appointment] = await this.db.select().from(schema.appointments).where(eq(schema.appointments.id, id)).limit(1);
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    // Prevent double-booking for same vet or same pet at the same datetime
    if (appointment.veterinarianId) {
      const [conflictVet] = await this.db.select().from(schema.appointments)
        .where(and(
          eq(schema.appointments.veterinarianId, appointment.veterinarianId),
          eq(schema.appointments.appointmentDate, appointment.appointmentDate)
        ))
        .limit(1);
      if (conflictVet) {
        throw new Error("Khung giờ đã được đặt cho bác sĩ, vui lòng chọn giờ khác");
      }
    }
    const [conflictPet] = await this.db.select().from(schema.appointments)
      .where(and(
        eq(schema.appointments.petId, appointment.petId),
        eq(schema.appointments.appointmentDate, appointment.appointmentDate)
      ))
      .limit(1);
    if (conflictPet) {
      throw new Error("Thú cưng đã có lịch tại khung giờ này");
    }

    const [newAppointment] = await this.db.insert(schema.appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    // Enforce no change within 1 hour of current appointment time
    const [existing] = await this.db.select().from(schema.appointments)
      .where(eq(schema.appointments.id, id)).limit(1);
    if (!existing) return undefined;

    if (appointment.appointmentDate && existing.appointmentDate) {
      const now = new Date();
      const original = new Date(existing.appointmentDate as any);
      const diffMs = original.getTime() - now.getTime();
      const diffMinutes = diffMs / (60 * 1000);
      const isTimeChanged = new Date(appointment.appointmentDate).getTime() !== original.getTime();
      if (isTimeChanged && diffMinutes < 60) {
        throw new Error("Không thể thay đổi lịch hẹn khi còn dưới 1 giờ trước giờ hẹn");
      }
    }

    // Prevent moving to an already booked slot for the same vet/pet
    if (appointment.appointmentDate && existing.veterinarianId) {
      const [conflictVet] = await this.db.select().from(schema.appointments)
        .where(and(
          eq(schema.appointments.veterinarianId, existing.veterinarianId),
          eq(schema.appointments.appointmentDate, appointment.appointmentDate),
          ne(schema.appointments.id, id)
        )).limit(1);
      if (conflictVet) {
        throw new Error("Khung giờ đã được đặt cho bác sĩ, vui lòng chọn giờ khác");
      }
    }
    if (appointment.appointmentDate) {
      const [conflictPet] = await this.db.select().from(schema.appointments)
        .where(and(
          eq(schema.appointments.petId, existing.petId),
          eq(schema.appointments.appointmentDate, appointment.appointmentDate),
          ne(schema.appointments.id, id)
        )).limit(1);
      if (conflictPet) {
        throw new Error("Thú cưng đã có lịch tại khung giờ này");
      }
    }

    const [updated] = await this.db.update(schema.appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(schema.appointments.id, id))
      .returning();
    return updated;
  }

  // Medical Records
  async getMedicalRecords(petId?: string): Promise<MedicalRecord[]> {
    if (petId) {
      return await this.db.select().from(schema.medicalRecords)
        .where(eq(schema.medicalRecords.petId, petId))
        .orderBy(desc(schema.medicalRecords.visitDate));
    }
    return await this.db.select().from(schema.medicalRecords).orderBy(desc(schema.medicalRecords.visitDate));
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    const [record] = await this.db.select().from(schema.medicalRecords).where(eq(schema.medicalRecords.id, id)).limit(1);
    return record;
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [newRecord] = await this.db.insert(schema.medicalRecords).values(record).returning();
    return newRecord;
  }

  // Prescriptions
  async getPrescriptions(medicalRecordId: string): Promise<Prescription[]> {
    return await this.db.select().from(schema.prescriptions).where(eq(schema.prescriptions.medicalRecordId, medicalRecordId));
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await this.db.insert(schema.prescriptions).values(prescription).returning();
    return newPrescription;
  }

  // Inventory
  async getInventory(search?: string): Promise<Inventory[]> {
    if (search) {
      return await this.db.select().from(schema.inventory)
        .where(like(schema.inventory.name, `%${search}%`));
    }
    return await this.db.select().from(schema.inventory);
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    const [item] = await this.db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).limit(1);
    return item;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await this.db.insert(schema.inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updated] = await this.db.update(schema.inventory)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(schema.inventory.id, id))
      .returning();
    return updated;
  }

  async updateInventoryStock(id: string, quantity: number): Promise<void> {
    await this.db.update(schema.inventory)
      .set({ stock: sql`${schema.inventory.stock} + ${quantity}`, updatedAt: new Date() })
      .where(eq(schema.inventory.id, id));
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await this.db.select().from(schema.inventory)
      .where(sql`${schema.inventory.stock} <= ${schema.inventory.minStock}`);
  }

  // Stock Batches
  async getStockBatches(inventoryId: string): Promise<StockBatch[]> {
    return await this.db.select().from(schema.stockBatches).where(eq(schema.stockBatches.inventoryId, inventoryId));
  }

  async createStockBatch(batch: InsertStockBatch): Promise<StockBatch> {
    const [newBatch] = await this.db.insert(schema.stockBatches).values(batch).returning();
    return newBatch;
  }

  async getExpiringBatches(daysUntilExpiry: number): Promise<StockBatch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);
    
    return await this.db.select().from(schema.stockBatches)
      .where(lt(schema.stockBatches.expiryDate, futureDate));
  }

  // Invoices
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    if (customerId) {
      return await this.db.select().from(schema.invoices)
        .where(eq(schema.invoices.customerId, customerId))
        .orderBy(desc(schema.invoices.issuedAt));
    }
    return await this.db.select().from(schema.invoices).orderBy(desc(schema.invoices.issuedAt));
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await this.db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1);
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await this.db.insert(schema.invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    await this.db.update(schema.invoices)
      .set({ status: status as any })
      .where(eq(schema.invoices.id, id));
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await this.db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await this.db.insert(schema.invoiceItems).values(item).returning();
    return newItem;
  }

  // Payments
  async getPayments(invoiceId: string): Promise<Payment[]> {
    return await this.db.select().from(schema.payments).where(eq(schema.payments.invoiceId, invoiceId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await this.db.insert(schema.payments).values(payment).returning();
    return newPayment;
  }

  // Camera Streams
  async getCameraStreams(petId?: string): Promise<CameraStream[]> {
    if (petId) {
      return await this.db.select().from(schema.cameraStreams).where(eq(schema.cameraStreams.petId, petId));
    }
    return await this.db.select().from(schema.cameraStreams).where(eq(schema.cameraStreams.isActive, true));
  }

  async createCameraStream(stream: InsertCameraStream): Promise<CameraStream> {
    const [newStream] = await this.db.insert(schema.cameraStreams).values(stream).returning();
    return newStream;
  }

  async updateCameraStream(id: string, stream: Partial<InsertCameraStream>): Promise<CameraStream | undefined> {
    const [updated] = await this.db.update(schema.cameraStreams)
      .set({ ...stream, updatedAt: new Date() })
      .where(eq(schema.cameraStreams.id, id))
      .returning();
    return updated;
  }
}

// Try to create database storage, fallback to mock storage
let storage: IStorage;
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

export { storage };
