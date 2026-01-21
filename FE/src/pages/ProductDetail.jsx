import { useState, useEffect } from "react";

// Responsive items per view
const getItemsPerView = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
};
import { useParams, useNavigate, Link } from "react-router-dom";
import { productService } from "../api/services";
import { cartService } from "../api/services";
import { categoryService } from "../api/services/categoryService";
import { useCartContext } from "../contexts/CartContext";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ReviewSection from "../components/ReviewSection";
import { formatPrice } from "../utils/helpers";

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { refreshCart } = useCartContext();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [sortBy, setSortBy] = useState("desc");
    const [selectedImage, setSelectedImage] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(4);

    useEffect(() => {
        fetchProductDetail();
    }, [productId, sortBy]);

    useEffect(() => {
        const handleResize = () => {
            setItemsPerView(getItemsPerView());
            setCurrentSlide(0);
        };
        window.addEventListener('resize', handleResize);
        setItemsPerView(getItemsPerView());
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProductDetail = async () => {
        try {
            setLoading(true);
            const response = await productService.getProductById(productId, sortBy);
            if (response?.product) {
                setProduct(response.product);
                if (response.product.options && response.product.options.length > 0) {
                    const cheapestOption = response.product.options.reduce((best, opt) => {
                        const bestPrice = (best.salePrice ?? best.price ?? Number.MAX_SAFE_INTEGER);
                        const optPrice = (opt.salePrice ?? opt.price ?? Number.MAX_SAFE_INTEGER);
                        return optPrice < bestPrice ? opt : best;
                    }, response.product.options[0]);
                    setSelectedOption(cheapestOption);
                    setSelectedColor(cheapestOption.color);
                    setSelectedVersion(cheapestOption.version);
                    setSelectedImage(cheapestOption.image || response.product.thumbnail);
                }

                if (response.product.categoryId) {
                    fetchRelatedProducts(response.product.categoryId);
                }
            }
        } catch (error) {
            console.error("Error fetching product detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (categoryId) => {
        try {
            const response = await categoryService.getCategoryById(categoryId, {
                page: 1,
                limit: 50,
            });
            if (response?.products) {
                const filtered = response.products.filter(p => p.productId !== productId);
                setRelatedProducts(filtered);
            }
        } catch (error) {
            console.error("Error fetching related products:", error);
        }
    };

    const getUniqueColors = () => {
        if (!product?.options) return [];
        const colors = [...new Set(product.options.map(opt => opt.color).filter(Boolean))];
        return colors;
    };

    const getUniqueVersions = () => {
        if (!product?.options) return [];
        const versions = [...new Set(product.options.map(opt => opt.version).filter(Boolean))];
        return versions;
    };

    const getOptionsByColorAndVersion = (color, version) => {
        if (!product?.options) return null;
        return product.options.find(opt => opt.color === color && opt.version === version && opt.isActive);
    };

    const handleColorChange = (color) => {
        setSelectedColor(color);
        const option = getOptionsByColorAndVersion(color, selectedVersion);
        if (option) {
            setSelectedOption(option);
            setSelectedImage(option.image || product.thumbnail);
        }
    };

    const handleVersionChange = (version) => {
        setSelectedVersion(version);
        const option = getOptionsByColorAndVersion(selectedColor, version);
        if (option) {
            setSelectedOption(option);
            setSelectedImage(option.image || product.thumbnail);
        }
    };

    const getProductImages = () => {
        if (!product?.options) return [];
        const images = new Set();
        product.options.forEach(opt => {
            if (opt.image) images.add(opt.image);
        });
        if (product.thumbnail) images.add(product.thumbnail);
        return Array.from(images);
    };

    const handleAddToCart = async () => {
        if (!selectedOption) {
            alert("Vui lòng chọn phiên bản sản phẩm");
            return;
        }

        if (selectedOption.stockQuantity === 0) {
            alert("Sản phẩm đã hết hàng");
            return;
        }

        if (quantity > selectedOption.stockQuantity) {
            alert(`Chỉ còn ${selectedOption.stockQuantity} sản phẩm trong kho`);
            return;
        }

        try {
            await cartService.addToCart(product.productId, selectedOption.optionId, quantity);
            refreshCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            if (error.message?.includes("Chưa đăng nhập") || error.status === 401) {
                alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
                navigate("/");
            } else {
                alert(error.message || "Có lỗi xảy ra khi thêm vào giỏ hàng");
            }
        }
    };

    const handleBuyNow = async () => {
        if (!selectedOption) {
            alert("Vui lòng chọn phiên bản sản phẩm");
            return;
        }

        if (selectedOption.stockQuantity === 0) {
            alert("Sản phẩm đã hết hàng");
            return;
        }

        if (quantity > selectedOption.stockQuantity) {
            alert(`Chỉ còn ${selectedOption.stockQuantity} sản phẩm trong kho`);
            return;
        }

        try {
            await cartService.addToCart(product.productId, selectedOption.optionId, quantity);
            refreshCart();
            window.dispatchEvent(new Event('cartUpdated'));
            navigate("/checkout");
        } catch (error) {
            if (error.message?.includes("Chưa đăng nhập") || error.status === 401) {
                alert("Vui lòng đăng nhập để mua sản phẩm");
                navigate("/");
            } else {
                alert(error.message || "Có lỗi xảy ra");
            }
        }
    };

    const handleQuantityChange = (delta) => {
        if (!selectedOption) return;
        const newQuantity = quantity + delta;
        if (newQuantity >= 1 && newQuantity <= selectedOption.stockQuantity) {
            setQuantity(newQuantity);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loading fullScreen />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
                    <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-4">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-4 animate-fade-in">
                        <ol className="flex items-center space-x-2 text-sm">
                            <li>
                                <Link to="/" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">
                                    Trang chủ
                                </Link>
                            </li>
                            <li className="text-gray-400">/</li>
                            <li>
                                <Link
                                    to={`/categories/${product.categoryId}`}
                                    className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
                                >
                                    {product.category?.name}
                                </Link>
                            </li>
                            <li className="text-gray-400">/</li>
                            <li className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</li>
                        </ol>
                    </nav>

                    {/* Main Product Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                        {/* Image Gallery */}
                        <div className="lg:sticky lg:top-8 h-fit animate-fade-in">
                            <Card className="p-3 sm:p-4 shadow-2xl border border-gray-100 overflow-hidden bg-white">
                                {/* Main Image */}
                                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden mb-3 group">
                                    <img
                                        src={selectedImage || selectedOption?.image || product.thumbnail || "/placeholder.png"}
                                        alt={product.name}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            e.target.src = "/placeholder.png";
                                        }}
                                    />
                                    {selectedOption?.discountPercent > 0 && (
                                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full font-bold text-xs shadow-lg animate-scale-in">
                                            -{selectedOption.discountPercent}%
                                        </div>
                                    )}
                                </div>


                                {getProductImages().length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {getProductImages().slice(0, 4).map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(img)}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${selectedImage === img
                                                    ? "border-blue-600 shadow-lg ring-2 ring-blue-100 scale-105"
                                                    : "border-gray-200 hover:border-blue-400"
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = "/placeholder.png";
                                                    }}
                                                />
                                                {selectedImage === img && (
                                                    <div className="absolute inset-0 bg-blue-600 bg-opacity-10"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-3 animate-fade-in-up">
                            {/* Title & Rating */}
                            <div>
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-gray-900 mb-1.5 leading-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg
                                                key={star}
                                                className="w-4 h-4 text-yellow-400 drop-shadow-sm"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">(1 đánh giá)</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Còn hàng
                                    </span>
                                </div>

                                {/* Price */}
                                {selectedOption && (
                                    <div className="mb-2">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="text-xl sm:text-2xl font-extrabold text-blue-600">
                                                {formatPrice(selectedOption.salePrice || selectedOption.price)}
                                            </span>
                                            {selectedOption.salePrice && (
                                                <>
                                                    <span className="text-base text-gray-400 line-through font-semibold">
                                                        {formatPrice(selectedOption.price)}
                                                    </span>
                                                    <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                        Tiết kiệm {formatPrice(selectedOption.price - selectedOption.salePrice)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {product.description && (
                                    <Card className="p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Mô tả sản phẩm
                                        </h3>
                                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    </Card>
                                )}
                            </div>

                            {/* Version Selection */}
                            {getUniqueVersions().length > 0 && (
                                <Card className="p-2.5 shadow-lg border border-gray-100 bg-white">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="text-sm font-bold text-gray-900">Chọn dung lượng</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {getUniqueVersions().map((version) => {
                                            const option = getOptionsByColorAndVersion(selectedColor, version);
                                            const isSelected = selectedVersion === version;
                                            const isAvailable = option && option.stockQuantity > 0;

                                            return (
                                                <button
                                                    key={version}
                                                    onClick={() => handleVersionChange(version)}
                                                    disabled={!isAvailable}
                                                    className={`relative p-2 border-2 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${isSelected
                                                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md ring-1 ring-blue-100"
                                                        : "border-gray-200 hover:border-blue-400 bg-white hover:bg-gray-50"
                                                        } ${!isAvailable ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="font-bold text-gray-900 text-sm mb-0.5">{version}</div>
                                                    {option && (
                                                        <div className="text-xs font-extrabold text-blue-600">
                                                            {formatPrice(option.salePrice || option.price)}
                                                        </div>
                                                    )}
                                                    {!isAvailable && (
                                                        <div className="text-xs text-red-500 font-semibold mt-1">Hết hàng</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* Color Selection */}
                            {getUniqueColors().length > 0 && (
                                <Card className="p-2.5 shadow-lg border border-gray-100 bg-white">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                        </svg>
                                        <h3 className="text-sm font-bold text-gray-900">Chọn màu sắc</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {getUniqueColors().map((color) => {
                                            const option = getOptionsByColorAndVersion(color, selectedVersion);
                                            const isSelected = selectedColor === color;
                                            const isAvailable = option && option.stockQuantity > 0;

                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorChange(color)}
                                                    disabled={!isAvailable}
                                                    className={`relative p-2 border-2 rounded-lg text-center transition-all duration-300 transform hover:scale-105 overflow-hidden ${isSelected
                                                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md ring-1 ring-blue-100"
                                                        : "border-gray-200 hover:border-blue-400 bg-white hover:bg-gray-50"
                                                        } ${!isAvailable ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center z-10">
                                                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="font-bold text-gray-900 text-xs mb-1">{color}</div>
                                                    {option && option.image && (
                                                        <div className="w-full h-16 rounded overflow-hidden bg-gray-50 border border-gray-200">
                                                            <img
                                                                src={option.image}
                                                                alt={color}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.target.src = "/placeholder.png";
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {!isAvailable && (
                                                        <div className="text-xs text-red-500 font-semibold mt-2">Hết hàng</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* VIP Warranty Banner */}
                            <Card className="p-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl border-0 overflow-hidden relative">
                                <div className="absolute inset-0 bg-black opacity-5"></div>
                                <div className="relative flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                                        <span className="text-blue-600 font-black text-xs">VIP</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-xs sm:text-sm mb-0.5">TĂNG BẢO HÀNH VIP</h3>
                                        <p className="text-xs text-blue-100 font-medium">Nguồn - Màn hình - Vân tay</p>
                                    </div>
                                    <svg className="w-6 h-6 text-blue-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                            </Card>

                            {/* Quantity Selector */}
                            {selectedOption && selectedOption.stockQuantity > 0 && (
                                <Card className="p-2.5 shadow-lg border border-gray-100 bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900">Số lượng</h2>
                                            <p className="text-xs text-gray-500">Chọn số lượng bạn muốn mua</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                                            <button
                                                onClick={() => handleQuantityChange(-1)}
                                                disabled={quantity <= 1}
                                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg active:scale-95"
                                            >
                                                −
                                            </button>
                                            <span className="px-6 py-2 min-w-[80px] text-center font-black text-lg bg-white border-x-2 border-gray-300">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(1)}
                                                disabled={quantity >= selectedOption.stockQuantity}
                                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg active:scale-95"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                                            <p className="text-xs text-gray-600 font-medium mb-1">Còn lại trong kho:</p>
                                            <p className="text-lg font-black text-green-600 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                {selectedOption.stockQuantity} sản phẩm
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            {selectedOption && selectedOption.stockQuantity > 0 && (
                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    <Button
                                        onClick={handleAddToCart}
                                        className="flex-1 py-3 text-sm font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 rounded-lg"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Thêm vào giỏ hàng
                                        </span>
                                    </Button>
                                    <Button
                                        onClick={handleBuyNow}
                                        className="flex-1 py-3 text-sm font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 rounded-lg"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Mua ngay
                                        </span>
                                    </Button>
                                </div>
                            )}

                            {selectedOption && selectedOption.stockQuantity === 0 && (
                                <Card className="p-8 shadow-lg bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-2xl font-black text-red-600 mb-2">Sản phẩm đã hết hàng</p>
                                        <p className="text-gray-700 font-medium">Vui lòng chọn phiên bản khác hoặc quay lại sau</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Related Products Carousel */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-8 mb-8 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-900">Có thể bạn quan tâm</h2>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="overflow-hidden">
                                    <div className="flex gap-4 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(calc(-${currentSlide * (100 / itemsPerView)}% - ${currentSlide * (itemsPerView === 2 ? 0.5 : itemsPerView === 3 ? 1 : 1.5)}rem))` }}>
                                        {relatedProducts.map((relatedProduct) => {
                                            const minPrice = Math.min(
                                                ...relatedProduct.options.map(opt => opt.salePrice || opt.price)
                                            );
                                            const maxPrice = Math.max(
                                                ...relatedProduct.options.map(opt => opt.salePrice || opt.price)
                                            );
                                            // Tìm option có discountPercent cao nhất
                                            const maxDiscountOption = relatedProduct.options.reduce((max, opt) => {
                                                return (opt.discountPercent || 0) > (max.discountPercent || 0) ? opt : max;
                                            }, relatedProduct.options[0] || {});
                                            const maxDiscountPercent = maxDiscountOption?.discountPercent || 0;
                                            const hasDiscount = relatedProduct.options.some(opt => opt.discountPercent > 0);

                                            return (
                                                <Link
                                                    key={relatedProduct.productId}
                                                    to={`/products/${relatedProduct.productId}`}
                                                    className="group bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                                                    style={{
                                                        width: `calc(${100 / itemsPerView}% - ${((itemsPerView - 1) / itemsPerView) * (itemsPerView === 2 ? 1 : itemsPerView === 3 ? 1 : 1.5)}rem)`
                                                    }}
                                                >
                                                    <div className="relative overflow-hidden">
                                                        <img
                                                            src={relatedProduct.thumbnail || relatedProduct.options[0]?.image || "/placeholder.png"}
                                                            alt={relatedProduct.name}
                                                            className="w-full h-40 object-contain transition-transform duration-500 group-hover:scale-110 p-2"
                                                            onError={(e) => {
                                                                e.target.src = "/placeholder.png";
                                                            }}
                                                        />
                                                        {hasDiscount && maxDiscountPercent > 0 && (
                                                            <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-black shadow-lg">
                                                                -{maxDiscountPercent}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-3">
                                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
                                                            {relatedProduct.name}
                                                        </h3>
                                                        <div className="space-y-0.5">
                                                            {(() => {
                                                                const discountedOption = relatedProduct.options.find(opt => opt.salePrice && opt.discountPercent > 0);
                                                                if (discountedOption) {
                                                                    return (
                                                                        <>
                                                                            <div className="flex items-baseline gap-2">
                                                                                <span className="text-base font-black text-blue-600">
                                                                                    {formatPrice(discountedOption.salePrice)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-baseline gap-2">
                                                                                <span className="text-xs text-gray-400 line-through">
                                                                                    {formatPrice(discountedOption.price)}
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                }
                                                                if (minPrice === maxPrice) {
                                                                    return (
                                                                        <span className="text-base font-black text-blue-600">
                                                                            {formatPrice(minPrice)}
                                                                        </span>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className="flex items-baseline gap-2">
                                                                        <span className="text-base font-black text-blue-600">
                                                                            {formatPrice(minPrice)}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">- {formatPrice(maxPrice)}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                {relatedProducts.length > itemsPerView && (
                                    <>
                                        <button
                                            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                                            disabled={currentSlide === 0}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 z-10"
                                        >
                                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const maxSlides = relatedProducts.length - itemsPerView;
                                                setCurrentSlide(Math.min(maxSlides, currentSlide + 1));
                                            }}
                                            disabled={currentSlide >= (relatedProducts.length - itemsPerView)}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 z-10"
                                        >
                                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-12">
                        <ReviewSection productId={productId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
