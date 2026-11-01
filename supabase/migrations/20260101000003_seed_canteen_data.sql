-- ====================================================================
-- MIGRATION 04: Seed Canteen Menu Data
-- Inserts 8 canteen food categories and 18+ delicious campus dishes
-- Safe to re-run (idempotent ON CONFLICT handling)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. SEED FOOD CATEGORIES
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

-- --------------------------------------------------------------------
-- 2. SEED CANTEEN PRODUCTS
-- --------------------------------------------------------------------
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

    -- Fast Food
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Crispy Peri Peri Fries') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Crispy Peri Peri Fries', 'Golden hand-cut potato fries tossed in spicy peri peri seasonings with cheesy dip', 60.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', fast_id, true, true, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Pav Bhaji Special') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Pav Bhaji Special', '2 butter-toasted pavs served with thick spiced potato-tomato vegetable mash, chopped onions, and lemon', 80.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', fast_id, true, true, 10);
    END IF;

    -- Pizza
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Double Cheese Margherita Pizza') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Double Cheese Margherita Pizza', 'Crispy thin crust topped with signature tangy marinara, mozzarella cheese blend, and fresh basil herbs', 140.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', pizza_id, true, true, 15);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Farmhouse Veggie Pizza') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Farmhouse Veggie Pizza', 'Loaded with crisp capsicum, diced sweet corn, red onions, mushrooms, and melted mozzarella cheese', 160.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80', pizza_id, true, true, 15);
    END IF;

    -- Burgers
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Classic Veggie Aloo Tikki Burger') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Classic Veggie Aloo Tikki Burger', 'Crispy seasoned spiced aloo patty with crunchy lettuce, onions, and spicy mayo inside a sesame bun', 50.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', burger_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Spicy Paneer Tikka Burger') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Spicy Paneer Tikka Burger', 'Grilled marinate cottage cheese slice with mint chutney, sliced tomatoes, jalapenos, and melted cheese', 75.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', burger_id, true, true, 12);
    END IF;

    -- Sandwiches
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Bombay Grilled Cheese Sandwich') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Bombay Grilled Cheese Sandwich', 'Toasted triple-layer sandwich with mashed spiced potatoes, cucumber, beetroot, and cheese', 65.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', sand_id, true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Paneer Corn Cheese Club Sandwich') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Paneer Corn Cheese Club Sandwich', 'Fresh paneer cubes, golden sweet corn, oregano, and molten cheese grilled to golden perfection', 75.00, 'https://images.unsplash.com/photo-1628191081676-8f40d4ce6c44?auto=format&fit=crop&w=600&q=80', sand_id, true, true, 10);
    END IF;

    -- South Indian
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Crispy Masala Dosa') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Crispy Masala Dosa', 'Golden fermented rice-lentil crepe filled with spiced potato masala, served with coconut chutney and hot sambar', 60.00, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80', south_id, true, true, 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Idli Sambar Combo (3 Pcs)') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Idli Sambar Combo (3 Pcs)', 'Steamed fluffy rice cakes soaked in aromatic lentil sambar with freshly ground coconut chutney', 45.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', south_id, true, true, 5);
    END IF;

    -- Chinese
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Veg Hakka Noodles') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, spring onions, and soya garlic sauce', 80.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', chinese_id, true, true, 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chilli Paneer Dry') THEN
        INSERT INTO public.products (name, description, price, image_url, category_id, is_available, is_veg, preparation_time_mins)
        VALUES ('Chilli Paneer Dry', 'Crisp batter-fried cottage cheese cubes tossed in spicy soy-chilli gravy with crunchy bell peppers and onions', 110.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', chinese_id, true, true, 15);
    END IF;

    -- Beverages
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

    -- Snacks
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
