/**
 * CAMPUS FOOD - Checkout Logic & Order Placement
 */

import { getCart, calculateCartTotals, clearCart, showToast } from './cart.js';
import { getCurrentUser } from './auth.js';
import { createOrder } from './supabase.js';

let selectedPaymentMethod = 'Cash at Canteen';

document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (cart.length === 0) {
    renderEmptyCartNotice();
    return;
  }

  prefillStudentDetails();
  renderOrderSummary();
  setupPaymentMethodSelector();
  setupFormSubmission();
});

function renderEmptyCartNotice() {
  const checkoutSection = document.getElementById('checkout-main-area');
  if (checkoutSection) {
    checkoutSection.innerHTML = `
      <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light); max-width: 600px; margin: 2rem auto;">
        <span style="font-size: 3.5rem;">🛒</span>
        <h2 style="font-size: 1.5rem; margin-top: 1rem; font-weight: 800;">Your Food Cart is Empty</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin: 0.75rem auto 1.75rem; max-width: 420px;">
          You don't have any food items to order yet. Visit the canteen menu to add snacks, meals, or drinks!
        </p>
        <a href="/menu.html" class="btn-primary">Browse Canteen Menu</a>
      </div>
    `;
  }
}

function prefillStudentDetails() {
  const user = getCurrentUser();
  if (user) {
    const nameInp = document.getElementById('checkout-name');
    const rollInp = document.getElementById('checkout-roll');
    const phoneInp = document.getElementById('checkout-phone');

    if (nameInp && user.full_name) nameInp.value = user.full_name;
    if (rollInp && user.roll_number) rollInp.value = user.roll_number;
    if (phoneInp && user.phone) phoneInp.value = user.phone;
  }
}

function renderOrderSummary() {
  const itemsContainer = document.getElementById('checkout-items-list');
  const totals = calculateCartTotals();
  const cart = getCart();

  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.88rem;">
        <div>
          <span style="font-weight: 700; color: var(--text-primary);">${item.name}</span>
          <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">× ${item.quantity}</span>
        </div>
        <div style="font-weight: 700; color: var(--text-secondary);">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');
  }

  // Set amounts
  const subtotalEl = document.getElementById('summary-subtotal');
  const packagingEl = document.getElementById('summary-packaging');
  const discountRow = document.getElementById('summary-discount-row');
  const discountEl = document.getElementById('summary-discount');
  const totalEl = document.getElementById('summary-total');

  if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toFixed(2)}`;
  if (packagingEl) packagingEl.textContent = `₹${totals.packagingFee.toFixed(2)}`;
  
  if (discountRow && discountEl) {
    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-₹${totals.discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (totalEl) totalEl.textContent = `₹${totals.total.toFixed(2)}`;

  // Also update UPI QR amount if visible
  updateUpiDetails(totals.total);
}

function setupPaymentMethodSelector() {
  const methodRadios = document.querySelectorAll('input[name="payment_method"]');
  const upiBox = document.getElementById('upi-payment-details-box');

  methodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedPaymentMethod = e.target.value;
      if (upiBox) {
        upiBox.style.display = selectedPaymentMethod === 'UPI Payment' ? 'block' : 'none';
      }
    });
  });
}

function updateUpiDetails(amount) {
  const upiAmtEl = document.getElementById('upi-qr-amount');
  const upiQrImg = document.getElementById('upi-qr-image');
  
  if (upiAmtEl) upiAmtEl.textContent = `₹${amount.toFixed(2)}`;

  if (upiQrImg) {
    // Generate valid UPI standard URL:
    // upi://pay?pa=canteen.aktu@upi&pn=Campus%20Food%20Canteen&am=AMOUNT&cu=INR
    const upiUri = encodeURIComponent(`upi://pay?pa=canteen.aktu@upi&pn=CAMPUS%20FOOD%20Canteen&am=${amount}&cu=INR&tn=Canteen%20Order`);
    // Render QR using public high-reliability API
    upiQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${upiUri}&bgcolor=151d30&color=f97316&margin=6`;
  }
}

function setupFormSubmission() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('checkout-name').value.trim();
    const roll = document.getElementById('checkout-roll').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const pickupTime = document.getElementById('checkout-pickup-time').value;
    const notes = document.getElementById('checkout-notes')?.value.trim() || '';

    // Validation
    if (!name || name.length < 2) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!roll || roll.length < 3) {
      showToast('Please enter your valid AKTU Roll Number or Student ID', 'error');
      return;
    }
    if (!phone || !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      showToast('Please enter a valid 10-digit mobile number for order SMS/call', 'error');
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    const totals = calculateCartTotals();
    const currentUser = getCurrentUser();

    const submitBtn = document.getElementById('confirm-order-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳</span> Processing Order...`;
    }

    const orderPayload = {
      user_id: currentUser ? currentUser.id : null,
      student_name: name,
      roll_number: roll,
      phone: phone,
      pickup_time: pickupTime,
      total_amount: totals.total,
      payment_method: selectedPaymentMethod,
      payment_status: selectedPaymentMethod === 'UPI Payment' ? 'completed' : 'pending',
      notes: notes
    };

    try {
      const result = await createOrder(orderPayload, cart);
      if (result.success) {
        clearCart();
        showToast('🎉 Order Placed Successfully!', 'success');
        setTimeout(() => {
          window.location.href = `/tracking.html?orderId=${result.order.id}`;
        }, 800);
      } else {
        showToast(result.message || 'Failed to place order. Please try again.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Confirm & Place Order`;
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Confirm & Place Order`;
      }
    }
  });
}
