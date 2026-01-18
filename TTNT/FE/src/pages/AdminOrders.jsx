import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { orderService } from "../api/services/orderService";
import { Loading, Card, Button, Pagination } from "../components/common";
import AdminLayout from "../components/AdminLayout";
import { formatPrice, formatDate } from "../utils/helpers";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../utils/constants";

const AdminOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      fetchOrders();
    }
  }, [user, pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter ? { status: statusFilter } : {}),
      };
      const response = await orderService.getOrders(params);
      if (response?.orders) {
        setOrders(response.orders);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${ORDER_STATUS_LABELS[newStatus]}"?`)) {
      return;
    }

    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      alert("Cập nhật trạng thái thành công!");
      fetchOrders();
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading fullScreen />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đơn hàng</h1>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            {Object.values(ORDER_STATUS).map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <div className="ml-auto text-sm text-gray-600">
            Tổng: <span className="font-bold">{pagination.total}</span> đơn hàng
          </div>
        </div>
      </Card>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">Chưa có đơn hàng nào</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {orders.map((order) => (
              <Card key={order.orderId} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Link
                        to={`/orders/${order.orderId}`}
                        className="font-bold text-lg text-blue-600 hover:text-blue-700"
                      >
                        #{order.orderId.slice(0, 8)}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Khách hàng:</span> {order.user?.name || order.user?.email || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Ngày đặt:</span> {formatDate(order.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium">Địa chỉ:</span> {order.shippingAddress}
                      </p>
                      <p>
                        <span className="font-medium">Thanh toán:</span> {order.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, ORDER_STATUS.PROCESSING)}
                        >
                          Xử lý
                        </Button>
                      )}
                      {order.status === "PROCESSING" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, ORDER_STATUS.SHIPPING)}
                        >
                          Giao hàng
                        </Button>
                      )}
                      {order.status === "SHIPPING" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.orderId, ORDER_STATUS.DELIVERED)}
                        >
                          Hoàn thành
                        </Button>
                      )}
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusUpdate(order.orderId, ORDER_STATUS.CANCELLED)}
                        >
                          Hủy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;

