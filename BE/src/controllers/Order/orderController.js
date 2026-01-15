import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

const orderSelect = {
    orderId: true,
    userId: true,
    totalPrice: true,
    status: true,
    shippingAddress: true,
    paymentMethod: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            userId: true,
            name: true,
            email: true,
            phone: true,
        },
    },
    items: {
        select: {
            orderItemId: true,
            productId: true,
            optionId: true,
            quantity: true,
            unitPrice: true,
            optionPrice: true,
            lineTotal: true,
            product: {
                select: {
                    productId: true,
                    name: true,
                    thumbnail: true,
                    category: {
                        select: {
                            categoryId: true,
                            name: true,
                        },
                    },
                },
            },
            option: {
                select: {
                    optionId: true,
                    color: true,
                    version: true,
                    price: true,
                    salePrice: true,
                    image: true,
                },
            },
        },
    },
    payments: {
        select: {
            paymentId: true,
            paymentStatus: true,
            amount: true,
            paymentMethod: true,
            transactionDate: true,
            createdAt: true,
        },
    },
};

export const createOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { shippingAddress, paymentMethod } = req.body;

        if (!shippingAddress || !shippingAddress.trim()) {
            return sendResponse(res, 400, "Vui lòng nhập địa chỉ giao hàng");
        }

        if (!paymentMethod || !["COD", "VNPAY"].includes(paymentMethod)) {
            return sendResponse(res, 400, "Phương thức thanh toán không hợp lệ (COD hoặc VNPAY)");
        }

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                productId: true,
                                name: true,
                            },
                        },
                        option: {
                            select: {
                                optionId: true,
                                price: true,
                                salePrice: true,
                                stockQuantity: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            return sendResponse(res, 400, "Giỏ hàng trống");
        }

        const orderItems = [];
        let totalPrice = 0;

        for (const cartItem of cart.items) {
            const { product, option, quantity, savedPrice } = cartItem;

            if (!product) {
                return sendResponse(res, 400, `Sản phẩm không còn tồn tại`);
            }

            if (option) {
                if (!option.isActive) {
                    return sendResponse(res, 400, `Option của sản phẩm ${product.name} đã bị khóa`);
                }

                if (quantity > option.stockQuantity) {
                    return sendResponse(res, 400, `Sản phẩm ${product.name} không đủ tồn kho (còn ${option.stockQuantity} sản phẩm)`);
                }

                const unitPrice = option.salePrice || option.price;
                const lineTotal = unitPrice * quantity;
                totalPrice += lineTotal;

                orderItems.push({
                    productId: product.productId,
                    optionId: option.optionId,
                    quantity,
                    unitPrice: option.price,
                    optionPrice: option.salePrice || null,
                    lineTotal,
                });
            } else {
                return sendResponse(res, 400, `Sản phẩm ${product.name} cần chọn option`);
            }
        }

        if (orderItems.length === 0) {
            return sendResponse(res, 400, "Không có sản phẩm hợp lệ để đặt hàng");
        }

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    shippingAddress: shippingAddress.trim(),
                    paymentMethod,
                    items: {
                        create: orderItems,
                    },
                    payments: {
                        create: {
                            amount: totalPrice,
                            paymentMethod,
                            paymentStatus: paymentMethod === "COD" ? "UNPAID" : "UNPAID",
                        },
                    },
                },
                select: orderSelect,
            });

            for (const item of orderItems) {
                await tx.productOption.update({
                    where: { optionId: item.optionId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            await tx.cartItem.deleteMany({
                where: { cartId: cart.cartId },
            });

            return order;
        });

        return sendResponse(res, 201, "Tạo đơn hàng thành công", { order: result });
    } catch (err) {
        console.error("Error createOrder:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const where = {
            ...(userRole === "CUSTOMER" ? { userId } : {}),
            ...(status && ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"].includes(status)
                ? { status }
                : {}),
        };

        const total = await prisma.order.count({ where });
        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: orderSelect,
        });

        const totalPages = Math.ceil(total / limit);

        return sendResponse(res, 200, "Lấy danh sách đơn hàng thành công", {
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error("Error getOrders:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getOrderById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { orderId },
            select: orderSelect,
        });

        if (!order) {
            return sendResponse(res, 404, "Đơn hàng không tồn tại");
        }

        if (userRole === "CUSTOMER" && order.userId !== userId) {
            return sendResponse(res, 403, "Không có quyền truy cập");
        }

        return sendResponse(res, 200, "Lấy đơn hàng thành công", { order });
    } catch (err) {
        console.error("Error getOrderById:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        if (userRole !== "ADMIN" && userRole !== "STAFF") {
            return sendResponse(res, 403, "Không có quyền cập nhật trạng thái đơn hàng");
        }

        const { orderId } = req.params;
        const { status } = req.body;

        if (!status || !["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"].includes(status)) {
            return sendResponse(res, 400, "Trạng thái không hợp lệ");
        }

        const order = await prisma.order.findUnique({
            where: { orderId },
            select: { orderId: true, status: true },
        });

        if (!order) {
            return sendResponse(res, 404, "Đơn hàng không tồn tại");
        }

        if (order.status === "CANCELLED") {
            return sendResponse(res, 400, "Không thể cập nhật đơn hàng đã bị hủy");
        }

        if (order.status === "DELIVERED" && status !== "DELIVERED") {
            return sendResponse(res, 400, "Không thể thay đổi trạng thái đơn hàng đã giao");
        }

        const updatedOrder = await prisma.order.update({
            where: { orderId },
            data: { status },
            select: orderSelect,
        });

        if (status === "DELIVERED") {
            await prisma.payment.updateMany({
                where: {
                    orderId,
                    paymentStatus: "UNPAID",
                },
                data: {
                    paymentStatus: "PAID",
                },
            });
        }

        return sendResponse(res, 200, "Cập nhật trạng thái đơn hàng thành công", { order: updatedOrder });
    } catch (err) {
        console.error("Error updateOrderStatus:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { orderId },
            include: {
                items: {
                    select: {
                        optionId: true,
                        quantity: true,
                    },
                },
            },
        });

        if (!order) {
            return sendResponse(res, 404, "Đơn hàng không tồn tại");
        }

        if (userRole === "CUSTOMER") {
            if (order.userId !== userId) {
                return sendResponse(res, 403, "Không có quyền hủy đơn hàng này");
            }

            if (order.status !== "PENDING" && order.status !== "PROCESSING") {
                return sendResponse(res, 400, "Chỉ có thể hủy đơn hàng ở trạng thái PENDING hoặc PROCESSING");
            }
        }

        if (order.status === "DELIVERED") {
            return sendResponse(res, 400, "Không thể hủy đơn hàng đã giao");
        }

        if (order.status === "CANCELLED") {
            return sendResponse(res, 400, "Đơn hàng đã bị hủy");
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { orderId },
                data: { status: "CANCELLED" },
                select: orderSelect,
            });

            for (const item of order.items) {
                if (item.optionId) {
                    await tx.productOption.update({
                        where: { optionId: item.optionId },
                        data: {
                            stockQuantity: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
            }

            await tx.payment.updateMany({
                where: {
                    orderId,
                    paymentStatus: "UNPAID",
                },
                data: {
                    paymentStatus: "FAILED",
                },
            });

            return updatedOrder;
        });

        return sendResponse(res, 200, "Hủy đơn hàng thành công", { order: result });
    } catch (err) {
        console.error("Error cancelOrder:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

