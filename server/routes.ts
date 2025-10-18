import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertCustomerSchema, insertInvoiceSchema, insertInventoryAdjustmentSchema, insertRolePermissionSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const rolePermissions = await storage.getRolePermission(user.role);
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, permissions: rolePermissions?.permissions || {} });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Registration endpoint removed for security - staff should be created through admin panel only

  // Product Routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search } = req.query;
      if (search && typeof search === "string") {
        const products = await storage.searchProducts(search);
        res.json(products);
      } else {
        const products = await storage.getAllProducts();
        res.json(products);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const product = await storage.getProductByBarcode(req.params.barcode);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Customer Routes
  app.get("/api/customers", async (req, res) => {
    try {
      const { search } = req.query;
      if (search && typeof search === "string") {
        const customers = await storage.searchCustomers(search);
        res.json(customers);
      } else {
        const customers = await storage.getAllCustomers();
        res.json(customers);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
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
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Failed to create customer" });
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

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { startDate, endDate, staffId } = req.query;
      
      if (startDate && endDate) {
        const invoices = await storage.getInvoicesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(invoices);
      } else if (staffId) {
        const invoices = await storage.getInvoicesByStaff(staffId as string);
        res.json(invoices);
      } else {
        const invoices = await storage.getAllInvoices();
        res.json(invoices);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
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
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      const items = validatedData.items as any[];
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(item.productId, {
            currentStock: product.currentStock - item.quantity,
          });
        }
      }
      
      if (validatedData.customerId) {
        const customer = await storage.getCustomer(validatedData.customerId);
        if (customer) {
          const total = parseFloat(validatedData.total as string);
          const totalSpent = parseFloat(customer.totalSpent as string) + total;
          const loyaltyPoints = customer.loyaltyPoints + Math.floor(total / 10);
          
          await storage.updateCustomer(validatedData.customerId, {
            totalSpent: totalSpent.toString(),
            loyaltyPoints,
            lastVisit: new Date(),
          });
        }
      }
      
      const invoice = await storage.createInvoice(validatedData);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Failed to create invoice" });
    }
  });

  // Inventory Adjustment Routes
  app.get("/api/inventory/adjustments", async (req, res) => {
    try {
      const { productId } = req.query;
      if (productId) {
        const adjustments = await storage.getInventoryAdjustmentsByProduct(productId as string);
        res.json(adjustments);
      } else {
        const adjustments = await storage.getAllInventoryAdjustments();
        res.json(adjustments);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch adjustments" });
    }
  });

  app.post("/api/inventory/adjustments", async (req, res) => {
    try {
      const validatedData = insertInventoryAdjustmentSchema.parse(req.body);
      
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await storage.updateProduct(validatedData.productId, {
        currentStock: validatedData.newStock,
      });
      
      const adjustment = await storage.createInventoryAdjustment(validatedData);
      res.json(adjustment);
    } catch (error) {
      res.status(400).json({ error: "Failed to create adjustment" });
    }
  });

  // Staff/User Routes
  app.get("/api/staff", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const allowedRoles = ["Admin", "Manager", "Cashier", "Accountant"];
      if (!validatedData.role || !allowedRoles.includes(validatedData.role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Failed to create staff member" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      if (updateData.role) {
        const allowedRoles = ["Admin", "Manager", "Cashier", "Accountant"];
        if (!allowedRoles.includes(updateData.role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
      }
      
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staff member" });
    }
  });

  // Role Permission Routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRolePermissions();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:role", async (req, res) => {
    try {
      const rolePermission = await storage.getRolePermission(req.params.role);
      if (!rolePermission) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(rolePermission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRolePermissionSchema.parse(req.body);
      const rolePermission = await storage.createRolePermission(validatedData);
      res.json(rolePermission);
    } catch (error) {
      res.status(400).json({ error: "Failed to create role" });
    }
  });

  app.patch("/api/roles/:role", async (req, res) => {
    try {
      const rolePermission = await storage.updateRolePermission(req.params.role, req.body);
      if (!rolePermission) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(rolePermission);
    } catch (error) {
      res.status(400).json({ error: "Failed to update role" });
    }
  });

  // Analytics Routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const customers = await storage.getAllCustomers();
      const invoices = await storage.getAllInvoices();
      const staff = await storage.getAllUsers();
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total as string), 0);
      const totalProfit = invoices.reduce((sum, inv) => {
        const items = inv.items as any[];
        const profit = items.reduce((itemSum, item) => {
          const itemProfit = (parseFloat(item.price) - parseFloat(item.costPrice || "0")) * item.quantity;
          return itemSum + itemProfit;
        }, 0);
        return sum + profit;
      }, 0);
      
      const lowStockProducts = products.filter(p => p.currentStock < p.minStock);
      const outOfStockProducts = products.filter(p => p.currentStock === 0);
      
      res.json({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalRevenue,
        totalProfit,
        totalInvoices: invoices.length,
        totalStaff: staff.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
