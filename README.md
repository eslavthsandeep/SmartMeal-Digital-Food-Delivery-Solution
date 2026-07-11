# FoodExpress | Real-Time Food Delivery System (MERN Stack)

A production-ready, portfolio-grade MERN stack application built as a final-year B.Tech (AI) project. The system architecture is modeled strictly after Level 0, Level 1, and Level 2 Data Flow Diagrams (DFDs) representing Customers, Restaurants, Payment Gateways, and Delivery Personnel.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router, TailwindCSS, Zustand (client state), React Query (server caching), Leaflet (maps)
- **Backend**: Node.js + Express.js (ES Modules format)
- **Real-Time**: Socket.IO (live orders queue, driver location coordinates updates)
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (15-min Access Token + 7-day httpOnly Refresh Token cookie pattern)
- **AI Chatbot**: Gemini API / OpenAI API with a smart rule-based local backup
- **Payments**: Stripe Test integration with an automated mock gateway fallback

---

## 🏗️ System Architecture & DFD Mapping

The codebase reflects the five core processes modeled in the DFD:
1. **User Authentication (1.0)**: Handled by `/api/auth` routing. Connects to **D1 User Database** storing hashed passwords and addresses.
2. **Browse Food (2.0)**: Search and cuisine filtering processed by `/api/restaurants` routes against **D2 Restaurant Database**.
3. **Order Processing (3.0)**: Price-verified order creation mapped to `/api/orders` routes and **D3 Order Database**.
4. **Payment Processing (4.0)**: Handled via `/api/payments` endpoints updating **D4 Payment Records** on success.
5. **Delivery Management (5.0)**: GPS tracking coordinates routing mapped to `/api/delivery` endpoints and **D5 Delivery Tracking Data**.

---

## 🧠 Key Design Decisions

- **Demo Shortcuts**: Login screen includes demo credentials fill triggers to switch between Customer, Merchant, Rider, and Admin views with one click.
- **Rider Claims Board**: Riders can browse a queue of unassigned orders to self-claim jobs, resolving multi-terminal testing bottlenecks.
- **GPS Slide Simulator**: The rider dashboard mounts a slider that drives their coordinate marker pin along a Leaflet polyline, feeding live coordinate pins to the customer map via websockets.
- **Zero-Config Fallbacks**: Automatic mock fallbacks for Stripe payments and LLM chatbot operations are active if external API tokens are missing from the `.env` configuration.

---

## 🚀 Setup & Execution Guide

### Prerequisite
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Database Seeding
First, seed the database with mock restaurants, customers, riders, and menu items:
```bash
cd backend
npm run seed
```
*(The seeder will log out test credentials for all four roles.)*

### 2. Launch Backend
Start the Express + Socket.IO server:
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Launch Frontend
In a new terminal shell:
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔑 Default Test Accounts
- **Customer**: `customer@test.com` (password: `password123`)
- **Restaurant**: `restaurant1@test.com` (password: `password123`)
- **Delivery Rider**: `delivery1@test.com` (password: `password123`)
- **Admin**: `admin@test.com` (password: `password123`)
