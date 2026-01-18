import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { categoryService } from "../api/services/categoryService";
import { cartService } from "../api/services/cartService";
import { useAuth } from "../hooks/useAuth";
import { useCartContext } from "../contexts/CartContext";

const CategoryDetail = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { refreshCart } = useCartContext();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    });
    const [sortBy, setSortBy] = useState("desc");
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchCategoryDetail();
    }, [categoryId, pagination.page, sortBy]);

    const fetchCategoryDetail = async () => {
        try {
            setLoading(true);
            const response = await categoryService.getCategoryById(categoryId, {
                page: pagination.page,
                limit: pagination.limit,
                sortBy,
            });

            if (response?.category) {
                setCategory(response.category);
            }
            if (response?.products) {
                setProducts(response.products);
            }
            if (response?.pagination) {
                setPagination((prev) => ({
                    ...prev,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages,
                }));
            }
        } catch (error) {
            console.error("Error fetching category detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return "0";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const getMinMaxPrice = (options) => {
        if (!options || options.length === 0) return { min: 0, max: 0 };
        const prices = options.map((opt) => opt.salePrice || opt.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
        };
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getFirstActiveOption = (product) => {
        if (product.options && product.options.length > 0) {
            return product.options.find(opt => opt.isActive);
        }
        return null;
    };

    const handleAddToCart = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
            return;
        }

        const firstOption = getFirstActiveOption(product);
        if (!firstOption) {
            alert("Sản phẩm hiện không có phiên bản khả dụng");
            return;
        }

        const productKey = product.productId;
        try {
            await cartService.addToCart(product.productId, firstOption.optionId, 1);
            refreshCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            alert(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy danh mục</h2>
                    <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-[180px] py-8 md:py-12">
            <nav className="mb-6 md:mb-8">
                <ol className="flex items-center space-x-2 text-sm text-gray-600">
                    <li>
                        <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
                    </li>
                    <li>/</li>
                    <li className="text-gray-900 font-medium">{category.name}</li>
                </ol>
            </nav>

            <div className="mb-8 md:mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{category.name}</h1>
                {category.description && (
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed">{category.description}</p>
                )}
            </div>

            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-gray-600">
                    Tìm thấy <span className="font-semibold text-gray-900">{pagination.total}</span> sản phẩm
                </p>
                <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-600">Sắp xếp:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="desc">Giá: Cao → Thấp</option>
                        <option value="asc">Giá: Thấp → Cao</option>
                    </select>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">Chưa có sản phẩm nào trong danh mục này</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {products.map((product) => {
                            const { min, max } = getMinMaxPrice(product.options);
                            const hasDiscount = product.options.some((opt) => opt.discountPercent > 0);

                            const maxDiscountOption = product.options.reduce((max, opt) => {
                                return (opt.discountPercent || 0) > (max.discountPercent || 0) ? opt : max;
                            }, product.options[0] || {});
                            const maxDiscountPercent = maxDiscountOption?.discountPercent || 0;

                            return (
                                <div
                                    key={product.productId}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all transform hover:scale-105 overflow-hidden border border-gray-100 group relative"
                                >
                                    <Link to={`/products/${product.productId}`} className="block">
                                        <div className="relative">
                                            <img
                                                src={product.thumbnail || product.options[0]?.image || "/placeholder.png"}
                                                alt={product.name}
                                                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.src = "/placeholder.png";
                                                }}
                                            />
                                            {hasDiscount && maxDiscountPercent > 0 && (
                                                <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg">
                                                    -{maxDiscountPercent}%
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700 shadow-lg"
                                                title="Thêm vào giỏ hàng"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-extrabold text-gray-900 mb-2 line-clamp-2 text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                                            <div className="space-y-1">
                                                {(() => {

                                                    const discountedOption = product.options.find(opt => opt.salePrice && opt.discountPercent > 0);

                                                    if (discountedOption) {
                                                        return (
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl font-bold text-blue-600">
                                                                        {formatPrice(discountedOption.salePrice)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-400 line-through">
                                                                        {formatPrice(discountedOption.price)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (min === max) {
                                                        return (
                                                            <span className="text-xl font-bold text-blue-600">
                                                                {formatPrice(min)}
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <div>
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {formatPrice(min)}
                                                            </span>
                                                            <span className="text-gray-500 mx-1">-</span>
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {formatPrice(max)}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            {product.options.length > 1 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {product.options.length} phiên bản
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                Trước
                            </button>
                            {[...Array(pagination.totalPages)].map((_, index) => {
                                const page = index + 1;
                                if (
                                    page === 1 ||
                                    page === pagination.totalPages ||
                                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-4 py-2 border rounded-lg transition-colors ${pagination.page === page
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    page === pagination.page - 2 ||
                                    page === pagination.page + 2
                                ) {
                                    return <span key={page} className="px-2">...</span>;
                                }
                                return null;
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CategoryDetail;

