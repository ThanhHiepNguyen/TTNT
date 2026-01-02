import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/Product/productController.js";

const router = Router();

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     description: "Lấy danh sách sản phẩm với search, filter, pagination. Query: page, limit, search (tên/mô tả), categoryId, minPrice, maxPrice, sortBy (asc/desc để sắp xếp theo giá)."
 *     tags:
 *       - Products
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
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get("/", getAllProducts);

/**
 * @openapi
 * /api/v1/products/{productId}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     description: Lấy thông tin sản phẩm kèm options. Query `sortBy` để sắp xếp options theo giá (asc/desc).
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
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
router.get("/:productId", getProductById);

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     summary: Tạo sản phẩm mới (ADMIN)
 *     description: "Tạo sản phẩm với options. Mỗi sản phẩm cần ít nhất 1 option. Option cần: price, image, stockQuantity. Giảm giá: nhập salePrice (hệ thống tự tính %)."
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, categoryId, options]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               options:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [price, image, stockQuantity]
 *                   properties:
 *                     color:
 *                       type: string
 *                     version:
 *                       type: string
 *                     price:
 *                       type: number
 *                     salePrice:
 *                       type: number
 *                     stockQuantity:
 *                       type: integer
 *                     sku:
 *                       type: string
 *                     image:
 *                       type: string
 *           example:
 *             name: "iPhone 15 Pro Max"
 *             description: "Điện thoại thông minh cao cấp"
 *             categoryId: "507f1f77bcf86cd799439011"
 *             options:
 *               - color: "Titanium"
 *                 version: "256GB"
 *                 price: 29990000
 *                 salePrice: 27990000
 *                 stockQuantity: 50
 *                 image: "https://example.com/iphone.jpg"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Category không tồn tại
 *       409:
 *         description: SKU trùng
 *       500:
 *         description: Lỗi server
 */
router.post("/", authMiddleware, requireRoles(["ADMIN"]), createProduct);

/**
 * @openapi
 * /api/v1/products/{productId}:
 *   patch:
 *     summary: Cập nhật sản phẩm (ADMIN)
 *     description: "Cập nhật thông tin sản phẩm (name, description, categoryId, thumbnail). Options: có optionId = update, không có = tạo mới. deleteOptionIds = xóa (option có đơn hàng sẽ bị khóa thay vì xóa). Phải còn ít nhất 1 option sau khi cập nhật."
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               categoryId:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               deleteOptionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     optionId:
 *                       type: string
 *                     color:
 *                       type: string
 *                     version:
 *                       type: string
 *                     price:
 *                       type: number
 *                     salePrice:
 *                       type: number
 *                     stockQuantity:
 *                       type: integer
 *                     sku:
 *                       type: string
 *                     image:
 *                       type: string
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
 *         description: SKU trùng hoặc không thể xóa option
 *       500:
 *         description: Lỗi server
 */
router.patch("/:productId", authMiddleware, requireRoles(["ADMIN"]), updateProduct);

/**
 * @openapi
 * /api/v1/products/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm (ADMIN)
 *     description: "Xóa sản phẩm và tất cả dữ liệu liên quan (reviews, options, orderItems). Cảnh báo: sẽ mất lịch sử đơn hàng."
 *     tags:
 *       - Products
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
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.delete("/:productId", authMiddleware, requireRoles(["ADMIN"]), deleteProduct);

export default router;

