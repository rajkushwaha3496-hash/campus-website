/**
 * CAMPUS FOOD - Menu Browsing & Filtering Logic
 */

import { fetchCategories, fetchProducts } from './supabase.js';
import { addToCart } from './cart.js';

let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'default';
let allCategories = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Read URL query parameters (e.g. ?category=Fast%20Food or ?search=burger)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  const searchParam = urlParams.get('search');

  if (searchParam) {
    currentSearch = searchParam;
    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) searchInput.value = searchParam;
  }

  await loadCategories(catParam);
  await loadProducts();
  setupFilterListeners();
});

async function loadCategories(preselectName = null) {
  const container = document.getElementById('category-filter-tabs');
  if (!container) return;

  allCategories = await fetchCategories();

  // If a preselectName was provided in query string, match category
  if (preselectName) {
    const matched = allCategories.find(c => c.name.toLowerCase() === preselectName.toLowerCase() || c.id === preselectName);
    if (matched) currentCategory = matched.id;
  }

  let html = `
    <button class="cat-pill ${currentCategory === 'all' ? 'active' : ''}" data-cat-id="all">
      🍽️ All Canteen Menu
    </button>
  `;

  allCategories.forEach(cat => {
    html += `
      <button class="cat-pill ${currentCategory === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
        ${cat.name}
      </button>
    `;
  });

  container.innerHTML = html;

  // Add click events
  container.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.catId;
      loadProducts();
    });
  });
}

async function loadProducts() {
  const grid = document.getElementById('menu-products-grid');
  const countLabel = document.getElementById('products-count-label');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: var(--text-muted);">
      <div style="display:inline-block; width:32px; height:32px; border:3px solid var(--accent-orange); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <p style="margin-top: 1rem; font-size: 0.9rem;">Fetching delicious canteen dishes...</p>
    </div>
  `;

  allProducts = await fetchProducts(currentCategory, currentSearch, currentSort);

  if (countLabel) {
    countLabel.textContent = `Showing ${allProducts.length} items`;
  }

  if (allProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
        <span style="font-size: 3rem;">🔍</span>
        <h3 style="font-size: 1.3rem; margin-top: 0.75rem; font-weight: 700;">No Canteen Dishes Found</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0.5rem auto 1.5rem; max-width: 400px;">
          We couldn't find any items matching "${currentSearch}". Try checking spelling or explore other categories.
        </p>
        <button id="reset-filters-btn" class="btn-primary" style="font-size: 0.85rem;">Reset Filters</button>
      </div>
    `;

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
      currentCategory = 'all';
      currentSearch = '';
      currentSort = 'default';
      const searchInput = document.getElementById('menu-search-input');
      if (searchInput) searchInput.value = '';
      const sortSelect = document.getElementById('menu-sort-select');
      if (sortSelect) sortSelect.value = 'default';
      const container = document.getElementById('category-filter-tabs');
      if (container) {
        container.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        container.querySelector('[data-cat-id="all"]')?.classList.add('active');
      }
      loadProducts();
    });
    return;
  }

  grid.innerHTML = allProducts.map(p => {
    const cat = allCategories.find(c => c.id === p.category_id);
    const catName = cat ? cat.name : 'College Special';
    const isAvailable = p.is_available !== false;

    return `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}" alt="${p.name}" loading="lazy">
          <div class="product-badges-layer">
            <span class="veg-tag">${p.is_veg !== false ? '🟢 Pure Veg' : '🔴 Non-Veg'}</span>
            <span class="prep-time-tag">⏱️ ${p.preparation_time_mins || 10} min</span>
          </div>
          ${!isAvailable ? `<div class="sold-out-overlay">Sold Out Today</div>` : ''}
        </div>
        <div class="product-content">
          <span class="product-cat-name">${catName}</span>
          <h3 class="product-title">${p.name}</h3>
          <p class="product-desc">${p.description || 'Prepared fresh in the college canteen kitchen.'}</p>
          <div class="product-footer">
            <div class="product-price"><span>₹</span>${Number(p.price).toFixed(2)}</div>
            <button 
              class="add-to-cart-btn ${!isAvailable ? 'out-of-stock' : ''}" 
              data-product-id="${p.id}"
              ${!isAvailable ? 'disabled' : ''}
            >
              ${isAvailable ? '<span>+</span> Add to Cart' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listener to all "Add to Cart" buttons
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = btn.dataset.productId;
      const product = allProducts.find(p => p.id === prodId);
      if (product) {
        addToCart(product, 1);
        // Quick visual feedback on button
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Added!';
        btn.style.background = 'var(--accent-green)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 1200);
      }
    });
  });
}

function setupFilterListeners() {
  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadProducts();
      }, 300);
    });
  }

  const sortSelect = document.getElementById('menu-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }
}
