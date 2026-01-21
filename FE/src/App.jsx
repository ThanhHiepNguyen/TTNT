import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBox from "./components/ChatBox";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import CategoryDetail from "./pages/CategoryDetail";
import ProductDetail from "./pages/ProductDetail";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminReviews from "./pages/AdminReviews";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Payment from "./pages/Payment";
import Account from "./pages/Account";
import AdminChatAnalytics from "./pages/AdminChatAnalytics";

function AppContent() {
  const location = useLocation();
  const authRoutes = ["/reset-password"];
  const adminRoutes = location.pathname.startsWith("/admin");
  const shouldShowHeader = !authRoutes.includes(location.pathname) && !adminRoutes;
  const shouldShowFooter = !authRoutes.includes(location.pathname) && !adminRoutes;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {shouldShowHeader && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories/:categoryId" element={<CategoryDetail />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/chat-analytics" element={<AdminChatAnalytics />} />
        </Routes>
      </main>
      {shouldShowFooter && <Footer />}
      {/* Show ChatBox on customer-facing pages */}
      {shouldShowHeader && <ChatBox />}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
