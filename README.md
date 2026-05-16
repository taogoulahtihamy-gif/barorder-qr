# BarOrder QR

A modern PWA for bars and restaurants. Customers scan a QR code, browse the menu, order, and pay via Wave or cash.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Real-time:** Socket.io
- **QR Code:** qrcode library

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd barorder-qr

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Configuration

Copy the environment example files and update the values:

```bash
# Server
cp server/.env.example server/.env

# Client (optional - defaults work for local dev)
cp client/.env.example client/.env
```

### Database Setup

```bash
# Create the database
createdb barorder_qr

# Run the schema
psql -d barorder_qr -f server/database/schema.sql

# Seed with sample data
psql -d barorder_qr -f server/database/seed.sql
```

### Running the Application

```bash
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
cd client
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## Project Structure

```
barorder-qr/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── client/     # Customer-facing pages
│   │   │   └── admin/      # Admin dashboard pages
│   │   ├── layouts/        # Layout components
│   │   ├── services/       # API and socket services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   └── utils/          # Utility functions
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Database models
│   │   ├── sockets/        # Socket.io handlers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   └── database/           # SQL schema and seeds
└── README.md
```

## Pages

### Client
- `/table/:tableId` - Table landing
- `/menu/:restaurantId/:tableId` - Menu browsing
- `/cart` - Shopping cart
- `/checkout` - Payment selection
- `/order/:orderNumber` - Order tracking
- `/server-call` - Call server button

### Admin
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Overview stats
- `/admin/orders` - Order management
- `/admin/products` - Product CRUD
- `/admin/categories` - Category management
- `/admin/tables` - Table management with QR codes
- `/admin/payments` - Payment history
- `/admin/stats` - Sales statistics
- `/admin/settings` - Restaurant settings

## Design

- Dark mode with black, gold, white, and Wave green palette
- Mobile-first responsive design
- Rounded cards and premium UI components
