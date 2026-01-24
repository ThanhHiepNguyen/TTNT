import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useCartContext } from "../contexts/CartContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import AnnouncementBar from "./AnnouncementBar";
import SearchAutocomplete from "./SearchAutocomplete";
import { categoryService } from "../api/services/categoryService";
import { authService } from "../api/services/authService";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { totalItems } = useCartContext();

  const cartItemCount = totalItems;


  useEffect(() => {
    const handleCartUpdate = () => {

    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryService.getAllCategories();
        if (response?.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchUserProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await authService.getProfile();
          if (response?.user) {
            setUser(response.user);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          localStorage.removeItem("accessToken");
        }
      }
    };

    fetchCategories();
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
      setIsUserMenuOpen(false);
      navigate("/");
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <AnnouncementBar />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src={logo}
              alt="Phonify Logo"
              className="h-25 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <div
              className="relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
              >
                <span>Danh mục</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isCategoryMenuOpen ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isCategoryMenuOpen && (
                <div
                  className="absolute top-full left-0 pt-2 w-64 z-50"
                >
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-96 overflow-y-auto">
                    {loadingCategories ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <svg
                          className="animate-spin h-5 w-5 mx-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <Link
                          key={category.categoryId}
                          to={`/categories/${category.categoryId}`}
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
                        >
                          <div className="font-medium">{category.name}</div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500 text-sm">
                        Không có danh mục
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchAutocomplete />
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/cart"
              className="relative p-2.5 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="hidden lg:block font-medium">Giỏ hàng</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden lg:block text-gray-700 font-medium">
                    {user.name || user.email}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      Thông tin tài khoản
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      Đơn hàng của tôi
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        Quản trị
                      </Link>
                    )}
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium rounded-lg hover:bg-gray-100"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Đăng ký
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="mb-4">
              <SearchAutocomplete />
            </div>

            <nav className="flex flex-col space-y-1">
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Danh mục
              </div>
              {loadingCategories ? (
                <div className="px-4 py-2 text-center text-gray-500">
                  <svg
                    className="animate-spin h-5 w-5 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category.categoryId}
                    to={`/categories/${category.categoryId}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  Không có danh mục
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
        }}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setIsLoginModalOpen(false);
          setIsForgotPasswordModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
        }}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => {
          setIsForgotPasswordModalOpen(false);
        }}
        onSwitchToLogin={() => {
          setIsForgotPasswordModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </header>
  );
};

export default Header;
