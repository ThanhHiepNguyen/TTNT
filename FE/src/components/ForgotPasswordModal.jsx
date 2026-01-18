import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services/authService.js";
import Modal from "./Modal.jsx";
import logo from "../assets/logo.png";

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [step, setStep] = useState("email");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Vui lòng nhập email");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Email không hợp lệ");
            return;
        }

        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setStep("otp");
            setError("");
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");

        if (!otp || otp.length !== 6) {
            setError("Vui lòng nhập mã OTP 6 số");
            return;
        }

        setLoading(true);

        try {

            await authService.verifyOtp(email, otp);
            setStep("password");
            setError("");
        } catch (err) {
            setError(err.message || "Mã OTP không đúng hoặc đã hết hạn");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        if (!newPassword || newPassword.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);

        try {
            if (!otp || otp.length !== 6) {
                setError("Vui lòng nhập mã OTP hợp lệ");
                setLoading(false);
                return;
            }
            await authService.resetPassword(otp, newPassword, email);

            handleClose();
            if (onSwitchToLogin) {
                setTimeout(() => onSwitchToLogin(), 100);
            }
        } catch (err) {
            console.error("Reset password error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setStep("email");
        onClose();
        navigate("/");
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
                        <p className="text-blue-100 text-center text-base font-medium mt-6">Công nghệ trong tầm tay</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-3/5 flex flex-col bg-white">
                <div className="px-10 py-12 flex-1 overflow-y-auto">
                    <div className="mb-10">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-3">
                            {step === "email" && "Quên mật khẩu?"}
                            {step === "otp" && "Nhập mã OTP"}
                            {step === "password" && "Đặt lại mật khẩu"}
                        </h2>
                        <p className="text-gray-500 text-base">
                            {step === "email" && "Nhập email để nhận mã OTP đặt lại mật khẩu"}
                            {step === "otp" && `Mã OTP đã được gửi đến ${email}`}
                            {step === "password" && "Nhập mật khẩu mới của bạn"}
                        </p>
                    </div>

                    {step === "otp" ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
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

                            <div>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setOtp(value);
                                        setError("");
                                    }}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md text-center text-2xl font-bold tracking-widest"
                                    placeholder="000000"
                                />
                                <p className="mt-2 text-sm text-gray-500 text-center">
                                    Nhập mã OTP 6 số đã được gửi đến email của bạn
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white py-4 px-4 rounded-xl font-bold text-base uppercase tracking-wider hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xác thực...
                                    </span>
                                ) : (
                                    "XÁC THỰC OTP"
                                )}
                            </button>

                            <div className="text-center pt-4 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setError("");
                                    }}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                                >
                                    ← Quay lại
                                </button>
                                <div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setOtp("");
                                            setError("");
                                            setLoading(true);
                                            try {
                                                await authService.forgotPassword(email);
                                                setError("");
                                            } catch (err) {
                                                setError("Không thể gửi lại OTP. Vui lòng thử lại sau.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Gửi lại mã OTP
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : step === "password" ? (
                        <form onSubmit={handleResetPassword} className="space-y-6">
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

                            <div>
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setError("");
                                    }}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                    placeholder="Mật khẩu mới"
                                />
                            </div>

                            <div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setError("");
                                    }}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                    placeholder="Xác nhận mật khẩu mới"
                                />
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
                                        Đang đặt lại...
                                    </span>
                                ) : (
                                    "ĐẶT LẠI MẬT KHẨU"
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("otp");
                                        setNewPassword("");
                                        setConfirmPassword("");
                                        setError("");
                                    }}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                                >
                                    ← Quay lại
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            <div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    className="block w-full px-5 py-4 bg-emerald-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-500 text-base shadow-sm hover:shadow-md"
                                    placeholder="Email đăng ký"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Nhập email bạn đã sử dụng để đăng ký tài khoản
                                </p>
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
                                        Đang gửi...
                                    </span>
                                ) : (
                                    "GỬI EMAIL ĐẶT LẠI MẬT KHẨU"
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        if (onSwitchToLogin) {
                                            setTimeout(() => onSwitchToLogin(), 100);
                                        }
                                    }}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                                >
                                    ← Quay lại đăng nhập
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;

