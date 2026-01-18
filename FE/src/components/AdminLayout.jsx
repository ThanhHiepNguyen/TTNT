import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading: authLoading, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);


    useEffect(() => {
        if (!user) {

            return;
        }

        if (user.role !== "ADMIN" && user.role !== "STAFF") {

            navigate("/", { replace: true });
            return;
        }

        if (user.role === "STAFF") {
            const staffAllowedRoutes = ["/admin/orders"];
            if (!staffAllowedRoutes.includes(location.pathname)) {
                navigate("/admin/orders", { replace: true });
            }
        }
    }, [user, location.pathname, navigate]);

    const allMenuItems = [
        {
            title: "Dashboard",
            path: "/admin",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            roles: ["ADMIN"],
        },
        {
            title: "Sản phẩm",
            path: "/admin/products",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            roles: ["ADMIN"],
        },
        {
            title: "Đơn hàng",
            path: "/admin/orders",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            roles: ["ADMIN", "STAFF"],
        },
        {
            title: "Người dùng",
            path: "/admin/users",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ["ADMIN"],
        },
        {
            title: "Danh mục",
            path: "/admin/categories",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            roles: ["ADMIN"],
        },
        {
            title: "Đánh giá",
            path: "/admin/reviews",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            roles: ["ADMIN", "STAFF"],
        },
        {
            title: "Chat Analytics",
            path: "/admin/chat-analytics",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v5l3 3M3 12a9 9 0 1018 0 9 9 0 10-18 0z" />
                </svg>
            ),
            roles: ["ADMIN"],
        },
    ];


    const menuItems = allMenuItems.filter(item =>
        item.roles.includes(user?.role)
    );

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };



    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }


    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">

            <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 fixed h-screen overflow-y-auto`}>
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {sidebarOpen && (
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {user.role === "ADMIN" ? "Admin Panel" : "Staff Panel"}
                                </h1>
                                <p className="text-xs text-gray-500 mt-1">{user.name || user.email}</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {sidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                title={!sidebarOpen ? item.title : ""}
                            >
                                {item.icon}
                                {sidebarOpen && (
                                    <span className="font-medium">{item.title}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                        title={!sidebarOpen ? "Đăng xuất" : ""}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

