# Medical Shop Service

A robust microservice for managing medical shops, medicine catalogs, and complex inventory systems in the MedicineFinder platform.

## 🚀 Features

### 🏪 Medical Shop Management
- **Shop Onboarding**: Complete registration with license and location verification.
- **Dynamic Profiles**: Manage operating hours, provided services, and contact info.
- **Geospatial Discovery**: Real-time shop discovery using GPS coordinates and proximity search.
- **Status Control**: Automated and manual shop status management (Active, Inactive, Suspended).

### 💊 Medicine Catalog
- **Global Catalog**: Standardized medicine database with categories and dosage forms.
- **Regulatory Compliance**: Tracking for prescription-required medicines and drug licenses.
- **Batch Precision**: Batch-level tracking with manufacturing and expiry date management.

### 📦 Advanced Inventory System
- **Strict Stock Movements**: Standardized handling of Stock In, Stock Out, Adjustments, and Returns.
- **Real-time Quantity Tracking**: Distinct tracking for physical Quantity, Reserved Quantity, and Available Quantity.
- **Atomic Updates**: Process-safe stock changes using MongoDB transactions to ensure data integrity.
- **Intelligent Alerts**: Threshold-based low stock notifications and proactive expiry warnings.
- **Inventory Reporting**: Advanced search and filtering for stock status, aging, and valuations.

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES6+ Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod (Strict type-safe schema validation)
- **Messaging**: Apache Kafka (Event-driven inter-service communication)
- **Security**: JWT Authentication, Role-Based Access Controls (Owner/User), Helmet, CORS
- **Geospatial**: MongoDB Geospatial Indices ($nearSphere)

## 📊 API Reference

### Shop Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/shops/public` | Find nearby shops (Public access) |
| `GET` | `/api/shops/me` | Fetch currently logged-in owner's shop |
| `PATCH` | `/api/shops/me` | Update shop profile details |

### Medicine Catalog
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/medicines` | List all available medicines in system |
| `GET` | `/api/medicines/:id` | Get individual medicine profile |
| `POST` | `/api/medicines` | Register new medicine (Admin privileged) |

### Inventory Management (Shop Owner Only)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/shops/inventory/items` | List inventory batches (Cursor-based) |
| `GET` | `/api/shops/inventory/items/:id` | Detailed batch info & history |
| `GET` | `/api/shops/inventory/search` | **Advanced Search** (Filter: low stock, expiring, etc.) |
| `POST` | `/api/shops/inventory/items` | Add a new medicine batch to inventory |
| `POST` | `/api/shops/inventory/items/:id/movements` | **Record Movement** (In, Out, Adjust, Return) |
| `GET` | `/api/shops/inventory/alerts` | Summary of stock and expiry alerts |
| `PUT` | `/api/shops/inventory/items/:id/alerts` | Configure batch-specific thresholds |

## 🗃️ Key Data Structures

### Inventory Batch
Standardized schema for tracking medicine batches with a detailed audit trail.
```javascript
{
  medicineId: ObjectId,     // Ref: Medicine
  batchNumber: String,      // Unique batch identifier
  quantity: Number,         // Total physical stock
  availableQuantity: Number,// (Total - Reserved)
  reservedQuantity: Number, // Blocked by active orders
  pricing: {
    costPrice: Number,      // Acquisition cost
    sellingPrice: Number,   // Base price before tax/discount
    mrp: Number,            // Maximum Retail Price
    taxPercentage: Number   // Applicable GST/Tax
  },
  stockMovements: [{        // Complete Audit Trail
    type: "in" | "out" | "adjustment" | "return",
    reason: "purchase" | "sale" | "damage" | "correction" | "return",
    quantity: Number,       // Delta change
    reference: String,      // Invoice/Order ID
    performedBy: ObjectId,  // User ID
    timestamp: Date
  }]
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB 6.0+
- Kafka Broker (Optional for local development)

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```

### Environment Variables
```env
PORT=3004
MONGO_URI=mongodb://localhost:27017/medical_shop_db
JWT_SECRET=your_secret_key
KAFKA_BROKERS=localhost:9092
ALLOWED_ORIGINS=http://localhost:3000
```

## 🔄 Core Business Logic: Stock Movements

The service enforces strict rules for stock movements to maintain ledger accuracy:

1. **Stock In (`in`)**: Increases quantity. Used for purchases or opening stock.
2. **Stock Out (`out`)**: Decreases quantity. Used for sales, wastage, or expiry removal.
3. **Adjustment (`adjustment`)**: Used for manual corrections after physical audits.
4. **Return (`return`)**: 
   - `customer_return`: Increases quantity (restock).
   - `supplier_return`: Decreases quantity (item sent back).

## 🔐 Security & Validation
- **Authentication**: Bearer JWT tokens required for all owner actions.
- **Authorization**: Middleware verifies if the user is the legitimate owner of the shop they are managing.
- **Validation**: All incoming requests are validated against Zod schemas. Invalid movement-reason combinations are rejected at the API level.

---
**MediGo Medical Shop Microservice**  
*Improving Healthcare Accessibility through Technology.*
