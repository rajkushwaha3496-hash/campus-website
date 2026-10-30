/**
 * CAMPUS FOOD - Real-time Order Tracking Logic
 */

import { fetchOrderDetails } from './supabase.js';

const STATUS_STEPS = ['Order Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed'];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let orderId = urlParams.get('orderId');

  const searchForm = document.getElementById('tracking-search-form');
  const searchInput = document.getElementById('tracking-input-id');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        window.location.search = `?orderId=${encodeURIComponent(val)}`;
      }
    });
  }

  if (orderId) {
    if (searchInput) searchInput.value = orderId;
    await loadOrderTracking(orderId);
  } else {
    // Show placeholder prompting user to enter Order ID / Token
    showSearchPrompt();
  }

  // Refresh button
  document.getElementById('btn-refresh-status')?.addEventListener('click', () => {
    if (orderId) {
      loadOrderTracking(orderId, true);
    }
  });
});

function showSearchPrompt() {
  const container = document.getElementById('tracking-details-card');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
        <span style="font-size: 3rem;">🔍</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-top: 0.75rem;">Enter Your Order ID or Token</h3>
        <p style="font-size: 0.88rem; max-width: 420px; margin: 0.5rem auto 1.5rem;">
          Enter the token number (e.g., #CF-101) or order ID from your confirmation receipt to track its live preparation progress.
        </p>
      </div>
    `;
  }
}

async function loadOrderTracking(orderId, isRefresh = false) {
  const container = document.getElementById('tracking-details-card');
  if (!container) return;

  if (!isRefresh) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
        <div style="display:inline-block; width:36px; height:36px; border:3px solid var(--accent-orange); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
        <p style="margin-top: 1rem; font-size: 0.9rem;">Fetching live order status from canteen kitchen...</p>
      </div>
    `;
  }

  const { order, items } = await fetchOrderDetails(orderId);

  if (!order) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
        <span style="font-size: 3rem;">⚠️</span>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-top: 0.75rem;">Order Not Found</h3>
        <p style="font-size: 0.88rem; max-width: 420px; margin: 0.5rem auto 1.5rem;">
          We couldn't locate any order matching "${orderId}". Please verify your Token or Order ID.
        </p>
        <a href="/my-orders.html" class="btn-primary" style="font-size: 0.85rem;">View My Orders</a>
      </div>
    `;
    return;
  }

  renderTrackingCard(container, order, items);
}

function renderTrackingCard(container, order, items) {
  const isCancelled = order.order_status === 'Cancelled';
  const currentStepIdx = STATUS_STEPS.indexOf(order.order_status);
  
  // Calculate progress percentage
  const progressPercent = isCancelled ? 0 : Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100);

  const stepIcons = ['📝', '👨‍🍳', '🍳', '🔔', '✅'];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle);">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.6rem; font-weight: 900; color: var(--accent-orange); font-family: monospace;">${order.token_number}</span>
          <span class="status-pill status-${order.order_status.toLowerCase().replace(/\s+/g, '-')}">${order.order_status}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">
          Order ID: <span class="break-anywhere order-id-label" style="font-family: monospace; color: var(--text-secondary);">${order.id}</span> • Placed: ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button id="btn-refresh-status" class="btn-secondary" style="font-size: 0.82rem; padding: 0.45rem 0.95rem;">
          🔄 Refresh Status
        </button>
      </div>
    </div>

    ${isCancelled ? `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1.5px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-bottom: 2rem;">
        <span style="font-size: 2rem;">🚫</span>
        <h4 style="color: #f87171; font-weight: 800; font-size: 1.1rem; margin: 0.4rem 0;">This Order Was Cancelled</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem;">If you have any questions, please contact the canteen counter.</p>
      </div>
    ` : `
      <!-- Stepper Component -->
      <div class="tracking-stepper">
        <div class="tracking-stepper-progress" style="width: ${progressPercent}%; height: ${progressPercent}%;"></div>
        ${STATUS_STEPS.map((step, idx) => {
          let nodeClass = '';
          if (idx < currentStepIdx) nodeClass = 'completed';
          else if (idx === currentStepIdx) nodeClass = 'current';

          return `
            <div class="step-node ${nodeClass}">
              <div class="step-bubble">
                ${idx <= currentStepIdx ? stepIcons[idx] : idx + 1}
              </div>
              <span class="step-node-label">${step}</span>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <!-- Pick up info notice box -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--accent-orange-subtle); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
          📍
        </div>
        <div>
          <div style="font-weight: 700; font-size: 0.95rem;">Canteen Counter: Window 2 (Express Food Delivery)</div>
          <div style="color: var(--text-muted); font-size: 0.82rem;">Show Token <strong>${order.token_number}</strong> at the collection window when status is "Ready for Pickup".</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 0.78rem; color: var(--text-muted);">Scheduled Pickup</div>
        <div style="font-weight: 800; color: var(--accent-orange); font-size: 0.95rem;">${order.pickup_time || 'ASAP (15-20 mins)'}</div>
      </div>
    </div>

    <!-- Order Items Breakdown -->
    <div style="margin-top: 1.5rem;">
      <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-primary);">Order Items (${items.length})</h4>
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 1rem;">
        ${items.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.88rem;">
            <div>
              <span style="font-weight: 700; color: var(--text-primary);">${item.product_name}</span>
              <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 8px;">× ${item.quantity}</span>
            </div>
            <div style="font-weight: 800; color: var(--text-secondary);">₹${Number(item.subtotal || item.price * item.quantity).toFixed(2)}</div>
          </div>
        `).join('')}

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.85rem; margin-top: 0.25rem;">
          <span style="font-size: 0.9rem; color: var(--text-muted);">Payment: <strong style="color: var(--text-primary);">${order.payment_method}</strong> (${order.payment_status.toUpperCase()})</span>
          <span style="font-size: 1.15rem; font-weight: 900; color: var(--accent-orange);">Total: ₹${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  // Re-attach refresh event listener
  document.getElementById('btn-refresh-status')?.addEventListener('click', () => {
    loadOrderTracking(order.id, true);
  });
}
