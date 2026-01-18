import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { orderService } from "../api/services/orderService";
import { paymentService } from "../api/services/paymentService";
import { Loading, Card, Button } from "../components/common";
import { formatPrice } from "../utils/helpers";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      if (response?.order) {
        setOrder(response.order);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;

    try {
      setRetrying(true);
      const response = await paymentService.createVnpayUrl(orderId);
      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      alert(error.message || "Không thể tạo lại URL thanh toán");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-2 border-red-200">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-600 text-lg">Đơn hàng của bạn chưa được thanh toán thành công</p>
        </div>

        {order && (
          <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-6 mb-6 text-left border border-red-200 shadow-md">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-red-200">
                <span className="text-gray-700 font-medium">Mã đơn hàng:</span>
                <span className="font-bold text-lg text-gray-900">#{order.orderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700 font-medium">Tổng tiền:</span>
                <span className="font-bold text-xl text-red-600">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {order?.paymentMethod === "VNPAY" && (
            <Button
              onClick={handleRetryPayment}
              loading={retrying}
              fullWidth
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg text-lg py-3"
            >
              {retrying ? "Đang xử lý..." : "Thử thanh toán lại"}
            </Button>
          )}
          <Link to="/orders" className="block">
            <Button variant="secondary" fullWidth className="text-lg py-3">
              Xem đơn hàng của tôi
            </Button>
          </Link>
          <Link to="/" className="block">
            <Button variant="outline" fullWidth className="text-lg py-3">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailed;

