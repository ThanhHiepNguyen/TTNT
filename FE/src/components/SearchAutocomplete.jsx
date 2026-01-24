import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { productService } from "../api/services/productService";

const SearchAutocomplete = ({ className = "" }) => {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);
    const navigate = useNavigate();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("recentSearches");
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading recent searches:", e);
            }
        }
    }, []);

    // Fetch suggestions with debounce
    useEffect(() => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timeoutId = setTimeout(async () => {
            try {
                const response = await productService.getAllProducts({
                    search: query.trim(),
                    limit: 5,
                });
                if (response?.products) {
                    setSuggestions(response.products);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const saveRecentSearch = (searchTerm) => {
        if (!searchTerm.trim()) return;
        const updated = [
            searchTerm,
            ...recentSearches.filter((s) => s !== searchTerm),
        ].slice(0, 5); // Keep only 5 recent searches
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
    };

    const handleSearch = (e, searchTerm = null) => {
        e.preventDefault();
        const term = searchTerm || query.trim();
        if (term) {
            saveRecentSearch(term);
            setShowSuggestions(false);
            navigate(`/products?search=${encodeURIComponent(term)}`);
            setQuery("");
        }
    };

    const handleSuggestionClick = (product) => {
        saveRecentSearch(query.trim());
        setShowSuggestions(false);
        navigate(`/products/${product.productId}`);
        setQuery("");
    };

    const formatPrice = (price) => {
        if (!price) return "0";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const getProductPrice = (product) => {
        // Backend đã trả về price và salePrice trực tiếp trong product object
        if (product.salePrice !== null && product.salePrice !== undefined) {
            return product.salePrice;
        }
        if (product.price !== null && product.price !== undefined) {
            return product.price;
        }

        // Fallback: Nếu có options, lấy giá từ options
        if (product.options && product.options.length > 0) {
            const prices = product.options
                .map((opt) => opt.salePrice || opt.price)
                .filter((p) => p !== null && p !== undefined && p > 0);
            if (prices.length > 0) {
                return Math.min(...prices);
            }
        }

        return 0;
    };

    const displaySuggestions = showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || query.trim().length >= 2);

    return (
        <form onSubmit={handleSearch} className={`relative w-full ${className}`}>
            <div className="relative" ref={searchRef}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full px-4 py-2.5 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50"
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </button>
            </div>

            {/* Dropdown Suggestions */}
            {displaySuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
                >
                    {/* Search suggestion (if query exists) */}
                    {query.trim().length >= 2 && (
                        <button
                            onClick={(e) => handleSearch(e)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                        >
                            <svg
                                className="w-5 h-5 text-gray-400"
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
                            <span className="text-gray-700 font-medium">
                                {query} - Tìm kiếm
                            </span>
                        </button>
                    )}

                    {/* Recent Searches */}
                    {query.trim().length < 2 && recentSearches.length > 0 && (
                        <div className="border-b border-gray-100">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                Tìm kiếm gần đây
                            </div>
                            {recentSearches.map((search, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => handleSearch(e, search)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-gray-700">{search}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product Suggestions */}
                    {query.trim().length >= 2 && (
                        <div>
                            {isLoading ? (
                                <div className="px-4 py-8 text-center">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : suggestions.length > 0 ? (
                                <>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                                        Sản phẩm
                                    </div>
                                    {suggestions.map((product) => (
                                        <button
                                            key={product.productId}
                                            onClick={() => handleSuggestionClick(product)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                        >
                                            <img
                                                src={
                                                    product.thumbnail ||
                                                    product.options?.[0]?.image ||
                                                    "https://via.placeholder.com/60"
                                                }
                                                alt={product.name}
                                                className="w-12 h-12 object-contain rounded"
                                                onError={(e) => {
                                                    e.target.src = "https://via.placeholder.com/60";
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {product.category?.name}
                                                </div>
                                                <div className="text-sm font-semibold text-blue-600">
                                                    {formatPrice(getProductPrice(product))}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    Không tìm thấy sản phẩm
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </form>
    );
};

export default SearchAutocomplete;
