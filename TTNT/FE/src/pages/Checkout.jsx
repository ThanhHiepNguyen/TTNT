import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartService, orderService, paymentService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { formatPrice } from "../utils/helpers";
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from "../utils/constants";

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.COD);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    fetchCart();
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setShippingAddress(user.address || "");
    }
  }, [isAuthenticated, user, authLoading]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response?.items) {
        setCart(response);
      }
    } catch (err) {
      alert(err.message || "Không thể tải giỏ hàng");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Vui lòng nhập họ tên");
      return;
    }

    if (!email.trim()) {
      alert("Vui lòng nhập email");
      return;
    }

    if (!phone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    if (!shippingAddress.trim()) {
      alert("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      alert("Giỏ hàng trống");
      return;
    }

    if (cart.summary?.hasUnavailableItems) {
      alert("Giỏ hàng có sản phẩm không khả dụng. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await orderService.createOrder({
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
      });
      if (response?.order) {
        if (paymentMethod === "VNPAY") {
          const paymentResponse = await paymentService.createVnpayUrl(response.order.orderId);
          if (paymentResponse?.paymentUrl) {
            window.location.href = paymentResponse.paymentUrl;
            return;
          }
        }
        navigate(`/orders/${response.order.orderId}`);
      }
    } catch (err) {
      alert(err.message || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading fullScreen />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <p className="text-gray-600 mb-4 text-lg">Giỏ hàng trống</p>
          <Button onClick={() => navigate("/")}>Tiếp tục mua sắm</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Thanh toán</h1>
            <p className="text-gray-600">Vui lòng điền thông tin giao hàng để hoàn tất đơn hàng</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Thông tin giao hàng</h2>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                          placeholder="example@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                          placeholder="0123456789"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none"
                        placeholder="Nhập địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                      <label
                        key={method}
                        className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === method
                          ? "border-amber-600 bg-amber-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-4 w-5 h-5 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 text-lg">{label}</span>
                          {method === "COD" && (
                            <p className="text-sm text-gray-500 mt-1">Thanh toán khi nhận hàng</p>
                          )}
                          {method === "VNPAY" && (
                            <p className="text-sm text-gray-500 mt-1">Thanh toán trực tuyến qua VNPay</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24 p-6 shadow-xl border-2 border-amber-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">
                    Tóm tắt đơn hàng
                  </h2>

                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cart.items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                        <img
                          src={item.productImage || "/placeholder.png"}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-amber-600 whitespace-nowrap">
                          {formatPrice(item.lineTotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="text-base">Tổng sản phẩm:</span>
                      <span className="font-semibold text-gray-900">{cart.summary?.totalItems || 0} sản phẩm</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="text-base">Phí vận chuyển:</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-amber-600">
                          {formatPrice(cart.summary?.totalPrice || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    loading={submitting}
                    disabled={submitting || cart.summary?.hasUnavailableItems}
                    className="mt-6 py-4 text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {submitting ? "Đang xử lý..." : "Đặt hàng"}
                  </Button>

                  {cart.summary?.hasUnavailableItems && (
                    <p className="text-sm text-red-600 mt-3 text-center">
                      Có sản phẩm không khả dụng trong giỏ hàng
                    </p>
                  )}
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
