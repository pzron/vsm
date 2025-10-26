import {
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Invoice,
  type InsertInvoice,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
  type RolePermission,
  type InsertRolePermission,
  users,
  products,
  customers,
  invoices,
  inventoryAdjustments,
  rolePermissions,
} from "@shared/schema";
import { db, DB_ENABLED } from "./db";
import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;

  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;

  getInvoice(id: string): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]>;
  getInvoicesByStaff(staffId: string): Promise<Invoice[]>;

  getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined>;
  getAllInventoryAdjustments(): Promise<InventoryAdjustment[]>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  getInventoryAdjustmentsByProduct(productId: string): Promise<InventoryAdjustment[]>;

  getRolePermission(role: string): Promise<RolePermission | undefined>;
  getAllRolePermissions(): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(role: string, permission: Partial<InsertRolePermission>): Promise<RolePermission | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(products).where(eq(products.barcode, barcode));
    return result[0];
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(products).where(eq(products.sku, sku));
    return result[0];
  }

  async getAllProducts(): Promise<Product[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updatedProduct = { ...product, updatedAt: new Date() };
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(products).set(updatedProduct).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(products).where(
      or(
        like(products.name, `%${query}%`),
        like(products.sku, `%${query}%`),
        like(products.barcode, `%${query}%`)
      )
    );
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(customers).where(
      or(
        like(customers.name, `%${query}%`),
        like(customers.phone, `%${query}%`),
        like(customers.email, `%${query}%`),
        like(customers.username as any, `%${query}%`)
      )
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getAllInvoices(): Promise<Invoice[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }

  async getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(invoices).where(
      and(
        gte(invoices.createdAt, startDate),
        lte(invoices.createdAt, endDate)
      )
    ).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByStaff(staffId: string): Promise<Invoice[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(invoices).where(eq(invoices.staffId, staffId)).orderBy(desc(invoices.createdAt));
  }

  async getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
    return result[0];
  }

  async getAllInventoryAdjustments(): Promise<InventoryAdjustment[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(inventoryAdjustments).values(adjustment).returning();
    return result[0];
  }

  async getInventoryAdjustmentsByProduct(productId: string): Promise<InventoryAdjustment[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.productId, productId)).orderBy(desc(inventoryAdjustments.createdAt));
  }

  async getRolePermission(role: string): Promise<RolePermission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
    return result[0];
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(rolePermissions);
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(rolePermissions).values(permission).returning();
    return result[0];
  }

  async updateRolePermission(role: string, permission: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.update(rolePermissions).set(permission).where(eq(rolePermissions.role, role)).returning();
    return result[0];
  }
}

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private products: Product[] = [];
  private customers: Customer[] = [];
  private invoices: Invoice[] = [];
  private adjustments: InventoryAdjustment[] = [];
  private roles: RolePermission[] = [];

  constructor() {
    const now = new Date();
    const admin: User = {
      id: randomUUID(),
      username: "Sairoot",
      password: bcrypt.hashSync("Sai@101", 10),
      fullName: "System Administrator",
      email: "admin@storemanager.com",
      phone: "+1-555-0100",
      role: "Admin",
      status: "Active",
      salary: "0",
      totalPaid: "0",
      notes: "",
      createdAt: now,
    } as User;
    this.users.push(admin);

    this.roles.push(
      { id: randomUUID(), role: "Admin", permissions: { Products: { view: true, add: true, edit: true, delete: true }, Invoices: { view: true, add: true, edit: true, delete: true }, Inventory: { view: true, add: true, edit: true, delete: true }, Customers: { view: true, add: true, edit: true, delete: true }, Sales: { view: true, add: true, edit: true, delete: true }, Reports: { view: true, add: true, edit: true, delete: true }, Staff: { view: true, add: true, edit: true, delete: true }, Settings: { view: true, add: true, edit: true, delete: true } } },
      { id: randomUUID(), role: "Manager", permissions: { Products: { view: true, add: true, edit: true, delete: false }, Invoices: { view: true, add: true, edit: true, delete: false }, Inventory: { view: true, add: true, edit: true, delete: false }, Customers: { view: true, add: true, edit: true, delete: false }, Sales: { view: true, add: false, edit: false, delete: false }, Reports: { view: true, add: false, edit: false, delete: false }, Staff: { view: false, add: false, edit: false, delete: false }, Settings: { view: false, add: false, edit: false, delete: false } } },
      { id: randomUUID(), role: "Cashier", permissions: { Products: { view: true, add: false, edit: false, delete: false }, Invoices: { view: true, add: true, edit: false, delete: false }, Inventory: { view: true, add: false, edit: false, delete: false }, Customers: { view: true, add: true, edit: true, delete: false }, Sales: { view: false, add: false, edit: false, delete: false }, Reports: { view: false, add: false, edit: false, delete: false }, Staff: { view: false, add: false, edit: false, delete: false }, Settings: { view: false, add: false, edit: false, delete: false } } },
      { id: randomUUID(), role: "Accountant", permissions: { Products: { view: true, add: false, edit: false, delete: false }, Invoices: { view: true, add: false, edit: false, delete: false }, Inventory: { view: true, add: false, edit: false, delete: false }, Customers: { view: true, add: false, edit: false, delete: false }, Sales: { view: true, add: false, edit: false, delete: false }, Reports: { view: true, add: true, edit: false, delete: false }, Staff: { view: false, add: false, edit: false, delete: false }, Settings: { view: false, add: false, edit: false, delete: false } } },
    );

    const sampleProducts: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [
      { name: "Wireless Mouse", sku: "WM-001", barcode: "1234567890123", category: "Electronics", subcategory: null as any, unitType: null as any, description: "Ergonomic wireless mouse", imageUrl: null as any, retailPrice: "29.99", wholesalePrice: "24.99", vipPrice: "22.99", costPrice: "15.00", currentStock: 45, minStock: 20, expiryDate: null as any, points: 0 as any, features: null as any },
      { name: "USB-C Cable 2m", sku: "UC-002", barcode: "1234567890124", category: "Accessories", subcategory: null as any, unitType: null as any, description: "USB-C charging cable", imageUrl: null as any, retailPrice: "12.99", wholesalePrice: "10.99", vipPrice: "9.99", costPrice: "5.00", currentStock: 8, minStock: 25, expiryDate: null as any, points: 0 as any, features: null as any },
      { name: "Mechanical Keyboard", sku: "MK-003", barcode: "1234567890125", category: "Electronics", subcategory: null as any, unitType: null as any, description: "RGB mechanical keyboard", imageUrl: null as any, retailPrice: "89.99", wholesalePrice: "79.99", vipPrice: "74.99", costPrice: "50.00", currentStock: 8, minStock: 15, expiryDate: null as any, points: 0 as any, features: null as any },
      { name: "Desk Lamp LED", sku: "DL-004", barcode: "1234567890126", category: "Furniture", subcategory: null as any, unitType: null as any, description: "Adjustable LED desk lamp", imageUrl: null as any, retailPrice: "39.99", wholesalePrice: "34.99", vipPrice: "32.99", costPrice: "20.00", currentStock: 0, minStock: 10, expiryDate: null as any, points: 0 as any, features: null as any },
      { name: "Notebook A5", sku: "NB-005", barcode: "1234567890127", category: "Stationery", subcategory: null as any, unitType: null as any, description: "Hardcover notebook", imageUrl: null as any, retailPrice: "4.99", wholesalePrice: "3.99", vipPrice: "3.49", costPrice: "2.00", currentStock: 120, minStock: 50, expiryDate: null as any, points: 0 as any, features: null as any },
    ];
    for (const p of sampleProducts) {
      const prod: Product = { id: randomUUID(), createdAt: now, updatedAt: now, ...p } as Product;
      this.products.push(prod);
    }

    const sampleCustomers: Omit<Customer, "id" | "createdAt">[] = [
      { username: null as any, name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0123", type: "VIP", address: null as any, preferredPayment: "Cash" as any, birthday: null as any, anniversary: null as any, specialDay: null as any, userId: null as any, loyaltyPoints: 0, totalSpent: "0", lastVisit: null as any },
      { username: null as any, name: "Mike Chen", email: "", phone: "+1-555-0124", type: "Member", address: null as any, preferredPayment: "Cash" as any, birthday: null as any, anniversary: null as any, specialDay: null as any, userId: null as any, loyaltyPoints: 0, totalSpent: "0", lastVisit: null as any },
      { username: null as any, name: "Emily Davis", email: "", phone: "+1-555-0125", type: "Wholesale", address: null as any, preferredPayment: "Cash" as any, birthday: null as any, anniversary: null as any, specialDay: null as any, userId: null as any, loyaltyPoints: 0, totalSpent: "0", lastVisit: null as any },
    ];
    for (const c of sampleCustomers) {
      const cust: Customer = { id: randomUUID(), createdAt: now, ...c } as Customer;
      this.customers.push(cust);
    }
  }

  async getUser(id: string) { return this.users.find(u => u.id === id); }
  async getUserByUsername(username: string) { return this.users.find(u => u.username === username); }
  async createUser(user: InsertUser) {
    const u: User = { id: randomUUID(), createdAt: new Date(), ...user } as unknown as User;
    this.users.push(u);
    return u;
  }
  async getAllUsers() { return [...this.users].sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }
  async updateUser(id: string, user: Partial<InsertUser>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...user } as User;
    return this.users[idx];
  }
  async deleteUser(id: string) { this.users = this.users.filter(u => u.id !== id); return true; }

  async getProduct(id: string) { return this.products.find(p => p.id === id); }
  async getProductByBarcode(barcode: string) { return this.products.find(p => p.barcode === barcode); }
  async getProductBySku(sku: string) { return this.products.find(p => p.sku === sku); }
  async getAllProducts() { return [...this.products].sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }
  async createProduct(product: InsertProduct) {
    const now = new Date();
    const p: Product = { id: randomUUID(), createdAt: now, updatedAt: now, ...product } as unknown as Product;
    this.products.push(p);
    return p;
  }
  async updateProduct(id: string, product: Partial<InsertProduct>) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    const updated = { ...this.products[idx], ...product, updatedAt: new Date() } as Product;
    this.products[idx] = updated;
    return updated;
  }
  async deleteProduct(id: string) { this.products = this.products.filter(p => p.id !== id); return true; }
  async searchProducts(query: string) {
    const q = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q)
    );
  }

  async getCustomer(id: string) { return this.customers.find(c => c.id === id); }
  async getAllCustomers() { return [...this.customers].sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }
  async createCustomer(customer: InsertCustomer) {
    // Enforce unique username if provided
    const uname = (customer as any).username;
    if (uname) {
      const exists = this.customers.some(c => ((c as any).username || "") === uname);
      if (exists) throw new Error("username_taken");
    }
    const c: Customer = { id: randomUUID(), createdAt: new Date(), ...customer } as unknown as Customer;
    this.customers.push(c);
    return c;
  }
  async updateCustomer(id: string, customer: Partial<InsertCustomer>) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    const uname = (customer as any).username;
    if (uname) {
      const exists = this.customers.some(c => c.id !== id && ((c as any).username || "") === uname);
      if (exists) throw new Error("username_taken");
    }
    this.customers[idx] = { ...this.customers[idx], ...customer } as Customer;
    return this.customers[idx];
  }
  async deleteCustomer(id: string) { this.customers = this.customers.filter(c => c.id !== id); return true; }
  async searchCustomers(query: string) {
    const q = query.toLowerCase();
    return this.customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      ((c as any).username || "").toLowerCase().includes(q)
    );
  }

  async getInvoice(id: string) { return this.invoices.find(i => i.id === id); }
  async getAllInvoices() { return [...this.invoices].sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }
  async createInvoice(invoice: InsertInvoice) {
    const inv: Invoice = { id: randomUUID(), createdAt: new Date(), ...invoice } as unknown as Invoice;
    this.invoices.push(inv);
    return inv;
  }
  async updateInvoice(id: string, invoice: Partial<InsertInvoice>) {
    const idx = this.invoices.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.invoices[idx] = { ...this.invoices[idx], ...invoice } as Invoice;
    return this.invoices[idx];
  }
  async deleteInvoice(id: string) { this.invoices = this.invoices.filter(i => i.id !== id); return true; }
  async getInvoicesByDateRange(startDate: Date, endDate: Date) {
    return this.invoices.filter(i => (i.createdAt as any) >= startDate && (i.createdAt as any) <= endDate);
  }
  async getInvoicesByStaff(staffId: string) { return this.invoices.filter(i => i.staffId === staffId); }

  async getInventoryAdjustment(id: string) { return this.adjustments.find(a => a.id === id); }
  async getAllInventoryAdjustments() { return [...this.adjustments].sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }
  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment) {
    const prev = await this.getProduct(adjustment.productId);
    const adj: InventoryAdjustment = { id: randomUUID(), createdAt: new Date(), ...adjustment } as unknown as InventoryAdjustment;
    this.adjustments.push(adj);
    return adj;
  }
  async getInventoryAdjustmentsByProduct(productId: string) { return this.adjustments.filter(a => a.productId === productId).sort((a,b)=> (b.createdAt as any) - (a.createdAt as any)); }

  async getRolePermission(role: string) { return this.roles.find(r => r.role === role); }
  async getAllRolePermissions() { return [...this.roles]; }
  async createRolePermission(permission: InsertRolePermission) {
    const rp: RolePermission = { id: randomUUID(), ...permission } as unknown as RolePermission;
    this.roles.push(rp);
    return rp;
  }
  async updateRolePermission(role: string, permission: Partial<InsertRolePermission>) {
    const idx = this.roles.findIndex(r => r.role === role);
    if (idx === -1) return undefined;
    this.roles[idx] = { ...this.roles[idx], ...permission } as RolePermission;
    return this.roles[idx];
  }
}

export const storage: IStorage = DB_ENABLED ? new DatabaseStorage() : new MemoryStorage();
