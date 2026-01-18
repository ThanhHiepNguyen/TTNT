import { useState, useEffect } from "react";
import { reviewService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import Loading from "./common/Loading";
import Card from "./common/Card";
import Button from "./common/Button";
import Pagination from "./common/Pagination";
import { formatDate } from "../utils/helpers";

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingReviewPermission, setCheckingReviewPermission] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated && productId) {
      checkCanReview();
    }
  }, [productId, currentPage, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getReviewsByProduct(productId, {
        page: currentPage,
        limit: 5,
      });
      if (response?.reviews) {
        setReviews(response.reviews);
        setStats(response.stats);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      setCheckingReviewPermission(true);
      const response = await reviewService.canReviewProduct(productId);
      if (response?.canReview) {
        setCanReview(true);
      } else {
        setCanReview(false);
      }
    } catch (err) {
      console.error("Error checking review permission:", err);
      setCanReview(false);
    } finally {
      setCheckingReviewPermission(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để đánh giá");
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        productId,
        rating,
        comment: comment.trim() || null,
      });
      setShowReviewForm(false);
      setComment("");
      setRating(5);
      await fetchReviews();
      await checkCanReview();
      alert("Đánh giá thành công!");
    } catch (err) {
      alert(err.message || "Không thể tạo đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!commentText.trim()) {
      alert("Vui lòng nhập bình luận");
      return;
    }

    try {
      setSubmittingComment(true);
      await reviewService.createComment({
        productId,
        comment: commentText.trim(),
      });
      setShowCommentForm(false);
      setCommentText("");
      await fetchReviews();
      alert("Bình luận thành công!");
    } catch (err) {
      alert(err.message || "Không thể tạo bình luận");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingReviewId(review.reviewId);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập");
      return;
    }

    try {
      setSubmittingEdit(true);
      await reviewService.updateReview(editingReviewId, {
        rating: editRating,
        comment: editComment.trim() || null,
      });
      setEditingReviewId(null);
      setEditRating(5);
      setEditComment("");
      await fetchReviews();
      alert("Cập nhật đánh giá thành công!");
    } catch (err) {
      alert(err.message || "Không thể cập nhật đánh giá");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const renderStars = (ratingValue, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <svg
              className={`w-5 h-5 ${star <= ratingValue
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
                }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Đánh giá & Bình luận</h2>
        <div className="flex gap-2">
          {isAuthenticated && !showCommentForm && (
            <Button variant="secondary" onClick={() => setShowCommentForm(true)}>
              Bình luận
            </Button>
          )}
          {isAuthenticated && !showReviewForm && canReview && !checkingReviewPermission && (
            <Button onClick={() => setShowReviewForm(true)}>Đánh giá</Button>
          )}
        </div>
      </div>

      {stats && (
        <Card className="mb-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{stats.average}</p>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(parseFloat(stats.average)))}
              </div>
              <p className="text-sm text-gray-600 mt-1">{stats.total} đánh giá</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-12">{star} sao</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.distribution[star] / stats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {stats.distribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showCommentForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Viết bình luận</h3>
          <form onSubmit={handleSubmitComment}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bình luận
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Chia sẻ suy nghĩ của bạn về sản phẩm này..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={submittingComment} disabled={submittingComment}>
                Gửi bình luận
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentText("");
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showReviewForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá (sao)
              </label>
              {renderStars(rating, true, setRating)}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (tùy chọn)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={submitting} disabled={submitting}>
                Gửi đánh giá
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowReviewForm(false);
                  setComment("");
                  setRating(5);
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : reviews.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => {
              const isOwnReview = user && review.userId === user.userId;
              const isEditing = editingReviewId === review.reviewId;

              return (
                <Card key={review.reviewId}>
                  {!isEditing ? (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900">
                            {review.user?.name || "Người dùng"}
                            {isOwnReview && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Của bạn
                              </span>
                            )}
                          </p>
                          {review.rating > 0 && (
                            <div className="flex">{renderStars(review.rating)}</div>
                          )}
                          {review.rating === 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Bình luận
                            </span>
                          )}
                          <p className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                        )}
                        {review.reply && (
                          <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-blue-700">Phản hồi từ cửa hàng:</span>
                              {review.repliedAt && (
                                <span className="text-xs text-gray-500">{formatDate(review.repliedAt)}</span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">{review.reply}</p>
                          </div>
                        )}
                      </div>
                      {isOwnReview && review.rating > 0 && (
                        <div className="flex-shrink-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStartEdit(review)}
                          >
                            Sửa
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sửa đánh giá của bạn</h3>
                      <form onSubmit={handleUpdateReview}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đánh giá (sao)
                          </label>
                          {renderStars(editRating, true, setEditRating)}
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nhận xét (tùy chọn)
                          </label>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" loading={submittingEdit} disabled={submittingEdit}>
                            Cập nhật
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelEdit}
                          >
                            Hủy
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ReviewSection;

