import { sendResponse } from "../utils/response.js";

export const requireRoles = (roles = []) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }
        if (allowed.length > 0 && !allowed.includes(role)) {
            return sendResponse(res, 403, "Không có quyền truy cập");
        }
        return next();
    };
};


export const USER_ROLES = ["CUSTOMER", "STAFF", "ADMIN"];
export const isValidRole = (role) => USER_ROLES.includes(role);

