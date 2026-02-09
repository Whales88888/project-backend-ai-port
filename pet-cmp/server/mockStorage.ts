import type { 
  User, InsertUser, Customer, InsertCustomer, Pet, InsertPet,
  Appointment, InsertAppointment, MedicalRecord, InsertMedicalRecord,
  Prescription, InsertPrescription, Inventory, InsertInventory,
  StockBatch, InsertStockBatch, Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem, Payment, InsertPayment,
  CameraStream, InsertCameraStream,
} from "@shared/schema";

// Mock data
const mockUsers: User[] = [
  { id: "1", email: "admin@petclinic.com", name: "Admin", role: "admin", phone: "0123456789", isActive: true, createdAt: new Date() },
  { id: "2", email: "vet1@petclinic.com", name: "BS. Nguyễn Văn An", role: "veterinarian", phone: "0123456780", isActive: true, createdAt: new Date() },
  { id: "3", email: "vet2@petclinic.com", name: "BS. Trần Thị Bình", role: "veterinarian", phone: "0123456781", isActive: true, createdAt: new Date() },
  { id: "4", email: "vet3@petclinic.com", name: "BS. Lê Văn Cường", role: "veterinarian", phone: "0123456782", isActive: true, createdAt: new Date() },
  { id: "5", email: "vet4@petclinic.com", name: "BS. Phạm Thị Dung", role: "veterinarian", phone: "0123456783", isActive: true, createdAt: new Date() },
  { id: "6", email: "vet5@petclinic.com", name: "BS. Hoàng Văn Em", role: "veterinarian", phone: "0123456784", isActive: true, createdAt: new Date() },
];

