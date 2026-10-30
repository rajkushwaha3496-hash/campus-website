/**
 * CAMPUS FOOD - Admin Panel Logic
 * Manages metrics, orders, products, categories, and inventory availability
 */

import { requireAdmin, getCurrentUser, logoutUser } from './auth.js';
import { 
  fetchDashboardMetrics, 
  fetchAllOrders, 
  fetchOrderDetails,
  updateOrderStatus, 
  fetchProducts, 
  saveProduct, 
  deleteProduct, 
  toggleProductAvailability,
  fetchCategories,
  getLocalTable,
  setLocalTable
} from './supabase.js';
import { showToast } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce admin permission check
  const adminUser = requireAdmin('/admin/login.html');
  if (!adminUser) return;

  setupAdminHeader(adminUser);
  setupAdminSidebarToggle();

  const path = window.location.pathname;

  if (path.includes('dashboard.html')) {
    await initAdminDashboard();
  } else if (path.includes('products.html')) {
    await initAdminProducts();
  } else if (path.includes('categories.html')) {
    await initAdminCategories();
  } else if (path.includes('orders.html')) {
    await initAdminOrders();
  }
});

function setupAdminHeader(adminUser) {
  const adminNameEl = document.getElementById('admin-user-name');
  if (adminNameEl) {
    adminNameEl.textContent = adminUser.full_name || 'Canteen Manager';
  }

  document.getElementById('admin-logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Log out from Admin Dashboard?')) {
      logoutUser();
    }
  });
}

function setupAdminSidebarToggle() {
  const toggleBtn = document.getElementById('admin-sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    sidebar.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.remove('open');
        }
      });
    });
  }
}

// -------------------------------------------------------------
// 1. ADMIN DASHBOARD
// -------------------------------------------------------------
async function initAdminDashboard() {
  const metrics = await fetchDashboardMetrics();

  const totalOrdersEl = document.getElementById('stat-total-orders');
  const totalRevenueEl = document.getElementById('stat-total-revenue');
  const activeProductsEl = document.getElementById('stat-active-products');
  const totalStudentsEl = document.getElementById('stat-total-students');

  if (totalOrdersEl) totalOrdersEl.textContent = metrics.totalOrders;
  if (totalRevenueEl) totalRevenueEl.textContent = `₹${metrics.totalRevenue.toLocaleString()}`;
  if (activeProductsEl) activeProductsEl.textContent = `${metrics.activeProducts}/${metrics.totalProducts}`;
  if (totalStudentsEl) totalStudentsEl.textContent = metrics.registeredStudents;

  // Render Recent Orders Table
  renderRecentOrdersTable(metrics.recentOrders);
}

