import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

// Cấu hình các trường dữ liệu cần lấy từ database
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

// 1. Lấy thông tin chi tiết giỏ hàng
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
            let stockQuantity = option ? option.stockQuantity : 0;
            let stockWarning = option && quantity > stockQuantity;
            
            let productImage = (option && option.image) ? option.image : (product ? product.thumbnail : null);
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

// 2. Thêm sản phẩm (Đã sửa lỗi 0đ bằng cách tự tìm Option mặc định)
export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendResponse(res, 401, "Chưa đăng nhập");

        let { productId, optionId, quantity } = req.body;
        if (!productId) return sendResponse(res, 400, "Vui lòng chọn sản phẩm");
        if (!quantity || quantity < 1) quantity = 1;

        // KIỂM TRA SẢN PHẨM: Nếu chatbot không gửi optionId, tìm phiên bản đầu tiên đang hoạt động
        if (!optionId) {
            const firstOption = await prisma.productOption.findFirst({
                where: { productId, isActive: true },
                orderBy: { price: 'asc' }
            });
            if (!firstOption) return sendResponse(res, 404, "Sản phẩm này hiện chưa có phiên bản để bán");
            optionId = firstOption.optionId;
        }

        const option = await prisma.productOption.findUnique({
            where: { optionId },
            select: { optionId: true, productId: true, price: true, salePrice: true, stockQuantity: true, isActive: true },
        });

        if (!option || !option.isActive) return sendResponse(res, 400, "Phiên bản sản phẩm không khả dụng");
        if (quantity > option.stockQuantity) return sendResponse(res, 400, `Chỉ còn ${option.stockQuantity} sản phẩm`);

        // Tìm hoặc tạo giỏ hàng
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) cart = await prisma.cart.create({ data: { userId } });

        const priceToSave = option.salePrice || option.price;

        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.cartId, productId, optionId },
        });

        let cartItem;
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > option.stockQuantity) return sendResponse(res, 400, "Tổng số lượng vượt quá tồn kho");

            cartItem = await prisma.cartItem.update({
                where: { cartItemId: existingItem.cartItemId },
                data: { quantity: newQuantity, savedPrice: priceToSave },
                select: cartSelect.items.select,
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: { cartId: cart.cartId, productId, optionId, quantity, savedPrice: priceToSave },
                select: cartSelect.items.select,
            });
        }

        return sendResponse(res, 200, "Đã thêm vào giỏ hàng", { cartItem });
    } catch (err) {
        console.error("Error addToCart:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

// 3. Cập nhật số lượng
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendResponse(res, 401, "Chưa đăng nhập");

        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) return sendResponse(res, 400, "Số lượng không hợp lệ");

        const cartItem = await prisma.cartItem.findUnique({
            where: { cartItemId },
            include: { cart: true, option: true }
        });

        if (!cartItem || cartItem.cart.userId !== userId) return sendResponse(res, 404, "Không tìm thấy món hàng");
        if (cartItem.option && quantity > cartItem.option.stockQuantity) return sendResponse(res, 400, "Vượt quá tồn kho");

        const updated = await prisma.cartItem.update({
            where: { cartItemId },
            data: { quantity },
            select: cartSelect.items.select,
        });

        return sendResponse(res, 200, "Cập nhật thành công", { cartItem: updated });
    } catch (err) {
        return sendResponse(res, 500, "Lỗi server");
    }
};

// 4. Xóa một món hàng
export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { cartItemId } = req.params;

        const cartItem = await prisma.cartItem.findUnique({
            where: { cartItemId },
            include: { cart: true }
        });

        if (!cartItem || cartItem.cart.userId !== userId) return sendResponse(res, 404, "Không có quyền xóa");

        await prisma.cartItem.delete({ where: { cartItemId } });
        return sendResponse(res, 200, "Đã xóa sản phẩm khỏi giỏ");
    } catch (err) {
        return sendResponse(res, 500, "Lỗi server");
    }
};

// 5. Dọn sạch giỏ hàng
export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return sendResponse(res, 404, "Giỏ hàng không tồn tại");

        await prisma.cartItem.deleteMany({ where: { cartId: cart.cartId } });
        return sendResponse(res, 200, "Đã dọn sạch giỏ hàng");
    } catch (err) {
        return sendResponse(res, 500, "Lỗi server");
    }
};
