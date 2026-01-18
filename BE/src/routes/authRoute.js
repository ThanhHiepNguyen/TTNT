import { Router } from "express";
import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
    adminListUsers,
    adminGetUserById,
    adminCreateUser,
    adminUpdateUser,
    adminLockUser,
    adminUnlockUser,
} from "../controllers/Auth/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     description: Đăng ký user mới. Email và phone phải unique. Password tối thiểu 6 ký tự. Mặc định role CUSTOMER.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, password, name, address]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *           example:
 *             email: "user@example.com"
 *             phone: "0393048626"
 *             password: "password123"
 *             name: "Nguyen Van A"
 *             address: "123 ABC Street"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation hoặc email/phone đã tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post("/register", register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     description: Đăng nhập bằng email hoặc phone + password. Trả về accessToken (dùng Bearer token hoặc cookie).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Sai thông tin đăng nhập
 *       403:
 *         description: Tài khoản bị khóa
 *       500:
 *         description: Lỗi server
 */
router.post("/login", login);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     description: Đăng xuất user. Xóa cookie access_token.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.post("/logout", logout);

/**
 * @openapi
 * /api/v1/auth/profile:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     description: Lấy thông tin user sau khi đăng nhập. Dùng Bearer token hoặc cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy user
 *       500:
 *         description: Lỗi server
 */
router.get("/profile", authMiddleware, getProfile);
/**
 * @openapi
 * /api/v1/auth/profile:
 *   patch:
 *     summary: Cập nhật profile
 *     description: Cập nhật thông tin user (name, address, password). Không thể thay đổi email/phone.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */

router.patch("/profile", authMiddleware, updateProfile);
/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Yêu cầu reset password
 *     description: Gửi email reset password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi validation
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @openapi
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Xác thực mã OTP
 *     description: Kiểm tra mã OTP có hợp lệ không trước khi cho phép đặt lại mật khẩu.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 *       400:
 *         description: OTP không đúng hoặc đã hết hạn
 */
router.post("/verify-otp", verifyOtp);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Đặt lại mật khẩu bằng token từ email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email (optional, nhưng nên có để tăng tính bảo mật)
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Token không hợp lệ hoặc password yếu
 */
router.post("/reset-password", resetPassword);



/**
 * @openapi
 * /api/v1/auth/admin/users:
 *   get:
 *     summary: (ADMIN) Danh sách users
 *     description: "Lấy danh sách users có phân trang. Query: page, limit, search (email/phone/name), role, isActive."
 *     tags:
 *       - Auth
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, STAFF, ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.get("/admin/users", authMiddleware, requireRoles(["ADMIN"]), adminListUsers);

/**
 * @openapi
 * /api/v1/auth/admin/users/{userId}:
 *   get:
 *     summary: (ADMIN) Chi tiết user
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get("/admin/users/:userId", authMiddleware, requireRoles(["ADMIN"]), adminGetUserById);

/**
 * @openapi
 * /api/v1/auth/admin/users:
 *   post:
 *     summary: (ADMIN) Tạo user
 *     description: Tạo user mới. Mặc định role STAFF nếu không truyền.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, STAFF, ADMIN]
 *     responses:
 *       201:
 *         description: Thành công
 *       409:
 *         description: Email/phone đã tồn tại
 */
router.post("/admin/users", authMiddleware, requireRoles(["ADMIN"]), adminCreateUser);

/**
 * @openapi
 * /api/v1/auth/admin/users/{userId}:
 *   patch:
 *     summary: (ADMIN) Cập nhật user
 *     description: Cập nhật role và/hoặc isActive của user.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, STAFF, ADMIN]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.patch("/admin/users/:userId", authMiddleware, requireRoles(["ADMIN"]), adminUpdateUser);

/**
 * @openapi
 * /api/v1/auth/admin/users/{userId}/lock:
 *   post:
 *     summary: (ADMIN) Khóa user
 *     description: Khóa tài khoản user (set isActive=false).
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.post("/admin/users/:userId/lock", authMiddleware, requireRoles(["ADMIN"]), adminLockUser);

/**
 * @openapi
 * /api/v1/auth/admin/users/{userId}/unlock:
 *   post:
 *     summary: (ADMIN) Mở khóa user
 *     description: Mở khóa tài khoản user (set isActive=true).
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.post("/admin/users/:userId/unlock", authMiddleware, requireRoles(["ADMIN"]), adminUnlockUser);

export default router;