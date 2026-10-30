/**
 * CAMPUS FOOD - Core App Module
 * Global utilities, Navigation state, Supabase Config Modal, and Common Event Listeners
 */

import { getCurrentUser, logoutUser, isAdmin } from './auth.js';
import { updateCartBadge, showToast } from './cart.js';
import { isConnectedToSupabase, saveSupabaseConfig, resetLocalCanteenDatabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  updateCartBadge();
  initSupabaseStatusBadge();
});

export function initNavbar() {
  const user = getCurrentUser();
  const authNavArea = document.getElementById('nav-auth-area');
  
  if (!authNavArea) return;

  if (user) {
    const isUserAdmin = user.role === 'admin';
    authNavArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <a href="${isUserAdmin ? '/admin/dashboard.html' : '/profile.html'}" class="user-menu-btn" title="View Profile">
          <div class="user-avatar-small">${(user.full_name || 'U').charAt(0).toUpperCase()}</div>
          <span class="user-name-label">${user.full_name?.split(' ')[0] || 'Student'}</span>
          <span class="role-badge-chip ${isUserAdmin ? 'role-badge-admin' : 'role-badge-student'}">${user.role}</span>
        </a>
        ${isUserAdmin ? `
          <a href="/admin/dashboard.html" class="btn-outline-orange nav-desktop-only" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
            ⚙️ Admin
          </a>
        ` : `
          <a href="/my-orders.html" class="btn-secondary nav-desktop-only" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
            📋 Orders
          </a>
        `}
        <button id="btn-logout" class="btn-secondary nav-desktop-only" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" title="Logout">
          🚪
        </button>
      </div>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        logoutUser();
      }
    });
  } else {
    authNavArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <a href="/login.html" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.82rem;">Login</a>
        <a href="/register.html" class="btn-primary nav-desktop-only" style="padding: 0.4rem 0.9rem; font-size: 0.82rem;">Register</a>
      </div>
    `;
  }
}

export function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links-menu');
  const user = getCurrentUser();

  if (navLinks && !navLinks.querySelector('.mobile-auth-item')) {
    // Append mobile-friendly auth links inside drawer
    if (user) {
      const isUserAdmin = user.role === 'admin';
      const liProfile = document.createElement('li');
      liProfile.className = 'nav-item mobile-auth-item';
      liProfile.innerHTML = `<a href="${isUserAdmin ? '/admin/dashboard.html' : '/profile.html'}">👤 ${user.full_name || 'My Profile'} (${user.role})</a>`;
      navLinks.appendChild(liProfile);

      const liLogout = document.createElement('li');
      liLogout.className = 'nav-item mobile-auth-item';
      liLogout.innerHTML = `<a href="#" id="mobile-drawer-logout" style="color: var(--accent-red);">🚪 Log Out</a>`;
      navLinks.appendChild(liLogout);

      liLogout.querySelector('#mobile-drawer-logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
          logoutUser();
        }
      });
    } else {
      const liLogin = document.createElement('li');
      liLogin.className = 'nav-item mobile-auth-item';
      liLogin.innerHTML = `<a href="/login.html">🔑 Sign In</a>`;
      navLinks.appendChild(liLogin);

      const liReg = document.createElement('li');
      liReg.className = 'nav-item mobile-auth-item';
      liReg.innerHTML = `<a href="/register.html">📝 Student Register</a>`;
      navLinks.appendChild(liReg);
    }
  }

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });

    // Close when clicking any nav link
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }
}

// Non-intrusive Supabase Connection & Configuration Modal
function initSupabaseStatusBadge() {
  // Avoid duplicate creation
  if (document.getElementById('supabase-config-modal')) return;

  const connected = isConnectedToSupabase();

  // Floating trigger button at bottom-left
  const trigger = document.createElement('div');
  trigger.id = 'supabase-status-trigger';
  trigger.style.cssText = `
    position: fixed;
    bottom: 18px;
    left: 18px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #0f172a;
    border: 1px solid ${connected ? '#10b981' : '#f97316'};
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #f8fafc;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    transition: all 0.2s ease;
  `;
  trigger.innerHTML = `
    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${connected ? '#10b981' : '#f97316'};"></span>
    <span>DB: ${connected ? 'Live Supabase' : 'AKTU Local Engine'}</span>
    <span style="opacity: 0.6;">⚙️</span>
  `;
  document.body.appendChild(trigger);

  // Modal Dialog
  const modal = document.createElement('div');
  modal.id = 'supabase-config-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close-btn" id="close-sb-modal">&times;</button>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
        <span style="font-size: 1.6rem;">🗄️</span>
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">Supabase Database Settings</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">AKTU College Project Backend Configuration</p>
        </div>
      </div>

      <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700; font-size: 0.85rem;">Current Mode:</span>
          <span style="color: ${connected ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 800; font-size: 0.85rem;">
            ${connected ? '🟢 Connected to Remote Supabase' : '⚡ High-Performance Local Engine (Zero Setup)'}
          </span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
          ${connected ? 'Real-time orders, products, and profiles are syncing directly with your Supabase PostgreSQL database.' : 'Operating with pre-seeded AKTU college canteen data. Everything works 100% out of the box (orders, tracking, admin). You can also link your own Supabase project below!'}
        </p>
      </div>

      <form id="supabase-config-form">
        <div class="form-group">
          <label class="form-label">Supabase Project URL</label>
          <input type="url" id="sb-url-input" class="form-control" placeholder="https://your-project-id.supabase.co">
        </div>
        <div class="form-group">
          <label class="form-label">Supabase Anon Key</label>
          <input type="text" id="sb-key-input" class="form-control" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
        </div>
        <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
          <button type="submit" class="btn-primary" style="flex: 1;">Save & Connect</button>
          <button type="button" id="btn-use-local" class="btn-secondary" style="font-size: 0.8rem;">Use Local DB</button>
        </div>
      </form>

      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <button id="btn-reset-db" class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem; color: var(--accent-red);">
          🔄 Reset Demo Canteen Data
        </button>
        <a href="/supabase-schema.sql" target="_blank" class="btn-outline-orange" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">
          📄 View SQL Schema
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Pre-fill existing config if any
  try {
    const raw = localStorage.getItem('campus_food_supabase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      const urlInp = document.getElementById('sb-url-input');
      const keyInp = document.getElementById('sb-key-input');
      if (urlInp) urlInp.value = parsed.url || '';
      if (keyInp) keyInp.value = parsed.anonKey || '';
    }
  } catch (e) {}

  trigger.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-sb-modal')?.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  document.getElementById('supabase-config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('sb-url-input').value.trim();
    const anonKey = document.getElementById('sb-key-input').value.trim();

    if (!url || !anonKey) {
      showToast('Please provide both Supabase URL and Anon Key', 'error');
      return;
    }

    const res = saveSupabaseConfig(url, anonKey);
    if (res.success) {
      showToast(res.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(res.message, 'error');
    }
  });

  document.getElementById('btn-use-local')?.addEventListener('click', () => {
    saveSupabaseConfig('', '');
    showToast('Switched to Campus Food Built-in DB Engine', 'success');
    setTimeout(() => window.location.reload(), 800);
  });

  document.getElementById('btn-reset-db')?.addEventListener('click', () => {
    if (confirm('Reset canteen database back to original sample products and orders?')) {
      resetLocalCanteenDatabase();
    }
  });
}
