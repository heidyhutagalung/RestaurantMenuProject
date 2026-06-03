import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n/index.js';
import MenuPage from './pages/MenuPage';
import OrderPage from './pages/OrderPage';
import QrisPaymentPage from './pages/QrisPaymentPage';
import CashierPaymentPage from './pages/CashierPaymentPage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/menu?table=1" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/payment/qris" element={<QrisPaymentPage />} />
        <Route path="/payment/cashier" element={<CashierPaymentPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/history" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
