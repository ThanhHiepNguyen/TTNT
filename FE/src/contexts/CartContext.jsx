import { createContext, useContext, useState, useEffect } from "react";
import { cartService } from "../api/services";
import { useAuth } from "../hooks/useAuth";

const CartContext = createContext();

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCartContext must be used within CartProvider");
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCart(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await cartService.getCart();
            setCart(response);
        } catch (err) {
            if (err.status === 401 || err.response?.status === 401 || err.message?.includes("401") || err.message?.includes("Chưa đăng nhập")) {
                setCart(null);
            } else {
                console.error("Error fetching cart:", err);
                setCart(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [isAuthenticated]);


    useEffect(() => {
        const handleCartUpdate = () => {
            fetchCart();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const refreshCart = () => {
        fetchCart();
    };

    // Số lượng items (sản phẩm khác nhau) trong giỏ hàng, không phải tổng số lượng
    const totalItems = cart?.items?.length || 0;

    return (
        <CartContext.Provider value={{ cart, loading, refreshCart, totalItems }}>
            {children}
        </CartContext.Provider>
    );
};

