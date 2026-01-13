import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import {
    getAllCategory,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/Category/categoryController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: Lấy danh sách categories
 *     description: Lấy tất cả categories, sắp xếp theo thời gian tạo mới nhất.
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get("/", getAllCategory);

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     summary: Tạo category mới (ADMIN)
 *     description: Tạo category mới. Tên category phải unique.
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *           example:
 *             name: "Điện thoại"
 *             description: "Danh mục điện thoại di động"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       409:
 *         description: Tên category đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware, requireRoles(["ADMIN"]), createCategory);

/**
 * @openapi
 * /api/v1/categories/{categoryId}:
 *   get:
 *     summary: Lấy chi tiết category
 *     description: "Lấy thông tin category kèm danh sách sản phẩm (có phân trang). Query: page, limit, sortBy (asc/desc để sắp xếp options theo giá). Chỉ hiển thị options đang active."
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *           default: 12
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get("/:categoryId", getCategoryById);

/**
 * @openapi
 * /api/v1/categories/{categoryId}:
 *   patch:
 *     summary: Cập nhật category (ADMIN)
 *     description: Cập nhật thông tin category. Tên category phải unique.
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               name:
 *                 type: string
 *               description:
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
 *       409:
 *         description: Tên category đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.patch("/:categoryId", authMiddleware, requireRoles(["ADMIN"]), updateCategory);

/**
 * @openapi
 * /api/v1/categories/{categoryId}:
 *   delete:
 *     summary: Xóa category (ADMIN)
 *     description: "Xóa category và tất cả dữ liệu liên quan (products, reviews, options, orderItems). Cảnh báo: sẽ mất lịch sử đơn hàng."
 *     tags:
 *       - Categories
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
router.delete("/:categoryId", authMiddleware, requireRoles(["ADMIN"]), deleteCategory);

export default router;

