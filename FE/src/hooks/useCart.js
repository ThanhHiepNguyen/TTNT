import { useState, useEffect } from "react";
import { cartService } from "../api/services";

export const useCart = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            if (err.status === 401 || err.response?.status === 401 || err.message?.includes("401") || err.message?.includes("Chưa đăng nhập") || err.message?.includes("Không có token")) {
                setCart(null);
                setError(null);
            } else {
                setError(err.message);
                setCart(null);
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        cart,
        loading,
        error,
        refetch: fetchCart,
        totalItems: cart?.summary?.totalItems || 0,
    };
};

