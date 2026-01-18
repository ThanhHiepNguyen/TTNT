import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { formatDate } from "../utils/helpers";

const Account = () => {
    const { user, isAuthenticated, loading: authLoading, refetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate("/");
            return;
        }

        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
            });
        }
    }, [isAuthenticated, user, authLoading, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Vui lòng nhập họ tên");
            return;
        }

        try {
            setSaving(true);
            const response = await authService.updateProfile({
                name: formData.name.trim(),
                address: formData.address.trim(),
            });

            const updatedUser = await refetch();

            if (response?.user) {
                setFormData({
                    name: response.user.name || "",
                    email: response.user.email || "",
                    phone: response.user.phone || "",
                    address: response.user.address || "",
                });
            } else if (updatedUser) {
                setFormData({
                    name: updatedUser.name || "",
                    email: updatedUser.email || "",
                    phone: updatedUser.phone || "",
                    address: updatedUser.address || "",
                });
            }

            alert("Cập nhật thông tin thành công!");
        } catch (error) {
            alert(error.message || "Không thể cập nhật thông tin");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        try {
            setSaving(true);
            await authService.updateProfile({
                password: passwordData.newPassword,
            });
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            alert("Đổi mật khẩu thành công!");
        } catch (error) {
            alert(error.message || "Không thể đổi mật khẩu");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tài khoản của tôi</h1>
                        <p className="text-gray-600">Quản lý thông tin tài khoản và cài đặt</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-64 flex-shrink-0">
                            <Card className="p-4 shadow-lg">
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "profile"
                                            ? "bg-blue-600 text-white font-semibold"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Thông tin cá nhân
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("password")}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "password"
                                            ? "bg-blue-600 text-white font-semibold"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Đổi mật khẩu
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => navigate("/orders")}
                                        className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Đơn hàng của tôi
                                        </div>
                                    </button>
                                </nav>
                            </Card>
                        </div>

                        <div className="flex-1">
                            {activeTab === "profile" && (
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Họ và tên <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                                placeholder="Nhập họ và tên"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                disabled
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Số điện thoại không thể thay đổi</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Địa chỉ
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                                                placeholder="Nhập địa chỉ"
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-gray-200">
                                            <Button
                                                type="submit"
                                                loading={saving}
                                                disabled={saving}
                                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                            >
                                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                            </Button>
                                        </div>
                                    </form>

                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Ngày tham gia:</span> {user?.createdAt && formatDate(user.createdAt)}
                                        </p>
                                    </div>
                                </Card>
                            )}

                            {activeTab === "password" && (
                                <Card className="p-6 shadow-lg">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-gray-900">Đổi mật khẩu</h2>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Mật khẩu mới <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Xác nhận mật khẩu <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                                                placeholder="Nhập lại mật khẩu mới"
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-gray-200">
                                            <Button
                                                type="submit"
                                                loading={saving}
                                                disabled={saving}
                                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                            >
                                                {saving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                                            </Button>
                                        </div>
                                    </form>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;

