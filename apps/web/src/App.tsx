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

// Role Dashboards
import AdminDashboard from './features/admin/AdminDashboard';
import AdminUsersPage from './features/admin/pages/AdminUsersPage';
import AdminReportsPage from './features/admin/pages/AdminReportsPage';
import EmployeeDashboard from './features/employee/EmployeeDashboard';
import RetailerDashboard from './features/retailer/RetailerDashboard';
import FarmerDashboard from './features/farmer/FarmerDashboard';

// Shared Feature Pages
import ProductListPage from './features/products/pages/ProductListPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import CartPage from './features/cart/pages/CartPage';
import OrderHistoryPage from './features/orders/pages/OrderHistoryPage';

/**
 * Protected Route wrapper - redirects to login if not authenticated
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

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
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getDashboardRoute } = useAuthStore();

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
 * Profile Page
 */
function ProfilePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-500">Name</label>
          <p className="font-medium text-gray-900">{user?.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Email</label>
          <p className="font-medium text-gray-900">{user?.email}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Phone</label>
          <p className="font-medium text-gray-900">{user?.phone}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Role</label>
          <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
        </div>
        {user?.businessName && (
          <div>
            <label className="text-sm text-gray-500">Business Name</label>
            <p className="font-medium text-gray-900">{user.businessName}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full mt-4 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
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
                  <OrderHistoryPage />
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
                  <OrderHistoryPage />
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

            {/* ========================================
                RETAILER ROUTES
                ======================================== */}
            <Route path="/dashboard/retailer" element={<RetailerDashboard />} />
            <Route path="/dashboard/retailer/products" element={<ProductListPage />} />
            <Route path="/dashboard/retailer/products/:id" element={<ProductDetailPage />} />
            <Route path="/dashboard/retailer/cart" element={<CartPage />} />
            <Route path="/dashboard/retailer/orders" element={<OrderHistoryPage />} />
            <Route path="/dashboard/retailer/profile" element={<ProfilePage />} />

            {/* ========================================
                FARMER ROUTES
                ======================================== */}
            <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
            <Route path="/dashboard/farmer/products" element={<ProductListPage />} />
            <Route path="/dashboard/farmer/products/:id" element={<ProductDetailPage />} />
            <Route path="/dashboard/farmer/cart" element={<CartPage />} />
            <Route path="/dashboard/farmer/orders" element={<OrderHistoryPage />} />
            <Route path="/dashboard/farmer/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
