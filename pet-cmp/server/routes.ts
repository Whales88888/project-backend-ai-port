import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertPetSchema, 
  insertAppointmentSchema,
  insertMedicalRecordSchema,
  insertInventorySchema,
  insertStockBatchSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertCameraStreamSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ CUSTOMERS ============
  app.get("/api/customers", async (req, res) => {
    try {
      const { limit, offset, search, active } = req.query;
      console.log("Fetching customers with params:", { limit, offset, search });
      const customers = await storage.getCustomers(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined,
        search as string | undefined,
        typeof active === 'string' ? active === 'true' : undefined
      );
      console.log("Customers found:", customers.length);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
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

  app.post("/api/customers", async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
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

  // Approval endpoints
  app.post("/api/customers/:id/approve", async (req, res) => {
    try {
      const approved = await storage.updateCustomer(req.params.id, { isActive: true } as any);
      if (!approved) return res.status(404).json({ error: "Customer not found" });
      res.json(approved);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Failed to approve customer" });
    }
  });

  app.post("/api/customers/:id/deactivate", async (req, res) => {
    try {
      const updated = await storage.updateCustomer(req.params.id, { isActive: false } as any);
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Failed to deactivate customer" });
    }
  });

  // ============ PETS ============
  app.get("/api/pets", async (req, res) => {
    try {
      const { customerId } = req.query;
      const pets = await storage.getPets(customerId as string | undefined);
      res.json(pets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", async (req, res) => {
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

  app.post("/api/pets", async (req, res) => {
    try {
      const validated = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(validated);
      res.status(201).json(pet);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Invalid pet data" });
    }
  });

  app.patch("/api/pets/:id", async (req, res) => {
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

  // ============ APPOINTMENTS ============
  app.get("/api/appointments", async (req, res) => {
    try {
      const { date, status } = req.query;
      console.log("GET /api/appointments - Query params:", { date, status });
      
      let filterDate: Date | undefined;
      if (date) {
        filterDate = new Date(date as string);
        if (isNaN(filterDate.getTime())) {
          console.error("Invalid date in query:", date);
          filterDate = undefined;
        } else {
          console.log("Filtering appointments for date:", filterDate.toISOString());
        }
      }
      
      const appointments = await storage.getAppointments(
        filterDate,
        status as string | undefined
      );
      
      console.log(`GET /api/appointments - Found ${appointments.length} appointments`);
      
      // Serialize dates in appointments array
      const serialized = appointments.map((apt: any) => ({
        ...apt,
        appointmentDate: apt.appointmentDate instanceof Date ? apt.appointmentDate.toISOString() : apt.appointmentDate,
        createdAt: apt.createdAt instanceof Date ? apt.createdAt.toISOString() : apt.createdAt,
        updatedAt: apt.updatedAt instanceof Date ? apt.updatedAt.toISOString() : apt.updatedAt,
      }));
      
      res.json(serialized);
    } catch (error) {
      console.error("GET /api/appointments - Error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
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

  app.post("/api/appointments", async (req, res, next) => {
    try {
      console.log("POST /api/appointments - Request body:", JSON.stringify(req.body, null, 2));
      
      // Validate request body exists
      if (!req.body) {
        console.error("POST /api/appointments - No request body");
        res.status(400).json({ error: "Request body is required" });
        return;
      }
      
      const { petId, customerId, appointmentDate, appointmentType, status, notes, veterinarianId } = req.body;
      
      // Validate required fields
      if (!petId || !customerId || !appointmentDate || !appointmentType) {
        console.error("POST /api/appointments - Missing required fields:", {
          petId: !!petId,
          customerId: !!customerId,
          appointmentDate: !!appointmentDate,
          appointmentType: !!appointmentType
        });
        res.status(400).json({ 
          error: "Missing required fields: petId, customerId, appointmentDate, appointmentType are required" 
        });
        return;
      }
      
      // Parse and validate date - accept any valid date (past or future)
      let parsedDate: Date;
      try {
        parsedDate = new Date(appointmentDate);
        if (isNaN(parsedDate.getTime())) {
          console.error("POST /api/appointments - Invalid date:", appointmentDate);
          res.status(400).json({ error: `Invalid appointment date format: ${appointmentDate}` });
          return;
        }
        console.log("POST /api/appointments - Parsed date:", parsedDate.toISOString());
      } catch (err: any) {
        console.error("POST /api/appointments - Date parse error:", err.message);
        res.status(400).json({ error: `Invalid appointment date: ${err.message}` });
        return;
      }
      
      // Prepare appointment data
      const appointmentData: any = {
        petId: String(petId),
        customerId: String(customerId),
        appointmentDate: parsedDate,
        appointmentType: String(appointmentType),
        status: status ? String(status) : "pending",
        notes: notes ? String(notes) : null,
        veterinarianId: veterinarianId ? String(veterinarianId) : null,
      };
      
      console.log("POST /api/appointments - Appointment data:", JSON.stringify(appointmentData, null, 2));
      
      // Create appointment
      const storageAny = storage as any;
      let createdAppointment;
      try {
        createdAppointment = await storageAny.createAppointment(appointmentData);
        console.log("POST /api/appointments - Created appointment:", JSON.stringify(createdAppointment, null, 2));
      } catch (createErr: any) {
        console.error("POST /api/appointments - Create error:", createErr);
        res.status(400).json({ error: createErr.message || "Failed to create appointment" });
        return;
      }
      
      // Validate creation result
      if (!createdAppointment || !createdAppointment.id) {
        console.error("POST /api/appointments - Invalid creation result:", createdAppointment);
        res.status(500).json({ error: "Appointment creation returned invalid result" });
        return;
      }
      
      // Serialize dates for JSON response
      const formatDate = (date: any): string => {
        if (!date) return "";
        if (date instanceof Date) {
          return date.toISOString();
        }
        if (typeof date === 'string') {
          return date;
        }
        try {
          return new Date(date).toISOString();
        } catch {
          return "";
        }
      };
      
      // Build response
      const response: any = {
        id: String(createdAppointment.id),
        petId: String(createdAppointment.petId),
        customerId: String(createdAppointment.customerId),
        appointmentDate: formatDate(createdAppointment.appointmentDate),
        appointmentType: String(createdAppointment.appointmentType),
        status: String(createdAppointment.status || "pending"),
        createdAt: formatDate(createdAppointment.createdAt),
        updatedAt: formatDate(createdAppointment.updatedAt),
      };
      
      if (createdAppointment.veterinarianId) {
        response.veterinarianId = String(createdAppointment.veterinarianId);
      } else {
        response.veterinarianId = null;
      }
      
      if (createdAppointment.notes) {
        response.notes = String(createdAppointment.notes);
      } else {
        response.notes = null;
      }
      
      console.log("POST /api/appointments - Response:", JSON.stringify(response, null, 2));
      
      // Send success response
      res.status(201).json(response);
    } catch (err: any) {
      console.error("POST /api/appointments - Unhandled error:", err);
      // Pass error to Express error handler
      next(err);
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
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

  // ============ MEDICAL RECORDS ============
  app.get("/api/medical-records", async (req, res) => {
    try {
      const { petId } = req.query;
      const records = await storage.getMedicalRecords(petId as string | undefined);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical records" });
    }
  });

  app.get("/api/medical-records/:id", async (req, res) => {
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

  app.post("/api/medical-records", async (req, res) => {
    try {
      const validated = insertMedicalRecordSchema.parse(req.body);
      const record = await storage.createMedicalRecord(validated);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: "Invalid medical record data" });
    }
  });

  // ============ INVENTORY ============
  app.get("/api/inventory", async (req, res) => {
    try {
      const { search } = req.query;
      const inventory = await storage.getInventory(search as string | undefined);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
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

  app.post("/api/inventory", async (req, res) => {
    try {
      const validated = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
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

  app.post("/api/inventory/:id/adjust-stock", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== 'number') {
        return res.status(400).json({ error: "Quantity must be a number" });
      }
      await storage.updateInventoryStock(req.params.id, quantity);
      const updated = await storage.getInventoryById(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to adjust stock" });
    }
  });

  // ============ STOCK BATCHES ============
  app.get("/api/stock-batches", async (req, res) => {
    try {
      const { inventoryId } = req.query;
      if (!inventoryId) {
        return res.status(400).json({ error: "inventoryId is required" });
      }
      const batches = await storage.getStockBatches(inventoryId as string);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock batches" });
    }
  });

  app.get("/api/stock-batches/expiring", async (req, res) => {
    try {
      const { days = 60 } = req.query;
      const batches = await storage.getExpiringBatches(parseInt(days as string));
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiring batches" });
    }
  });

  app.post("/api/stock-batches", async (req, res) => {
    try {
      const validated = insertStockBatchSchema.parse(req.body);
      const batch = await storage.createStockBatch(validated);
      res.status(201).json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock batch data" });
    }
  });

  // ============ INVOICES ============
  app.get("/api/invoices", async (req, res) => {
    try {
      const { customerId } = req.query;
      const invoices = await storage.getInvoices(customerId as string | undefined);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
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

  app.post("/api/invoices", async (req, res) => {
    try {
      const validated = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validated);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateInvoiceStatus(req.params.id, status);
      const updated = await storage.getInvoiceById(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update invoice status" });
    }
  });

  // ============ INVOICE ITEMS ============
  app.get("/api/invoices/:invoiceId/items", async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(req.params.invoiceId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/invoice-items", async (req, res) => {
    try {
      const validated = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice item data" });
    }
  });

  // ============ PAYMENTS ============
  app.get("/api/invoices/:invoiceId/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments(req.params.invoiceId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validated);
      
      // Update invoice status to paid if payment matches total
      const invoice = await storage.getInvoiceById(validated.invoiceId);
      if (invoice && parseFloat(payment.amount) >= parseFloat(invoice.totalAmount)) {
        await storage.updateInvoiceStatus(invoice.id, 'paid');
      }
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // ============ CAMERA STREAMS ============
  app.get("/api/camera-streams", async (req, res) => {
    try {
      const { petId } = req.query;
      const streams = await storage.getCameraStreams(petId as string | undefined);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch camera streams" });
    }
  });

  app.post("/api/camera-streams", async (req, res) => {
    try {
      const validated = insertCameraStreamSchema.parse(req.body);
      const stream = await storage.createCameraStream(validated);
      res.status(201).json(stream);
    } catch (error) {
      res.status(400).json({ error: "Invalid camera stream data" });
    }
  });

  app.patch("/api/camera-streams/:id", async (req, res) => {
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

  // ============ USERS ============
  app.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      const users = await storage.getUsers(role as string | undefined);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ============ EXPORT (CSV) ============
  app.get("/api/export/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers(10000, 0);
      const headers = ["CustomerID","Name","Email","Phone","Address","Active","CreatedAt"];
      const csvRows = [headers.join(",")].concat(
        customers.map((c: any) => [
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
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export customers" });
    }
  });

  app.get("/api/export/pets", async (req, res) => {
    try {
      const pets = await storage.getPets();
      const headers = ["PetID","CustomerID","Name","Species","Breed","Age","Gender","Microchip","Active","CreatedAt"];
      const csvRows = [headers.join(",")].concat(
        pets.map((p: any) => [
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
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="pets.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export pets" });
    }
  });

  // ============ DASHBOARD STATS ============
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointments = await storage.getAppointments(today);
      const lowStock = await storage.getLowStockItems();

      // Calculate current month revenue from paid invoices
      const invoices = await storage.getInvoices();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .filter((inv: any) => {
          const d = new Date(inv.issuedAt ?? inv.createdAt ?? now);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0);
      
      res.json({
        totalCustomers: customers.length,
        todayAppointments: appointments.length,
        lowStockCount: lowStock.length,
        monthlyRevenue,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
