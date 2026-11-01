-- ====================================================================
-- CAMPUS FOOD – Smart College Canteen Food Ordering System
-- AKTU B.Tech Web Development Project
-- Complete Supabase PostgreSQL Database Schema, RLS Policies, & Seed Data
-- ====================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com
-- 2. Navigate to "SQL Editor" on the left menu -> Click "New Query"
-- 3. Paste this entire file contents and click "Run"
-- ====================================================================

-- Enable necessary Postgres extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    roll_number TEXT UNIQUE,
    phone TEXT,
    branch TEXT,
    year_semester TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_veg BOOLEAN DEFAULT true,
    preparation_time_mins INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. ORDERS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    roll_number TEXT,
    phone TEXT NOT NULL,
    pickup_time TEXT DEFAULT 'ASAP (15-20 mins)',
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    subtotal_amount NUMERIC(10,2) DEFAULT 0 CHECK (subtotal_amount >= 0),
    packaging_fee NUMERIC(10,2) DEFAULT 5.00 CHECK (packaging_fee >= 0),
    discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash at Canteen', 'UPI Payment')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    order_status TEXT NOT NULL DEFAULT 'Order Placed' CHECK (order_status IN ('Order Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 5. ORDER_ITEMS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. INDEXES FOR HIGH-PERFORMANCE CANTEEN SEARCH & LOOKUP
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_token ON public.orders(token_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_roll ON public.profiles(roll_number);

-- --------------------------------------------------------------------
-- 7. AUTOMATIC TIMESTAMP UPDATE TRIGGER (updated_at)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trigger_set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_products ON public.products;
CREATE TRIGGER trigger_set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- --------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper security definer function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile or admin reads all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin reads all" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Categories Policies
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" 
ON public.categories FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Only admins can insert categories" ON public.categories;
CREATE POLICY "Only admins can insert categories" 
ON public.categories FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update categories" ON public.categories;
CREATE POLICY "Only admins can update categories" 
ON public.categories FOR UPDATE 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete categories" ON public.categories;
CREATE POLICY "Only admins can delete categories" 
ON public.categories FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" 
ON public.products FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
CREATE POLICY "Only admins can insert products" 
ON public.products FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
CREATE POLICY "Only admins can update products" 
ON public.products FOR UPDATE 
TO authenticated 
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Only admins can delete products" 
ON public.products FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Users view own orders or admin views all" ON public.orders;
CREATE POLICY "Users view own orders or admin views all" 
ON public.orders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can place orders" ON public.orders;
CREATE POLICY "Users can place orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins or owners can update orders" ON public.orders;
CREATE POLICY "Admins or owners can update orders" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (
  public.is_admin() OR 
  (auth.uid() = user_id AND order_status = 'Order Placed')
);

-- Order Items Policies
DROP POLICY IF EXISTS "Users view own order items or admin views all" ON public.order_items;
CREATE POLICY "Users view own order items or admin views all" 
ON public.order_items FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" 
ON public.order_items FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- --------------------------------------------------------------------
-- 9. AUTO-SYNC NEW AUTH USERS TO PROFILES VIA TRIGGER
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    roll_number, 
    phone, 
    branch, 
    year_semester, 
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', 'AKTU' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', 'Computer Science & Engineering'),
    COALESCE(NEW.raw_user_meta_data->>'year_semester', '3rd Semester (2nd Year)'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 10. SEED DATA: 8 CATEGORIES & 18+ DELICIOUS CANTEEN DISHES
-- --------------------------------------------------------------------
INSERT INTO public.categories (name, image_url) VALUES
('Fast Food', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=80'),
('Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'),
('Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'),
('Sandwiches', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'),
('South Indian', 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80'),
('Chinese', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'),
('Beverages', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80'),
('Snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url;

DO $$
DECLARE
    fast_id UUID;
    pizza_id UUID;
    burger_id UUID;
    sand_id UUID;
    south_id UUID;
    chinese_id UUID;
    bev_id UUID;
    snack_id UUID;
BEGIN
    SELECT id INTO fast_id FROM public.categories WHERE name = 'Fast Food';
    SELECT id INTO pizza_id FROM public.categories WHERE name = 'Pizza';
    SELECT id INTO burger_id FROM public.categories WHERE name = 'Burgers';
    SELECT id INTO sand_id FROM public.categories WHERE name = 'Sandwiches';
    SELECT id INTO south_id FROM public.categories WHERE name = 'South Indian';
    SELECT id INTO chinese_id FROM public.categories WHERE name = 'Chinese';
    SELECT id INTO bev_id FROM public.categories WHERE name = 'Beverages';
    SELECT id INTO snack_id FROM public.categories WHERE name = 'Snacks';

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Crispy Peri Peri Fries') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Crispy Peri Peri Fries', 'Golden hand-cut potato fries tossed in spicy peri peri seasonings with cheesy dip', 60.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', fast_id, true, true, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Pav Bhaji Special') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Pav Bhaji Special', '2 butter-toasted pavs served with thick spiced potato-tomato vegetable mash, chopped onions, and lemon', 80.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', fast_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Double Cheese Margherita Pizza') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Double Cheese Margherita Pizza', 'Crispy thin crust topped with signature tangy marinara, mozzarella cheese blend, and fresh basil herbs', 140.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', pizza_id, true, true, 15);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Farmhouse Veggie Pizza') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Farmhouse Veggie Pizza', 'Loaded with crisp capsicum, diced sweet corn, red onions, mushrooms, and melted mozzarella cheese', 160.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80', pizza_id, true, true, 15);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Classic Veggie Aloo Tikki Burger') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Classic Veggie Aloo Tikki Burger', 'Crispy seasoned spiced aloo patty with crunchy lettuce, onions, and spicy mayo inside a sesame bun', 50.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', burger_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Spicy Paneer Tikka Burger') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Spicy Paneer Tikka Burger', 'Grilled marinate cottage cheese slice with mint chutney, sliced tomatoes, jalapenos, and melted cheese', 75.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', burger_id, true, true, 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Bombay Grilled Cheese Sandwich') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Bombay Grilled Cheese Sandwich', 'Toasted triple-layer sandwich with mashed spiced potatoes, cucumber, beetroot, and cheese', 65.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', sand_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Paneer Corn Cheese Club Sandwich') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Paneer Corn Cheese Club Sandwich', 'Fresh paneer cubes, golden sweet corn, oregano, and molten cheese grilled to golden perfection', 75.00, 'https://images.unsplash.com/photo-1628191081676-8f40d4ce6c44?auto=format&fit=crop&w=600&q=80', sand_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Crispy Masala Dosa') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Crispy Masala Dosa', 'Golden fermented rice-lentil crepe filled with spiced potato masala, served with coconut chutney and hot sambar', 60.00, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80', south_id, true, true, 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Idli Sambar Combo (3 Pcs)') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Idli Sambar Combo (3 Pcs)', 'Steamed fluffy rice cakes soaked in aromatic lentil sambar with freshly ground coconut chutney', 45.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', south_id, true, true, 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Veg Hakka Noodles') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, spring onions, and soya garlic sauce', 80.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', chinese_id, true, true, 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chilli Paneer Dry') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Chilli Paneer Dry', 'Crisp batter-fried cottage cheese cubes tossed in spicy soy-chilli gravy with crunchy bell peppers and onions', 110.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', chinese_id, true, true, 15);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cold Coffee with Vanilla Scoop') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Cold Coffee with Vanilla Scoop', 'Chilled creamy blended espresso milk topped with a rich vanilla ice cream scoop and chocolate drizzle', 50.00, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80', bev_id, true, true, 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Kulhad Adrak Masala Chai') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Kulhad Adrak Masala Chai', 'Traditional hot brewed milk tea with crushed ginger, cardamom, and aromatic spices served in earthen clay cup', 20.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', bev_id, true, true, 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Sweet Punjabi Lassi') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Sweet Punjabi Lassi', 'Chilled thick whipped yogurt beverage topped with saffron, cardamom, and fresh malai layer', 40.00, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80', bev_id, true, true, 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Hot Samosa with Mint & Saunth Chutney (2 Pcs)') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Hot Samosa with Mint & Saunth Chutney (2 Pcs)', 'Crispy flaky crust stuffed with spicy potato green peas filling served with fresh coriander mint chutney', 30.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', snack_id, true, true, 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chole Bhature (2 Pcs)') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Chole Bhature (2 Pcs)', 'Puffy deep-fried sourdough breads served with spiced Amritsari chickpea curry, pickled onions, and green chilli', 90.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', snack_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Veg Spring Rolls (6 Pcs)') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Veg Spring Rolls (6 Pcs)', 'Golden crispy rolls packed with seasoned julienned veggies, served with sweet chilli dipping sauce', 70.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', snack_id, true, true, 10);
    END IF;
END $$;