function renderRecentOrdersTable(orders) {
  const tableBody = document.getElementById('recent-orders-tbody');
  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders recorded yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = orders.map(order => `
    <tr>
      <td style="font-weight: 800; font-family: monospace; color: var(--accent-orange);">${order.token_number}</td>
      <td style="font-weight: 600; color: var(--text-primary);">${order.student_name}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${order.roll_number || 'N/A'}</td>
      <td style="font-weight: 700; color: var(--text-primary);">₹${Number(order.total_amount).toFixed(2)}</td>
      <td>
        <span class="status-pill status-${order.order_status.toLowerCase().replace(/\s+/g, '-')}">
          ${order.order_status}
        </span>
      </td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td>
        <a href="/admin/orders.html?search=${encodeURIComponent(order.token_number)}" class="btn-secondary" style="padding: 3px 8px; font-size: 0.75rem;">
          Manage
        </a>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------
// 2. PRODUCTS MANAGEMENT
// -------------------------------------------------------------
let allProductsCache = [];
let allCategoriesCache = [];

async function initAdminProducts() {
  allCategoriesCache = await fetchCategories();
  
  // Populate category select in Add/Edit modal
  const modalCatSelect = document.getElementById('product-modal-category');
  const filterCatSelect = document.getElementById('product-filter-category');

  if (modalCatSelect) {
    modalCatSelect.innerHTML = allCategoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  if (filterCatSelect) {
    filterCatSelect.innerHTML = `<option value="all">All Categories</option>` + allCategoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    filterCatSelect.addEventListener('change', () => filterAndRenderProducts());
  }

  const searchInp = document.getElementById('product-search-input');
  if (searchInp) {
    searchInp.addEventListener('input', () => filterAndRenderProducts());
  }

  await loadAndRenderProducts();
  setupProductModalEvents();
}

async function loadAndRenderProducts() {
  allProductsCache = await fetchProducts('all');
  filterAndRenderProducts();
}

function filterAndRenderProducts() {
  const tbody = document.getElementById('products-table-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('product-search-input')?.value.toLowerCase().trim() || '';
  const selectedCat = document.getElementById('product-filter-category')?.value || 'all';

  let filtered = allProductsCache;
  if (selectedCat !== 'all') {
    filtered = filtered.filter(p => p.category_id === selectedCat);
  }
  if (searchVal) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || (p.description && p.description.toLowerCase().includes(searchVal)));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No food items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(prod => {
    const cat = allCategoriesCache.find(c => c.id === prod.category_id);
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${prod.image_url}" alt="${prod.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;">
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${prod.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${prod.is_veg !== false ? '🟢 Veg' : '🔴 Non-Veg'}</div>
            </div>
          </div>
        </td>
        <td style="color: var(--accent-orange); font-weight: 600;">${cat ? cat.name : 'Canteen'}</td>
        <td style="font-weight: 800; color: var(--text-primary);">₹${Number(prod.price).toFixed(2)}</td>
        <td>
          <label class="switch">
            <input type="checkbox" class="product-availability-toggle" data-product-id="${prod.id}" ${prod.is_available ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span style="font-size: 0.75rem; margin-left: 6px; color: ${prod.is_available ? 'var(--accent-green)' : 'var(--text-disabled)'};">
            ${prod.is_available ? 'In Stock' : 'Sold Out'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-secondary edit-product-btn" data-product-id="${prod.id}" style="padding: 4px 8px; font-size: 0.78rem;">
              ✏️ Edit
            </button>
            <button class="btn-secondary delete-product-btn" data-product-id="${prod.id}" style="padding: 4px 8px; font-size: 0.78rem; color: var(--accent-red);">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Availability toggle handler
  tbody.querySelectorAll('.product-availability-toggle').forEach(input => {
    input.addEventListener('change', async (e) => {
      const prodId = input.dataset.productId;
      const isAvailable = input.checked;
      await toggleProductAvailability(prodId, isAvailable);
      showToast(`Updated stock status for product`, 'success');
      await loadAndRenderProducts();
    });
  });

  // Edit handlers
  tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = allProductsCache.find(p => p.id === btn.dataset.productId);
      if (prod) openProductModal(prod);
    });
  });

  // Delete handlers
  tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prod = allProductsCache.find(p => p.id === btn.dataset.productId);
      if (prod && confirm(`Delete "${prod.name}" permanently from canteen menu?`)) {
        await deleteProduct(prod.id);
        showToast('Product deleted', 'success');
        await loadAndRenderProducts();
      }
    });
  });
}

function setupProductModalEvents() {
  const modal = document.getElementById('product-modal');
  const addBtn = document.getElementById('open-add-product-btn');
  const closeBtn = document.getElementById('close-product-modal');
  const form = document.getElementById('product-form');

  addBtn?.addEventListener('click', () => openProductModal(null));
  closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id-input')?.value;
    const name = document.getElementById('product-modal-name').value.trim();
    const price = parseFloat(document.getElementById('product-modal-price').value);
    const category_id = document.getElementById('product-modal-category').value;
    const image_url = document.getElementById('product-modal-image').value.trim();
    const description = document.getElementById('product-modal-desc').value.trim();
    const is_veg = document.getElementById('product-modal-veg').value === 'true';

    if (!name || isNaN(price)) {
      showToast('Please enter a valid product name and price', 'error');
      return;
    }

    const payload = {
      ...(id ? { id } : {}),
      name,
      price,
      category_id,
      image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description,
      is_veg,
      is_available: true
    };

    const res = await saveProduct(payload);
    if (res.success) {
      showToast(id ? 'Product updated successfully' : 'New food product added to canteen menu', 'success');
      modal?.classList.remove('open');
      await loadAndRenderProducts();
    }
  });
}

function openProductModal(product = null) {
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  if (!modal || !form) return;

  if (product) {
    modalTitle.textContent = 'Edit Food Item';
    document.getElementById('product-id-input').value = product.id;
    document.getElementById('product-modal-name').value = product.name;
    document.getElementById('product-modal-price').value = product.price;
    document.getElementById('product-modal-category').value = product.category_id;
    document.getElementById('product-modal-image').value = product.image_url || '';
    document.getElementById('product-modal-desc').value = product.description || '';
    document.getElementById('product-modal-veg').value = product.is_veg !== false ? 'true' : 'false';
  } else {
    modalTitle.textContent = 'Add New Canteen Item';
    form.reset();
    document.getElementById('product-id-input').value = '';
    document.getElementById('product-modal-image').value = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }

  modal.classList.add('open');
}

// -------------------------------------------------------------
// 3. ORDERS MANAGEMENT
// -------------------------------------------------------------
let allOrdersCache = [];

async function initAdminOrders() {
  allOrdersCache = await fetchAllOrders();

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    const searchInp = document.getElementById('orders-search-input');
    if (searchInp) searchInp.value = searchParam;
  }

  setupOrderFilterListeners();
  renderAdminOrders();
}

function setupOrderFilterListeners() {
  const searchInp = document.getElementById('orders-search-input');
  const statusFilter = document.getElementById('orders-status-filter');

  searchInp?.addEventListener('input', () => renderAdminOrders());
  statusFilter?.addEventListener('change', () => renderAdminOrders());
}

function renderAdminOrders() {
  const tbody = document.getElementById('orders-table-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('orders-search-input')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('orders-status-filter')?.value || 'all';

  let filtered = allOrdersCache;
  if (statusVal !== 'all') {
    filtered = filtered.filter(o => o.order_status === statusVal);
  }
  if (searchVal) {
    filtered = filtered.filter(o => 
      o.token_number.toLowerCase().includes(searchVal) ||
      o.student_name.toLowerCase().includes(searchVal) ||
      (o.roll_number && o.roll_number.toLowerCase().includes(searchVal)) ||
      o.id.toLowerCase().includes(searchVal)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">No canteen orders found matching filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(order => `
    <tr>
      <td style="font-weight: 900; font-family: monospace; color: var(--accent-orange); font-size: 1rem;">${order.token_number}</td>
      <td>
        <div style="font-weight: 700; color: var(--text-primary);">${order.student_name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${order.phone}</div>
      </td>
      <td style="font-size: 0.8rem; font-family: monospace; color: var(--text-secondary);">${order.roll_number || 'N/A'}</td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${order.pickup_time || 'ASAP'}</td>
      <td style="font-weight: 800; color: var(--text-primary);">₹${Number(order.total_amount).toFixed(2)}</td>
      <td>
        <select class="order-status-select form-control" data-order-id="${order.id}" style="padding: 4px 8px; font-size: 0.78rem; font-weight: 700; background: var(--bg-surface); border-color: var(--border-light);">
          <option value="Order Placed" ${order.order_status === 'Order Placed' ? 'selected' : ''}>📝 Order Placed</option>
          <option value="Accepted" ${order.order_status === 'Accepted' ? 'selected' : ''}>👨‍🍳 Accepted</option>
          <option value="Preparing" ${order.order_status === 'Preparing' ? 'selected' : ''}>🍳 Preparing</option>
          <option value="Ready for Pickup" ${order.order_status === 'Ready for Pickup' ? 'selected' : ''}>🔔 Ready for Pickup</option>
          <option value="Completed" ${order.order_status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
          <option value="Cancelled" ${order.order_status === 'Cancelled' ? 'selected' : ''}>🚫 Cancelled</option>
        </select>
      </td>
      <td style="font-size: 0.78rem; color: var(--text-muted);">${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td>
        <button class="btn-secondary view-order-details-btn" data-order-id="${order.id}" style="padding: 4px 8px; font-size: 0.75rem;">
          👁️ Items
        </button>
      </td>
    </tr>
  `).join('');

  // Status Change listener
  tbody.querySelectorAll('.order-status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = select.dataset.orderId;
      const newStatus = select.value;
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showToast(`Order status updated to "${newStatus}"`, 'success');
        allOrdersCache = await fetchAllOrders();
      } else {
        showToast('Failed to update order status', 'error');
      }
    });
  });

  // Details Modal listener
  tbody.querySelectorAll('.view-order-details-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await showOrderDetailsModal(btn.dataset.orderId);
    });
  });
}

async function showOrderDetailsModal(orderId) {
  const { order, items } = await fetchOrderDetails(orderId);
  if (!order) return;

  const modal = document.getElementById('order-details-modal');
  const body = document.getElementById('order-details-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 1.4rem; font-weight: 900; color: var(--accent-orange); font-family: monospace;">${order.token_number}</span>
        <span class="status-pill status-${order.order_status.toLowerCase().replace(/\s+/g, '-')}">${order.order_status}</span>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">Student: <strong>${order.student_name}</strong> • Roll: ${order.roll_number || 'N/A'} • Phone: ${order.phone}</div>
      <div style="font-size: 0.82rem; color: var(--text-muted);">Pickup Slot: <strong style="color: var(--text-primary);">${order.pickup_time || 'ASAP'}</strong></div>
      ${order.notes ? `<div style="font-size: 0.82rem; color: var(--accent-amber); margin-top: 4px;">Special Note: "${order.notes}"</div>` : ''}
    </div>

    <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Food Items:</h4>
    <div style="background: var(--bg-surface); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
      ${items.map(i => `
        <div style="display: flex; justify-content: space-between; padding: 0.45rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.88rem;">
          <div>${i.product_name} <span style="color: var(--text-muted); font-size: 0.8rem;">× ${i.quantity}</span></div>
          <div style="font-weight: 700;">₹${Number(i.subtotal || i.price * i.quantity).toFixed(2)}</div>
        </div>
      `).join('')}
      <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; margin-top: 0.25rem; font-weight: 900; color: var(--accent-orange); font-size: 1.1rem;">
        <span>Total Bill</span>
        <span>₹${Number(order.total_amount).toFixed(2)}</span>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted);">
      <span>Payment Method: <strong>${order.payment_method}</strong></span>
      <span>Status: <strong style="color: var(--accent-green);">${order.payment_status.toUpperCase()}</strong></span>
    </div>
  `;

  modal.classList.add('open');
  document.getElementById('close-order-modal')?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
}

// -------------------------------------------------------------
// 4. CATEGORIES MANAGEMENT
// -------------------------------------------------------------
async function initAdminCategories() {
  await renderCategoriesTable();

  const addBtn = document.getElementById('open-add-category-btn');
  const modal = document.getElementById('category-modal');
  const closeBtn = document.getElementById('close-category-modal');
  const form = document.getElementById('category-form');

  addBtn?.addEventListener('click', () => {
    form?.reset();
    document.getElementById('category-id-input').value = '';
    modal?.classList.add('open');
  });

  closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('category-id-input')?.value;
    const name = document.getElementById('category-modal-name').value.trim();
    const image_url = document.getElementById('category-modal-image').value.trim();

    if (!name) {
      showToast('Please enter category name', 'error');
      return;
    }

    const categories = getLocalTable('categories', []);
    if (id) {
      const idx = categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], name, image_url };
        setLocalTable('categories', categories);
        showToast('Category updated', 'success');
      }
    } else {
      categories.push({
        id: 'cat-' + Date.now(),
        name,
        image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        created_at: new Date().toISOString()
      });
      setLocalTable('categories', categories);
      showToast('Category added', 'success');
    }

    modal?.classList.remove('open');
    await renderCategoriesTable();
  });
}

async function renderCategoriesTable() {
  const tbody = document.getElementById('categories-table-tbody');
  if (!tbody) return;

  const categories = await fetchCategories();
  const products = await fetchProducts('all');

  tbody.innerHTML = categories.map(cat => {
    const itemCount = products.filter(p => p.category_id === cat.id).length;
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${cat.image_url}" alt="${cat.name}" style="width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover;">
            <span style="font-weight: 700; color: var(--text-primary);">${cat.name}</span>
          </div>
        </td>
        <td style="font-weight: 700; color: var(--accent-orange);">${itemCount} Items</td>
        <td style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${cat.id}</td>
        <td>
          <button class="btn-secondary edit-cat-btn" data-cat-id="${cat.id}" style="padding: 4px 8px; font-size: 0.75rem;">
            ✏️ Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = categories.find(c => c.id === btn.dataset.catId);
      if (cat) {
        document.getElementById('category-id-input').value = cat.id;
        document.getElementById('category-modal-name').value = cat.name;
        document.getElementById('category-modal-image').value = cat.image_url || '';
        document.getElementById('category-modal')?.classList.add('open');
      }
    });
  });
}
