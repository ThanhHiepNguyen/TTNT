import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

const reviewSelect = {
    reviewId: true,
    productId: true,
    userId: true,
    rating: true,
    comment: true,
    reply: true,
    repliedBy: true,
    repliedAt: true,
    createdAt: true,
    user: {
        select: {
            userId: true,
            name: true,
            email: true,
        },
    },
    product: {
        select: {
            productId: true,
            name: true,
        },
    },
};

export const createComment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { productId, comment } = req.body;

        if (!productId) {
            return sendResponse(res, 400, "Vui lòng chọn sản phẩm");
        }

        if (!comment || !comment.trim()) {
            return sendResponse(res, 400, "Vui lòng nhập bình luận");
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating: 0,
                comment: comment.trim(),
            },
            select: reviewSelect,
        });

        return sendResponse(res, 201, "Tạo bình luận thành công", { review });
    } catch (err) {
        console.error("Error createComment:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const createReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { productId, rating, comment } = req.body;

        if (!productId) {
            return sendResponse(res, 400, "Vui lòng chọn sản phẩm");
        }

        if (!rating || rating < 1 || rating > 5) {
            return sendResponse(res, 400, "Đánh giá phải từ 1 đến 5 sao");
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        const purchasedOrder = await prisma.order.findFirst({
            where: {
                userId,
                status: "DELIVERED",
                items: {
                    some: {
                        productId,
                    },
                },
            },
            select: {
                orderId: true,
            },
        });

        if (!purchasedOrder) {
            return sendResponse(res, 403, "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận được hàng thành công");
        }

        const existingReview = await prisma.review.findFirst({
            where: {
                userId,
                productId,
                rating: {
                    not: 0,
                },
            },
        });

        if (existingReview) {
            return sendResponse(res, 400, "Bạn đã đánh giá sản phẩm này rồi. Vui lòng cập nhật đánh giá hiện có.");
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating,
                comment: comment?.trim() || null,
            },
            select: reviewSelect,
        });

        return sendResponse(res, 201, "Tạo đánh giá thành công", { review });
    } catch (err) {
        console.error("Error createReview:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const canReviewProduct = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 200, "Kiểm tra quyền đánh giá thành công", {
                canReview: false,
                reason: "Chưa đăng nhập",
            });
        }

        const { productId } = req.params;

        if (!productId) {
            return sendResponse(res, 400, "Vui lòng chọn sản phẩm");
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        const existingReview = await prisma.review.findFirst({
            where: {
                userId,
                productId,
                rating: {
                    not: 0,
                },
            },
        });

        if (existingReview) {
            return sendResponse(res, 200, "Kiểm tra quyền đánh giá thành công", {
                canReview: false,
                reason: "Đã đánh giá sản phẩm này",
                hasReview: true,
            });
        }

        const purchasedOrder = await prisma.order.findFirst({
            where: {
                userId,
                status: "DELIVERED",
                items: {
                    some: {
                        productId,
                    },
                },
            },
            select: {
                orderId: true,
            },
        });

        if (!purchasedOrder) {
            return sendResponse(res, 200, "Kiểm tra quyền đánh giá thành công", {
                canReview: false,
                reason: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận được hàng thành công",
            });
        }

        return sendResponse(res, 200, "Kiểm tra quyền đánh giá thành công", {
            canReview: true,
        });
    } catch (err) {
        console.error("Error canReviewProduct:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const skip = (page - 1) * limit;

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        const total = await prisma.review.count({
            where: { productId },
        });

        const reviews = await prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: reviewSelect,
        });

        const allReviews = await prisma.review.findMany({
            where: {
                productId,
                rating: {
                    not: 0,
                },
            },
            select: { rating: true },
        });

        const stats = {
            total: allReviews.length,
            average: allReviews.length > 0
                ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
                : 0,
            distribution: {
                5: allReviews.filter((r) => r.rating === 5).length,
                4: allReviews.filter((r) => r.rating === 4).length,
                3: allReviews.filter((r) => r.rating === 3).length,
                2: allReviews.filter((r) => r.rating === 2).length,
                1: allReviews.filter((r) => r.rating === 1).length,
            },
        };

        const totalPages = Math.ceil(total / limit);

        return sendResponse(res, 200, "Lấy danh sách đánh giá thành công", {
            reviews,
            stats,
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
        console.error("Error getReviewsByProduct:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const updateReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return sendResponse(res, 400, "Đánh giá phải từ 1 đến 5 sao");
        }

        const review = await prisma.review.findUnique({
            where: { reviewId },
            select: { reviewId: true, userId: true },
        });

        if (!review) {
            return sendResponse(res, 404, "Đánh giá không tồn tại");
        }

        if (review.userId !== userId) {
            return sendResponse(res, 403, "Không có quyền cập nhật đánh giá này");
        }

        const updateData = {};
        if (rating !== undefined) {
            updateData.rating = rating;
        }
        if (comment !== undefined) {
            updateData.comment = comment?.trim() || null;
        }

        if (Object.keys(updateData).length === 0) {
            return sendResponse(res, 400, "Không có dữ liệu để cập nhật");
        }

        const updatedReview = await prisma.review.update({
            where: { reviewId },
            data: updateData,
            select: reviewSelect,
        });

        return sendResponse(res, 200, "Cập nhật đánh giá thành công", { review: updatedReview });
    } catch (err) {
        console.error("Error updateReview:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const deleteReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        const { reviewId } = req.params;

        const review = await prisma.review.findUnique({
            where: { reviewId },
            select: { reviewId: true, userId: true },
        });

        if (!review) {
            return sendResponse(res, 404, "Đánh giá không tồn tại");
        }

        if (userRole !== "ADMIN" && review.userId !== userId) {
            return sendResponse(res, 403, "Không có quyền xóa đánh giá này");
        }

        await prisma.review.delete({
            where: { reviewId },
        });

        return sendResponse(res, 200, "Xóa đánh giá thành công");
    } catch (err) {
        console.error("Error deleteReview:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getAllReviews = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
        const skip = (page - 1) * limit;

        const search = (req.query.search || "").trim();
        const productId = req.query.productId;
        const userId = req.query.userId;
        const rating = req.query.rating ? parseInt(req.query.rating) : null;

        const where = {
            ...(productId ? { productId } : {}),
            ...(userId ? { userId } : {}),
            ...(rating !== null && rating >= 1 && rating <= 5 ? { rating } : {}),
            ...(search
                ? {
                    OR: [
                        { comment: { contains: search, mode: "insensitive" } },
                        { user: { name: { contains: search, mode: "insensitive" } } },
                        { user: { email: { contains: search, mode: "insensitive" } } },
                        { product: { name: { contains: search, mode: "insensitive" } } },
                    ],
                }
                : {}),
        };

        const total = await prisma.review.count({ where });

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: reviewSelect,
        });

        const totalPages = Math.ceil(total / limit);

        return sendResponse(res, 200, "Lấy danh sách đánh giá thành công", {
            reviews,
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
        console.error("Error getAllReviews:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const replyReview = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId) {
            return sendResponse(res, 401, "Chưa đăng nhập");
        }

        if (userRole !== "ADMIN" && userRole !== "STAFF") {
            return sendResponse(res, 403, "Chỉ ADMIN và STAFF mới được phản hồi đánh giá");
        }

        const { reviewId } = req.params;
        const { reply } = req.body;

        if (!reply || !reply.trim()) {
            return sendResponse(res, 400, "Vui lòng nhập nội dung phản hồi");
        }

        const review = await prisma.review.findUnique({
            where: { reviewId },
            select: { reviewId: true },
        });

        if (!review) {
            return sendResponse(res, 404, "Đánh giá không tồn tại");
        }

        const updatedReview = await prisma.review.update({
            where: { reviewId },
            data: {
                reply: reply.trim(),
                repliedBy: userId,
                repliedAt: new Date(),
            },
            select: reviewSelect,
        });

        return sendResponse(res, 200, "Phản hồi đánh giá thành công", { review: updatedReview });
    } catch (err) {
        console.error("Error replyReview:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

