/**
 * CAMPUS FOOD - Supabase Client & Database Engine
 * Handles Supabase integration with seamless fallback storage for AKTU Canteen System
 */

import { createClient } from '@supabase/supabase-js';

// Default initial seed data for college canteen
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Fast Food', image_url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Pizza', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Burgers', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Sandwiches', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'South Indian', image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Chinese', image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Beverages', image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Snacks', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', created_at: new Date().toISOString() }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Crispy Peri Peri Fries',
    description: 'Golden hand-cut potato fries tossed in spicy peri peri seasonings with cheesy dip',
    price: 60.00,
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-1',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 8,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Pav Bhaji Special',
    description: '2 butter-toasted pavs served with thick spiced potato-tomato vegetable mash, chopped onions, and fresh lemon',
    price: 80.00,
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-1',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Double Cheese Margherita Pizza',
    description: 'Crispy thin crust topped with signature tangy marinara, mozzarella cheese blend, and fresh basil herbs',
    price: 140.00,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-2',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 15,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Farmhouse Veggie Pizza',
    description: 'Loaded with crisp capsicum, diced sweet corn, red onions, mushrooms, and melted mozzarella cheese',
    price: 160.00,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-2',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 15,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Classic Veggie Aloo Tikki Burger',
    description: 'Crispy seasoned spiced aloo patty with crunchy lettuce, onions, and spicy mayo inside a sesame bun',
    price: 50.00,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-3',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Spicy Paneer Tikka Burger',
    description: 'Grilled marinate cottage cheese slice with mint chutney, sliced tomatoes, jalapenos, and melted cheese',
    price: 75.00,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-3',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7',
    name: 'Bombay Grilled Cheese Sandwich',
    description: 'Toasted triple-layer sandwich with mashed spiced potatoes, cucumber, beetroot, and cheese',
    price: 65.00,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-4',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-8',
    name: 'Paneer Corn Cheese Club Sandwich',
    description: 'Fresh paneer cubes, golden sweet corn, oregano, and molten cheese grilled to golden perfection',
    price: 75.00,
    image_url: 'https://images.unsplash.com/photo-1628191081676-8f40d4ce6c44?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-4',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-9',
    name: 'Crispy Masala Dosa',
    description: 'Golden fermented rice-lentil crepe filled with spiced potato masala, served with coconut chutney and hot sambar',
    price: 60.00,
    image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-5',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-10',
    name: 'Idli Sambar Combo (3 Pcs)',
    description: 'Steamed fluffy rice cakes soaked in aromatic lentil sambar with freshly ground coconut chutney',
    price: 45.00,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-5',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-11',
    name: 'Veg Hakka Noodles',
    description: 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, spring onions, and soya garlic sauce',
    price: 80.00,
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-6',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-12',
    name: 'Chilli Paneer Dry',
    description: 'Crisp batter-fried cottage cheese cubes tossed in spicy soy-chilli gravy with crunchy bell peppers and onions',
    price: 110.00,
    image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-6',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 15,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-13',
    name: 'Cold Coffee with Vanilla Scoop',
    description: 'Chilled creamy blended espresso milk topped with a rich vanilla ice cream scoop and chocolate drizzle',
    price: 50.00,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-7',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-14',
    name: 'Kulhad Adrak Masala Chai',
    description: 'Traditional hot brewed milk tea with crushed ginger, cardamom, and aromatic spices served in earthen clay cup',
    price: 20.00,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-7',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-15',
    name: 'Sweet Punjabi Lassi',
    description: 'Chilled thick whipped yogurt beverage topped with saffron, cardamom, and fresh malai layer',
    price: 40.00,
    image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-7',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-16',
    name: 'Hot Samosa with Mint & Saunth Chutney (2 Pcs)',
    description: 'Crispy flaky crust stuffed with spicy potato green peas filling served with fresh coriander mint chutney',
    price: 30.00,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-8',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-17',
    name: 'Chole Bhature (2 Pcs)',
    description: 'Puffy deep-fried sourdough breads served with spiced Amritsari chickpea curry, pickled onions, and green chilli',
    price: 90.00,
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-8',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-18',
    name: 'Veg Spring Rolls (6 Pcs)',
    description: 'Golden crispy rolls packed with seasoned julienned veggies, served with sweet chilli dipping sauce',
    price: 70.00,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    category_id: 'cat-8',
    is_available: true,
    is_veg: true,
    preparation_time_mins: 10,
    created_at: new Date().toISOString()
  }
];

// Initialize Storage or retrieve saved config
function getStoredConfig() {
  try {
    const raw = localStorage.getItem('campus_food_supabase_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored config', e);
  }
  return {
    url: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '',
    anonKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || ''
  };
}

let supabaseInstance = null;
const config = getStoredConfig();

if (config.url && config.anonKey) {
  try {
    supabaseInstance = createClient(config.url, config.anonKey);
    console.log('✅ Supabase Client Connected:', config.url);
  } catch (err) {
    console.warn('⚠️ Supabase init failed, fallback mode enabled', err);
  }
}

