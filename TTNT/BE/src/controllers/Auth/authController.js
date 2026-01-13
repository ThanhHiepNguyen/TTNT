import { isValidPhone, isValidEmail } from "../../utils/validators.js";
import { prisma } from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../../services/emailServices.js";
import { isValidRole } from "../../middleware/authorize.js";
import { sendResponse } from "../../utils/response.js";

const createToken = (user) => {
    const payload = { userId: user.userId, email: user.email, role: user.role };
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 1000,
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();



export const register = async (req, res) => {
    try {
        const { email, phone, name, address, password } = req.body;

        if (!email || !phone || !password || !name || !address) {
            return sendResponse(res, 400, "Vui lòng nhập đầy đủ thông tin");
        }
        if (!isValidPhone(phone)) {
            return sendResponse(res, 400, "Vui lòng nhập đúng định dạng số điện thoại");
        }
        if (!isValidEmail(email)) {
            return sendResponse(res, 400, "Vui lòng nhập đúng định dạng email");
        }

        if ((password || "").length <= 6) {
            return sendResponse(res, 400, "Mật khẩu chứa ít nhất 6 ký tự");
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] },
        });
        if (existing) {
            return sendResponse(res, 400, "Email hoặc số điện thoại đã tồn tại");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, phone, name, address, passwordHash },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });

        return sendResponse(res, 201, "Đăng ký tài khoản thành công", { user });
    } catch (err) {
        console.error("Đăng ký thất bại: ", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!email && !phone) {
            return sendResponse(res, 400, "Vui lòng nhập email hoặc số điện thoại");
        }
        if (!password) {
            return sendResponse(res, 400, "Vui lòng nhập mật khẩu");
        }
        if (phone && !isValidPhone(phone)) {
            return sendResponse(res, 400, "Vui lòng nhập đúng định dạng số điện thoại");
        }
        if (email && !isValidEmail(email)) {
            return sendResponse(res, 400, "Vui lòng nhập đúng định dạng email");
        }

        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] },
        });
        if (!user) {
            return sendResponse(res, 401, "Email hoặc số điện thoại chưa được đăng ký");
        }
        if (!user.isActive) {
            return sendResponse(res, 403, "Tài khoản đã bị khóa, vui lòng liên hệ admin để xử lý");
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return sendResponse(res, 401, "Thông tin tài khoản hoặc mật khẩu không chính xác");
        }

        const token = createToken(user);
        res.cookie("access_token", token, cookieOptions);

        return sendResponse(res, 200, "Đăng nhập thành công", {
            accessToken: token,
        });
    } catch (err) {
        console.error("Login error: ", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const logout = async (_req, res) => {
    try {
        res.clearCookie("access_token", {
            ...cookieOptions,
            maxAge: undefined,
        });
        return sendResponse(res, 200, "Đã đăng xuất");
    } catch (err) {
        console.error("Logout error: ", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getProfile = async (req, res) => {
    try {
        const userPayload = req.user;
        if (!userPayload?.userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const user = await prisma.user.findUnique({
            where: { userId: userPayload.userId },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user) {
            return sendResponse(res, 404, "Không tìm thấy người dùng");
        }

        return sendResponse(res, 200, "Lấy thông tin người dùng thành công", { user });
    } catch (err) {
        console.error("Get profile error: ", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendResponse(res, 400, "Vui lòng nhập email");
        }
        if (!isValidEmail(email)) {
            return sendResponse(res, 400, "Vui lòng nhập đúng email theo định dạng");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return sendResponse(res, 200, "Nếu email tồn tại, mã khôi phục đã được gửi");
        }

        const resetToken = generateOtp();
        const resetPasswordExpires = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.update({
            where: { userId: user.userId },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires,
            },
        });

        const emailSent = await sendOtpEmail(email, resetToken);

        if (!emailSent) {
            return sendResponse(res, 500, "Không thể gửi OTP. Vui lòng thử lại sau.");
        }

        return sendResponse(res, 200, "Đã tạo mã OTP. Vui lòng kiểm tra email", {
            resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return sendResponse(res, 400, "Vui lòng nhập email và mã OTP");
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
                resetPasswordToken: otp,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return sendResponse(res, 400, "Mã OTP không đúng hoặc đã hết hạn");
        }

        return sendResponse(res, 200, "Mã OTP hợp lệ");
    } catch (err) {
        console.error("Verify OTP error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password, email } = req.body;

        if (!token || !password) {
            return sendResponse(res, 400, "Thiếu OTP hoặc mật khẩu");
        }
        if (password.length < 6) {
            return sendResponse(res, 400, "Mật khẩu chứa ít nhất 6 ký tự");
        }

        const whereClause = {
            resetPasswordToken: token,
            resetPasswordExpires: {
                gt: new Date(),
            },
        };

        if (email) {
            whereClause.email = email;
        }

        const user = await prisma.user.findFirst({
            where: whereClause,
        });

        if (!user) {
            return sendResponse(res, 400, "OTP không hợp lệ hoặc đã hết hạn");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { userId: user.userId },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return sendResponse(res, 200, "Đổi mật khẩu thành công");
    } catch (err) {
        console.error("Reset password error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userPayload = req.user;
        if (!userPayload?.userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { name, address, phone, email, password } = req.body;

        if (phone || email) {
            return sendResponse(res, 400, "Không cho phép thay đổi email hoặc số điện thoại");
        }

        if (!name && !address && !password) {
            return sendResponse(res, 400, "Không có dữ liệu để cập nhật");
        }

        if (password && password.length <= 6) {
            return sendResponse(res, 400, "Mật khẩu chứa ít nhất 6 ký tự");
        }

        const data = {};
        if (name) {
            data.name = name;
        }
        if (address) {
            data.address = address;
        }
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { userId: userPayload.userId },
            data,
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return sendResponse(res, 200, "Cập nhật hồ sơ thành công", { user: updated });
    } catch (err) {
        console.error("Update profile error: ", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};



export const adminListUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
        const skip = (page - 1) * limit;

        const search = (req.query.search || "").trim();
        const role = req.query.role;
        const isActive =
            req.query.isActive === undefined ? undefined : String(req.query.isActive).toLowerCase() === "true";

        const where = {
            ...(role ? { role } : {}),
            ...(isActive === undefined ? {} : { isActive }),
            ...(search
                ? {
                    OR: [
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search } },
                        { name: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };

        const total = await prisma.user.count({ where });
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        const totalPages = Math.ceil(total / limit);

        return sendResponse(res, 200, "Lấy danh sách user thành công", {
            users,
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
        console.error("adminListUsers error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const adminGetUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return sendResponse(res, 404, "User không tồn tại");
        }

        return sendResponse(res, 200, "Lấy user thành công", { user });
    } catch (err) {
        console.error("adminGetUserById error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const adminCreateUser = async (req, res) => {
    try {
        const { email, phone, name, address, password, role } = req.body;

        if (!email || !phone || !password || !name) {
            return sendResponse(res, 400, "Vui lòng nhập đầy đủ: email, phone, name, password");
        }
        if (!isValidEmail(email)) {
            return sendResponse(res, 400, "Email không hợp lệ");
        }
        if (!isValidPhone(phone)) {
            return sendResponse(res, 400, "Số điện thoại không hợp lệ");
        }
        if ((password || "").length < 6) {
            return sendResponse(res, 400, "Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (role && !isValidRole(role)) {
            return sendResponse(res, 400, "Role không hợp lệ (CUSTOMER/STAFF/ADMIN)");
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] },
            select: { userId: true },
        });
        if (existing) {
            return sendResponse(res, 409, "Email hoặc số điện thoại đã tồn tại");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                phone,
                name,
                address: address ?? null,
                passwordHash,
                role: role ?? "STAFF",
            },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return sendResponse(res, 201, "Tạo user thành công", { user });
    } catch (err) {
        console.error("adminCreateUser error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const adminUpdateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, isActive } = req.body;

        if (role === undefined && isActive === undefined) {
            return sendResponse(res, 400, "Không có dữ liệu để cập nhật");
        }
        if (role !== undefined && !isValidRole(role)) {
            return sendResponse(res, 400, "Role không hợp lệ (CUSTOMER/STAFF/ADMIN)");
        }
        if (isActive !== undefined && typeof isActive !== "boolean") {
            return sendResponse(res, 400, "isActive phải là boolean");
        }

        const existing = await prisma.user.findUnique({
            where: { userId },
            select: { userId: true },
        });
        if (!existing) {
            return sendResponse(res, 404, "User không tồn tại");
        }

        const updated = await prisma.user.update({
            where: { userId },
            data: {
                ...(role !== undefined ? { role } : {}),
                ...(isActive !== undefined ? { isActive } : {}),
            },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return sendResponse(res, 200, "Cập nhật user thành công", { user: updated });
    } catch (err) {
        console.error("adminUpdateUser error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const adminLockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { userId },
            select: { userId: true, isActive: true },
        });
        if (!user) {
            return sendResponse(res, 404, "User không tồn tại");
        }
        if (!user.isActive) {
            return sendResponse(res, 200, "User đã bị khóa trước đó");
        }

        const updated = await prisma.user.update({
            where: { userId },
            data: { isActive: false },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                updatedAt: true,
            },
        });

        return sendResponse(res, 200, "Khóa user thành công", { user: updated });
    } catch (err) {
        console.error("adminLockUser error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const adminUnlockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { userId },
            select: { userId: true, isActive: true },
        });
        if (!user) {
            return sendResponse(res, 404, "User không tồn tại");
        }
        if (user.isActive) {
            return sendResponse(res, 200, "User đang hoạt động");
        }

        const updated = await prisma.user.update({
            where: { userId },
            data: { isActive: true },
            select: {
                userId: true,
                email: true,
                phone: true,
                name: true,
                address: true,
                role: true,
                isActive: true,
                updatedAt: true,
            },
        });

        return sendResponse(res, 200, "Mở khóa user thành công", { user: updated });
    } catch (err) {
        console.error("adminUnlockUser error:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

