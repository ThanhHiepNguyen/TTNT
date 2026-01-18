import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartService } from "../api/services";
import { useCartContext } from "../contexts/CartContext";
import { Loading, EmptyState, Button, Card } from "../components/common";
import { formatPrice } from "../utils/helpers";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

const Cart = () => {
  const { refreshCart } = useCartContext();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      setCart(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems((prev) => new Set(prev).add(cartItemId));
      await cartService.updateCartItem(cartItemId, newQuantity);

      // Cập nhật state local thay vì fetch lại toàn bộ
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const updatedItems = prevCart.items.map((item) => {
          if (item.cartItemId === cartItemId) {
            const updatedQuantity = newQuantity;
            const updatedLineTotal = (item.salePrice || item.price) * updatedQuantity;
            return {
              ...item,
              quantity: updatedQuantity,
              lineTotal: updatedLineTotal,
            };
          }
          return item;
        });

        const newSummary = {
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + item.lineTotal, 0),
          hasWarnings: updatedItems.some((item) => item.stockWarning),
          hasUnavailableItems: updatedItems.some((item) => !item.isAvailable),
        };

        return {
          ...prevCart,
          items: updatedItems,
          summary: newSummary,
        };
      });

      refreshCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      alert(err.message);
      // Nếu có lỗi, fetch lại để đảm bảo data đúng
      await fetchCart();
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      return;
    }

    try {
      await cartService.removeCartItem(cartItemId);

      // Cập nhật state local thay vì fetch lại toàn bộ
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const updatedItems = prevCart.items.filter((item) => item.cartItemId !== cartItemId);

        const newSummary = {
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + item.lineTotal, 0),
          hasWarnings: updatedItems.some((item) => item.stockWarning),
          hasUnavailableItems: updatedItems.some((item) => !item.isAvailable),
        };

        return {
          ...prevCart,
          items: updatedItems,
          summary: newSummary,
        };
      });

      refreshCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      alert(err.message);
      // Nếu có lỗi, fetch lại để đảm bảo data đúng
      await fetchCart();
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
      return;
    }

    try {
      await cartService.clearCart();
      await fetchCart();
      refreshCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading fullScreen />
      </div>
    );
  }

  if (error && !cart) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-lg underline transition-colors"
              >
                Vui lòng đăng nhập để xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
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
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
        <ForgotPasswordModal
          isOpen={isForgotPasswordModalOpen}
          onClose={() => setIsForgotPasswordModalOpen(false)}
          onSwitchToLogin={() => {
            setIsForgotPasswordModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      </>
    );
  }

  const items = cart?.items || [];
  const summary = cart?.summary || {
    totalItems: 0,
    totalPrice: 0,
    hasWarnings: false,
    hasUnavailableItems: false,
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Giỏ hàng</h1>
          <EmptyState
            icon={
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Giỏ hàng của bạn đang trống"
            description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm"
            actionLabel="Tiếp tục mua sắm"
            actionLink="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Xóa toàn bộ
            </button>
          )}
        </div>

        {summary.hasWarnings && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              ⚠️ Một số sản phẩm trong giỏ hàng có số lượng vượt quá tồn kho
            </p>
          </div>
        )}

        {summary.hasUnavailableItems && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              ⚠️ Một số sản phẩm trong giỏ hàng không còn khả dụng
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card
                key={item.cartItemId}
                className={!item.isAvailable ? "opacity-60" : ""}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={item.productImage || "/placeholder.png"}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder.png";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {item.productName}
                    </h3>
                    {item.optionColor && (
                      <p className="text-sm text-gray-600 mb-1">
                        Màu: {item.optionColor}
                      </p>
                    )}
                    {item.optionVersion && (
                      <p className="text-sm text-gray-600 mb-2">
                        Phiên bản: {item.optionVersion}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      {item.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-amber-600">
                            {formatPrice(item.salePrice)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>

                    {!item.isAvailable && (
                      <p className="text-xs text-red-600 mb-2">
                        ⚠️ Sản phẩm không còn khả dụng
                      </p>
                    )}
                    {item.stockWarning && (
                      <p className="text-xs text-yellow-600 mb-2">
                        ⚠️ Số lượng vượt quá tồn kho (còn {item.stockQuantity})
                      </p>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.cartItemId,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            updatingItems.has(item.cartItemId) ||
                            item.quantity <= 1
                          }
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 min-w-[60px] text-center font-medium">
                          {updatingItems.has(item.cartItemId) ? (
                            <span className="animate-spin">⟳</span>
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.cartItemId,
                              item.quantity + 1
                            )
                          }
                          disabled={updatingItems.has(item.cartItemId)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tổng sản phẩm:</span>
                  <span className="font-medium">{summary.totalItems}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-medium">
                    {formatPrice(summary.totalPrice)}
                  </span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Tổng cộng:</span>
                <span className="text-amber-600">
                  {formatPrice(summary.totalPrice)}
                </span>
              </div>

              <Button
                onClick={() => navigate("/checkout")}
                disabled={summary.hasUnavailableItems}
                fullWidth
              >
                Thanh toán
              </Button>

              <Link
                to="/categories"
                className="block mt-4 text-center text-amber-600 hover:text-amber-700 font-medium"
              >
                ← Tiếp tục mua sắm
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

