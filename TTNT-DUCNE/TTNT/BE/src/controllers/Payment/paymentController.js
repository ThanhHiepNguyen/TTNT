import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import { createVnpayPaymentUrl, verifyVnpayCallback } from "../../services/vnpayService.js";

export const createPaymentUrl = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { orderId },
            include: {
                payments: {
                    where: { paymentMethod: "VNPAY" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!order) {
            return sendResponse(res, 404, "Đơn hàng không tồn tại");
        }

        if (order.userId !== userId) {
            return sendResponse(res, 403, "Không có quyền truy cập đơn hàng này");
        }

        if (order.status === "CANCELLED") {
            return sendResponse(res, 400, "Không thể thanh toán đơn hàng đã bị hủy");
        }

        const payment = order.payments[0];
        if (!payment) {
            return sendResponse(res, 404, "Không tìm thấy thông tin thanh toán");
        }

        if (payment.paymentStatus === "PAID") {
            return sendResponse(res, 400, "Đơn hàng đã được thanh toán");
        }

        try {
            const clientIp = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"]?.split(",")[0] || "127.0.0.1";

            const paymentUrl = await createVnpayPaymentUrl(
                order.orderId,
                order.totalPrice,
                `Thanh toan don hang ${order.orderId}`,
                clientIp
            );

            return sendResponse(res, 200, "Tạo URL thanh toán thành công", {
                paymentUrl,
            });
        } catch (vnpayError) {
            console.error("VNPay error:", vnpayError);
            if (vnpayError.message?.includes("Missing VNPay") || vnpayError.message?.includes("configuration")) {
                return sendResponse(res, 500, "Cấu hình VNPay chưa đầy đủ. Vui lòng liên hệ quản trị viên.");
            }
            if (vnpayError.message?.includes("Invalid amount")) {
                return sendResponse(res, 400, "Số tiền thanh toán không hợp lệ");
            }
            return sendResponse(res, 500, "Không thể tạo URL thanh toán VNPay");
        }
    } catch (err) {
        console.error("Error createPaymentUrl:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const vnpayCallback = async (req, res) => {
    try {
        const vnp_Params = req.query;

        const orderId = vnp_Params.vnp_TxnRef;
        const responseCode = vnp_Params.vnp_ResponseCode;
        const transactionNo = vnp_Params.vnp_TransactionNo;
        const amount = parseFloat(vnp_Params.vnp_Amount) / 100;

        const isValid = await verifyVnpayCallback(vnp_Params);
        if (!isValid) {
            console.error("Invalid VNPay signature for order:", orderId);
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${orderId}&message=Invalid signature`);
        }

        const order = await prisma.order.findUnique({
            where: { orderId },
            include: {
                payments: {
                    where: { paymentMethod: "VNPAY" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!order) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${orderId}`);
        }

        const payment = order.payments[0];
        if (!payment) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${orderId}`);
        }

        if (responseCode === "00") {
            await prisma.payment.update({
                where: { paymentId: payment.paymentId },
                data: {
                    paymentStatus: "PAID",
                    transactionDate: new Date(),
                },
            });

            if (order.status === "PENDING") {
                await prisma.order.update({
                    where: { orderId },
                    data: { status: "PROCESSING" },
                });
            }

            return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
        } else {
            await prisma.payment.update({
                where: { paymentId: payment.paymentId },
                data: {
                    paymentStatus: "FAILED",
                },
            });

            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${orderId}`);
        }
    } catch (err) {
        console.error("Error vnpayCallback:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
};

export const getPaymentStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { orderId },
            include: {
                payments: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!order) {
            return sendResponse(res, 404, "Đơn hàng không tồn tại");
        }

        if (order.userId !== userId && req.user?.role !== "ADMIN" && req.user?.role !== "STAFF") {
            return sendResponse(res, 403, "Không có quyền truy cập");
        }

        return sendResponse(res, 200, "Lấy trạng thái thanh toán thành công", {
            payments: order.payments,
        });
    } catch (err) {
        console.error("Error getPaymentStatus:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

