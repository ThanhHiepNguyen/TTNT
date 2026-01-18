import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services/authService.js";
import Modal from "./Modal.jsx";
import logo from "../assets/logo.png";

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        password: "",
        name: "",
        address: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "confirmPassword") {
            setConfirmPassword(value);
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
        setError("");
    };

    const validateForm = () => {
        if (!formData.email) {
            setError("Vui lòng nhập email");
            return false;
        }

        if (!formData.phone) {
            setError("Vui lòng nhập số điện thoại");
            return false;
        }

        if (!formData.password) {
            setError("Vui lòng nhập mật khẩu");
            return false;
        }

        if (formData.password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return false;
        }

        if (formData.password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return false;
        }

        if (!formData.name) {
            setError("Vui lòng nhập họ tên");
            return false;
        }

        if (!formData.address) {
            setError("Vui lòng nhập địa chỉ");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await authService.register(formData);

            if (response.data?.accessToken) {
                localStorage.setItem("accessToken", response.data.accessToken);
                handleClose();
                window.location.reload();
            } else {
                handleClose();
            }
        } catch (err) {
            setError(err.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            email: "",
            phone: "",
            password: "",
            name: "",
            address: "",
        });
        setConfirmPassword("");
        setError("");
        onClose();
        navigate("/"); // Chuyển về trang chủ
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 transition-colors bg-white rounded-full p-2 shadow-lg"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="hidden md:flex md:w-2/5 relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-40">
                    <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                        <path d="M0,80 Q100,30 200,80 T400,80 L400,0 L0,0 Z" fill="rgba(255,255,255,0.15)" />
                    </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-40">
                    <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                        <path d="M0,80 Q100,130 200,80 T400,80 L400,160 L0,160 Z" fill="rgba(255,255,255,0.15)" />
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white">
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-48 h-48 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform p-5">
                            <img src={logo} alt="Phonify Logo" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-blue-100 text-center text-base font-medium mt-6">Tham gia cùng chúng tôi</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-3/5 flex flex-col bg-white">
                <div className="px-10 py-12 flex-1 overflow-y-auto max-h-[90vh]">
                    <div className="mb-10">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-3">Chào mừng</h2>
                        <p className="text-gray-500 text-base">Tạo tài khoản để bắt đầu</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg animate-shake">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                placeholder="Họ và tên"
                            />

                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                placeholder="Email"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                placeholder="Số điện thoại"
                            />

                            <input
                                id="address"
                                name="address"
                                type="text"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                placeholder="Địa chỉ"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                    placeholder="Mật khẩu"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                    placeholder="Xác nhận mật khẩu"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white py-4 px-4 rounded-xl font-bold text-base uppercase tracking-wider hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang đăng ký...
                                </span>
                            ) : (
                                "ĐĂNG KÝ"
                            )}
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-500">
                                Đã có tài khoản?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        if (onSwitchToLogin) {
                                            setTimeout(() => onSwitchToLogin(), 100);
                                        }
                                    }}
                                    className="font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                                >
                                    Đăng nhập
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default RegisterModal;

