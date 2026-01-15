import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { reviewService } from "../api/services/reviewService";
import { Loading, Card, Button, Pagination } from "../components/common";
import AdminLayout from "../components/AdminLayout";
import { formatDate } from "../utils/helpers";

const AdminReviews = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState({
        search: "",
        productId: "",
        userId: "",
        rating: "",
    });

    useEffect(() => {
        if (user?.role === "ADMIN" || user?.role === "STAFF") {
            fetchReviews();
        }
    }, [user, pagination.page, filters]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.search ? { search: filters.search } : {}),
                ...(filters.productId ? { productId: filters.productId } : {}),
                ...(filters.userId ? { userId: filters.userId } : {}),
                ...(filters.rating ? { rating: filters.rating } : {}),
            };
            const response = await reviewService.getAllReviews(params);
            if (response?.reviews) {
                setReviews(response.reviews);
                if (response.pagination) {
                    setPagination((prev) => ({
                        ...prev,
                        total: response.pagination.total,
                        totalPages: response.pagination.totalPages,
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) {
            return;
        }

        try {
            await reviewService.deleteReview(reviewId);
            alert("Xóa đánh giá thành công!");
            fetchReviews();
        } catch (error) {
            alert(error.message || "Có lỗi xảy ra");
        }
    };

    const handleReplyReview = async (reviewId) => {
        if (!replyText.trim()) {
            alert("Vui lòng nhập nội dung phản hồi");
            return;
        }

        try {
            await reviewService.replyReview(reviewId, replyText);
            alert("Phản hồi đánh giá thành công!");
            setReplyingTo(null);
            setReplyText("");
            fetchReviews();
        } catch (error) {
            alert(error.message || "Có lỗi xảy ra");
        }
    };

    const handleStartReply = (reviewId, existingReply = null) => {
        setReplyingTo(reviewId);
        setReplyText(existingReply || "");
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyText("");
    };

    const getRatingStars = (rating) => {
        if (rating === 0) return "Bình luận";
        return "⭐".repeat(rating) + "☆".repeat(5 - rating);
    };

    const getRatingColor = (rating) => {
        if (rating === 0) return "bg-gray-100 text-gray-800";
        if (rating >= 4) return "bg-green-100 text-green-800";
        if (rating >= 3) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    if (loading) {
        return (
            <AdminLayout>
                <Loading fullScreen />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đánh giá</h1>
                <p className="text-gray-600">Quản lý và xem tất cả đánh giá từ khách hàng</p>
            </div>

            <Card className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm (nội dung, tên, email, sản phẩm)..."
                        value={filters.search}
                        onChange={(e) => {
                            setFilters((prev) => ({ ...prev, search: e.target.value }));
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Mã sản phẩm..."
                        value={filters.productId}
                        onChange={(e) => {
                            setFilters((prev) => ({ ...prev, productId: e.target.value }));
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="Mã người dùng..."
                        value={filters.userId}
                        onChange={(e) => {
                            setFilters((prev) => ({ ...prev, userId: e.target.value }));
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                        value={filters.rating}
                        onChange={(e) => {
                            setFilters((prev) => ({ ...prev, rating: e.target.value }));
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tất cả đánh giá</option>
                        <option value="5">5 sao</option>
                        <option value="4">4 sao</option>
                        <option value="3">3 sao</option>
                        <option value="2">2 sao</option>
                        <option value="1">1 sao</option>
                        <option value="0">Bình luận</option>
                    </select>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    Tổng: <span className="font-bold">{pagination.total}</span> đánh giá
                </div>
            </Card>

            {reviews.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-gray-500">Không tìm thấy đánh giá nào</p>
                </Card>
            ) : (
                <>
                    <div className="space-y-4 mb-6">
                        {reviews.map((review) => (
                            <Card key={review.reviewId} className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {review.user?.name?.charAt(0).toUpperCase() || review.user?.email?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900">{review.user?.name || "N/A"}</h3>
                                                    <span className="text-sm text-gray-500">{review.user?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                                                        {getRatingStars(review.rating)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-gray-700 leading-relaxed mt-2">{review.comment}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-16 mt-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                                <span className="font-medium">Sản phẩm:</span>
                                                <Link
                                                    to={`/products/${review.product?.productId}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    {review.product?.name || "N/A"}
                                                </Link>
                                            </div>

                                            {/* Phản hồi hiện có */}
                                            {review.reply && replyingTo !== review.reviewId && (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-semibold text-blue-700">Phản hồi từ Admin/Staff:</span>
                                                        {review.repliedAt && (
                                                            <span className="text-xs text-gray-500">{formatDate(review.repliedAt)}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed">{review.reply}</p>
                                                </div>
                                            )}

                                            {/* Form phản hồi */}
                                            {replyingTo === review.reviewId && (
                                                <div className="bg-gray-50 border-2 border-blue-300 p-4 rounded-lg mt-3">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        {review.reply ? "Sửa phản hồi:" : "Phản hồi đánh giá:"}
                                                    </label>
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-3"
                                                        rows="3"
                                                        placeholder="Nhập nội dung phản hồi..."
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReplyReview(review.reviewId)}
                                                        >
                                                            {review.reply ? "Cập nhật" : "Gửi phản hồi"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={handleCancelReply}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex gap-2">
                                            <span className="text-xs text-gray-500">ID: {review.reviewId}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleStartReply(review.reviewId, review.reply || "")}
                                            >
                                                {review.reply ? "Sửa phản hồi" : "Phản hồi"}
                                            </Button>
                                            {user?.role === "ADMIN" && (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteReview(review.reviewId)}
                                                >
                                                    Xóa
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                        />
                    )}
                </>
            )}
        </AdminLayout>
    );
};

export default AdminReviews;

