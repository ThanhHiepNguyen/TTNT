import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { orderService } from "../api/services/orderService";
import { Loading, Card, Button } from "../components/common";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS } from "../utils/constants";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-2 border-green-200">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 text-lg">Đơn hàng của bạn đã được thanh toán thành công</p>
        </div>

        {order && (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 mb-6 text-left border border-green-200 shadow-md">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-700 font-medium">Mã đơn hàng:</span>
                <span className="font-bold text-lg text-gray-900">#{order.orderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-700 font-medium">Tổng tiền:</span>
                <span className="font-bold text-xl text-green-600">{formatPrice(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-green-200">
                <span className="text-gray-700 font-medium">Trạng thái:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-medium">Thanh toán:</span>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {PAYMENT_STATUS_LABELS[order.payments[0].paymentStatus] || order.payments[0].paymentStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/orders/${orderId}`} className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              Xem chi tiết đơn hàng
            </Button>
          </Link>
          <Link to="/" className="flex-1 sm:flex-none">
            <Button variant="secondary" className="w-full sm:w-auto">
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;

