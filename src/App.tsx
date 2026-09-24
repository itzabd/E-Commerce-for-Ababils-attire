/**
 * Ababil’s Attire by Sanjida Bethi
 * Application Router & Provider Setup
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { StorefrontHome } from './pages/StorefrontHome';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Customer Routes (100% Guest-accessible without login) */}
          <Route path="/" element={<StorefrontHome />} />

          {/* Admin Login Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes (Guarded by Supabase Auth + admin_users role verification) */}
          <Route
            path="/admin"
            element={
              <AdminGuard allowedRoles={['superadmin', 'admin', 'staff']}>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
          </Route>

          {/* Fallback to Storefront */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
