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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="kitchen" element={<KitchenPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="tables/printable-qr" element={<PrintableQRPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}