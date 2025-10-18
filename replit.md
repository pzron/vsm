# Store Management System - PWA

A comprehensive offline-capable web-based (PWA) store management system built with React, TypeScript, Express, and PostgreSQL.

## Overview

This is a full-stack Progressive Web Application (PWA) for managing retail stores with features including:
- Interactive dashboard with real-time analytics and charts
- Product management with barcode scanning, multi-tier pricing, and expiry tracking
- Complete invoicing system with multiple payment modes, tax, and discount calculations
- Customer management with loyalty points and purchase history
- Inventory tracking with stock alerts and adjustments
- Sales analytics and comprehensive reports with filters
- Staff management with role-based access control (Admin/Manager/Cashier/Accountant)
- Offline-first functionality using IndexedDB
- Customizable invoice templates

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** (React Query) for server state management
- **Tailwind CSS** + **shadcn/ui** for UI components
- **Recharts** for data visualizations
- **IndexedDB** for offline storage
- **Service Worker** for offline capability

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** (Neon) for database
- **Drizzle ORM** for type-safe database operations
- **bcrypt** for password hashing
- **WebSocket** (ws package) for real-time features

## Project Structure

```
/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── lib/         # Utilities and helpers
│   │   ├── pages/       # Page components
│   │   └── main.tsx     # App entry point
│   └── index.html
├── server/              # Backend Express application
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Data access layer
│   ├── routes.ts       # API routes
│   ├── seed.ts         # Database seeding
│   └── index.ts        # Server entry point
├── shared/             # Shared types and schemas
│   └── schema.ts       # Drizzle schemas and types
└── public/             # Static assets
    ├── sw.js           # Service worker
    └── manifest.json   # PWA manifest

```

## Database Schema

### Tables
- **users** - Staff members with roles and permissions
- **products** - Product catalog with pricing tiers
- **customers** - Customer profiles with loyalty tracking
- **invoices** - Sales transactions with payment details
- **inventory_adjustments** - Stock movement history
- **role_permissions** - RBAC permission definitions

## Features

### Authentication & Authorization
- Secure login with bcrypt password hashing
- Role-based access control (RBAC)
- Protected routes on frontend
- Default admin credentials: **Sairoot / Sai@101**

### Products Management
- Multi-tier pricing (Retail, Wholesale, VIP)
- Barcode support for quick lookup
- Expiry date tracking
- Stock level monitoring with alerts
- Search and filter functionality

### Customer Management
- Customer types: Retail, Wholesale, VIP, Member
- Loyalty points system (1 point per $10 spent)
- Purchase history tracking
- Last visit tracking

### Invoicing
- Multiple payment modes (Cash, Bank Transfer, Mobile Banking, Loyalty Points)
- Tax and discount calculations
- Automatic stock updates on invoice creation
- Automatic loyalty points accrual

### Inventory
- Real-time stock tracking
- Low stock and out-of-stock alerts
- Stock adjustment history
- Value calculations

### Sales Analytics
- Dashboard with key metrics
- Revenue and profit analysis
- Sales trends visualization
- Top products and categories
- Payment method breakdown

### Staff Management
- Create and manage staff accounts
- Role assignment (Admin, Manager, Cashier, Accountant)
- Salary tracking
- Activity monitoring

### Role Permissions

#### Admin
- Full access to all modules
- Can manage staff and settings

#### Manager
- View, add, edit for most modules
- Cannot delete or manage staff/settings

#### Cashier
- View products and inventory
- Create invoices and manage customers
- Cannot access sales reports or staff

#### Accountant
- View-only access to most modules
- Can generate reports
- Cannot modify data

### Offline Capability
- IndexedDB for local data storage
- Service Worker for offline functionality
- Sync queue for offline operations
- PWA manifest for installability

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create invoice

### Inventory
- `GET /api/inventory/adjustments` - List adjustments
- `POST /api/inventory/adjustments` - Create adjustment

### Staff
- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create staff member
- `PATCH /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics

### Roles
- `GET /api/roles` - List all role permissions
- `GET /api/roles/:role` - Get role permissions
- `POST /api/roles` - Create role permissions
- `PATCH /api/roles/:role` - Update role permissions

## Development

### Running the Application
```bash
npm run dev
```
This starts both the Express server and Vite dev server on port 5000.

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Seed the database with sample data
tsx server/seed.ts
```

### Default Credentials
- Username: **Sairoot**
- Password: **Sai@101**
- Role: **Admin**

## Environment Variables

Required environment variables (automatically set in Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials
- `SESSION_SECRET` - Session encryption secret

## Security Features

- Password hashing with bcrypt
- Role validation on staff creation/updates
- No public registration endpoint (admin-only staff creation)
- Protected API routes
- Secure session management

## Recent Changes

### Latest Updates (2025-10-18)
- Implemented complete database schema with all tables
- Built comprehensive backend API with all CRUD operations
- Created authentication system with role-based access control
- Connected all frontend components to backend APIs
- Removed all mock data from components
- Fixed critical security issues:
  - Removed insecure public registration endpoint
  - Fixed permissions hydration in AuthContext
  - Added role validation for staff operations
- Implemented IndexedDB for offline storage
- Added Service Worker for offline capability
- Created PWA manifest for installability
- Seeded database with default admin and sample data

## User Preferences

None specified yet.

## Known Limitations

- Service worker needs to be properly configured for production deployment
- Invoice templates are not yet customizable (coming soon)
- Real-time sync is basic (uses polling, not WebSockets yet)
- No data export/import functionality yet
- Reports are basic (advanced filtering coming soon)
