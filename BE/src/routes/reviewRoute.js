import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import {
    createReview,
    createComment,
    getReviewsByProduct,
    updateReview,
    deleteReview,
    canReviewProduct,
    getAllReviews,
    replyReview,
} from "../controllers/Review/reviewController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/reviews/comment:
 *   post:
 *     summary: Tạo bình luận sản phẩm
 *     description: "Tạo bình luận cho sản phẩm. Ai cũng có thể bình luận (không cần mua hàng)."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, comment]
 *             properties:
 *               productId:
 *                 type: string
 *               comment:
 *                 type: string
 *           example:
 *             productId: "507f1f77bcf86cd799439012"
 *             comment: "Sản phẩm này trông rất đẹp!"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/comment", authMiddleware, createComment);

/**
 * @openapi
 * /api/v1/reviews:
 *   post:
 *     summary: Tạo đánh giá sản phẩm
 *     description: "Tạo đánh giá cho sản phẩm. Mỗi user chỉ được đánh giá 1 lần cho mỗi sản phẩm. Rating từ 1-5 sao."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating]
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *           example:
 *             productId: "507f1f77bcf86cd799439012"
 *             rating: 5
 *             comment: "Sản phẩm rất tốt, đáng mua!"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation hoặc đã đánh giá rồi
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware, createReview);

/**
 * @openapi
 * /api/v1/reviews/product/{productId}:
 *   get:
 *     summary: Lấy danh sách đánh giá theo sản phẩm
 *     description: "Lấy danh sách đánh giá của sản phẩm kèm thống kê (tổng số, điểm trung bình, phân bố theo sao). Query: page, limit."
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.get("/product/:productId", getReviewsByProduct);

/**
 * @openapi
 * /api/v1/reviews:
 *   get:
 *     summary: (ADMIN) Lấy danh sách tất cả đánh giá
 *     description: "Lấy danh sách tất cả đánh giá với phân trang và filter. Query: page, limit, search (comment/user name/email/product name), productId, userId, rating (1-5)."
 *     tags:
 *       - Reviews
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5]
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi server
 */
router.get("/", authMiddleware, requireRoles(["ADMIN", "STAFF"]), getAllReviews);

/**
 * @openapi
 * /api/v1/reviews/product/{productId}/can-review:
 *   get:
 *     summary: Kiểm tra quyền đánh giá sản phẩm
 *     description: "Kiểm tra xem user hiện tại có thể đánh giá sản phẩm không (đã mua và nhận hàng thành công)."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       404:
 *         description: Sản phẩm không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.get("/product/:productId/can-review", authMiddleware, canReviewProduct);

/**
 * @openapi
 * /api/v1/reviews/{reviewId}:
 *   patch:
 *     summary: Cập nhật đánh giá
 *     description: "Cập nhật đánh giá. Chỉ user tạo review mới được cập nhật."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
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
router.patch("/:reviewId", authMiddleware, updateReview);

/**
 * @openapi
 * /api/v1/reviews/{reviewId}:
 *   delete:
 *     summary: Xóa đánh giá
 *     description: "Xóa đánh giá. User chỉ xóa được review của mình. Admin có thể xóa bất kỳ review nào."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
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
router.delete("/:reviewId", authMiddleware, deleteReview);

/**
 * @openapi
 * /api/v1/reviews/{reviewId}/reply:
 *   post:
 *     summary: Phản hồi đánh giá (ADMIN/STAFF)
 *     description: "Phản hồi đánh giá từ khách hàng. Chỉ ADMIN và STAFF mới được phản hồi."
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reply]
 *             properties:
 *               reply:
 *                 type: string
 *           example:
 *             reply: "Cảm ơn bạn đã đánh giá. Chúng tôi sẽ cải thiện dịch vụ."
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
router.post("/:reviewId/reply", authMiddleware, requireRoles(["ADMIN", "STAFF"]), replyReview);

export default router;

