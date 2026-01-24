import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { productService } from "../api/services/productService";
import { categoryService } from "../api/services/categoryService";
import { Loading, Card, Button, Pagination } from "../components/common";
import AdminLayout from "../components/AdminLayout";
import { formatPrice } from "../utils/helpers";

const AdminProducts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
  });
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchCategories();
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchProducts();
    }
  }, [user, pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response?.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && filters.search.trim().length >= 2 ? { search: filters.search.trim() } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      };
      const response = await productService.getAllProducts(params);
      if (response?.products) {
        setProducts(response.products);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      alert("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi xóa sản phẩm");
    }
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý sản phẩm</h1>
        </div>
          <Link to="/admin/products/new">
            <Button>Thêm sản phẩm mới</Button>
          </Link>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm... (tối thiểu 2 ký tự)"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filters.categoryId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, categoryId: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Tổng: <span className="font-bold">{pagination.total}</span> sản phẩm
          </div>
        </Card>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {products.map((product) => (
                <Card key={product.productId} className="p-4">
                  <Link to={`/products/${product.productId}`} className="block mb-4">
                    <div className="w-full h-48 bg-gray-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                      <img
                        src={product.thumbnail || product.cheapestOptionImage || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="mb-2">
                      {product.minPrice && product.maxPrice ? (
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(product.minPrice)} - {formatPrice(product.maxPrice)}
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-gray-400">Chưa có giá</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Danh mục: {product.category?.name || "N/A"}
                    </p>
                  </Link>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/admin/products/${product.productId}/edit`} className="flex-1">
                      <Button size="sm" variant="secondary" fullWidth>
                        Sửa
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteProduct(product.productId, product.name)}
                    >
                      Xóa
                    </Button>
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

export default AdminProducts;

