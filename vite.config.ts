import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          menu: path.resolve(__dirname, 'menu.html'),
          cart: path.resolve(__dirname, 'cart.html'),
          checkout: path.resolve(__dirname, 'checkout.html'),
          tracking: path.resolve(__dirname, 'tracking.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          profile: path.resolve(__dirname, 'profile.html'),
          myOrders: path.resolve(__dirname, 'my-orders.html'),
          adminLogin: path.resolve(__dirname, 'admin/login.html'),
          adminDashboard: path.resolve(__dirname, 'admin/dashboard.html'),
          adminProducts: path.resolve(__dirname, 'admin/products.html'),
          adminCategories: path.resolve(__dirname, 'admin/categories.html'),
          adminOrders: path.resolve(__dirname, 'admin/orders.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
