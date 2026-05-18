import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../layouts/ClientLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import LandingPage from '../pages/client/LandingPage';
import RestaurantsPage from '../pages/client/RestaurantsPage';
import TablePage from '../pages/client/TablePage';
import MenuPage from '../pages/client/MenuPage';
import CartPage from '../pages/client/CartPage';
import CheckoutPage from '../pages/client/CheckoutPage';
import OrderPage from '../pages/client/OrderPage';
import ServerCallPage from '../pages/client/ServerCallPage';
import TableSlugPage from '../pages/client/TableSlugPage';

import LoginPage from '../pages/admin/LoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import OrdersPage from '../pages/admin/OrdersPage';
import KitchenPage from '../pages/admin/KitchenPage';
import ProductsPage from '../pages/admin/ProductsPage';
import CategoriesPage from '../pages/admin/CategoriesPage';
import TablesPage from '../pages/admin/TablesPage';
import PrintableQRPage from '../pages/admin/PrintableQRPage';
import PaymentsPage from '../pages/admin/PaymentsPage';
import StatsPage from '../pages/admin/StatsPage';
import SettingsPage from '../pages/admin/SettingsPage';
import ServerCallsPage from '../pages/admin/ServerCallsPage';
import UsersPage from '../pages/admin/UsersPage';
import RoleTestPage from '../pages/admin/RoleTestPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<ClientLayout><LandingPage /></ClientLayout>} />
      <Route path="/restaurants" element={<ClientLayout><RestaurantsPage /></ClientLayout>} />
      <Route path="/menu/:restaurantSlug/:tableId" element={<ClientLayout><MenuPage /></ClientLayout>} />
      <Route path="/menu/:tableId" element={<ClientLayout><MenuPage /></ClientLayout>} />
      <Route path="/r/:slug/menu/:tableId" element={<ClientLayout><MenuPage /></ClientLayout>} />
      <Route path="/r/:restaurantSlug/table/:tableId" element={<ClientLayout><TableSlugPage /></ClientLayout>} />
      <Route path="/table/:tableId" element={<ClientLayout><TablePage /></ClientLayout>} />
      <Route path="/cart" element={<ClientLayout><CartPage /></ClientLayout>} />
      <Route path="/checkout" element={<ClientLayout><CheckoutPage /></ClientLayout>} />
      <Route path="/order/:orderNumber" element={<ClientLayout><OrderPage /></ClientLayout>} />
      <Route path="/r/:slug/order/:orderNumber" element={<ClientLayout><OrderPage /></ClientLayout>} />
      <Route path="/server-call" element={<ClientLayout><ServerCallPage /></ClientLayout>} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<ProtectedRoute roles={['admin','super_admin','manager']}><DashboardPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute roles={['admin','super_admin','manager','waiter','kitchen','cashier']}><OrdersPage /></ProtectedRoute>} />
        <Route path="kitchen" element={<ProtectedRoute roles={['admin','super_admin','manager','kitchen']}><KitchenPage /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute roles={['admin','super_admin','manager']}><ProductsPage /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute roles={['admin','super_admin','manager']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="tables/printable-qr" element={<ProtectedRoute roles={['admin','super_admin','manager']}><PrintableQRPage /></ProtectedRoute>} />
        <Route path="tables" element={<ProtectedRoute roles={['admin','super_admin','manager','waiter']}><TablesPage /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute roles={['admin','super_admin','manager','cashier']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="stats" element={<ProtectedRoute roles={['admin','super_admin','manager']}><StatsPage /></ProtectedRoute>} />
        <Route path="server-calls" element={<ProtectedRoute roles={['admin','super_admin','manager','waiter']}><ServerCallsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['admin','super_admin','manager']}><SettingsPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['admin','super_admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="role-test" element={<ProtectedRoute roles={['admin','super_admin']}><RoleTestPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
