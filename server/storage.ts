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
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";

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
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.barcode, barcode));
    return result[0];
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.sku, sku));
    return result[0];
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const updatedProduct = { ...product, updatedAt: new Date() };
    const result = await db.update(products).set(updatedProduct).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products).where(
      or(
        like(products.name, `%${query}%`),
        like(products.sku, `%${query}%`),
        like(products.barcode, `%${query}%`)
      )
    );
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return await db.select().from(customers).where(
      or(
        like(customers.name, `%${query}%`),
        like(customers.phone, `%${query}%`),
        like(customers.email, `%${query}%`)
      )
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
    return await db.select().from(invoices).where(
      and(
        gte(invoices.createdAt, startDate),
        lte(invoices.createdAt, endDate)
      )
    ).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByStaff(staffId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.staffId, staffId)).orderBy(desc(invoices.createdAt));
  }

  async getInventoryAdjustment(id: string): Promise<InventoryAdjustment | undefined> {
    const result = await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
    return result[0];
  }

  async getAllInventoryAdjustments(): Promise<InventoryAdjustment[]> {
    return await db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const result = await db.insert(inventoryAdjustments).values(adjustment).returning();
    return result[0];
  }

  async getInventoryAdjustmentsByProduct(productId: string): Promise<InventoryAdjustment[]> {
    return await db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.productId, productId)).orderBy(desc(inventoryAdjustments.createdAt));
  }

  async getRolePermission(role: string): Promise<RolePermission | undefined> {
    const result = await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
    return result[0];
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const result = await db.insert(rolePermissions).values(permission).returning();
    return result[0];
  }

  async updateRolePermission(role: string, permission: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    const result = await db.update(rolePermissions).set(permission).where(eq(rolePermissions.role, role)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
