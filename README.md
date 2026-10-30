# 🍔 CAMPUS FOOD – Smart College Canteen Food Ordering System

> **B.Tech 3rd Semester AKTU Web Development College Project**  
> **Course:** Web Technology & Development Lab  
> **Affiliation:** Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow  

---

## 📌 1. Project Overview

**CAMPUS FOOD** is a responsive, modern full-stack college canteen food ordering and live kitchen tracking web system. The primary goal is to empower university students to browse daily fresh canteen food items, filter by categories, customize quantities, apply student discount coupons, pay via Cash at the Counter or dynamic UPI QR code, and track their food preparation in real time with unique pickup tokens (e.g. `#CF-101`) to eliminate long canteen lunch queues.

---

## 🛠️ 2. Technology Stack

- **Frontend:** HTML5, CSS3 (Custom Responsive Design System with Dark Navy `#080c16` & Warm Orange `#f97316` accents), Vanilla JavaScript (ES6+ Modules).
- **Backend / Database:** 
  - Supabase PostgreSQL Relational Database (`profiles`, `categories`, `products`, `orders`, `order_items`)
  - Supabase Row Level Security (RLS) Policies
  - Supabase Authentication
  - Built-in High-Performance Local DB Engine (works 100% out-of-the-box with zero initial setup required, plus live switch to remote Supabase)

---

## 📁 3. Project Folder Structure

```
CAMPUS-FOOD/
│
├── index.html                  # Homepage (Hero, search, categories, featured, how it works)
├── menu.html                   # Food Menu (8 categories, search, sort, add-to-cart)
├── cart.html                   # Shopping Cart (+/- quantity, coupons, subtotal)
├── checkout.html               # Checkout (Student details, UPI QR / Cash, place order)
├── tracking.html               # Live Order Tracking (visual progress stepper, token)
├── login.html                  # Student Login (with 1-click evaluator demo fill)
├── register.html               # Student Registration (AKTU Roll Number, phone, email)
├── profile.html                # Student Profile Management
├── my-orders.html              # Student Order History (Token numbers, status, items)
│
├── admin/
│   ├── login.html              # Admin Portal Login (with 1-click evaluator demo fill)
│   ├── dashboard.html          # Admin Dashboard (Orders, Revenue, Products, Students)
│   ├── products.html           # Food Product Catalog (Add, edit, delete, live stock toggle)
│   ├── categories.html         # Food Category Manager
│   └── orders.html             # Kitchen Orders Management (Real-time status updates)
│
├── css/
│   ├── style.css               # Core theme, variables, cards, buttons, modals, toasts
│   ├── responsive.css          # Mobile-first breakpoints (1024px, 768px, 480px)
│   └── admin.css               # Admin dashboard layout, stats, tables, status pills
│
├── js/
│   ├── supabase.js             # Supabase client integration & storage engine
│   ├── auth.js                 # Authentication, role verification, session management
│   ├── app.js                  # Shared navbar, mobile toggle, Supabase config modal
│   ├── menu.js                 # Dynamic categories, live search, sorting, filtering
│   ├── cart.js                 # Shopping cart state, calculation, coupons, toasts
│   ├── checkout.js             # Order submission, dynamic UPI QR generation
│   ├── tracking.js             # Visual progress stepper, token lookup, live refresh
│   └── admin.js                # Metrics, products CRUD, inventory toggle, order updates
│
├── supabase-schema.sql         # Complete PostgreSQL schema, RLS policies, and seed data
└── README.md                   # Project documentation & evaluator guide
```

---

## 🔑 4. Demo Evaluation Accounts

For instant testing and evaluation without typing:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Student** | `student@campusfood.aktu.ac.in` | `Student@123` | Roll: `2300970100045`, Aryan Sharma |
| **Admin / Manager** | `admin@campusfood.aktu.ac.in` | `Admin@123` | Canteen Manager, Full Access |

*Note: Both login screens include a **"1-Click Fill"** button for instant evaluation.*

---

## 🚀 5. Quick Start & Setup Instructions

### Option A: Run in AI Studio / Local Dev
1. The project runs directly via Vite dev server on port `3000`.
2. Click the floating **"DB: Local Engine / Supabase"** badge at the bottom-left to inspect the active database state or connect your own remote Supabase project.

