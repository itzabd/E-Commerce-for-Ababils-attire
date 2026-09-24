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
import { CartProvider } from './context/CartContext';
import { MyBagPage } from './pages/customer/MyBagPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderConfirmedPage } from './pages/customer/OrderConfirmedPage';
import { CustomerLayout } from './layouts/CustomerLayout';
import { HomePage } from './pages/customer/HomePage';
import { DressesPage } from './pages/customer/DressesPage';
import { CakesPage } from './pages/customer/CakesPage';
import { DressDetailPage } from './pages/customer/DressDetailPage';
import { CakeDetailPage } from './pages/customer/CakeDetailPage';
import { AboutPage } from './pages/customer/AboutPage';
import { ContactPage } from './pages/customer/ContactPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Customer Routes (100% Guest-accessible without login) */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/dresses" element={<DressesPage />} />
              <Route path="/dresses/:id" element={<DressDetailPage />} />
              <Route path="/cakes" element={<CakesPage />} />
              <Route path="/cakes/:id" element={<CakeDetailPage />} />
              <Route path="/bag" element={<MyBagPage />} />
              <Route path="/cart" element={<Navigate to="/bag" replace />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmed/:invoiceNumber" element={<OrderConfirmedPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