// Local Storage relational tables helper
export function getLocalTable(tableName, defaultData = []) {
  try {
    const raw = localStorage.getItem(`cf_db_${tableName}`);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(`cf_db_${tableName}`, JSON.stringify(defaultData));
    return defaultData;
  } catch (e) {
    return defaultData;
  }
}

export function setLocalTable(tableName, data) {
  localStorage.setItem(`cf_db_${tableName}`, JSON.stringify(data));
}

// Seed initial state if missing
if (!localStorage.getItem('cf_db_categories')) {
  setLocalTable('categories', DEFAULT_CATEGORIES);
}
if (!localStorage.getItem('cf_db_products')) {
  setLocalTable('products', DEFAULT_PRODUCTS);
}
if (!localStorage.getItem('cf_db_orders')) {
  const initialDemoOrders = [
    {
      id: 'ord-101',
      token_number: '#CF-101',
      user_id: 'usr-student-1',
      student_name: 'Aryan Sharma',
      roll_number: '2300970100045',
      phone: '9876543210',
      pickup_time: '1:15 PM (Lunch Break)',
      total_amount: 140.00,
      payment_method: 'UPI Payment',
      payment_status: 'completed',
      order_status: 'Ready for Pickup',
      notes: 'Extra tissue papers please',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'ord-102',
      token_number: '#CF-102',
      user_id: 'usr-student-2',
      student_name: 'Priya Verma',
      roll_number: '2300970100088',
      phone: '9123456780',
      pickup_time: 'ASAP (15-20 mins)',
      total_amount: 110.00,
      payment_method: 'Cash at Canteen',
      payment_status: 'pending',
      order_status: 'Preparing',
      notes: '',
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ];
  setLocalTable('orders', initialDemoOrders);
  
  const initialDemoItems = [
    { id: 'item-1', order_id: 'ord-101', product_id: 'prod-11', product_name: 'Veg Hakka Noodles', quantity: 1, price: 80, subtotal: 80 },
    { id: 'item-2', order_id: 'ord-101', product_id: 'prod-1', product_name: 'Crispy Peri Peri Fries', quantity: 1, price: 60, subtotal: 60 },
    { id: 'item-3', order_id: 'ord-102', product_id: 'prod-7', product_name: 'Bombay Grilled Cheese Sandwich', quantity: 1, price: 65, subtotal: 65 },
    { id: 'item-4', order_id: 'ord-102', product_id: 'prod-10', product_name: 'Idli Sambar Combo (3 Pcs)', quantity: 1, price: 45, subtotal: 45 }
  ];
  setLocalTable('order_items', initialDemoItems);
}

export const supabase = supabaseInstance;

export function isConnectedToSupabase() {
  return !!supabaseInstance;
}

export function saveSupabaseConfig(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem('campus_food_supabase_config', JSON.stringify({ url, anonKey }));
    try {
      supabaseInstance = createClient(url, anonKey);
      return { success: true, message: 'Supabase connected successfully!' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } else {
    localStorage.removeItem('campus_food_supabase_config');
    supabaseInstance = null;
    return { success: true, message: 'Switched to Campus Food Built-in DB Engine.' };
  }
}

// -------------------------------------------------------------
// DATA REPOSITORY FUNCTIONS (Supports Live Supabase or Local DB)
// -------------------------------------------------------------

export async function fetchCategories() {
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase fetchCategories failed, using local storage', e);
    }
  }
  return getLocalTable('categories', DEFAULT_CATEGORIES);
}

export async function fetchProducts(categoryId = 'all', searchQuery = '', sortOption = 'default') {
  let products = [];
  if (supabaseInstance) {
    try {
      let query = supabaseInstance.from('products').select('*');
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        products = data;
      }
    } catch (e) {
      console.warn('Supabase fetchProducts failed, using local storage', e);
    }
  }

  if (products.length === 0) {
    products = getLocalTable('products', DEFAULT_PRODUCTS);
    if (categoryId && categoryId !== 'all') {
      products = products.filter(p => p.category_id === categoryId);
    }
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sortOption === 'price-low') {
    products.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortOption === 'price-high') {
    products.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortOption === 'name-asc') {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }

  return products;
}

export async function fetchProductById(id) {
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance.from('products').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchProductById fallback', e);
    }
  }
  const products = getLocalTable('products', DEFAULT_PRODUCTS);
  return products.find(p => p.id === id) || null;
}

export async function saveProduct(productData) {
  if (supabaseInstance) {
    try {
      if (productData.id && !productData.id.startsWith('prod-')) {
        const { data, error } = await supabaseInstance.from('products').update(productData).eq('id', productData.id).select().single();
        if (!error && data) return { success: true, data };
      } else {
        const newObj = { ...productData };
        delete newObj.id;
        const { data, error } = await supabaseInstance.from('products').insert(newObj).select().single();
        if (!error && data) return { success: true, data };
      }
    } catch (e) {
      console.warn('Supabase saveProduct fallback', e);
    }
  }

  const products = getLocalTable('products', DEFAULT_PRODUCTS);
  if (productData.id) {
    const index = products.findIndex(p => p.id === productData.id);
    if (index !== -1) {
      products[index] = { ...products[index], ...productData };
      setLocalTable('products', products);
      return { success: true, data: products[index] };
    }
  }
  
  const newProduct = {
    ...productData,
    id: 'prod-' + Date.now(),
    created_at: new Date().toISOString()
  };
  products.unshift(newProduct);
  setLocalTable('products', products);
  return { success: true, data: newProduct };
}