const mockCustomers: Customer[] = [
  { id: "1", userId: null, name: "Nguyễn Văn A", email: "customer1@email.com", phone: "0912345678", address: "Hà Nội", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", userId: null, name: "Trần Thị B", email: "customer2@email.com", phone: "0912345679", address: "TP.HCM", isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockPets: Pet[] = [
  { id: "1", customerId: "1", name: "Max", species: "Chó", breed: "Golden Retriever", age: 3, weight: "25.5", gender: "Đực", microchip: "123456789", imageUrl: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", customerId: "1", name: "Miu", species: "Mèo", breed: "Persian", age: 2, weight: "4.2", gender: "Cái", microchip: null, imageUrl: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "3", customerId: "2", name: "Lucky", species: "Chó", breed: "Labrador", age: 1, weight: "20.0", gender: "Đực", microchip: "987654321", imageUrl: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockAppointments: Appointment[] = [];

const mockMedicalRecords: MedicalRecord[] = [
  { id: "1", petId: "1", appointmentId: null, veterinarianId: "2", visitDate: new Date("2025-01-05"), symptoms: "Chó bị ho, chảy nước mũi", diagnosis: "Cảm lạnh", treatment: "Nghỉ ngơi, uống thuốc kháng sinh", notes: "Theo dõi nhiệt độ", createdAt: new Date() },
  { id: "2", petId: "2", appointmentId: null, veterinarianId: "3", visitDate: new Date("2025-01-03"), symptoms: "Mèo bỏ ăn, nôn mửa", diagnosis: "Viêm dạ dày", treatment: "Nhịn ăn 24h, uống thuốc", notes: "Tái khám sau 3 ngày", createdAt: new Date() },
];

const mockInvoices: Invoice[] = [
  { id: "1", customerId: "1", appointmentId: null, invoiceNumber: "I0001", totalAmount: "350000", status: "paid", issuedAt: new Date(), dueDate: null, createdAt: new Date() },
  { id: "2", customerId: "2", appointmentId: null, invoiceNumber: "I0002", totalAmount: "450000", status: "pending", issuedAt: new Date(), dueDate: null, createdAt: new Date() },
];

const mockInvoiceItems: InvoiceItem[] = [];

const mockPayments: Payment[] = [
  { id: "1", invoiceId: "1", amount: "350000", paymentMethod: "cash", paymentDate: new Date(), notes: "", createdAt: new Date() },
];

const mockInventory: Inventory[] = [
  { id: "1", code: "MED-001", name: "Kháng sinh A", category: "Thuốc", unit: "hộp", stock: 5, minStock: 10, price: "45000", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", code: "VAC-001", name: "Vắc-xin B", category: "Vắc-xin", unit: "liều", stock: 25, minStock: 10, price: "120000", createdAt: new Date(), updatedAt: new Date() },
];

const mockCameraStreams: CameraStream[] = [
  { id: "1", petId: "1", streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", roomNumber: "Phòng 1", isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

export class MockStorage {
  // Users
  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return mockUsers.filter(user => user.role === role);
    }
    return mockUsers;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return mockUsers.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return mockUsers.find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      name: user.name,
      email: user.email,
      role: user.role || "customer",
      phone: user.phone || null,
      isActive: true,
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  }

  // Customers
  async getCustomers(limit = 100, offset = 0, search?: string): Promise<Customer[]> {
    let filtered = mockCustomers;
    if (search) {
      filtered = mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search)
      );
    }
    return filtered.slice(offset, offset + limit);
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return mockCustomers.find(customer => customer.id === id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = {
      id: (mockCustomers.length + 1).toString(),
      userId: null,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    mockCustomers[index] = { ...mockCustomers[index], ...customer, updatedAt: new Date() };
    return mockCustomers[index];
  }

  // Pets
  async getPets(customerId?: string): Promise<Pet[]> {
    if (customerId) {
      return mockPets.filter(pet => pet.customerId === customerId);
    }
    return mockPets;
  }

  async getPetById(id: string): Promise<Pet | undefined> {
    return mockPets.find(pet => pet.id === id);
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newPet: Pet = {
      id: newId,
      customerId: pet.customerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      age: pet.age || null,
      weight: pet.weight || null,
      gender: pet.gender || null,
      microchip: pet.microchip || null,
      imageUrl: pet.imageUrl || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPets.push(newPet);
    return newPet;
  }

  async updatePet(id: string, pet: Partial<InsertPet>): Promise<Pet | undefined> {
    const index = mockPets.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    mockPets[index] = { ...mockPets[index], ...pet, updatedAt: new Date() };
    return mockPets[index];
  }

  // Appointments
  async getAppointments(date?: Date, status?: string): Promise<Appointment[]> {
    console.log("getAppointments called with:", { 
      date: date ? date.toISOString() : undefined, 
      status,
      totalAppointments: mockAppointments.length 
    });
    
    let filtered = [...mockAppointments]; // Create a copy
    
    if (date) {
      // Normalize input date to start of day (UTC)
      const inputDate = new Date(date);
      const dateStr = inputDate.toISOString().split('T')[0];
      console.log("Filtering by date:", dateStr);
      
      filtered = mockAppointments.filter(apt => {
        // Normalize appointment date to start of day for comparison
        const aptDate = new Date(apt.appointmentDate);
        const aptDateStr = aptDate.toISOString().split('T')[0];
        const matches = aptDateStr === dateStr;
        if (matches) {
          console.log("Match found:", apt.id, aptDateStr);
        }
        return matches;
      });
      
      console.log(`Filtered to ${filtered.length} appointments for date ${dateStr}`);
    }
    
    if (status) {
      filtered = filtered.filter(apt => apt.status === status);
    }
    
    // Sort by appointment date
    filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateA - dateB;
    });
    
    console.log(`Returning ${filtered.length} appointments`);
    return filtered;
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    return mockAppointments.find(apt => apt.id === id);
  }

  async createAppointment(appointment: any): Promise<any> {
    // Generate unique ID
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle date - always ensure it's a valid Date object
    let date: Date;
    if (appointment.appointmentDate instanceof Date) {
      date = new Date(appointment.appointmentDate);
    } else if (typeof appointment.appointmentDate === 'string') {
      date = new Date(appointment.appointmentDate);
      if (isNaN(date.getTime())) {
        console.error("Invalid appointment date:", appointment.appointmentDate);
        date = new Date();
      }
    } else {
      console.error("Missing appointment date, using current date");
      date = new Date();
    }
    
    console.log("Creating appointment with date:", date.toISOString());
    
    // Build appointment object
    const newAppointment: any = {
      id: newId,
      petId: String(appointment.petId || ""),
      customerId: String(appointment.customerId || ""),
      veterinarianId: appointment.veterinarianId ? String(appointment.veterinarianId) : null,
      appointmentDate: date,
      appointmentType: String(appointment.appointmentType || ""),
      status: String(appointment.status || "pending"),
      notes: appointment.notes ? String(appointment.notes) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to array
    (mockAppointments as any[]).push(newAppointment);
    
    console.log("Appointment created. Total appointments:", mockAppointments.length);
    console.log("Appointment ID:", newId, "Date:", date.toISOString());
    
    // Return created appointment
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const index = mockAppointments.findIndex(apt => apt.id === id);
    if (index === -1) return undefined;
    
    mockAppointments[index] = { ...mockAppointments[index], ...appointment, updatedAt: new Date() } as Appointment;
    return mockAppointments[index];
  }

  // Medical Records
  async getMedicalRecords(petId?: string): Promise<MedicalRecord[]> {
    if (petId) {
      return mockMedicalRecords.filter(record => record.petId === petId);
    }
    return mockMedicalRecords;
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    return mockMedicalRecords.find(record => record.id === id);
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const newRecord: MedicalRecord = {
      id: (mockMedicalRecords.length + 1).toString(),
      petId: record.petId,
      appointmentId: record.appointmentId || null,
      veterinarianId: record.veterinarianId,
      visitDate: record.visitDate || new Date(),
      symptoms: record.symptoms || null,
      diagnosis: record.diagnosis || null,
      treatment: record.treatment || null,
      notes: record.notes || null,
      createdAt: new Date(),
    };
    mockMedicalRecords.push(newRecord);
    return newRecord;
  }

  // Prescriptions
  async getPrescriptions(medicalRecordId: string): Promise<Prescription[]> {
    return [];
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const newPrescription: Prescription = {
      id: "1",
      medicalRecordId: prescription.medicalRecordId,
      medicineId: prescription.medicineId,
      quantity: prescription.quantity,
      dosage: prescription.dosage || null,
      instructions: prescription.instructions || null,
      createdAt: new Date(),
    };
    return newPrescription;
  }

  // Inventory
  async getInventory(search?: string): Promise<Inventory[]> {
    if (search) {
      return mockInventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    return mockInventory;
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    return mockInventory.find(i => i.id === id);
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newItem: Inventory = {
      id: newId,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: item.stock ?? 0,
      minStock: item.minStock ?? 10,
      price: item.price,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockInventory.push(newItem);
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const idx = mockInventory.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    mockInventory[idx] = { ...mockInventory[idx], ...item, updatedAt: new Date() } as Inventory;
    return mockInventory[idx];
  }

  async updateInventoryStock(id: string, quantity: number): Promise<void> {
    const idx = mockInventory.findIndex(i => i.id === id);
    if (idx === -1) return;
    mockInventory[idx].stock = Math.max(0, (mockInventory[idx].stock || 0) + quantity);
    mockInventory[idx].updatedAt = new Date();
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return mockInventory.filter(i => (i.stock || 0) <= (i.minStock || 0));
  }

  // Stock Batches
  async getStockBatches(inventoryId: string): Promise<StockBatch[]> {
    return [];
  }

  async createStockBatch(batch: InsertStockBatch): Promise<StockBatch> {
    const newBatch: StockBatch = {
      id: "1",
      inventoryId: batch.inventoryId,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate,
      supplier: batch.supplier || null,
      createdAt: new Date(),
    };
    return newBatch;
  }

  async getExpiringBatches(daysUntilExpiry: number): Promise<StockBatch[]> {
    return [];
  }

  // Invoices
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    if (customerId) return mockInvoices.filter(i => i.customerId === customerId);
    return mockInvoices;
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    return mockInvoices.find(i => i.id === id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const newInvoice: Invoice = {
      id: (mockInvoices.length + 1).toString(),
      customerId: invoice.customerId,
      appointmentId: invoice.appointmentId || null,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      status: invoice.status || "pending",
      issuedAt: invoice.issuedAt || new Date(),
      dueDate: invoice.dueDate || null,
      createdAt: new Date(),
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    const inv = mockInvoices.find(i => i.id === id);
    if (inv) inv.status = status as any;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return mockInvoiceItems.filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const newItem: InvoiceItem = {
      id: (mockInvoiceItems.length + 1).toString(),
      invoiceId: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
    mockInvoiceItems.push(newItem);
    
    // Update invoice total amount
    const invoice = mockInvoices.find(i => i.id === item.invoiceId);
    if (invoice) {
      const items = mockInvoiceItems.filter(i => i.invoiceId === item.invoiceId);
      const total = items.reduce((sum, i) => {
        return sum + parseFloat(i.totalPrice || "0");
      }, 0);
      invoice.totalAmount = total.toFixed(2);
    }
    
    return newItem;
  }

  // Payments
  async getPayments(invoiceId: string): Promise<Payment[]> {
    return mockPayments.filter(p => p.invoiceId === invoiceId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: (mockPayments.length + 1).toString(),
      ...payment,
      paymentDate: new Date(),
      createdAt: new Date(),
    } as Payment;
    mockPayments.push(newPayment);
    
    // Update invoice status and calculate paid amount
    const inv = mockInvoices.find(i => i.id === payment.invoiceId);
    if (inv) {
      const payments = mockPayments.filter(p => p.invoiceId === payment.invoiceId);
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      const totalAmount = parseFloat(inv.totalAmount || "0");
      
      if (totalPaid >= totalAmount) {
        inv.status = "paid" as any;
      } else if (totalPaid > 0) {
        inv.status = "partial" as any;
      } else {
        inv.status = "pending" as any;
      }
    }
    
    return newPayment;
  }

  // Camera Streams
  async getCameraStreams(petId?: string): Promise<CameraStream[]> {
    if (petId) return mockCameraStreams.filter(s => s.petId === petId);
    return mockCameraStreams;
  }

  async createCameraStream(stream: InsertCameraStream): Promise<CameraStream> {
    const newStream: CameraStream = {
      id: (mockCameraStreams.length + 1).toString(),
      ...stream,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CameraStream;
    mockCameraStreams.push(newStream);
    return newStream;
  }

  async updateCameraStream(id: string, stream: Partial<InsertCameraStream>): Promise<CameraStream | undefined> {
    const idx = mockCameraStreams.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    mockCameraStreams[idx] = { ...mockCameraStreams[idx], ...stream, updatedAt: new Date() } as CameraStream;
    return mockCameraStreams[idx];
  }
}
