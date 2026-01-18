import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} from "../controllers/cart/cartController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     summary: Lấy giỏ hàng
 *     description: Lấy giỏ hàng của user. Tự động tạo cart nếu chưa có.
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/", authMiddleware, getCart);

/**
 * @openapi
 * /api/v1/cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     description: Thêm sản phẩm vào giỏ. Nếu đã có (cùng productId + optionId) thì cộng dồn số lượng. Kiểm tra tồn kho và chỉ thêm option đang active.
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               optionId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *           example:
 *             productId: "507f1f77bcf86cd799439012"
 *             optionId: "507f1f77bcf86cd799439013"
 *             quantity: 2
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation hoặc vượt quá tồn kho
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm/option
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware, addToCart);

/**
 * @openapi
 * /api/v1/cart/{cartItemId}:
 *   patch:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ
 *     description: Cập nhật số lượng cart item. Kiểm tra tồn kho và option phải active.
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation hoặc vượt quá tồn kho
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.patch("/:cartItemId", authMiddleware, updateCartItem);

/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     description: Xóa tất cả items trong giỏ hàng của user hiện tại.
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Giỏ hàng không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.delete("/", authMiddleware, clearCart);

/**
 * @openapi
 * /api/v1/cart/{cartItemId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     description: Xóa cart item. Chỉ user sở hữu cart mới được xóa.
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
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
router.delete("/:cartItemId", authMiddleware, removeCartItem);

export default router;

