# Supabase Migrations – Campus Food Canteen System

This directory contains the production-grade PostgreSQL migration scripts for the **CAMPUS FOOD** College Canteen Food Ordering System.

## Tables Included:
1. **`public.profiles`**: Linked to `auth.users`, stores student & admin information (`id`, `full_name`, `roll_number`, `phone`, `branch`, `year_semester`, `role`, timestamps).
2. **`public.categories`**: Food categories (`Fast Food`, `Pizza`, `Burgers`, `Sandwiches`, `South Indian`, `Chinese`, `Beverages`, `Snacks`).
3. **`public.products`**: Canteen menu items (`name`, `description`, `price`, `image_url`, `category_id`, `is_available`, `is_veg`, `preparation_time_mins`).
4. **`public.orders`**: Student orders & tokens (`token_number`, `user_id`, `student_name`, `roll_number`, `phone`, `pickup_time`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `notes`).
5. **`public.order_items`**: Individual items per order (`order_id`, `product_id`, `product_name`, `quantity`, `price`, `subtotal`).

---

## Migration Scripts Order:

| File | Purpose |
|---|---|
| `20260101000000_create_canteen_schema.sql` | Creates all 5 tables, foreign keys, indexes, and updated_at triggers |
| `20260101000001_row_level_security.sql` | Configures RLS policies for public visitors, students, and canteen managers |
| `20260101000002_user_auth_sync_trigger.sql` | Syncs new Supabase Auth sign-ups into `public.profiles` automatically |
| `20260101000003_seed_canteen_data.sql` | Populates the 8 categories and 18+ popular canteen dishes |

---

## How to Apply Migrations:

### Method 1: Using the Supabase Web Dashboard (Recommended for 1-Click Setup)
1. Go to [supabase.com](https://supabase.com) and open your project dashboard.
2. Click **SQL Editor** in the left sidebar -> **New Query**.
3. Open `/supabase-schema.sql` from the root of this project (which combines all migrations into a single file) or run each migration file in order.
4. Click **Run**. All tables, indexes, triggers, RLS policies, and seed dishes will be created immediately!

### Method 2: Using the Supabase CLI
```bash
# Link your local project to your remote Supabase project
supabase link --project-ref your-project-id

# Push all migrations to your remote Supabase database
supabase db push
```
