/**
 * CAMPUS FOOD - Shopping Cart Logic & Calculations
 */

const CART_STORAGE_KEY = 'campus_food_cart';
const COUPON_STORAGE_KEY = 'campus_food_applied_coupon';

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

export function getAppliedCoupon() {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function applyCoupon(code) {
  const clean = code.trim().toUpperCase();
  if (clean === 'AKTU10') {
    const coupon = { code: 'AKTU10', type: 'percent', value: 10, label: '10% AKTU Student Discount' };
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    return { success: true, coupon };
  } else if (clean === 'CAMPUSFOOD') {
    const coupon = { code: 'CAMPUSFOOD', type: 'flat', value: 20, label: '₹20 Welcome Canteen Off' };
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    return { success: true, coupon };
  }
  return { success: false, message: 'Invalid coupon code. Try AKTU10 or CAMPUSFOOD' };
}

export function removeCoupon() {
  localStorage.removeItem(COUPON_STORAGE_KEY);
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.product_id === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`Added ${product.name} to cart!`, 'success');
}

export function updateQuantity(productId, delta) {
  let cart = getCart();
  const index = cart.findIndex(item => item.product_id === productId);
  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
  return getCart();
}

export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.product_id !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(COUPON_STORAGE_KEY);
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
}

export function calculateCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const packagingFee = subtotal > 0 ? 5.00 : 0; // Nominal canteen packing charge ₹5
  
  const coupon = getAppliedCoupon();
  let discount = 0;
  if (coupon && subtotal > 0) {
    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal + packagingFee - discount);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    packagingFee,
    discount,
    coupon,
    total,
    itemCount: totalItemCount
  };
}

export function updateCartBadge() {
  const badge = document.getElementById('nav-cart-badge');
  if (badge) {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}
