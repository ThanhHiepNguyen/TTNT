import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} from "../controllers/Order/orderController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     description: "Tạo đơn hàng từ giỏ hàng. Tự động trừ tồn kho và xóa giỏ hàng sau khi tạo đơn. Yêu cầu: shippingAddress, paymentMethod (COD/VNPAY)."
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress, paymentMethod]
 *             properties:
 *               shippingAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, VNPAY]
 *           example:
 *             shippingAddress: "123 Đường ABC, Quận 1, TP.HCM"
 *             paymentMethod: "COD"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation hoặc giỏ hàng trống
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware, createOrder);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng
 *     description: "Lấy danh sách đơn hàng. Customer chỉ xem được đơn hàng của mình. Admin/Staff xem được tất cả. Query: page, limit, status (PENDING/PROCESSING/SHIPPING/DELIVERED/CANCELLED)."
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get("/", authMiddleware, getOrders);

/**
 * @openapi
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     description: "Lấy thông tin chi tiết đơn hàng. Customer chỉ xem được đơn hàng của mình."
 *     tags:
 *       - Orders
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
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:orderId", authMiddleware, getOrderById);

/**
 * @openapi
 * /api/v1/orders/{orderId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (ADMIN/STAFF)
 *     description: "Cập nhật trạng thái đơn hàng. Chỉ ADMIN và STAFF mới được cập nhật. Khi chuyển sang DELIVERED, tự động cập nhật payment status thành PAID."
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.patch("/:orderId/status", authMiddleware, requireRoles(["ADMIN", "STAFF"]), updateOrderStatus);

/**
 * @openapi
 * /api/v1/orders/{orderId}/cancel:
 *   post:
 *     summary: Hủy đơn hàng
 *     description: "Hủy đơn hàng. Customer chỉ hủy được đơn hàng của mình ở trạng thái PENDING hoặc PROCESSING. Admin có thể hủy bất kỳ đơn hàng nào (trừ đã giao). Tự động hoàn trả tồn kho."
 *     tags:
 *       - Orders
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
 *         description: Không thể hủy đơn hàng
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.post("/:orderId/cancel", authMiddleware, cancelOrder);

export default router;

