import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { categoryService } from "../api/services/categoryService";

import { cartService } from "../api/services/cartService";
import { useAuth } from "../hooks/useAuth";
import { useCartContext } from "../contexts/CartContext";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categorySlides, setCategorySlides] = useState({});
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCartContext();

  const getItemsPerView = () => {
    if (typeof window === "undefined") return 6;
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 1024) return 4;
    return 6;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  const getSlides = useMemo(() => {
    return categories.slice(0, 6).map((category) => {
      const products = categoryProducts[category.categoryId] || [];
      let slideImage =
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&h=600&fit=crop";

      if (products.length > 0) {
        const firstProduct = products[0];
        if (firstProduct.thumbnail) {
          slideImage = firstProduct.thumbnail;
        } else if (firstProduct.options && firstProduct.options.length > 0) {
          const firstOption =
            firstProduct.options.find((opt) => opt.image) ||
            firstProduct.options[0];
          if (firstOption?.image) {
            slideImage = firstOption.image;
          }
        }
      }

      return {
        id: category.categoryId,
        title: category.name,
        subtitle: "Danh mục nổi bật",
        description:
          category.description ||
          `Khám phá bộ sưu tập ${category.name} với những sản phẩm công nghệ hàng đầu`,
        image: slideImage,
        categoryId: category.categoryId,
      };
    });
  }, [categories, categoryProducts]);

  const slides = getSlides;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());

      const newSlides = {};
      categories.forEach((cat) => {
        newSlides[cat.categoryId] = 0;
      });
      setCategorySlides(newSlides);
    };
    window.addEventListener("resize", handleResize);
    setItemsPerView(getItemsPerView());
    return () => window.removeEventListener("resize", handleResize);
  }, [categories]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoriesRes = await categoryService.getAllCategories();
      const categories = categoriesRes?.categories || [];

      if (categories.length > 0) {
        setCategories(categories);

        const productsByCategory = {};
        await Promise.all(
          categories.map(async (category) => {
            try {
              const categoryDetail = await categoryService.getCategoryById(
                category.categoryId,
                {
                  page: 1,
                  limit: 12,
                }
              );
              const products = categoryDetail?.products || [];
              if (products.length > 0) {
                productsByCategory[category.categoryId] = products;
              }
            } catch (error) {
              console.error(
                `Error fetching products for category ${category.name}:`,
                error
              );
            }
          })
        );
        setCategoryProducts(productsByCategory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getMinPrice = (product) => {
    if (!product.options || product.options.length === 0) return null;
    const prices = product.options
      .filter((opt) => opt.isActive)
      .map((opt) => opt.salePrice || opt.price);
    return Math.min(...prices);
  };

  const getMaxPrice = (product) => {
    if (!product.options || product.options.length === 0) return null;
    const prices = product.options
      .filter((opt) => opt.isActive)
      .map((opt) => opt.salePrice || opt.price);
    return Math.max(...prices);
  };

  const getProductImage = (product) => {
    if (product.thumbnail) return product.thumbnail;
    if (product.options && product.options.length > 0) {
      const activeOption = product.options.find((opt) => opt.isActive);
      return activeOption?.image || "https://via.placeholder.com/300";
    }
    return "https://via.placeholder.com/300";
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

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const scrollToCategory = (categoryId) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {loading ? (
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      ) : (
        <>
          <section className="relative h-[450px] md:h-[500px] lg:h-[550px] overflow-hidden pt-4 md:pt-6 lg:pt-8">
            {slides.length > 0 ? (
              slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  <div className="relative h-full text-white overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-white">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-3/4 h-3/4 object-contain"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&h=600&fit=crop";
                        }}
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-transparent"></div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full relative z-10 flex items-center">
                      <div className="max-w-3xl ml-0 md:ml-0 lg:ml-8 xl:ml-16">
                        <div
                          className={`transform transition-all duration-1000 ${
                            index === currentSlide
                              ? "translate-x-0 opacity-100"
                              : "-translate-x-10 opacity-0"
                          }`}
                        >
                          <p className="text-gray-700 text-sm md:text-base mb-2 font-semibold uppercase tracking-wider drop-shadow-sm">
                            {slide.subtitle}
                          </p>
                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight text-gray-900 drop-shadow-lg">
                            {slide.title}
                          </h1>
                          <p className="text-lg md:text-xl mb-8 text-gray-700 leading-relaxed max-w-xl drop-shadow-sm">
                            {slide.description}
                          </p>
                          <button
                            onClick={() => scrollToCategory(slide.categoryId)}
                            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
                          >
                            <span>Khám phá ngay</span>
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
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải slideshow...</p>
                </div>
              </div>
            )}

            {slides.length > 0 && (
              <>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? "bg-white w-10 shadow-lg"
                          : "bg-white/50 hover:bg-white/70 w-2.5"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
                  aria-label="Previous slide"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
                  aria-label="Next slide"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </section>
        </>
      )}

      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Danh mục sản phẩm
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá bộ sưu tập đầy đủ các sản phẩm công nghệ hàng đầu
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-4 rounded-full"></div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : categories.length > 0 ? (
            <div className="flex justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 max-w-7xl w-full">
                {categories.map((category, index) => (
                  <Link
                    key={category.categoryId}
                    to={`/categories/${category.categoryId}`}
                    className="group p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                        {category.name.charAt(0)}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có danh mục nào</p>
            </div>
          )}
        </div>
      </section>

      {categories.map((category) => {
        const products = categoryProducts[category.categoryId] || [];
        if (products.length === 0) return null;

        return (
          <section
            key={category.categoryId}
            id={`category-${category.categoryId}`}
            className="py-16 bg-gradient-to-b from-gray-50 to-white scroll-mt-20"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-1">
                      {category.name} Nổi Bật
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base">
                      Sản phẩm hot nhất trong danh mục {category.name}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/categories/${category.categoryId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span>Xem tất cả</span>
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex gap-4 md:gap-5 lg:gap-6 transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(calc(-${
                        (categorySlides[category.categoryId] || 0) *
                        (100 / itemsPerView)
                      }% - ${
                        (categorySlides[category.categoryId] || 0) *
                        (itemsPerView === 2
                          ? 0.5
                          : itemsPerView === 4
                          ? 1.25
                          : 1.5)
                      }rem))`,
                    }}
                  >
                    {products.map((product) => {
                      const minPrice = getMinPrice(product);
                      const maxPrice = getMaxPrice(product);
                      const hasDiscount = product.options?.some(
                        (opt) => opt.discountPercent && opt.discountPercent > 0
                      );

                      return (
                        <div
                          key={product.productId}
                          className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group relative flex-shrink-0"
                          style={{
                            width: `calc(${100 / itemsPerView}% - ${
                              ((itemsPerView - 1) / itemsPerView) *
                              (itemsPerView === 2
                                ? 1
                                : itemsPerView === 4
                                ? 1.25
                                : 1.5)
                            }rem)`,
                          }}
                        >
                          <Link
                            to={`/products/${product.productId}`}
                            className="block"
                          >
                            <div className="relative overflow-hidden bg-gray-50">
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-500 p-2"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/300";
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
                              <h3 className="font-extrabold text-gray-900 mb-3 line-clamp-2 text-sm md:text-base leading-snug group-hover:text-blue-600 transition-colors duration-300 tracking-tight">
                                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-blue-700 group-hover:to-blue-600 transition-all duration-300">
                                  {product.name}
                                </span>
                              </h3>
                              <div className="mt-2">
                                {(() => {
                                  const activeOptions =
                                    product.options?.filter(
                                      (opt) => opt.isActive
                                    ) || [];
                                  const optionWithDiscount = activeOptions.find(
                                    (opt) =>
                                      opt.salePrice && opt.discountPercent > 0
                                  );

                                  if (optionWithDiscount) {
                                    return (
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-base font-bold text-blue-600">
                                            {formatPrice(
                                              optionWithDiscount.salePrice
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400 line-through">
                                            {formatPrice(
                                              optionWithDiscount.price
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }

                                  if (minPrice === maxPrice) {
                                    return (
                                      <span className="text-base font-bold text-blue-600">
                                        {formatPrice(minPrice)}
                                      </span>
                                    );
                                  }

                                  return (
                                    <div>
                                      <span className="text-base font-bold text-blue-600">
                                        {formatPrice(minPrice)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">
                                        - {formatPrice(maxPrice)}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {products.length > itemsPerView && (
                  <>
                    <button
                      onClick={() => {
                        const current =
                          categorySlides[category.categoryId] || 0;
                        if (current > 0) {
                          setCategorySlides((prev) => ({
                            ...prev,
                            [category.categoryId]: current - 1,
                          }));
                        }
                      }}
                      disabled={
                        (categorySlides[category.categoryId] || 0) === 0
                      }
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 z-10"
                    >
                      <svg
                        className="w-6 h-6 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const current =
                          categorySlides[category.categoryId] || 0;

                        const maxSlides = products.length - itemsPerView;
                        if (current < maxSlides) {
                          setCategorySlides((prev) => ({
                            ...prev,
                            [category.categoryId]: current + 1,
                          }));
                        }
                      }}
                      disabled={
                        (categorySlides[category.categoryId] || 0) >=
                        products.length - itemsPerView
                      }
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-xl border-2 border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 z-10"
                    >
                      <svg
                        className="w-6 h-6 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-blue-300">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                Chính hãng 100%
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sản phẩm chính hãng, đầy đủ bảo hành và tem chống hàng giả
              </p>
            </div>
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-green-300">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                Giao hàng nhanh
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Freeship đơn từ 15K, giao hàng toàn quốc trong 24-48h
              </p>
            </div>
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-purple-300">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                Giá tốt nhất
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Giảm giá đến 5 triệu, quà tặng hấp dẫn và ưu đãi độc quyền
              </p>
            </div>
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-transparent hover:border-orange-300">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                Bảo hành 12 tháng
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bảo hành chính hãng, đổi trả miễn phí trong 7 ngày
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cam kết mua hàng */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-gray-900">
              Cam Kết Mua Hàng
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi cam kết mang đến cho bạn trải nghiệm mua sắm tốt nhất
              với những ưu đãi và dịch vụ hàng đầu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Sản Phẩm Chính Hãng
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tất cả sản phẩm đều được nhập khẩu chính hãng, có đầy đủ tem bảo
                hành và hóa đơn VAT. Cam kết hoàn tiền 200% nếu phát hiện hàng
                giả, hàng nhái.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Giao Hàng Siêu Tốc
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Miễn phí vận chuyển cho đơn hàng từ 15.000đ. Giao hàng nhanh
                trong 24-48h tại các thành phố lớn. Hỗ trợ giao hàng COD toàn
                quốc.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Giá Tốt Nhất Thị Trường
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Cam kết giá tốt nhất, nếu tìm thấy nơi bán rẻ hơn, chúng tôi sẽ
                hoàn lại 110% số tiền chênh lệch. Ưu đãi và khuyến mãi thường
                xuyên.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Bảo Hành Toàn Diện
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Bảo hành chính hãng 12 tháng, hỗ trợ đổi trả miễn phí trong 7
                ngày nếu sản phẩm lỗi. Dịch vụ bảo hành tại nhà cho khách hàng
                VIP.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-pink-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Hỗ Trợ 24/7
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Đội ngũ tư vấn chuyên nghiệp sẵn sàng hỗ trợ bạn 24/7 qua
                hotline, chat trực tuyến và email. Giải đáp mọi thắc mắc nhanh
                chóng.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Đổi Trả Dễ Dàng
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Chính sách đổi trả linh hoạt trong 30 ngày, không cần lý do.
                Miễn phí đổi trả và hoàn tiền nhanh chóng trong 24h.
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
              <p className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                "Khách hàng là trung tâm của mọi hoạt động"
              </p>
              <p className="text-gray-600 text-lg md:text-xl">
                Chúng tôi luôn nỗ lực không ngừng để mang đến cho bạn những sản
                phẩm và dịch vụ tốt nhất
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