### Option B: Connect to a Live Supabase Project
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Copy and run the entire content of `supabase-schema.sql`.
4. Go to **Project Settings** -> **API** and copy:
   - `Project URL`
   - `Anon (public) Key`
5. Open the website, click the bottom-left DB badge (⚙️), paste your URL and Anon Key, and click **Save & Connect**.

---

## 🗄️ 6. Supabase Database Schema & RLS Policies

The database contains 5 core relational tables defined in `supabase-schema.sql`:

1. **`profiles`**
   - `id UUID PRIMARY KEY REFERENCES auth.users(id)`
   - `full_name TEXT NOT NULL`
   - `roll_number TEXT UNIQUE`
   - `phone TEXT`
   - `role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin'))`
   - `created_at TIMESTAMP`

2. **`categories`**
   - `id UUID PRIMARY KEY`
   - `name TEXT UNIQUE`
   - `image_url TEXT`
   - `created_at TIMESTAMP`

3. **`products`**
   - `id UUID PRIMARY KEY`
   - `name TEXT NOT NULL`
   - `description TEXT`
   - `price NUMERIC(10,2)`
   - `image_url TEXT`
   - `category_id UUID REFERENCES categories(id)`
   - `is_available BOOLEAN DEFAULT true`
   - `is_veg BOOLEAN DEFAULT true`
   - `preparation_time_mins INTEGER`

4. **`orders`**
   - `id UUID PRIMARY KEY`
   - `token_number TEXT NOT NULL` (e.g. `#CF-101`)
   - `user_id UUID REFERENCES auth.users(id)`
   - `student_name TEXT NOT NULL`
   - `roll_number TEXT`
   - `phone TEXT NOT NULL`
   - `pickup_time TEXT`
   - `total_amount NUMERIC(10,2)`
   - `payment_method TEXT` ('Cash at Canteen', 'UPI Payment')
   - `payment_status TEXT` ('pending', 'completed')
   - `order_status TEXT` ('Order Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled')
   - `notes TEXT`

5. **`order_items`**
   - `id UUID PRIMARY KEY`
   - `order_id UUID REFERENCES orders(id) ON DELETE CASCADE`
   - `product_id UUID REFERENCES products(id)`
   - `product_name TEXT NOT NULL`
   - `quantity INTEGER`
   - `price NUMERIC(10,2)`
   - `subtotal NUMERIC(10,2)`

### Row Level Security (RLS) Rules:
- **`profiles`**: Students can read/update their own profile. Admins can view all profiles using the `is_admin()` security definer function.
- **`categories` & `products`**: Public read access for all students. Only verified admins can insert, update, or delete products and categories.
- **`orders` & `order_items`**: Students can only view their own orders. Admins can view and update order kitchen statuses across the canteen.

---

## 🎟️ 7. Student Discounts & Coupons

- `AKTU10`: 10% Discount on the entire order subtotal.
- `CAMPUSFOOD`: Flat ₹20 Welcome Canteen Discount.

---

## ✅ 8. Testing Checklist

- [x] **Homepage Navigation:** Brand logo, sticky header, hero search, category links, featured items.
- [x] **Canteen Menu:** 8 categories filterable (Fast Food, Pizza, Burgers, Sandwiches, South Indian, Chinese, Beverages, Snacks).
- [x] **Live Search & Sort:** Real-time dish search and sorting by Price (Low/High) and Name.
- [x] **Shopping Cart:** Add item, increase/decrease quantity, remove item, subtotal & fee breakdown.
- [x] **Coupon Code:** Apply `AKTU10` or `CAMPUSFOOD` with instant discount calculation.
- [x] **Checkout:** Student details validation, pickup time selection, Cash or real dynamic UPI QR generation.
- [x] **Order Placement:** Generates unique Token Number (e.g. `#CF-104`) and saves order.
- [x] **Live Order Tracking:** 5-step visual progress bar (`Order Placed` -> `Accepted` -> `Preparing` -> `Ready for Pickup` -> `Completed`).
- [x] **Student Authentication:** Registration, login, profile editing, and my orders history.
- [x] **Admin Dashboard:** Total orders, revenue in ₹, active items, registered students.
- [x] **Admin Products:** Add new dish, edit, delete, and instant In Stock / Sold Out toggle.
- [x] **Admin Orders:** Live status dropdown selector that updates student tracking in real time.
- [x] **Mobile Responsiveness:** Drawer navigation and mobile-first layouts tested across mobile, tablet, and desktop.
