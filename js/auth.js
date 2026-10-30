/**
 * CAMPUS FOOD - Authentication & Session Management
 * Connects with Supabase Auth and manages student/admin profiles
 */

import { supabase } from './supabase.js';

const AUTH_USER_KEY = 'campus_food_current_user';

// Pre-configured Demo Accounts for instant college project evaluation
export const DEMO_CREDENTIALS = {
  student: {
    email: 'student@campusfood.aktu.ac.in',
    password: 'Student@123',
    fullName: 'Aryan Sharma',
    rollNumber: '2300970100045',
    phone: '9876543210',
    role: 'student'
  },
  admin: {
    email: 'admin@campusfood.aktu.ac.in',
    password: 'Admin@123',
    fullName: 'Ramesh Kumar (Canteen Manager)',
    rollNumber: 'ADMIN-AKTU-01',
    phone: '9811223344',
    role: 'admin'
  }
};

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading auth state', e);
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function isAuthenticated() {
  return !!getCurrentUser();
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

export async function loginUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Check Demo Accounts
  if (cleanEmail === DEMO_CREDENTIALS.student.email.toLowerCase() && password === DEMO_CREDENTIALS.student.password) {
    const user = {
      id: 'usr-student-1',
      email: DEMO_CREDENTIALS.student.email,
      full_name: DEMO_CREDENTIALS.student.fullName,
      roll_number: DEMO_CREDENTIALS.student.rollNumber,
      phone: DEMO_CREDENTIALS.student.phone,
      role: 'student'
    };
    setCurrentUser(user);
    return { success: true, user };
  }

  if (cleanEmail === DEMO_CREDENTIALS.admin.email.toLowerCase() && password === DEMO_CREDENTIALS.admin.password) {
    const user = {
      id: 'usr-admin-1',
      email: DEMO_CREDENTIALS.admin.email,
      full_name: DEMO_CREDENTIALS.admin.fullName,
      roll_number: DEMO_CREDENTIALS.admin.rollNumber,
      phone: DEMO_CREDENTIALS.admin.phone,
      role: 'admin'
    };
    setCurrentUser(user);
    return { success: true, user };
  }

  // 2. Try Supabase Auth if connected
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (!error && data?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userObj = {
          id: data.user.id,
          email: data.user.email,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Student User',
          roll_number: profile?.roll_number || data.user.user_metadata?.roll_number || '',
          phone: profile?.phone || data.user.user_metadata?.phone || '',
          role: profile?.role || 'student'
        };
        setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
    } catch (err) {
      console.warn('Supabase auth login error, checking local store', err);
    }
  }

  // 3. Check registered users in local storage
  const registeredUsers = JSON.parse(localStorage.getItem('cf_registered_users') || '[]');
  const matched = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
  if (matched) {
    const { password, ...safeUser } = matched;
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  }

  return { success: false, message: 'Invalid college email or password. Please verify your credentials.' };
}

export async function registerUser({ fullName, rollNumber, phone, email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  // Try Supabase Auth
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            roll_number: rollNumber,
            phone: phone,
            role: 'student'
          }
        }
      });

      if (!error && data?.user) {
        const userObj = {
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          roll_number: rollNumber,
          phone: phone,
          role: 'student'
        };
        setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
    } catch (err) {
      console.warn('Supabase auth signup fallback to local', err);
    }
  }

  // Save to local registered users
  const registeredUsers = JSON.parse(localStorage.getItem('cf_registered_users') || '[]');
  if (registeredUsers.some(u => u.email.toLowerCase() === cleanEmail || u.roll_number === rollNumber)) {
    return { success: false, message: 'An account with this Email or Roll Number already exists.' };
  }

  const newUser = {
    id: 'usr-' + Date.now(),
    email: cleanEmail,
    password: password,
    full_name: fullName,
    roll_number: rollNumber,
    phone: phone,
    role: 'student',
    created_at: new Date().toISOString()
  };

  registeredUsers.push(newUser);
  localStorage.setItem('cf_registered_users', JSON.stringify(registeredUsers));

  const { password: _, ...safeUser } = newUser;
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

export function logoutUser() {
  if (supabase) {
    try {
      supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  }
  setCurrentUser(null);
  window.location.href = '/index.html';
}

export function requireAuth(targetRedirect = '/login.html') {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = `${targetRedirect}?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }
  return user;
}

export function requireAdmin(targetRedirect = '/admin/login.html') {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = `${targetRedirect}?error=unauthorized`;
    return null;
  }
  return user;
}

export function updateCurrentProfile(updatedData) {
  const user = getCurrentUser();
  if (!user) return false;
  const merged = { ...user, ...updatedData };
  setCurrentUser(merged);
  return true;
}
