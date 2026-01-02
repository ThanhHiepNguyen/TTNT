import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Card from "../components/common/Card";
import Pagination from "../components/common/Pagination";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../utils/constants";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate("/");
            return;
        }

        fetchOrders();
    }, [currentPage, statusFilter, isAuthenticated, authLoading]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: currentPage,
                limit: 12,
                ...(statusFilter && { status: statusFilter }),
            };
            const response = await orderService.getOrders(params);
            if (response?.orders) {
                setOrders(response.orders);
                setTotalPages(response.pagination?.totalPages || 1);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <p className="text-red-600 mb-4 text-lg">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
                        <p className="text-gray-600">Theo dõi và quản lý đơn hàng của bạn</p>
                    </div>

                    <div className="mb-6 flex gap-3 flex-wrap">
                        <button
                            onClick={() => setStatusFilter("")}
                            className={`px-5 py-2.5 rounded-xl transition-all font-semibold ${!statusFilter
                                ? "bg-amber-600 text-white shadow-lg"
                                : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                }`}
                        >
                            Tất cả
                        </button>
                        {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2.5 rounded-xl transition-all font-semibold ${statusFilter === status
                                    ? "bg-amber-600 text-white shadow-lg"
                                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {orders.length === 0 ? (
                        <Card className="p-12 shadow-lg">
                            <EmptyState
                                icon={
                                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                }
                                title="Chưa có đơn hàng nào"
                                description="Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!"
                                actionLabel="Tiếp tục mua sắm"
                                actionLink="/"
                            />
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <Link key={order.orderId} to={`/orders/${order.orderId}`}>
                                        <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-amber-200">
                                            <div className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                Đơn hàng #{order.orderId.slice(-8).toUpperCase()}
                                                            </h3>
                                                            <span
                                                                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}
                                                            >
                                                                {ORDER_STATUS_LABELS[order.status]}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-sm text-gray-600">
                                                            <p className="flex items-center gap-2">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Ngày đặt: {formatDate(order.createdAt)}
                                                            </p>
                                                            <p className="flex items-center gap-2">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                </svg>
                                                                {order.items?.length || 0} sản phẩm
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right md:text-left md:min-w-[150px]">
                                                        <p className="text-2xl font-bold text-amber-600 mb-2">
                                                            {formatPrice(order.totalPrice)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center justify-end md:justify-start gap-1">
                                                            Xem chi tiết
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders;