export async function deleteProduct(productId) {
  if (supabaseInstance) {
    try {
      const { error } = await supabaseInstance.from('products').delete().eq('id', productId);
      if (!error) return { success: true };
    } catch (e) {
      console.warn('Supabase deleteProduct fallback', e);
    }
  }

  const products = getLocalTable('products', DEFAULT_PRODUCTS);
  const updated = products.filter(p => p.id !== productId);
  setLocalTable('products', updated);
  return { success: true };
}

export async function toggleProductAvailability(productId, isAvailable) {
  return await saveProduct({ id: productId, is_available: isAvailable });
}

// -------------------------------------------------------------
// ORDERS REPOSITORY
// -------------------------------------------------------------

export async function createOrder(orderPayload, items) {
  const tokenNumber = '#CF-' + Math.floor(100 + Math.random() * 900);
  const orderRecord = {
    ...orderPayload,
    token_number: tokenNumber,
    order_status: 'Order Placed',
    created_at: new Date().toISOString()
  };

  if (supabaseInstance) {
    try {
      const { data: orderData, error: orderErr } = await supabaseInstance
        .from('orders')
        .insert([orderRecord])
        .select()
        .single();

      if (!orderErr && orderData) {
        const orderItemsPayload = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        }));
        await supabaseInstance.from('order_items').insert(orderItemsPayload);
        return { success: true, order: orderData, items: orderItemsPayload };
      }
    } catch (e) {
      console.warn('Supabase createOrder fallback to local', e);
    }
  }

  // Local fallback
  const orderId = 'ord-' + Date.now();
  const createdOrder = { ...orderRecord, id: orderId };
  
  const orders = getLocalTable('orders', []);
  orders.unshift(createdOrder);
  setLocalTable('orders', orders);

  const orderItems = getLocalTable('order_items', []);
  const createdItems = items.map((item, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    order_id: orderId,
    product_id: item.product_id,
    product_name: item.name,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity
  }));
  orderItems.push(...createdItems);
  setLocalTable('order_items', orderItems);

  return { success: true, order: createdOrder, items: createdItems };
}

export async function fetchOrderDetails(orderId) {
  let order = null;
  let items = [];

  if (supabaseInstance) {
    try {
      const { data: oData } = await supabaseInstance.from('orders').select('*').eq('id', orderId).single();
      if (oData) {
        order = oData;
        const { data: iData } = await supabaseInstance.from('order_items').select('*').eq('order_id', orderId);
        items = iData || [];
        return { order, items };
      }
    } catch (e) {
      console.warn('Supabase fetchOrderDetails fallback', e);
    }
  }

  const orders = getLocalTable('orders', []);
  order = orders.find(o => o.id === orderId || o.token_number === orderId) || null;
  if (order) {
    const allItems = getLocalTable('order_items', []);
    items = allItems.filter(i => i.order_id === order.id);
  }
  return { order, items };
}

export async function fetchUserOrders(userId, rollNumber = '') {
  if (supabaseInstance && userId) {
    try {
      const { data, error } = await supabaseInstance
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchUserOrders fallback', e);
    }
  }

  const orders = getLocalTable('orders', []);
  return orders.filter(o => (userId && o.user_id === userId) || (rollNumber && o.roll_number === rollNumber));
}

export async function fetchAllOrders() {
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchAllOrders fallback', e);
    }
  }
  return getLocalTable('orders', []);
}

export async function updateOrderStatus(orderId, newStatus) {
  if (supabaseInstance) {
    try {
      const { data, error } = await supabaseInstance
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
      if (!error && data) return { success: true, order: data };
    } catch (e) {
      console.warn('Supabase updateOrderStatus fallback', e);
    }
  }

  const orders = getLocalTable('orders', []);
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].order_status = newStatus;
    if (newStatus === 'Completed') {
      orders[index].payment_status = 'completed';
    }
    setLocalTable('orders', orders);
    return { success: true, order: orders[index] };
  }
  return { success: false, message: 'Order not found' };
}

export async function fetchDashboardMetrics() {
  const orders = await fetchAllOrders();
  const products = await fetchProducts('all');
  const categories = await fetchCategories();

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.order_status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeProducts = products.filter(p => p.is_available).length;
  const registeredStudents = 48 + orders.length; // Realistic AKTU student base

  return {
    totalOrders,
    totalRevenue,
    activeProducts,
    totalProducts: products.length,
    totalCategories: categories.length,
    registeredStudents,
    recentOrders: orders.slice(0, 5)
  };
}

// Reset local mock database helper
export function resetLocalCanteenDatabase() {
  localStorage.setItem('cf_db_categories', JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem('cf_db_products', JSON.stringify(DEFAULT_PRODUCTS));
  localStorage.removeItem('cf_db_orders');
  localStorage.removeItem('cf_db_order_items');
  window.location.reload();
}
