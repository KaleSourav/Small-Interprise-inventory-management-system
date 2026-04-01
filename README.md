# SAIRIK Brand Management System 

![Sairik Luxury Management](https://img.shields.io/badge/Status-Production_Ready-D4AF37?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-1.0.0-1A1A1A?style=for-the-badge)

A premium, enterprise-grade multi-tenant Retail & Inventory Management system designed exclusively for luxury fragrance and wellness brands. The system operates on a dual-portal architecture—giving the Super Admin strict, god-view control over the entire brand ecosystem, while providing individual satellite Stores with an ultrafast Point-of-Sale (POS) to drive daily operations.

## ✨ Core Philosophy
Built around a sleek **White & Gold Luxury Theme**, the interface focuses on eliminating friction for retail workers while elevating the software to match the prestige of the luxury products being sold. 

---

## 🚀 Key Features & Modules

### 1. Dual-Portal Architecture
*   **Super Admin Portal (`/admin`)**: A centralized command center to oversee all stores, track aggregate sales metrics, manage the universal product catalog, and resolve inventory disputes.
*   **Store POS Portal (`/store`)**: A streamlined, high-speed interface for front-line retail workers to log sales, print invoices, track customers, and communicate stock status directly to HQ.

### 2. Universal Product Catalog & Variant Builder
*   Creates a single source of truth for all retail locations.
*   **Category-Agnostic Engine**: Supports any product type (Perfumes, Attars, Bakhoors, etc.).
*   **Dynamic Variant Management**: Super Admins can assign custom sizes (e.g., 5ml, 30ml, 50ml) and dynamic pricing instantly.

### 3. Integrated Stock & Notifications Engine
*   **Real-time Stock Control**: Stores can instantly mark a product as "Request Out of Stock".
*   **Dispute & Verification System**: Super Admin must approve out-of-stock (OOS) requests before a product is globally blocked.
*   **Global Announcements**: Super Admin can instantly freeze a piece of inventory across *every* store with a single click if supply runs dry.
*   *Integrated Notification Center* directly alerts store managers and HQ seamlessly.

### 4. Lightning-Fast Point of Sale (POS)
*   Barcode-friendly catalog search and variant selection.
*   Instant Cart calculation (taxes, dynamic discounts, and totals).
*   **Secure Checkout & Invoicing**: Captures customer details and outputs branded invoices.

### 5. Multi-Channel Invoicing
*   **One-Click Print**: Generates high-resolution, print-ready PDF invoices.
*   **WhatsApp Integration**: Capable of directly forwarding responsive digital invoices to Elite Customers via WhatsApp bridging.

---

## 🛠 Technology Stack

*   **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: Tailwind CSS v4 + Vanilla CSS Modules for bespoke animations.
*   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
*   **State Management**: React Hooks (Optimistic UI updates)
*   **Authentication**: JWT Cookie-based Auth with internal RBAC (Role-Based Access Control)

---

## 📈 Future Roadmap (To Be Added)

To ensure SAIRIK remains the pinnacle of retail management, the architecture natively supports the following future capabilities:

1.  **AI Sales Forecasting**: Predictive machine learning to tell the Super Admin *when* a product is likely to go out of stock based on seasonal data.
2.  **Customer Loyalty Engine**: Tiered VIP statuses for repeat "Elite Customers" generating automated targeted SMS discounts.
3.  **Barcode/RFID Hardware Integration**: Direct plugins for scanning hardware to bypass manual search entirely.
4.  **Automated HQ Reordering**: Workflows to auto-email suppliers when global inventory breaches a minimum threshold.

---

## 💻 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   Supabase Account

### Setup
1.  Clone the repository and install dependencies:
    ```bash
    npm install
    # or
    bun install
    ```
2.  Set up your `.env.local` to securely link your database keys.
3.  Boot the development server:
    ```bash
    npm run dev
    ```
4.  Access the server at `http://localhost:3000`. 

---
*Architected and developed with an obsession for speed, control, and absolute luxury.*
