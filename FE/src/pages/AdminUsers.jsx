import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { adminService } from "../api/services/adminService";
import { Loading, Card, Button, Pagination } from "../components/common";
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";

const AdminUsers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    isActive: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    role: "STAFF",
  });

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [user, pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.isActive !== "" ? { isActive: filters.isActive === "true" } : {}),
      };
      const response = await adminService.getUsers(params);
      if (response?.users) {
        setUsers(response.users);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async (userId) => {
    if (!confirm("Bạn có chắc muốn khóa tài khoản này?")) {
      return;
    }

    try {
      await adminService.lockUser(userId);
      alert("Khóa tài khoản thành công!");
      fetchUsers();
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra");
    }
  };

  const handleUnlockUser = async (userId) => {
    if (!confirm("Bạn có chắc muốn mở khóa tài khoản này?")) {
      return;
    }

    try {
      await adminService.unlockUser(userId);
      alert("Mở khóa tài khoản thành công!");
      fetchUsers();
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (editingUser) {

      try {
        await adminService.updateUser(editingUser.userId, {
          role: formData.role,
        });
        alert("Cập nhật người dùng thành công!");
        handleCancel();
        fetchUsers();
      } catch (error) {
        alert(error.message || "Có lỗi xảy ra khi cập nhật người dùng");
      }
      return;
    }


    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin: Tên, Email, Số điện thoại, Mật khẩu");
      return;
    }

    if (formData.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await adminService.createUser(formData);
      alert("Tạo người dùng thành công!");
      handleCancel();
      fetchUsers();
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi tạo người dùng");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      role: "STAFF",
    });
    setEditingUser(null);
    setShowForm(false);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>Thêm người dùng mới</Button>
      </div>

      {showForm && (
        <Card className={`p-6 mb-6 border-2 ${editingUser ? 'border-yellow-200 bg-yellow-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editingUser ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {editingUser ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUser ? "Sửa người dùng" : "Thêm người dùng mới"}
            </h2>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nhập tên người dùng"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required={!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required={!editingUser}
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Nhập địa chỉ (tùy chọn)"
                    />
                  </div>
                </>
              )}
            </div>
            {editingUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Chỉ có thể thay đổi vai trò của người dùng. Các thông tin khác không thể chỉnh sửa.
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
                {editingUser ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cập nhật người dùng
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo người dùng
                  </>
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} className="px-6">
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm (email, phone, tên)..."
            value={filters.search}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filters.role}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, role: e.target.value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="STAFF">Nhân viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, isActive: e.target.value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Tổng: <span className="font-bold">{pagination.total}</span> người dùng
        </div>
      </Card>

      {users.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">Không tìm thấy người dùng nào</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {users.map((u) => (
              <Card key={u.userId} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{u.name || "N/A"}</h3>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 ml-16">
                      <p>
                        <span className="font-medium">Số điện thoại:</span> {u.phone || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Địa chỉ:</span> {u.address || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Ngày tạo:</span> {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                          u.role === "STAFF" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                        }`}>
                        {u.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                        {u.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setFormData({
                            name: u.name,
                            email: u.email,
                            phone: u.phone,
                            address: u.address || "",
                            password: "",
                            role: u.role,
                          });
                          setEditingUser(u);
                          setShowForm(true);
                        }}
                      >
                        Sửa
                      </Button>
                      {u.isActive ? (
                        <Button size="sm" variant="danger" onClick={() => handleLockUser(u.userId)}>
                          Khóa
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleUnlockUser(u.userId)}>
                          Mở khóa
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

export default AdminUsers;

