import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "../utils/constants";

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate("/");
            return;
        }

        fetchOrder();
    }, [orderId, isAuthenticated, authLoading]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await orderService.getOrderById(orderId);
            if (response?.order) {
                setOrder(response.order);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
            return;
        }

        try {
            setCancelling(true);
            await orderService.cancelOrder(orderId);
            await fetchOrder();
            alert("Hủy đơn hàng thành công");
        } catch (err) {
            alert(err.message || "Không thể hủy đơn hàng");
        } finally {
            setCancelling(false);
        }
    };

    const canCancel = order?.status === "PENDING" || order?.status === "PROCESSING";

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <p className="text-red-600 mb-4 text-lg">{error || "Không tìm thấy đơn hàng"}</p>
                    <Link
                        to="/orders"
                        className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 inline-block font-semibold transition-colors"
                    >
                        Quay lại danh sách đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <Link
                            to="/orders"
                            className="text-amber-600 hover:text-amber-700 font-semibold mb-4 inline-block flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại danh sách đơn hàng
                        </Link>
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                    Chi tiết đơn hàng
                                </h1>
                                <p className="text-gray-600">Mã đơn hàng: <span className="font-semibold text-gray-900">#{order.orderId.slice(-8).toUpperCase()}</span></p>
                            </div>
                            <span className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-md ${ORDER_STATUS_COLORS[order.status]}`}>
                                {ORDER_STATUS_LABELS[order.status]}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900">Thông tin đơn hàng</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Ngày đặt hàng</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-1">Cập nhật lần cuối</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatDate(order.updatedAt)}
                                        </p>
                                    </div>
                                </div>

                                {canCancel && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <Button
                                            variant="danger"
                                            onClick={handleCancelOrder}
                                            loading={cancelling}
                                            disabled={cancelling}
                                            className="w-full md:w-auto"
                                        >
                                            {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900">Thông tin giao hàng</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-2">Địa chỉ giao hàng</p>
                                        <p className="font-semibold text-gray-900">{order.shippingAddress}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600 mb-2">Phương thức thanh toán</p>
                                        <p className="font-semibold text-gray-900">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900">Sản phẩm</h2>
                                </div>

                                <div className="space-y-4">
                                    {order.items?.map((item) => (
                                        <div key={item.orderItemId} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <img
                                                src={item.option?.image || item.product?.thumbnail || "/placeholder.png"}
                                                alt={item.product?.name}
                                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                                onError={(e) => {
                                                    e.target.src = "/placeholder.png";
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.product?.name}</h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    {item.option?.color && (
                                                        <p className="flex items-center gap-2">
                                                            <span className="font-semibold">Màu:</span> {item.option.color}
                                                        </p>
                                                    )}
                                                    {item.option?.version && (
                                                        <p className="flex items-center gap-2">
                                                            <span className="font-semibold">Phiên bản:</span> {item.option.version}
                                                        </p>
                                                    )}
                                                    <p className="flex items-center gap-2">
                                                        <span className="font-semibold">Số lượng:</span> {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-600 text-xl mb-1">
                                                    {formatPrice(item.lineTotal)}
                                                </p>
                                                {item.optionPrice && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {formatPrice(item.unitPrice * item.quantity)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900">Tổng cộng:</span>
                                        <span className="text-3xl font-bold text-amber-600">
                                            {formatPrice(order.totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {order.payments && order.payments.length > 0 && (
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <h2 className="text-2xl font-semibold text-gray-900">Thanh toán</h2>
                                        </div>
                                        {order.paymentMethod === "VNPAY" &&
                                            order.payments[0]?.paymentStatus !== "PAID" &&
                                            order.status !== "CANCELLED" && (
                                                <Link to={`/payment/${order.orderId}`}>
                                                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                                                        Thanh toán ngay
                                                    </Button>
                                                </Link>
                                            )}
                                    </div>

                                    <div className="space-y-3">
                                        {order.payments.map((payment) => (
                                            <div key={payment.paymentId} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-gray-900 mb-1">
                                                        {PAYMENT_STATUS_LABELS[payment.paymentStatus]}
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {formatDate(payment.transactionDate)}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-amber-600 text-xl">{formatPrice(payment.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="sticky top-24 p-6 shadow-xl border-2 border-amber-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b-2 border-gray-200">
                                    Tóm tắt đơn hàng
                                </h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Số sản phẩm:</span>
                                        <span className="font-semibold text-gray-900">{order.items?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Phí vận chuyển:</span>
                                        <span className="font-semibold text-green-600">Miễn phí</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                                            <span className="text-2xl font-bold text-amber-600">
                                                {formatPrice(order.totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <Link to="/orders">
                                        <Button fullWidth variant="secondary">
                                            Quay lại danh sách
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
