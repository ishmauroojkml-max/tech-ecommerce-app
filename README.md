# NexaTech — Full-Stack E-Commerce Web Application

NexaTech is a modern, production-quality e-commerce storefront with a complete admin backend. Customers can browse products, filter by category, manage a persistent shopping cart, and check out through a dynamic payment gateway preview. Administrators get a dedicated dashboard for analytics, inventory management, and catalog control — all backed by a secure, persistent database.

## Key Features

### Customer Storefront
- **Product Filtering** — Browse the full catalog and filter by category (Smartphones, Laptops, Audio, Smartwatches, Cameras, and more). Search products by name or category with instant results.
- **Product Detail Pages** — View product images, pricing, ratings, stock status, and customer reviews. Signed-in users can leave their own star-rated reviews.
- **Persistent Shopping Cart** — Add items, adjust quantities, and remove products. The cart is saved permanently to the database for signed-in customers and restored on any device. Guest carts are saved locally and merged on sign-in.
- **Buy Now** — Skip the cart and jump straight to checkout for a single item.
- **Order History** — Signed-in customers can view their complete order history with status tracking.

### Dynamic Checkout & Payment Gateway Preview
- **Interactive 3D Credit Card Preview** — A live, flipping credit card visualization that updates in real time as the user types their name, card number, expiry date, and CVC. The card flips to the back when the CVC field is focused.
- **Auto-Formatting** — Card numbers auto-space every 4 digits; expiry auto-formats to `MM/YY`.
- **Card Brand Detection** — Automatically detects and displays VISA, Mastercard, AMEX, and Discover badges.
- **Success Confirmation** — Animated checkmark with a receipt summary (amount, masked card, cardholder, and approved status).
- **Stripe-Ready Checkout** — A real Stripe checkout flow is wired and ready to activate with a Stripe key. Falls back to a fully functional demo checkout when Stripe isn't configured.

### Admin Dashboard
- **Analytics Overview** — Total sales, order count, product count, and conversion rate, plus a 7-month revenue chart and recent order feed.
- **Inventory Management** — Add, edit, and delete products through a modal form. Track stock levels with low-stock and out-of-stock indicators.
- **Product Catalog Control** — Full CRUD over the product catalog, saved instantly to the database and reflected across the storefront.

### Security
- Row-Level Security (RLS) on every database table.
- Owner-scoped policies so customers can only access their own carts, orders, and reviews.
- Admin-only access to product management functions.
- Secure authentication with Supabase Auth (email/password).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Icons | Lucide React |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Payments | Stripe (optional) / Demo checkout |
| Edge Functions | Supabase Edge Functions (Deno) |
| Hosting | Bolt (deployment ready) |

## Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nexatech
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   The dev server runs locally. Open the local URL shown in your terminal.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript type checker |

### Environment

Supabase database credentials and Stripe keys are pre-configured in the project environment. No manual `.env` setup is required for the demo to run.

## Live Demo

A live demo of the application is available here:

> **Live Demo:** [Add your deployed URL here]

## Project Structure

```
src/
├── App.tsx                    # Main app component, routing, and state
├── main.tsx                    # React entry point
├── index.css                   # Global styles and Tailwind
├── types.ts                    # Shared TypeScript types
├── components/
│   └── DemoPaymentForm.tsx     # Interactive 3D payment form
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── utils.ts                 # Shared utilities (currency, dates, etc.)
supabase/
├── migrations/                 # Database schema migrations
└── functions/                  # Edge functions (Stripe checkout)
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with role (customer/admin) |
| `products` | Product catalog with pricing, stock, and ratings |
| `cart_items` | Per-user persistent shopping cart |
| `orders` | Completed orders with items and status |
| `reviews` | Product reviews with ratings and comments |

## License

This project is a demo application built for showcase purposes.

---

Built with React, Tailwind CSS, Vite, and Supabase.
