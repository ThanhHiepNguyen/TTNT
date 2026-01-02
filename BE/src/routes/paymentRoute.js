import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
    createPaymentUrl,
    vnpayCallback,
    getPaymentStatus,
} from "../controllers/Payment/paymentController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/payments/orders/{orderId}/vnpay:
 *   post:
 *     summary: Tạo URL thanh toán VNPay
 *     description: Tạo URL thanh toán VNPay cho đơn hàng. Chỉ chủ đơn hàng mới được tạo URL.
 *     tags:
 *       - Payments
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Đơn hàng đã được thanh toán hoặc đã bị hủy
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.post("/orders/:orderId/vnpay", authMiddleware, createPaymentUrl);

/**
 * @openapi
 * /api/v1/payments/vnpay/callback:
 *   get:
 *     summary: Callback từ VNPay
 *     description: Endpoint nhận callback từ VNPay sau khi thanh toán. Tự động redirect về frontend.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect về frontend
 */
router.get("/vnpay/callback", vnpayCallback);

/**
 * @openapi
 * /api/v1/payments/orders/{orderId}:
 *   get:
 *     summary: Lấy trạng thái thanh toán
 *     description: Lấy thông tin thanh toán của đơn hàng
 *     tags:
 *       - Payments
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get("/orders/:orderId", authMiddleware, getPaymentStatus);

export default router;

