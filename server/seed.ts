import 'dotenv/config';
import { storage } from "./storage";
import bcrypt from "bcrypt";
import ws from "ws";

if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = ws;
}

async function seed() {
  console.log("Starting database seed...");

  try {
    const existingAdmin = await storage.getUserByUsername("Sairoot");
    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed.");
      return;
    }

    const hashedPassword = await bcrypt.hash("Sai@101", 10);
    
    await storage.createUser({
      username: "Sairoot",
      password: hashedPassword,
      fullName: "System Administrator",
      email: "admin@storemanager.com",
      phone: "+1-555-0100",
      role: "Admin",
      status: "Active",
      salary: "0",
    });
    console.log("✓ Created admin user: Sairoot / Sai@101");

    const defaultRoles = [
      {
        role: "Admin",
        permissions: {
          Products: { view: true, add: true, edit: true, delete: true },
          Invoices: { view: true, add: true, edit: true, delete: true },
          Inventory: { view: true, add: true, edit: true, delete: true },
          Customers: { view: true, add: true, edit: true, delete: true },
          Sales: { view: true, add: true, edit: true, delete: true },
          Reports: { view: true, add: true, edit: true, delete: true },
          Staff: { view: true, add: true, edit: true, delete: true },
          Settings: { view: true, add: true, edit: true, delete: true },
        },
      },
      {
        role: "Manager",
        permissions: {
          Products: { view: true, add: true, edit: true, delete: false },
          Invoices: { view: true, add: true, edit: true, delete: false },
          Inventory: { view: true, add: true, edit: true, delete: false },
          Customers: { view: true, add: true, edit: true, delete: false },
          Sales: { view: true, add: false, edit: false, delete: false },
          Reports: { view: true, add: false, edit: false, delete: false },
          Staff: { view: false, add: false, edit: false, delete: false },
          Settings: { view: false, add: false, edit: false, delete: false },
        },
      },
      {
        role: "Cashier",
        permissions: {
          Products: { view: true, add: false, edit: false, delete: false },
          Invoices: { view: true, add: true, edit: false, delete: false },
          Inventory: { view: true, add: false, edit: false, delete: false },
          Customers: { view: true, add: true, edit: true, delete: false },
          Sales: { view: false, add: false, edit: false, delete: false },
          Reports: { view: false, add: false, edit: false, delete: false },
          Staff: { view: false, add: false, edit: false, delete: false },
          Settings: { view: false, add: false, edit: false, delete: false },
        },
      },
      {
        role: "Accountant",
        permissions: {
          Products: { view: true, add: false, edit: false, delete: false },
          Invoices: { view: true, add: false, edit: false, delete: false },
          Inventory: { view: true, add: false, edit: false, delete: false },
          Customers: { view: true, add: false, edit: false, delete: false },
          Sales: { view: true, add: false, edit: false, delete: false },
          Reports: { view: true, add: true, edit: false, delete: false },
          Staff: { view: false, add: false, edit: false, delete: false },
          Settings: { view: false, add: false, edit: false, delete: false },
        },
      },
    ];

    for (const rolePermission of defaultRoles) {
      await storage.createRolePermission(rolePermission);
      console.log(`✓ Created role permissions for: ${rolePermission.role}`);
    }

    const sampleProducts = [
      {
        name: "Wireless Mouse",
        sku: "WM-001",
        barcode: "1234567890123",
        category: "Electronics",
        description: "Ergonomic wireless mouse with 2.4GHz connection",
        retailPrice: "29.99",
        wholesalePrice: "24.99",
        vipPrice: "22.99",
        costPrice: "15.00",
        currentStock: 45,
        minStock: 20,
      },
      {
        name: "USB-C Cable 2m",
        sku: "UC-002",
        barcode: "1234567890124",
        category: "Accessories",
        description: "High-speed USB-C charging cable 2 meters",
        retailPrice: "12.99",
        wholesalePrice: "10.99",
        vipPrice: "9.99",
        costPrice: "5.00",
        currentStock: 8,
        minStock: 25,
      },
      {
        name: "Mechanical Keyboard",
        sku: "MK-003",
        barcode: "1234567890125",
        category: "Electronics",
        description: "RGB mechanical keyboard with blue switches",
        retailPrice: "89.99",
        wholesalePrice: "79.99",
        vipPrice: "74.99",
        costPrice: "50.00",
        currentStock: 8,
        minStock: 15,
      },
      {
        name: "Desk Lamp LED",
        sku: "DL-004",
        barcode: "1234567890126",
        category: "Furniture",
        description: "Adjustable LED desk lamp with touch control",
        retailPrice: "39.99",
        wholesalePrice: "34.99",
        vipPrice: "32.99",
        costPrice: "20.00",
        currentStock: 0,
        minStock: 10,
      },
      {
        name: "Notebook A5",
        sku: "NB-005",
        barcode: "1234567890127",
        category: "Stationery",
        description: "Premium hardcover notebook 192 pages",
        retailPrice: "4.99",
        wholesalePrice: "3.99",
        vipPrice: "3.49",
        costPrice: "2.00",
        currentStock: 120,
        minStock: 50,
      },
    ];

    for (const product of sampleProducts) {
      await storage.createProduct(product);
      console.log(`✓ Created product: ${product.name}`);
    }

    const sampleCustomers = [
      {
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "+1-555-0123",
        type: "VIP",
        loyaltyPoints: 0,
        totalSpent: "0",
      },
      {
        name: "Mike Chen",
        email: "mike.c@email.com",
        phone: "+1-555-0124",
        type: "Member",
        loyaltyPoints: 0,
        totalSpent: "0",
      },
      {
        name: "Emily Davis",
        email: "emily.d@email.com",
        phone: "+1-555-0125",
        type: "Wholesale",
        loyaltyPoints: 0,
        totalSpent: "0",
      },
    ];

    for (const customer of sampleCustomers) {
      await storage.createCustomer(customer);
      console.log(`✓ Created customer: ${customer.name}`);
    }

    console.log("\n✓ Database seeded successfully!");
    console.log("\nDefault Login Credentials:");
    console.log("Username: Sairoot");
    console.log("Password: Sai@101");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
