import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderService } from "../api/services/orderService";
import { paymentService } from "../api/services/paymentService";
import { useAuth } from "../hooks/useAuth";
import { Loading, Card, Button } from "../components/common";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "../utils/constants";

const Payment = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [shippingAddress, setShippingAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.COD);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate("/");
            return;
        }

        if (orderId) {
            fetchOrder();
        }
    }, [orderId, isAuthenticated, authLoading]);

    useEffect(() => {
        if (order) {
            setShippingAddress(order.shippingAddress || "");
            setPaymentMethod(order.paymentMethod || PAYMENT_METHOD.COD);
            const payment = order.payments?.[0];
            const isPaid = payment?.paymentStatus === "PAID";
            setCanEdit(order.status === "PENDING" && !isPaid);
        }
    }, [order]);

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

    const handlePayment = async (e) => {
        if (e) e.preventDefault();

        if (!order) return;

        if (order.status === "CANCELLED") {
            alert("Không thể thanh toán đơn hàng đã bị hủy");
            return;
        }

        const payment = order.payments?.[0];
        if (payment?.paymentStatus === "PAID") {
            alert("Đơn hàng đã được thanh toán");
            return;
        }

        if (!shippingAddress.trim()) {
            alert("Vui lòng nhập địa chỉ giao hàng");
            return;
        }

        if (paymentMethod === "COD") {
            alert("Đơn hàng này sẽ được thanh toán khi nhận hàng (COD)");
            navigate(`/orders/${orderId}`);
            return;
        }

        try {
            setProcessing(true);
            const response = await paymentService.createVnpayUrl(orderId);
            console.log("Payment response:", response);
            if (response?.paymentUrl) {
                window.location.href = response.paymentUrl;
            } else {
                alert("Không nhận được URL thanh toán từ server");
            }
        } catch (error) {
            console.error("Payment error:", error);
            if (error.response?.status === 401) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                navigate("/");
            } else {
                alert(error.message || "Không thể tạo URL thanh toán");
            }
        } finally {
            setProcessing(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Không tìm thấy đơn hàng</p>
                    <Link to="/orders" className="text-blue-600 hover:text-blue-700 font-medium">
                        ← Quay lại danh sách đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    const payment = order.payments?.[0];
    const isPaid = payment?.paymentStatus === "PAID";
    const canPay = !isPaid && order.status !== "CANCELLED";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <Link
                            to={`/orders/${orderId}`}
                            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
                        >
                            ← Quay lại chi tiết đơn hàng
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">Thanh toán đơn hàng</h1>
                    </div>

                    <form onSubmit={handlePayment}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Thông tin giao hàng
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Địa chỉ giao hàng *
                                            </label>
                                            <textarea
                                                value={shippingAddress}
                                                onChange={(e) => setShippingAddress(e.target.value)}
                                                required
                                                disabled={!canEdit}
                                                rows={4}
                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEdit ? "bg-gray-100 cursor-not-allowed" : ""
                                                    }`}
                                                placeholder="Nhập địa chỉ giao hàng đầy đủ"
                                            />
                                            {!canEdit && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Không thể chỉnh sửa địa chỉ giao hàng cho đơn hàng này
                                                </p>
                                            )}
                                        </div>
                                        {user?.address && canEdit && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setShippingAddress(user.address)}
                                            >
                                                Sử dụng địa chỉ mặc định
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Phương thức thanh toán
                                    </h2>
                                    <div className="space-y-3">
                                        {Object.entries(PAYMENT_METHOD_LABELS).map(([method, label]) => (
                                            <label
                                                key={method}
                                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === method
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method}
                                                    checked={paymentMethod === method}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    disabled={!canEdit}
                                                    className="mr-3"
                                                />
                                                <span className="font-medium">{label}</span>
                                            </label>
                                        ))}
                                        {!canEdit && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Không thể thay đổi phương thức thanh toán cho đơn hàng này
                                            </p>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-gray-600">Mã đơn hàng:</span>
                                            <span className="font-bold text-gray-900">#{order.orderId.slice(0, 8)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-gray-600">Trạng thái:</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                                                {ORDER_STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </div>
                                        {payment && (
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Trạng thái thanh toán:</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${payment.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
                                                    payment.paymentStatus === "FAILED" ? "bg-red-100 text-red-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                                    }`}>
                                                    {PAYMENT_STATUS_LABELS[payment.paymentStatus] || payment.paymentStatus}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Sản phẩm</h2>
                                    <div className="space-y-4">
                                        {order.items?.map((item) => (
                                            <div key={item.orderItemId} className="flex gap-4 pb-4 border-b last:border-0">
                                                <img
                                                    src={item.option?.image || item.product?.thumbnail || "/placeholder.png"}
                                                    alt={item.product?.name}
                                                    className="w-20 h-20 object-cover rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{item.product?.name}</h3>
                                                    {item.option?.color && (
                                                        <p className="text-sm text-gray-600">Màu: {item.option.color}</p>
                                                    )}
                                                    {item.option?.version && (
                                                        <p className="text-sm text-gray-600">Phiên bản: {item.option.version}</p>
                                                    )}
                                                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{formatPrice(item.lineTotal)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <Card className="sticky top-24 p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt thanh toán</h2>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tạm tính:</span>
                                            <span className="font-medium">{formatPrice(order.totalPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Phí vận chuyển:</span>
                                            <span className="font-medium">Miễn phí</span>
                                        </div>
                                        <hr className="my-3" />
                                        <div className="flex justify-between text-xl font-bold text-gray-900">
                                            <span>Tổng cộng:</span>
                                            <span className="text-blue-600">{formatPrice(order.totalPrice)}</span>
                                        </div>
                                    </div>

                                    {isPaid ? (
                                        <div className="text-center py-4">
                                            <div className="mb-4">
                                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-green-600 font-semibold mb-2">Đã thanh toán</p>
                                                <p className="text-sm text-gray-600">
                                                    {payment?.transactionDate && formatDate(payment.transactionDate)}
                                                </p>
                                            </div>
                                            <Link to={`/orders/${orderId}`}>
                                                <Button fullWidth variant="secondary">
                                                    Xem chi tiết đơn hàng
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : canPay ? (
                                        <div className="space-y-3">
                                            <Button
                                                type="submit"
                                                loading={processing}
                                                disabled={processing || !canEdit}
                                                fullWidth
                                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-3 shadow-lg disabled:opacity-50"
                                            >
                                                {processing ? "Đang xử lý..." : paymentMethod === "VNPAY" ? "Thanh toán VNPay" : "Xác nhận đơn hàng"}
                                            </Button>
                                            {paymentMethod === "VNPAY" && (
                                                <p className="text-xs text-gray-500 text-center">
                                                    Bạn sẽ được chuyển đến trang thanh toán VNPay
                                                </p>
                                            )}
                                            {paymentMethod === "COD" && (
                                                <p className="text-xs text-gray-500 text-center">
                                                    Bạn sẽ thanh toán khi nhận hàng
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-600 mb-4">
                                                Không thể thanh toán đơn hàng này
                                            </p>
                                            <Link to={`/orders/${orderId}`}>
                                                <Button fullWidth variant="secondary">
                                                    Xem chi tiết đơn hàng
                                                </Button>
                                            </Link>
                                        </div>
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

export default Payment;
