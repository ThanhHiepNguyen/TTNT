import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { orderService } from "../api/services/orderService";
import { productService } from "../api/services/productService";
import { adminService } from "../api/services/adminService";
import { Loading, Card } from "../components/common";
import AdminLayout from "../components/AdminLayout";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../utils/constants";

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalUsers: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [ordersRes, productsRes, usersRes] = await Promise.all([
                orderService.getOrders({ page: 1, limit: 100 }),
                productService.getAllProducts({ page: 1, limit: 100 }),
                adminService.getUsers({ page: 1, limit: 100 }),
            ]);

            const orders = ordersRes?.orders || [];
            const products = productsRes?.products || [];
            const users = usersRes?.users || [];

            const totalRevenue = orders
                .filter((o) => o.status !== "CANCELLED")
                .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

            const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
            const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

            setStats({
                totalOrders: orders.length,
                totalRevenue,
                totalProducts: products.length,
                totalUsers: users.length,
                pendingOrders,
                deliveredOrders,
            });

            setRecentOrders(orders.slice(0, 5));
            setRecentProducts(products.slice(0, 5));
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Loading fullScreen />
            </AdminLayout>
        );
    }

    const statCards = [
        {
            title: "Tổng đơn hàng",
            value: stats.totalOrders,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            color: "bg-blue-500",
        },
        {
            title: "Tổng doanh thu",
            value: formatPrice(stats.totalRevenue),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: "bg-green-500",
        },
        {
            title: "Tổng sản phẩm",
            value: stats.totalProducts,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: "bg-purple-500",
        },
        {
            title: "Tổng người dùng",
            value: stats.totalUsers,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: "bg-orange-500",
        },
    ];

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Tổng quan hệ thống và quản lý</p>
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat, index) => (
                        <Card key={index} className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} text-white p-3 rounded-lg`}>{stat.icon}</div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Trạng thái đơn hàng</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Chờ xử lý</span>
                                <span className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-700 font-medium">Đã giao hàng</span>
                                <span className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Thao tác nhanh</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Link
                                to="/admin/products"
                                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
                            >
                                <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-sm font-medium text-gray-700">Quản lý sản phẩm</p>
                            </Link>
                            <Link
                                to="/admin/orders"
                                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
                            >
                                <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-700">Quản lý đơn hàng</p>
                            </Link>
                            <Link
                                to="/admin/users"
                                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
                            >
                                <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-700">Quản lý người dùng</p>
                            </Link>
                            <Link
                                to="/admin/categories"
                                className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors"
                            >
                                <svg className="w-8 h-8 mx-auto mb-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-700">Quản lý danh mục</p>
                            </Link>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Đơn hàng gần đây</h2>
                            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Xem tất cả →
                            </Link>
                        </div>
                        {recentOrders.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => (
                                    <Link
                                        key={order.orderId}
                                        to={`/orders/${order.orderId}`}
                                        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">#{order.orderId.slice(0, 8)}</p>
                                                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                                                    {ORDER_STATUS_LABELS[order.status] || order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Sản phẩm mới</h2>
                            <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Xem tất cả →
                            </Link>
                        </div>
                        {recentProducts.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Chưa có sản phẩm nào</p>
                        ) : (
                            <div className="space-y-3">
                                {recentProducts.map((product) => (
                                    <Link
                                        key={product.productId}
                                        to={`/products/${product.productId}`}
                                        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={product.thumbnail || product.cheapestOptionImage || "/placeholder.png"}
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {product.minPrice && product.maxPrice
                                                        ? `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`
                                                        : "Chưa có giá"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
        </AdminLayout>
    );
};

export default Dashboard;

