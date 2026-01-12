/**
 * App Component
 * ==============
 * Main application with routing and layout switching
 * 
 * Route Structure:
 * - Public: /, /login, /register
 * - Protected: /dashboard/* (role-based)
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDevice } from './shared/hooks/useDevice';
import { useAuthStore } from './features/auth/authstore';

// Layouts
import MobileLayout from './layouts/mobile/MobileLayout';
import DesktopLayout from './layouts/desktop/DesktopLayout';

// Public Pages
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';

// Role Dashboards
import AdminDashboard from './features/admin/AdminDashboard';
import AdminUsersPage from './features/admin/pages/AdminUsersPage';
import AdminReportsPage from './features/admin/pages/AdminReportsPage';
import InventoryManagement from './features/admin/pages/InventoryManagement';
import InventoryLogsPage from './features/inventory/pages/InventoryLogsPage';
import EmployeeDashboard from './features/employee/EmployeeDashboard';
import StockManagement from './features/employee/pages/StockManagement';
import RetailerDashboard from './features/retailer/RetailerDashboard';
import FarmerDashboard from './features/farmer/FarmerDashboard';

// Shared Feature Pages
import ProductListPage from './features/products/pages/ProductListPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import CartPage from './features/cart/pages/CartPage';
import OrderHistoryPage from './features/orders/pages/OrderHistoryPage';
import OrderDetailPage from './features/orders/pages/OrderDetailPage';

// Checkout
import CheckoutPage from './features/checkout/pages/CheckoutPage';

// Admin/Employee Orders Management
import AdminOrdersPage from './features/admin/pages/AdminOrdersPage';
import EmployeeOrdersPage from './features/employee/pages/EmployeeOrdersPage';

// Profile
import ProfilePage from './features/profile/ProfilePage';

// Notifications
import NotificationsPage from './features/notifications/pages/NotificationsPage';

// Brands
import BrandManagementPage from './features/brands/pages/BrandManagementPage';

/**
 * Protected Route wrapper - redirects to login if not authenticated
 * Waits for hydration to complete before making routing decisions
 */
function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Show loading while hydrating from localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * Role-based Route wrapper
 */
function RoleRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route wrapper - redirects to dashboard if authenticated
 * Waits for hydration to complete before making routing decisions
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated, getDashboardRoute } = useAuthStore();

  // Show loading while hydrating from localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return <>{children}</>;
}

/**
 * Responsive Dashboard Layout
 */
function DashboardLayout() {
  const { isMobile } = useDevice();

  if (isMobile) {
    return <MobileLayout />;
  }

  return <DesktopLayout />;
}

/**
 * Dashboard Redirect based on role
 */
function DashboardRedirect() {
  const { getDashboardRoute } = useAuthStore();
  return <Navigate to={getDashboardRoute()} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTES
            ========================================== */}

        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* ==========================================
            PROTECTED DASHBOARD ROUTES
            ========================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard Index - redirects based on role */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* ========================================
                ADMIN ROUTES
                ======================================== */}
            <Route
              path="/dashboard/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/users"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/reports"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminReportsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/products"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ProductListPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/products/:id"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ProductDetailPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/orders"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminOrdersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/profile"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/inventory"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <InventoryManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/inventory/logs"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <InventoryLogsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/notifications"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <NotificationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/admin/brands"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <BrandManagementPage />
                </RoleRoute>
              }
            />

            {/* ========================================
                EMPLOYEE ROUTES
                ======================================== */}
            <Route
              path="/dashboard/employee"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <EmployeeDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/employee/products"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <ProductListPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/employee/orders"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <EmployeeOrdersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/employee/profile"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <ProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/employee/notifications"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <NotificationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/employee/stock"
              element={
                <RoleRoute allowedRoles={['employee', 'admin']}>
                  <StockManagement />
                </RoleRoute>
              }
            />

            {/* ========================================
                RETAILER ROUTES
                ======================================== */}
            <Route path="/dashboard/retailer" element={<RetailerDashboard />} />
            <Route path="/dashboard/retailer/products" element={<ProductListPage />} />
            <Route path="/dashboard/retailer/products/:id" element={<ProductDetailPage />} />
            <Route path="/dashboard/retailer/cart" element={<CartPage />} />
            <Route path="/dashboard/retailer/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard/retailer/orders" element={<OrderHistoryPage />} />
            <Route path="/dashboard/retailer/orders/:id" element={<OrderDetailPage />} />
            <Route path="/dashboard/retailer/profile" element={<ProfilePage />} />
            <Route path="/dashboard/retailer/notifications" element={<NotificationsPage />} />

            {/* ========================================
                FARMER ROUTES
                ======================================== */}
            <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
            <Route path="/dashboard/farmer/products" element={<ProductListPage />} />
            <Route path="/dashboard/farmer/products/:id" element={<ProductDetailPage />} />
            <Route path="/dashboard/farmer/cart" element={<CartPage />} />
            <Route path="/dashboard/farmer/checkout" element={<CheckoutPage />} />
            <Route path="/dashboard/farmer/orders" element={<OrderHistoryPage />} />
            <Route path="/dashboard/farmer/orders/:id" element={<OrderDetailPage />} />
            <Route path="/dashboard/farmer/profile" element={<ProfilePage />} />
            <Route path="/dashboard/farmer/notifications" element={<NotificationsPage />} />

            {/* ========================================
                SHARED ORDER DETAIL ROUTE
                All authenticated users can view orders
                ======================================== */}
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Route>
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
