import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { productService } from "../api/services/productService";
import { cartService } from "../api/services/cartService";
import { useAuth } from "../hooks/useAuth";
import { useCartContext } from "../contexts/CartContext";
import Loading from "../components/common/Loading";
import { formatPrice } from "../utils/helpers";

const Products = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
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
    const { refreshCart } = useCartContext();

    useEffect(() => {
        if (searchQuery) {
            fetchProducts();
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [searchQuery, pagination.page, sortBy]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery,
                sortBy,
            };
            const response = await productService.getAllProducts(params);
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
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
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
            return product.options.find((opt) => opt.isActive);
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

        try {
            await cartService.addToCart(product.productId, firstOption.optionId, 1);
            refreshCart();
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            alert(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
        }
    };

    const getProductImage = (product) => {
        if (product.thumbnail) return product.thumbnail;
        if (product.options && product.options.length > 0) {
            const activeOption = product.options.find((opt) => opt.isActive);
            return activeOption?.image || "https://via.placeholder.com/300";
        }
        return "https://via.placeholder.com/300";
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Tất cả sản phẩm"}
                </h1>
                {searchQuery && (
                    <p className="text-gray-600">
                        Tìm thấy {pagination.total} sản phẩm
                    </p>
                )}
            </div>

            {/* Sort & Filter */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Giá: Cao → Thấp</option>
                        <option value="asc">Giá: Thấp → Cao</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <div className="text-center py-16">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Không tìm thấy sản phẩm
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery
                            ? `Không có sản phẩm nào khớp với "${searchQuery}"`
                            : "Chưa có sản phẩm nào"}
                    </p>
                    {searchQuery && (
                        <Link
                            to="/"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Về trang chủ
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {products.map((product) => {
                            const { min, max } = getMinMaxPrice(product.options);
                            const hasDiscount = product.options?.some(
                                (opt) => opt.discountPercent > 0
                            );

                            return (
                                <Link
                                    key={product.productId}
                                    to={`/products/${product.productId}`}
                                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200"
                                >
                                    <div className="relative overflow-hidden bg-gray-50">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-500 p-2"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/300";
                                            }}
                                        />
                                        {hasDiscount && (
                                            <span className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg animate-pulse">
                                                -
                                                {
                                                    product.options?.find(
                                                        (opt) => opt.discountPercent > 0
                                                    )?.discountPercent
                                                }
                                                %
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-800 shadow-xl hover:scale-110"
                                            title="Thêm vào giỏ hàng"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            {min === max ? (
                                                <span className="text-lg font-bold text-blue-600">
                                                    {formatPrice(min)}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {formatPrice(min)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        - {formatPrice(max)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {product.category && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {product.category.name}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                Trước
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === pagination.totalPages ||
                                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                                )
                                .map((page, idx, arr) => (
                                    <div key={page} className="flex items-center gap-2">
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="px-2">...</span>
                                        )}
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`px-4 py-2 border rounded-lg transition-colors ${pagination.page === page
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                ))}
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

export default Products;
