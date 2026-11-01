-- ====================================================================
-- MIGRATION 02: Row Level Security (RLS) & Role-Based Access Control
-- Protects student personal orders and gives canteen managers full control
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. HELPER SECURITY DEFINER FUNCTION (Checks if current user is admin)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 4. CATEGORIES POLICIES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 5. PRODUCTS POLICIES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 6. ORDERS POLICIES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 7. ORDER_ITEMS POLICIES
-- --------------------------------------------------------------------
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
