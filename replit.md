# BMAA FASHION Hydroponic Ecommerce Platform

## Overview

BMAA FASHION is a full-stack e-commerce platform specializing in hydroponic farming systems, kits, vertical farming solutions, and fresh hydroponic produce. It serves as a dual marketplace for sustainable agriculture equipment and farm-fresh vegetables using hydroponic methods. The platform targets home gardening enthusiasts, commercial farming operations, and fresh produce consumers across India, aiming to provide a comprehensive solution for modern, sustainable agriculture. Key capabilities include comprehensive admin dashboards, customer analytics, multi-channel notifications, inventory management, and complete legal compliance for the Indian market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **UI Framework**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with a nature-inspired color palette
- **State Management**: React Context API (cart), TanStack Query (server state)
- **Responsive Design**: Mobile-first approach, comprehensive responsiveness across all client-facing and admin pages, including tables and forms.

### Backend

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Storage**: Designed for PostgreSQL (in-memory for development)
- **API Design**: RESTful endpoints for products, categories, cart, and order management.

### Database Schema

- **Products**: Detailed catalog including hydroponic kit specifics.
- **Cart Items**: Session-based management.
- **Orders**: Order processing with customer and item details.
- **Users**: Basic schema for future authentication.
- **Categories**: Dynamic, database-driven category management with subcategories.

### Component Architecture

- **Reusable Components**: Modular design (e.g., ProductCard, ShoppingCart).
- **Design System**: Consistent spacing, typography (Poppins/Open Sans), and rounded corners.
- **Interactive Elements**: Hover effects, cart slideout, filtering, and search.

### System Design Choices

- **Legal Compliance**: Comprehensive legal pages (Privacy, ToS, Shipping, Return) tailored for the Indian market (Consumer Protection Act 2019, GST, RBI/PCI).
- **SEO & Marketing**: Custom `useSEO` hook for meta tags, Open Graph, Twitter cards, and unique page metadata.
- **Notification System**: Queue-based email system (13 types, HTML templates, retry logic via Gmail SMTP), ready for Twilio SMS/WhatsApp integration. Includes admin order notifications.
- **Admin Features**: Secure `/admin` routes with `requireAdmin` middleware, dashboards for analytics, inventory, customer management, and data export. Includes detailed payment information display in order details.
- **Security Features**: Replit Auth (OIDC), JWT security, Razorpay signature verification, atomic database transactions, API rate limiting, and role-based access control.
- **Payment & Order Management**: Implemented Razorpay for payments with server-side validation and HMAC verification. Includes payment retry, cancellation flows, and a 0% GST and free shipping policy.
- **Address Management**: Full CRUD functionality for addresses in user profiles and during checkout.
- **Cart Synchronization**: Gracefully handles missing/deleted products during cart synchronization.

## External Dependencies

### UI and Styling

- **Radix UI**: Accessible React components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Type-safe variant handling.

### Development Tools

- **Vite**: Fast build tool and development server.
- **Drizzle Kit**: Database migration and schema management.
- **ESBuild**: Fast JavaScript bundler.

### Database and Backend

- **Neon Database Serverless**: PostgreSQL-compatible serverless database (future configuration).
- **Express Session**: Session management.
- **Connect PG Simple**: PostgreSQL session store (production preparation).

### Payment Integration

- **Razorpay**: Complete payment processing for the Indian market, including server-side validation, HMAC verification, order creation, payment verification, and error handling.

### Utilities & Validation

- **React Hook Form**: Form handling with validation.
- **Zod**: Schema validation for API contracts and form validation.

## Recent Changes

### November 18, 2025

1. ✅ **Retry Payment on Order Detail Page**
   - Added retry payment functionality to individual order detail page (/orders/:id)
   - Two prominent UI elements for pending payments:
     - "Complete Payment" button in page header (top-right)
     - Payment pending alert banner with inline "Pay Now" button (orange/yellow color scheme)
   - Uses correct Razorpay payment flow:
     - Fetches key from `/api/payments/razorpay-key`
     - Creates new Razorpay order via `/api/payments/create-razorpay-order`
     - Verifies payment using `/api/payments/verify-razorpay-payment`
   - Matches exact implementation from OrderHistory.tsx for consistency
   - **Cache synchronization fix**: Invalidates both `['/api/orders', orderId]` AND `['/api/orders']` query keys to ensure order list page updates immediately after payment completion
   - Buttons show "Processing..." state during payment initialization
   - Not available in order access mode (limited access via email link)
   - Includes proper type declarations for Razorpay window object
