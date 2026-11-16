# StockFlow — Multi-Tenant SaaS Inventory Management System

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?style=flat&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**StockFlow** is a modern, production-grade SaaS inventory management application designed for small and medium businesses. Built on a clean full-stack architecture (React 19 + Express.js + MySQL 8.0 + Sequelize), it provides strict row-level multi-tenant logical isolation, real-time stock alerts, atomic inventory adjustments, immutable stock movement audit trails, supplier directories, and purchase order tracking.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Design System](#design-system)
- [Database Schema & Data Model](#database-schema--data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Automated Test Suites](#automated-test-suites)
- [Deployment Guide](#deployment-guide)
  - [Frontend on Vercel](#frontend-on-vercel)
  - [Backend Deployment](#backend-deployment)
- [Security & Multi-Tenancy Guarantees](#security--multi-tenancy-guarantees)
- [Postman Collection](#postman-collection)

---

## Key Features

### 1. Multi-Tenant Logical Isolation
- **Row-Level Tenancy**: Every business record is scoped strictly by `organization_id` derived exclusively from verified JWT authentication tokens. Client bodies and URL params cannot override tenant boundaries.
- **Tenant-Scoped Constraints**: Composite unique key `(organization_id, sku)` allows different organizations to use the same SKU without collisions.

### 2. Product Catalog Management
- Full lifecycle CRUD for inventory items.
- Debounced live search across Product Name and SKU.
- Sorting by date added, name, stock level, or pricing.
- Pagination controls and threshold management.

### 3. Immutable Stock Movement Audit Trail
- Automated tracking for inbound receipts (`IN`), outbound dispatches (`OUT`), and cycle count adjustments (`ADJUSTMENT`).
- **Atomic Transactions with Row Locking**: Every stock modification executes in a Sequelize transaction with `t.LOCK.UPDATE`, guaranteeing stock cannot drop below zero and preventing concurrency race conditions.
- Zero untracked stock updates: direct edits to product details, product registrations, and manual stock updates all create audit records.

### 4. Supplier Management & Purchase Orders
- Comprehensive vendor directory with contact info (email, phone, address) and payment terms.
- **Purchase Order Creation with Supplier Selection**: Line item product selectors, automated unit cost population, live total calculation, and order status tracking.
- Referential integrity: deletion of suppliers with active purchase order history is safely restricted.

### 5. Real-Time Dashboard & Stock Alerts
- KPI metric cards: **Total Products**, **Total Available Stock Units**, and **Low Stock Items**.
- Dynamic low-stock calculation utilizing threshold hierarchy:
  $$\text{Effective Threshold} = \text{COALESCE}(\text{product.low\_stock\_threshold}, \text{organization\_settings.default\_low\_stock\_threshold})$$
- Critical stock alerts table highlighting items that require replenishment.

### 6. Organization-Level Settings
- Customizable default low-stock threshold for the entire workspace.
- Real-time recalculation of dashboard health alerts upon updating preferences.

---

## System Architecture

```text
SaaS Inventory Management System/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & Sequelize synchronization
│   │   ├── controllers/        # HTTP request handling & API response formatting
│   │   ├── middlewares/        # JWT auth, validation handler, global error handling
│   │   ├── models/             # Sequelize models (User, Org, Product, Supplier, etc.)
│   │   ├── routes/             # Express API routing
│   │   ├── services/           # Core business logic & database transactions
│   │   ├── utils/              # JWT helpers, response transformers
│   │   └── validators/         # express-validator schemas
│   ├── test-auth-suite.js      # Auth & Tenant onboarding test suite
│   ├── test-product-suite.js   # Products CRUD & adjustments test suite
│   ├── test-stock-movement-suite.js # Stock movements & audit trail test suite
│   ├── test-supplier-suite.js  # Suppliers & Purchase Orders test suite
│   ├── verify-full-system.js   # End-to-end integration test runner
│   ├── server.js               # Express application entry point
│   ├── .env.example            # Backend environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API clients (auth, products, suppliers, etc.)
│   │   ├── components/
│   │   │   ├── auth/           # Protected and Public route guards
│   │   │   ├── layout/         # AppLayout, responsive Sidebar, Topbar
│   │   │   ├── products/       # ProductModal, AdjustStockModal, DeleteProductModal
│   │   │   ├── purchase-orders/# CreatePurchaseOrderModal with supplier selection
│   │   │   ├── stock-movements/# RecordMovementModal, MovementDetailModal
│   │   │   ├── suppliers/      # SupplierModal, SupplierDetailModal, DeleteSupplierModal
│   │   │   └── ui/             # Design system (Button, Badge, Card, Modal, DataTable, etc.)
│   │   ├── context/            # AuthContext (JWT session hydration & query cache management)
│   │   ├── hooks/              # TanStack Query custom hooks & debouncing
│   │   ├── pages/              # Dashboard, Products, Stock Movements, Suppliers, Settings
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── App.jsx             # React router configuration
│   │   ├── main.jsx            # React root with QueryClientProvider
│   │   └── index.css           # Tailwind CSS v4 styling & tabular-nums helpers
│   ├── vercel.json             # Vercel deployment configuration
│   ├── vite.config.js          # Vite configuration with Tailwind CSS v4 plugin
│   ├── .env.example            # Frontend environment template
│   └── package.json
│
├── StockFlow_API_Postman_Collection.json   # Full Postman API testing collection
├── vercel.json                 # Root Vercel build configuration
├── .gitignore                  # Multi-level Git exclusion (secrets & node_modules)
└── README.md                   # Project documentation
```

---

## Design System

StockFlow features a minimalist design system inspired by **Linear** and the **Stripe Dashboard**:
- **Light Theme Palette**:
  - Background: `#F8FAFC` (Slate 50)
  - Surface: `#FFFFFF` (Pure White)
  - Borders: `#E2E8F0` (Slate 200)
  - Primary Accent: `#2563EB` (Blue 600)
  - Text: `#0F172A` (Slate 900) primary / `#64748B` (Slate 500) secondary
  - Status Indicators: Emerald (Healthy/Inbound), Amber (Low Stock/Adjustment), Red (Out of Stock/Dispatch)
- **Typography**: Monospace badges for SKUs and `.tabular-nums` for clean vertical alignment of stock numbers, dates, and currency values.
- **User Experience**: Skeletons during data fetching, distinct empty states (first-time vs. zero search matches), and confirmation dialogs for destructive actions.

---

## Database Schema & Data Model

The application uses MySQL 8.0 managed via Sequelize ORM with foreign keys and cascading rules:

| Table | Primary Key | Description |
|---|---|---|
| `organizations` | `id` (UUID) | Tenant workspace entities |
| `organization_settings`| `id` (UUID) | Organization-wide defaults (e.g. `default_low_stock_threshold`) |
| `users` | `id` (UUID) | Admin and team accounts with bcrypt hashed credentials |
| `products` | `id` (UUID) | Product catalog with composite unique index `(organization_id, sku)` |
| `stock_movements` | `id` (UUID) | Immutable audit log of all stock increases, deductions, and adjustments |
| `suppliers` | `id` (UUID) | Vendor directory with contact details and notes |
| `purchase_orders` | `id` (UUID) | Procurement orders linked to suppliers and created by users |
| `purchase_order_items`| `id` (UUID) | Line items detailing product IDs, ordered quantities, and unit costs |

---

## API Reference

All protected endpoints require an `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new organization, administrator, and default settings |
| `POST` | `/api/auth/login` | Authenticate credentials and receive tenant JWT |
| `GET` | `/api/auth/me` | Hydrate active user profile, tenant details, and settings |

### Products (`/api/products`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create product (auto-creates initial stock movement if quantity > 0) |
| `GET` | `/api/products` | List paginated products with search and sorting |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `PUT` | `/api/products/:id` | Update product details and stock level |
| `DELETE` | `/api/products/:id` | Delete product from catalog |
| `PATCH` | `/api/products/:id/stock` | Atomic stock adjustment (`INCREASE` or `DECREASE`) |

### Stock Movements (`/api/stock-movements`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/stock-movements` | Record movement (`IN`, `OUT`, `ADJUSTMENT`) with transaction lock |
| `GET` | `/api/stock-movements` | List audit movements with type and date filters |
| `GET` | `/api/stock-movements/:id` | Retrieve specific movement audit record |
| `GET` | `/api/stock-movements/product/:productId` | List movements for a specific product |

### Suppliers (`/api/suppliers`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/suppliers` | Register new vendor in directory |
| `GET` | `/api/suppliers` | List paginated suppliers with search |
| `GET` | `/api/suppliers/:id` | Retrieve supplier details and linked purchase orders |
| `PUT` | `/api/suppliers/:id` | Update supplier contact information |
| `DELETE` | `/api/suppliers/:id` | Delete supplier (restricted if active POs exist) |

### Purchase Orders (`/api/purchase-orders`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/purchase-orders` | Create purchase order with supplier selection and line items |
| `GET` | `/api/purchase-orders` | List paginated purchase orders with status filter |
| `GET` | `/api/purchase-orders/:id` | Get purchase order details with line items |

### Dashboard & Settings (`/api/dashboard`, `/api/settings`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Aggregate metrics (Total Products, Total Stock, Low Stock alerts) |
| `GET` | `/api/settings` | Retrieve organization settings |
| `PUT` | `/api/settings` | Update organization default low-stock threshold |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or **pnpm** v9+
- **MySQL Server**: v8.0+ running locally or in the cloud

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # MySQL Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=stockflow_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   ```

4. **Synchronize database models with MySQL**:
   ```bash
   node src/config/syncDatabase.js
   ```

5. **Start the backend development server**:
   ```bash
   npm run dev
   # Server will run at: http://localhost:5000
   # Health check at:   http://localhost:5000/api/health
   ```

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=/api
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   # Frontend will run at: http://localhost:5173
   ```

5. **Build for production**:
   ```bash
   npm ci --include=dev
   npm run build
   ```

---

## Automated Test Suites

StockFlow includes comprehensive automated backend test suites that verify tenant isolation, validation rules, stock calculations, and referential constraints against a real MySQL database:

```bash
cd backend

# Run Auth & Multi-Tenant Onboarding Suite (10/10 Tests)
node test-auth-suite.js

# Run Product & Inventory CRUD Suite (18/18 Tests)
node test-product-suite.js

# Run Stock Movement History & Audit Suite (17/17 Tests)
node test-stock-movement-suite.js

# Run Supplier & Purchase Order Suite (17/17 Tests)
node test-supplier-suite.js

# Run Complete End-to-End System Verification (27/27 Tests)
node verify-full-system.js
```

---

## Deployment Guide

### Frontend on Vercel

The repository includes both root `vercel.json` and `frontend/vercel.json` for deployment compatibility:

1. **Import the repository into [Vercel](https://vercel.com)**.
2. In the project setup:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Recommended)*
   - **Build Command**: `npm run build`
   - **Install Command**: `npm ci --include=dev`
   - **Output Directory**: `dist`
3. Add Environment Variables:
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://api.yourdomain.com/api`).
4. Click **Deploy**.

---

### Backend Deployment

The Express backend can be deployed to any platform supporting Node.js containers (Railway, Render, AWS Elastic Beanstalk, DigitalOcean App Platform):

1. **Environment Variables**: Ensure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, and `CLIENT_URL` are configured on your hosting provider.
2. **Database Migrations / Sync**: Run `node src/config/syncDatabase.js` as a pre-deploy or release phase command.
3. **Start Command**: `node server.js`.

---

## Security & Multi-Tenancy Guarantees

- **No Shared Tenant Scope**: All SQL queries execute with `WHERE organization_id = ?`.
- **JWT Authentication Guard**: The `authenticate` middleware verifies tokens and rejects mismatched or expired tenant claims (`401`/`403`).
- **Never Leaked Passwords**: Sequelize `defaultScope` strictly excludes `password_hash` from serialization and JSON output.
- **Zero Secrets in Git**: Multi-tier `.gitignore` patterns permanently block all `.env` and `*.local` files from being committed to GitHub.
- **Race Condition Prevention**: Stock deductions execute with `lock: t.LOCK.UPDATE` within database transactions.

---

## Postman Collection

A Postman collection is included in the root directory:
[`StockFlow_API_Postman_Collection.json`](StockFlow_API_Postman_Collection.json)

It includes pre-configured requests and collection test scripts for:
1. **Authentication** (Health, Register, Login, Me)
2. **Products** (Create, List, Details, Update, Delete, Adjust Stock)
3. **Dashboard** (Summary metrics)
4. **Settings** (Get & Update default threshold)
5. **Stock Movements** (Record, List, Details, Product History)
6. **Suppliers** (Create, List, Details, Update, Delete)
7. **Purchase Orders** (Create with Supplier selection, List, Details)

---

## License

This project is licensed under the [MIT License](LICENSE).
