import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";


const cartSelect = {
    cartId: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    items: {
        select: {
            cartItemId: true,
            productId: true,
            optionId: true,
            quantity: true,
            savedPrice: true,
            product: {
                select: {
                    productId: true,
                    name: true,
                    thumbnail: true,
                    category: { select: { categoryId: true, name: true } },
                },
            },
            option: {
                select: {
                    optionId: true,
                    color: true,
                    version: true,
                    price: true,
                    salePrice: true,
                    stockQuantity: true,
                    image: true,
                    isActive: true,
                },
            },
        },
    },
};

export const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }


        let cart = await prisma.cart.findUnique({
            where: { userId },
            select: cartSelect,
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                select: cartSelect,
            });
        }

        const processedItems = cart.items.map((item) => {

            const product = item.product;
            const option = item.option;
            const quantity = item.quantity;
            const savedPrice = item.savedPrice;
            const optionId = item.optionId;


            const isAvailable = product !== null && (optionId === null || (option !== null && option.isActive));


            let stockQuantity = 0;
            if (option) {
                stockQuantity = option.stockQuantity;
            }


            let stockWarning = false;
            if (option && quantity > stockQuantity) {
                stockWarning = true;
            }
            let productImage = null;
            if (option && option.image) {
                productImage = option.image;
            } else if (product && product.thumbnail) {
                productImage = product.thumbnail;
            }


            const lineTotal = savedPrice * quantity;

            return {
                cartItemId: item.cartItemId,
                productId: product ? product.productId : null,
                productName: product ? product.name : "Sản phẩm không còn tồn tại",
                productImage: productImage,
                optionId: option ? option.optionId : null,
                optionColor: option ? option.color : null,
                optionVersion: option ? option.version : null,
                quantity: quantity,
                price: option ? option.price : null,
                salePrice: option ? option.salePrice : null,
                lineTotal: lineTotal,
                stockQuantity: stockQuantity,
                isAvailable: isAvailable,
                stockWarning: stockWarning,
            };
        });


        const summary = {
            totalItems: processedItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: processedItems.reduce((sum, item) => sum + item.lineTotal, 0),
            hasWarnings: processedItems.some((item) => item.stockWarning),
            hasUnavailableItems: processedItems.some((item) => !item.isAvailable),
        };

        return sendResponse(res, 200, "Lấy giỏ hàng thành công", {
            items: processedItems,
            summary,
        });
    } catch (err) {
        console.error("Error getCart:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { productId, optionId, quantity } = req.body;

        if (!productId) {
            return sendResponse(res, 400, "Vui lòng chọn sản phẩm");
        }

        if (quantity === undefined || quantity === null || quantity < 1) {
            return sendResponse(res, 400, "Số lượng phải lớn hơn 0");
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        let option = null;
        if (optionId) {
            option = await prisma.productOption.findUnique({
                where: { optionId },
                select: {
                    optionId: true,
                    productId: true,
                    price: true,
                    salePrice: true,
                    stockQuantity: true,
                    isActive: true,
                },
            });

            if (!option) {
                return sendResponse(res, 404, "Option không tồn tại");
            }

            if (!option.isActive) {
                return sendResponse(res, 400, "Option này đã bị khóa, không thể thêm vào giỏ hàng");
            }

            if (option.productId !== productId) {
                return sendResponse(res, 400, "Option không thuộc sản phẩm này");
            }

            if (quantity > option.stockQuantity) {
                return sendResponse(res, 400, `Số lượng vượt quá tồn kho (còn ${option.stockQuantity} sản phẩm)`);
            }
        }

        let cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }

        const savedPrice = option ? (option.salePrice || option.price) : null;

        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.cartId,
                productId,
                optionId: optionId || null,
            },
        });

        let cartItem;
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (option && newQuantity > option.stockQuantity) {
                return sendResponse(res, 400, `Tổng số lượng vượt quá tồn kho (còn ${option.stockQuantity} sản phẩm)`);
            }

            cartItem = await prisma.cartItem.update({
                where: { cartItemId: existingItem.cartItemId },
                data: {
                    quantity: newQuantity,
                    savedPrice: savedPrice || existingItem.savedPrice,
                },
                select: cartSelect.items.select,
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.cartId,
                    productId,
                    optionId: optionId || null,
                    quantity,
                    savedPrice: savedPrice || 0,
                },
                select: cartSelect.items.select,
            });
        }

        return sendResponse(res, 200, "Thêm vào giỏ hàng thành công", { cartItem });
    } catch (err) {
        console.error("Error addToCart:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity === null || quantity < 1) {
            return sendResponse(res, 400, "Số lượng phải lớn hơn 0");
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            return sendResponse(res, 404, "Giỏ hàng không tồn tại");
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { cartItemId },
            select: {
                cartItemId: true,
                cartId: true,
                productId: true,
                optionId: true,
                quantity: true,
                savedPrice: true,
            },
        });

        if (!cartItem) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại trong giỏ hàng");
        }

        if (cartItem.cartId !== cart.cartId) {
            return sendResponse(res, 403, "Không có quyền truy cập");
        }

        if (cartItem.optionId) {
            const option = await prisma.productOption.findUnique({
                where: { optionId: cartItem.optionId },
                select: { stockQuantity: true, isActive: true },
            });

            if (!option) {
                return sendResponse(res, 404, "Option không còn tồn tại");
            }

            if (!option.isActive) {
                return sendResponse(res, 400, "Option này đã bị khóa, không thể cập nhật");
            }

            if (quantity > option.stockQuantity) {
                return sendResponse(res, 400, `Số lượng vượt quá tồn kho (còn ${option.stockQuantity} sản phẩm)`);
            }
        }

        const updatedItem = await prisma.cartItem.update({
            where: { cartItemId },
            data: { quantity },
            select: cartSelect.items.select,
        });

        return sendResponse(res, 200, "Cập nhật giỏ hàng thành công", { cartItem: updatedItem });
    } catch (err) {
        console.error("Error updateCartItem:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { cartItemId } = req.params;

        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            return sendResponse(res, 404, "Giỏ hàng không tồn tại");
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { cartItemId },
            select: {
                cartItemId: true,
                cartId: true,
            },
        });

        if (!cartItem) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại trong giỏ hàng");
        }

        if (cartItem.cartId !== cart.cartId) {
            return sendResponse(res, 403, "Không có quyền truy cập");
        }

        await prisma.cartItem.delete({
            where: { cartItemId },
        });

        return sendResponse(res, 200, "Xóa sản phẩm khỏi giỏ hàng thành công");
    } catch (err) {
        console.error("Error removeCartItem:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
            select: {
                cartId: true,
                items: {
                    select: {
                        cartItemId: true,
                    },
                },
            },
        });

        if (!cart) {
            return sendResponse(res, 404, "Giỏ hàng không tồn tại");
        }

        if (cart.items.length === 0) {
            return sendResponse(res, 200, "Giỏ hàng đã trống");
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.cartId },
        });

        return sendResponse(res, 200, "Xóa toàn bộ giỏ hàng thành công");
    } catch (err) {
        console.error("Error clearCart:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};