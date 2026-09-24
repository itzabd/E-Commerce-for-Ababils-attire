/**
 * Ababil’s Attire by Sanjida Bethi
 * Application Router & Provider Setup with Code-Splitting
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';

// Lazy-loaded Customer Pages
const HomePage = lazy(() => import('./pages/customer/HomePage').then(m => ({ default: m.HomePage })));
const DressesPage = lazy(() => import('./pages/customer/DressesPage').then(m => ({ default: m.DressesPage })));
const DressDetailPage = lazy(() => import('./pages/customer/DressDetailPage').then(m => ({ default: m.DressDetailPage })));
const CakesPage = lazy(() => import('./pages/customer/CakesPage').then(m => ({ default: m.CakesPage })));
const CakeDetailPage = lazy(() => import('./pages/customer/CakeDetailPage').then(m => ({ default: m.CakeDetailPage })));
const MyBagPage = lazy(() => import('./pages/customer/MyBagPage').then(m => ({ default: m.MyBagPage })));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderConfirmedPage = lazy(() => import('./pages/customer/OrderConfirmedPage').then(m => ({ default: m.OrderConfirmedPage })));
const TrackOrderPage = lazy(() => import('./pages/customer/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const AboutPage = lazy(() => import('./pages/customer/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/customer/ContactPage').then(m => ({ default: m.ContactPage })));

// Lazy-loaded Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

const RouteLoadingFallback: React.FC = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#5c3e36',
    }}
  >
    <span className="material-symbols-outlined spin" style={{ fontSize: '32px' }}>
      progress_activity
    </span>
    <span style={{ fontSize: '13px', letterSpacing: '0.05em', color: '#8c5e51', fontWeight: 500 }}>
      Loading Ababil’s Attire...
    </span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
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
                <Route path="/track-order" element={<TrackOrderPage />} />
                <Route path="/track-order/:invoiceNumber" element={<TrackOrderPage />} />
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
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Fallback to Storefront */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
