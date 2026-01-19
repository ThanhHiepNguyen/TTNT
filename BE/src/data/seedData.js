// Seed data cho Category và Product
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
    {
        name: "iPhone",
        description: "Điện thoại iPhone chính hãng Apple với công nghệ tiên tiến và thiết kế sang trọng",
    },
    {
        name: "Samsung",
        description: "Điện thoại Samsung Galaxy với màn hình AMOLED sắc nét và hiệu năng mạnh mẽ",
    },
    {
        name: "Xiaomi",
        description: "Điện thoại Xiaomi với giá cả hợp lý và cấu hình cao, phù hợp mọi đối tượng",
    },
    {
        name: "OPPO",
        description: "Điện thoại OPPO với camera selfie xuất sắc và thiết kế thời trang",
    },
    {
        name: "Vivo",
        description: "Điện thoại Vivo với công nghệ chụp ảnh đêm và pin siêu trâu",
    },
    {
        name: "Realme",
        description: "Điện thoại Realme với hiệu năng gaming mạnh mẽ và giá cả cạnh tranh",
    },
];

const products = [
    // iPhone - 13 sản phẩm
    {
        name: "iPhone 15 Pro Max",
        description: "iPhone 15 Pro Max với chip A17 Pro, camera 48MP và pin 4422mAh. Thiết kế titan cao cấp, màn hình Super Retina XDR 6.7 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/07/28/resized/iphone-15-pro-max-blue-thumbnew-600x600_1753640743.jpg",
        options: [
            { color: "Titanium Xanh", version: "256GB", price: 29990000, salePrice: 27990000, stockQuantity: 50, sku: "IP15PM-256-TX", image: "https://dienthoaihay.vn/images/products/2025/07/28/resized/iphone-15-pro-max-blue-thumbnew-600x600_1753640743.jpg" },
            { color: "Titanium Trắng", version: "256GB", price: 29990000, salePrice: 27990000, stockQuantity: 45, sku: "IP15PM-256-TT", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png" },
            { color: "Titanium Đen", version: "512GB", price: 34990000, salePrice: 32990000, stockQuantity: 30, sku: "IP15PM-512-TD", image: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-17-pro-finish-select-2025_1759207281.jpg" },
        ],
    },
    {
        name: "iPhone 15 Pro",
        description: "iPhone 15 Pro với chip A17 Pro, camera 48MP và pin 3274mAh. Thiết kế titan, màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png",
        options: [
            { color: "Titanium Xanh", version: "128GB", price: 24990000, salePrice: 22990000, stockQuantity: 60, sku: "IP15P-128-TX", image: "https://dienthoaihay.vn/images/products/2025/07/28/resized/iphone-15-pro-max-blue-thumbnew-600x600_1753640743.jpg" },
            { color: "Titanium Trắng", version: "256GB", price: 26990000, salePrice: 24990000, stockQuantity: 55, sku: "IP15P-256-TT", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png" },
        ],
    },
    {
        name: "iPhone 15",
        description: "iPhone 15 với chip A16 Bionic, camera kép 48MP và pin 3349mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 21990000, salePrice: 19990000, stockQuantity: 70, sku: "IP15-128-X", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg" },
            { color: "Hồng", version: "256GB", price: 23990000, salePrice: 21990000, stockQuantity: 65, sku: "IP15-256-H", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
        ],
    },
    {
        name: "iPhone 14 Pro Max",
        description: "iPhone 14 Pro Max với chip A16 Bionic, camera 48MP và pin 4323mAh. Màn hình Super Retina XDR 6.7 inch với Dynamic Island.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg",
        options: [
            { color: "Tím", version: "256GB", price: 26990000, salePrice: 24990000, stockQuantity: 40, sku: "IP14PM-256-T", image: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg" },
            { color: "Vàng", version: "512GB", price: 30990000, salePrice: 28990000, stockQuantity: 35, sku: "IP14PM-512-V", image: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg" },
        ],
    },
    {
        name: "iPhone 14 Pro",
        description: "iPhone 14 Pro với chip A16 Bionic, camera 48MP và pin 3200mAh. Màn hình Super Retina XDR 6.1 inch với Dynamic Island.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg",
        options: [
            { color: "Tím", version: "128GB", price: 22990000, salePrice: 20990000, stockQuantity: 55, sku: "IP14P-128-T", image: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg" },
            { color: "Vàng", version: "256GB", price: 24990000, salePrice: 22990000, stockQuantity: 50, sku: "IP14P-256-V", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
        ],
    },
    {
        name: "iPhone 14",
        description: "iPhone 14 với chip A15 Bionic, camera kép 12MP và pin 3279mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png",
        options: [
            { color: "Xanh", version: "128GB", price: 19990000, salePrice: 17990000, stockQuantity: 80, sku: "IP14-128-X", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
            { color: "Tím", version: "256GB", price: 21990000, salePrice: 19990000, stockQuantity: 70, sku: "IP14-256-T", image: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg" },
        ],
    },
    {
        name: "iPhone 13 Pro Max",
        description: "iPhone 13 Pro Max với chip A15 Bionic, camera 12MP và pin 4352mAh. Màn hình Super Retina XDR 6.7 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 22990000, salePrice: 20990000, stockQuantity: 45, sku: "IP13PM-128-X", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg" },
            { color: "Vàng", version: "256GB", price: 24990000, salePrice: 22990000, stockQuantity: 40, sku: "IP13PM-256-V", image: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg" },
        ],
    },
    {
        name: "iPhone 13 Pro",
        description: "iPhone 13 Pro với chip A15 Bionic, camera 12MP và pin 3095mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 19990000, salePrice: 17990000, stockQuantity: 60, sku: "IP13P-128-X", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
            { color: "Vàng", version: "256GB", price: 21990000, salePrice: 19990000, stockQuantity: 55, sku: "IP13P-256-V", image: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg" },
        ],
    },
    {
        name: "iPhone 13",
        description: "iPhone 13 với chip A15 Bionic, camera kép 12MP và pin 3240mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 17990000, salePrice: 15990000, stockQuantity: 85, sku: "IP13-128-X", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg" },
            { color: "Hồng", version: "256GB", price: 19990000, salePrice: 17990000, stockQuantity: 75, sku: "IP13-256-H", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
        ],
    },
    {
        name: "iPhone 12 Pro Max",
        description: "iPhone 12 Pro Max với chip A14 Bionic, camera 12MP và pin 3687mAh. Màn hình Super Retina XDR 6.7 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png",
        options: [
            { color: "Xanh", version: "128GB", price: 18990000, salePrice: 16990000, stockQuantity: 50, sku: "IP12PM-128-X", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
            { color: "Vàng", version: "256GB", price: 20990000, salePrice: 18990000, stockQuantity: 45, sku: "IP12PM-256-V", image: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg" },
        ],
    },
    {
        name: "iPhone 12 Pro",
        description: "iPhone 12 Pro với chip A14 Bionic, camera 12MP và pin 2815mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png",
        options: [
            { color: "Xanh", version: "128GB", price: 16990000, salePrice: 14990000, stockQuantity: 65, sku: "IP12P-128-X", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg" },
            { color: "Vàng", version: "256GB", price: 18990000, salePrice: 16990000, stockQuantity: 60, sku: "IP12P-256-V", image: "https://dienthoaihay.vn/images/products/2021/09/29/resized/13_1632878128.jpg" },
        ],
    },
    {
        name: "iPhone 12",
        description: "iPhone 12 với chip A14 Bionic, camera kép 12MP và pin 2815mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png",
        options: [
            { color: "Tím", version: "64GB", price: 14990000, salePrice: 12990000, stockQuantity: 90, sku: "IP12-64-T", image: "https://dienthoaihay.vn/images/products/2022/09/12/resized/tim_1662964379.jpg" },
            { color: "Xanh", version: "128GB", price: 16990000, salePrice: 14990000, stockQuantity: 80, sku: "IP12-128-X", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
        ],
    },
    {
        name: "iPhone 17 Pro",
        description: "iPhone 17 Pro với chip A19 Pro, camera 48MP và pin 3500mAh. Thiết kế titan, màn hình Super Retina XDR 6.3 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-17-pro-finish-select-2025-4_1759207422.jpg",
        options: [
            { color: "Titanium Xanh", version: "256GB", price: 31990000, salePrice: 29990000, stockQuantity: 40, sku: "IP17P-256-TX", image: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-17-pro-finish-select-2025-4_1759207422.jpg" },
            { color: "Titanium Trắng", version: "512GB", price: 35990000, salePrice: 33990000, stockQuantity: 35, sku: "IP17P-512-TT", image: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-17-pro-finish-select-2025_1759207281.jpg" },
        ],
    },
    {
        name: "iPhone 17",
        description: "iPhone 17 với chip A18 Bionic, camera kép 48MP và pin 3400mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-17-storage-select-202509-1_1759206838.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 23990000, salePrice: 21990000, stockQuantity: 65, sku: "IP17-128-X", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/iphone-15-xanh_1754273002.jpg" },
            { color: "Hồng", version: "256GB", price: 25990000, salePrice: 23990000, stockQuantity: 60, sku: "IP17-256-H", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
        ],
    },
    {
        name: "iPhone 16 Pro",
        description: "iPhone 16 Pro với chip A18 Pro, camera 48MP và pin 3350mAh. Thiết kế titan tự nhiên, màn hình Super Retina XDR 6.3 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png",
        options: [
            { color: "Titanium Tự nhiên", version: "256GB", price: 27990000, salePrice: 25990000, stockQuantity: 50, sku: "IP16P-256-TN", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png" },
            { color: "Titanium Đen", version: "512GB", price: 31990000, salePrice: 29990000, stockQuantity: 40, sku: "IP16P-512-TD", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-pro---titan-tu%CC%9B%CC%A3-nhie%CC%82n_1726075065.png" },
        ],
    },
    {
        name: "iPhone 16 Plus",
        description: "iPhone 16 Plus với chip A18, camera kép 48MP và pin 4326mAh. Màn hình Super Retina XDR 6.7 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png",
        options: [
            { color: "Hồng", version: "128GB", price: 24990000, salePrice: 22990000, stockQuantity: 55, sku: "IP16PL-128-H", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
            { color: "Xanh", version: "256GB", price: 26990000, salePrice: 24990000, stockQuantity: 50, sku: "IP16PL-256-X", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
        ],
    },
    {
        name: "iPhone 16",
        description: "iPhone 16 với chip A18, camera kép 48MP và pin 3561mAh. Màn hình Super Retina XDR 6.1 inch.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png",
        options: [
            { color: "Xanh Mòng Kết", version: "128GB", price: 22990000, salePrice: 20990000, stockQuantity: 70, sku: "IP16-128-XMK", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16---xanh-mo%CC%80ng-ke%CC%81t_1726074714.png" },
            { color: "Hồng", version: "256GB", price: 24990000, salePrice: 22990000, stockQuantity: 65, sku: "IP16-256-H", image: "https://dienthoaihay.vn/images/products/2024/09/12/resized/iphone-16-plus---ho%CC%82%CC%80ng_1726074852.png" },
        ],
    },
    {
        name: "iPhone Air",
        description: "iPhone Air với chip A17, camera kép 48MP và pin 3200mAh. Màn hình Super Retina XDR 6.1 inch, thiết kế siêu mỏng.",
        categoryName: "iPhone",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-air-storage-select-202509-1_1759206991.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 19990000, salePrice: 17990000, stockQuantity: 75, sku: "IPAIR-256-X", image: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-air-storage-select-202509-1_1759206991.jpg" },
            { color: "Trắng", version: "512GB", price: 22990000, salePrice: 20990000, stockQuantity: 65, sku: "IPAIR-512-T", image: "https://dienthoaihay.vn/images/products/2025/09/30/resized/iphone-air-storage-select-202509-1_1759206991.jpg" },
        ],
    },
    // Samsung - 13 sản phẩm
    {
        name: "Samsung Galaxy S25 Ultra",
        description: "Samsung Galaxy S25 Ultra với chip Snapdragon 8 Gen 4, camera 200MP và S Pen. Màn hình Dynamic AMOLED 2X 6.8 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/02/18/resized/galaxy-s25-ultra---ba%CC%A3c-titan_1739887185.jpg",
        options: [
            { color: "Titanium Bạc", version: "256GB", price: 27990000, salePrice: 25990000, stockQuantity: 40, sku: "S25U-256-TB", image: "https://dienthoaihay.vn/images/products/2025/02/18/resized/galaxy-s25-ultra---ba%CC%A3c-titan_1739887185.jpg" },
            { color: "Titanium Đen", version: "512GB", price: 30990000, salePrice: 28990000, stockQuantity: 35, sku: "S25U-512-TD", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        description: "Samsung Galaxy S24 Ultra với chip Snapdragon 8 Gen 3, camera 200MP và S Pen. Màn hình Dynamic AMOLED 2X 6.8 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg",
        options: [
            { color: "Xám", version: "256GB", price: 26990000, salePrice: 24990000, stockQuantity: 40, sku: "S24U-256-X", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
            { color: "Titanium Vàng", version: "512GB", price: 29990000, salePrice: 27990000, stockQuantity: 35, sku: "S24U-512-TV", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a26-5g-tra%CC%86%CC%81ng_1754286267.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy Z Flip 6",
        description: "Samsung Galaxy Z Flip 6 với chip Snapdragon 8 Gen 3, camera kép 50MP. Màn hình gập Dynamic AMOLED 6.7 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2024/07/11/resized/vn-galaxy-zflip6-f741-513550-sm-f741blgaxxv-542637095-copy_1720713854.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 24990000, salePrice: 22990000, stockQuantity: 45, sku: "ZFLIP6-256-X", image: "https://dienthoaihay.vn/images/products/2024/07/11/resized/vn-galaxy-zflip6-f741-513550-sm-f741blgaxxv-542637095-copy_1720713854.jpg" },
            { color: "Tím", version: "512GB", price: 27990000, salePrice: 25990000, stockQuantity: 38, sku: "ZFLIP6-512-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy Z Fold 5",
        description: "Samsung Galaxy Z Fold 5 với chip Snapdragon 8 Gen 2, camera 50MP. Màn hình gập Dynamic AMOLED 7.6 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/06/17/resized/galaxy-z-fold5-be_1750114091.jpg",
        options: [
            { color: "Be", version: "256GB", price: 34990000, salePrice: 32990000, stockQuantity: 30, sku: "ZFOLD5-256-B", image: "https://dienthoaihay.vn/images/products/2025/06/17/resized/galaxy-z-fold5-be_1750114091.jpg" },
            { color: "Đen", version: "512GB", price: 37990000, salePrice: 35990000, stockQuantity: 25, sku: "ZFOLD5-512-D", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy S23",
        description: "Samsung Galaxy S23 với chip Snapdragon 8 Gen 2, camera 50MP và pin 3900mAh. Màn hình Dynamic AMOLED 2X 6.1 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg",
        options: [
            { color: "Đen", version: "128GB", price: 18990000, salePrice: 16990000, stockQuantity: 65, sku: "S23-128-D", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
            { color: "Xanh", version: "256GB", price: 20990000, salePrice: 18990000, stockQuantity: 55, sku: "S23-256-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy A26 5G",
        description: "Samsung Galaxy A26 5G với chip MediaTek Dimensity 6300, camera 50MP và pin 5000mAh. Màn hình Super AMOLED 6.7 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a26-5g-tra%CC%86%CC%81ng_1754286267.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 5990000, salePrice: 5490000, stockQuantity: 120, sku: "A26-128-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a26-5g-tra%CC%86%CC%81ng_1754286267.jpg" },
            { color: "Xanh", version: "256GB", price: 6990000, salePrice: 6490000, stockQuantity: 110, sku: "A26-256-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy A06",
        description: "Samsung Galaxy A06 với chip MediaTek Helio G85, camera 50MP và pin 5000mAh. Màn hình PLS LCD 6.6 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg",
        options: [
            { color: "Trắng", version: "64GB", price: 3490000, salePrice: 2990000, stockQuantity: 150, sku: "A06-64-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg" },
            { color: "Đen", version: "128GB", price: 3990000, salePrice: 3490000, stockQuantity: 140, sku: "A06-128-D", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy A13",
        description: "Samsung Galaxy A13 với chip Exynos 850, camera 50MP và pin 5000mAh. Màn hình PLS LCD 6.6 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg",
        options: [
            { color: "Xanh", version: "64GB", price: 2990000, salePrice: 2490000, stockQuantity: 160, sku: "A13-64-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
            { color: "Đen", version: "128GB", price: 3490000, salePrice: 2990000, stockQuantity: 150, sku: "A13-128-D", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy Tab A9",
        description: "Samsung Galaxy Tab A9 với chip MediaTek Helio G99, camera 8MP và pin 7040mAh. Màn hình TFT LCD 8.7 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/06/17/resized/014-galaxy-tab-a9-silver-combo_1750115402.jpg",
        options: [
            { color: "Bạc", version: "64GB", price: 3990000, salePrice: 3490000, stockQuantity: 100, sku: "TABA9-64-B", image: "https://dienthoaihay.vn/images/products/2025/06/17/resized/014-galaxy-tab-a9-silver-combo_1750115402.jpg" },
            { color: "Xám", version: "128GB", price: 4990000, salePrice: 4490000, stockQuantity: 90, sku: "TABA9-128-X", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy Tab S10 FE",
        description: "Samsung Galaxy Tab S10 FE với chip Exynos 1380, camera 8MP và pin 10090mAh. Màn hình TFT LCD 10.9 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-tab-s10-fe-tra%CC%86%CC%81ng_1754287066.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 8990000, salePrice: 7990000, stockQuantity: 70, sku: "TABS10FE-128-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-tab-s10-fe-tra%CC%86%CC%81ng_1754287066.jpg" },
            { color: "Xanh", version: "256GB", price: 10990000, salePrice: 9990000, stockQuantity: 60, sku: "TABS10FE-256-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy S22 Ultra",
        description: "Samsung Galaxy S22 Ultra với chip Snapdragon 8 Gen 1, camera 108MP và S Pen. Màn hình Dynamic AMOLED 2X 6.8 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg",
        options: [
            { color: "Đen", version: "128GB", price: 19990000, salePrice: 17990000, stockQuantity: 50, sku: "S22U-128-D", image: "https://dienthoaihay.vn/images/products/2025/06/12/resized/s24u-xa%CC%81m_1749700612.jpg" },
            { color: "Xanh", version: "256GB", price: 21990000, salePrice: 19990000, stockQuantity: 45, sku: "S22U-256-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy S21 FE",
        description: "Samsung Galaxy S21 FE với chip Snapdragon 888, camera 64MP và pin 4500mAh. Màn hình Dynamic AMOLED 2X 6.4 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 12990000, salePrice: 11990000, stockQuantity: 75, sku: "S21FE-128-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg" },
            { color: "Tím", version: "256GB", price: 14990000, salePrice: 13990000, stockQuantity: 65, sku: "S21FE-256-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy A54",
        description: "Samsung Galaxy A54 với chip Exynos 1380, camera 50MP và pin 5000mAh. Màn hình Super AMOLED 6.4 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 8990000, salePrice: 7990000, stockQuantity: 95, sku: "A54-128-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
            { color: "Tím", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 85, sku: "A54-256-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a06-tra%CC%86%CC%81ng_1754285758.jpg" },
        ],
    },
    {
        name: "Samsung Galaxy A34",
        description: "Samsung Galaxy A34 với chip MediaTek Dimensity 1080, camera 48MP và pin 5000mAh. Màn hình Super AMOLED 6.6 inch.",
        categoryName: "Samsung",
        thumbnail: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a26-5g-tra%CC%86%CC%81ng_1754286267.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 6990000, salePrice: 5990000, stockQuantity: 110, sku: "A34-128-T", image: "https://dienthoaihay.vn/images/products/2025/08/04/resized/galaxy-a26-5g-tra%CC%86%CC%81ng_1754286267.jpg" },
            { color: "Xanh", version: "256GB", price: 7990000, salePrice: 6990000, stockQuantity: 100, sku: "A34-256-X", image: "https://dienthoaihay.vn/images/products/2022/05/04/resized/a13xanh_1651599946.jpg" },
        ],
    },
    // Xiaomi - 13 sản phẩm
    {
        name: "Xiaomi 17 Pro Max",
        description: "Xiaomi 17 Pro Max với chip Snapdragon 8 Gen 4, camera Leica 50MP và pin 5500mAh. Màn hình AMOLED 6.8 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 22990000, salePrice: 20990000, stockQuantity: 50, sku: "XM17PM-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
            { color: "Đen", version: "512GB", price: 25990000, salePrice: 23990000, stockQuantity: 40, sku: "XM17PM-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
        ],
    },
    {
        name: "Xiaomi Redmi Note 12T Pro",
        description: "Xiaomi Redmi Note 12T Pro với chip MediaTek Dimensity 8200 Ultra, camera 64MP và pin 5080mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_5g_xanh_3_a16f31cae7.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 6990000, salePrice: 5990000, stockQuantity: 100, sku: "RMN12TP-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_5g_xanh_3_a16f31cae7.jpg" },
            { color: "Đen", version: "256GB", price: 7990000, salePrice: 6990000, stockQuantity: 90, sku: "RMN12TP-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
        ],
    },
    {
        name: "Xiaomi Redmi K50",
        description: "Xiaomi Redmi K50 với chip MediaTek Dimensity 8100, camera 48MP và pin 5500mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png",
        options: [
            { color: "Đen", version: "128GB", price: 7990000, salePrice: 6990000, stockQuantity: 95, sku: "K50-128-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
            { color: "Xanh", version: "256GB", price: 8990000, salePrice: 7990000, stockQuantity: 85, sku: "K50-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_xanh_5_a701ff995d.jpg" },
        ],
    },
    {
        name: "Xiaomi 14 Pro",
        description: "Xiaomi 14 Pro với chip Snapdragon 8 Gen 3, camera Leica 50MP và pin 4880mAh. Màn hình AMOLED 6.73 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_xanh_5_a701ff995d.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 19990000, salePrice: 17990000, stockQuantity: 60, sku: "XM14P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
            { color: "Đen", version: "512GB", price: 22990000, salePrice: 20990000, stockQuantity: 50, sku: "XM14P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_den_5_d11c2f2629.png" },
        ],
    },
    {
        name: "Xiaomi 13 Pro",
        description: "Xiaomi 13 Pro với chip Snapdragon 8 Gen 2, camera Leica 50MP và pin 4820mAh. Màn hình AMOLED 6.73 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_den_5_d11c2f2629.png",
        options: [
            { color: "Đen", version: "256GB", price: 17990000, salePrice: 15990000, stockQuantity: 70, sku: "XM13P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_den_5_d11c2f2629.png" },
            { color: "Xanh", version: "512GB", price: 20990000, salePrice: 18990000, stockQuantity: 60, sku: "XM13P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_xanh_5_a701ff995d.jpg" },
        ],
    },
    {
        name: "Xiaomi Redmi Note 13 Pro",
        description: "Xiaomi Redmi Note 13 Pro với chip Snapdragon 7s Gen 2, camera 200MP và pin 5100mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_15_xanh_5_d7f488284a.png",
        options: [
            { color: "Xanh", version: "128GB", price: 7990000, salePrice: 6990000, stockQuantity: 105, sku: "RMN13P-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_15_xanh_5_d7f488284a.png" },
            { color: "Trắng", version: "256GB", price: 8990000, salePrice: 7990000, stockQuantity: 95, sku: "RMN13P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
        ],
    },
    {
        name: "Xiaomi Redmi Note 12 Pro",
        description: "Xiaomi Redmi Note 12 Pro với chip MediaTek Dimensity 1080, camera 200MP và pin 5000mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png",
        options: [
            { color: "Xanh", version: "128GB", price: 5990000, salePrice: 4990000, stockQuantity: 120, sku: "RMN12P-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_5g_xanh_3_a16f31cae7.jpg" },
            { color: "Đen", version: "256GB", price: 6990000, salePrice: 5990000, stockQuantity: 110, sku: "RMN12P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
        ],
    },
    {
        name: "Xiaomi Redmi K60 Ultra",
        description: "Xiaomi Redmi K60 Ultra với chip MediaTek Dimensity 9200+, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_pro_vang_5_1e3becf88b.png",
        options: [
            { color: "Đen", version: "256GB", price: 10990000, salePrice: 9990000, stockQuantity: 80, sku: "K60U-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_den_5_d11c2f2629.png" },
            { color: "Xanh", version: "512GB", price: 12990000, salePrice: 11990000, stockQuantity: 70, sku: "K60U-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_xanh_5_a701ff995d.jpg" },
        ],
    },
    {
        name: "Xiaomi Redmi K60 Pro",
        description: "Xiaomi Redmi K60 Pro với chip Snapdragon 8 Gen 2, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_poco_x7_den_vang_5_9d618c2219.png",
        options: [
            { color: "Đen", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 85, sku: "K60P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_poco_x7_den_vang_5_9d618c2219.png" },
            { color: "Trắng", version: "512GB", price: 11990000, salePrice: 10990000, stockQuantity: 75, sku: "K60P-512-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
        ],
    },
    {
        name: "Xiaomi Redmi 12C",
        description: "Xiaomi Redmi 12C với chip MediaTek Helio G85, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.71 inch.",
        categoryName: "Xiaomi",
        thumbnail: "http://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_14c_den_1_671192109b.jpg",
        options: [
            { color: "Đen", version: "64GB", price: 3490000, salePrice: 2990000, stockQuantity: 150, sku: "RM12C-64-D", image: "http://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_14c_den_1_671192109b.jpg" },
            { color: "Xanh", version: "128GB", price: 3990000, salePrice: 3490000, stockQuantity: 140, sku: "RM12C-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/redmi_15c_blue_1_80eb9c4ba4.png" },
        ],
    },
    {
        name: "Xiaomi 12 Pro",
        description: "Xiaomi 12 Pro với chip Snapdragon 8 Gen 1, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.73 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 16990000, salePrice: 14990000, stockQuantity: 55, sku: "XM12P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
            { color: "Đen", version: "512GB", price: 19990000, salePrice: 17990000, stockQuantity: 45, sku: "XM12P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15t_den_5_d11c2f2629.png" },
        ],
    },
    {
        name: "Xiaomi Redmi Note 11 Pro",
        description: "Xiaomi Redmi Note 11 Pro với chip MediaTek Helio G96, camera 108MP và pin 5000mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_13x_xanh_5_2f17e30bdd.png",
        options: [
            { color: "Xanh", version: "128GB", price: 5990000, salePrice: 4990000, stockQuantity: 115, sku: "RMN11P-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_13x_xanh_5_2f17e30bdd.png" },
            { color: "Đen", version: "256GB", price: 6990000, salePrice: 5990000, stockQuantity: 105, sku: "RMN11P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
        ],
    },
    {
        name: "Xiaomi Redmi K40",
        description: "Xiaomi Redmi K40 với chip Snapdragon 870, camera 48MP và pin 4520mAh. Màn hình AMOLED 6.67 inch.",
        categoryName: "Xiaomi",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_poco_m7_pro_xanh_5_20cec22a7c.jpg",
        options: [
            { color: "Đen", version: "128GB", price: 6990000, salePrice: 5990000, stockQuantity: 90, sku: "K40-128-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_redmi_note_14_den_4_2f995df92e.png" },
            { color: "Trắng", version: "256GB", price: 7990000, salePrice: 6990000, stockQuantity: 80, sku: "K40-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_15_ultra_bac_5_2d18398535.jpg" },
        ],
    },
    // OPPO - 13 sản phẩm
    {
        name: "OPPO Find X7 Ultra",
        description: "OPPO Find X7 Ultra với chip Snapdragon 8 Gen 3, camera Hasselblad 50MP và pin 5000mAh. Màn hình AMOLED 6.82 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_xam_5_1df20c71b7.png",
        options: [
            { color: "Đen", version: "256GB", price: 22990000, salePrice: 20990000, stockQuantity: 45, sku: "OPX7U-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg" },
            { color: "Vàng", version: "512GB", price: 25990000, salePrice: 23990000, stockQuantity: 35, sku: "OPX7U-512-V", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_pro_hong_3_f6a383d401.png" },
        ],
    },
    {
        name: "OPPO Reno11 Pro",
        description: "OPPO Reno11 Pro với chip MediaTek Dimensity 8200, camera 50MP và pin 4700mAh. Màn hình AMOLED 6.74 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_f_xanh_0a5b091f91.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 12990000, salePrice: 11990000, stockQuantity: 60, sku: "OPR11P-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_f_xanh_0a5b091f91.jpg" },
            { color: "Đen", version: "512GB", price: 14990000, salePrice: 13990000, stockQuantity: 50, sku: "OPR11P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a5i_pro_den_1_28ac8b531d.jpg" },
        ],
    },
    {
        name: "OPPO Find X6 Pro",
        description: "OPPO Find X6 Pro với chip Snapdragon 8 Gen 2, camera Hasselblad 50MP và pin 5000mAh. Màn hình AMOLED 6.82 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_xam_5_1df20c71b7.png",
        options: [
            { color: "Trắng", version: "256GB", price: 19990000, salePrice: 17990000, stockQuantity: 50, sku: "OPX6P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a6_pro_silver_4306d7f8bc.png" },
            { color: "Đen", version: "512GB", price: 22990000, salePrice: 20990000, stockQuantity: 40, sku: "OPX6P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg" },
        ],
    },
    {
        name: "OPPO Reno10 Pro",
        description: "OPPO Reno10 Pro với chip MediaTek Dimensity 8200, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.74 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno12_f_green_800b5588d2.png",
        options: [
            { color: "Xanh", version: "256GB", price: 11990000, salePrice: 10990000, stockQuantity: 65, sku: "OPR10P-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg" },
            { color: "Tím", version: "512GB", price: 13990000, salePrice: 12990000, stockQuantity: 55, sku: "OPR10P-512-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a5i_tim_5_c476e20e16.jpg" },
        ],
    },
    {
        name: "OPPO Find X5 Pro",
        description: "OPPO Find X5 Pro với chip Snapdragon 8 Gen 1, camera Hasselblad 50MP và pin 5000mAh. Màn hình AMOLED 6.7 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_xam_5_1df20c71b7.png",
        options: [
            { color: "Đen", version: "256GB", price: 17990000, salePrice: 15990000, stockQuantity: 55, sku: "OPX5P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg" },
            { color: "Trắng", version: "512GB", price: 20990000, salePrice: 18990000, stockQuantity: 45, sku: "OPX5P-512-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a6_pro_silver_4306d7f8bc.png" },
        ],
    },
    {
        name: "OPPO Reno9 Pro",
        description: "OPPO Reno9 Pro với chip Snapdragon 778G, camera 50MP và pin 4500mAh. Màn hình AMOLED 6.7 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_f_xanh_0a5b091f91.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 10990000, salePrice: 9990000, stockQuantity: 70, sku: "OPR9P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_trang_5_9d886c971d.jpg" },
            { color: "Xanh", version: "512GB", price: 12990000, salePrice: 11990000, stockQuantity: 60, sku: "OPR9P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg" },
        ],
    },
    {
        name: "OPPO A78",
        description: "OPPO A78 với chip MediaTek Helio G99, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.43 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a5i_tim_5_c476e20e16.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 5990000, salePrice: 4990000, stockQuantity: 100, sku: "OPA78-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg" },
            { color: "Đen", version: "256GB", price: 6990000, salePrice: 5990000, stockQuantity: 90, sku: "OPA78-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a5i_pro_den_1_28ac8b531d.jpg" },
        ],
    },
    {
        name: "OPPO A58",
        description: "OPPO A58 với chip MediaTek Helio G85, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.72 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_tim_5_a81a5f4bf7.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 4990000, salePrice: 3990000, stockQuantity: 110, sku: "OPA58-128-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_trang_5_9d886c971d.jpg" },
            { color: "Xanh", version: "256GB", price: 5990000, salePrice: 4990000, stockQuantity: 100, sku: "OPA58-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno12_f_green_800b5588d2.png" },
        ],
    },
    {
        name: "OPPO Find N3",
        description: "OPPO Find N3 với chip Snapdragon 8 Gen 2, camera Hasselblad 48MP. Màn hình gập AMOLED 7.82 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg",
        options: [
            { color: "Be", version: "256GB", price: 29990000, salePrice: 27990000, stockQuantity: 30, sku: "OPN3-256-B", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a6_pro_silver_4306d7f8bc.png" },
            { color: "Đen", version: "512GB", price: 32990000, salePrice: 30990000, stockQuantity: 25, sku: "OPN3-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg" },
        ],
    },
    {
        name: "OPPO Reno8 Pro",
        description: "OPPO Reno8 Pro với chip MediaTek Dimensity 8100 Max, camera 50MP và pin 4500mAh. Màn hình AMOLED 6.62 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 75, sku: "OPR8P-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg" },
            { color: "Đen", version: "512GB", price: 11990000, salePrice: 10990000, stockQuantity: 65, sku: "OPR8P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a5i_pro_den_1_28ac8b531d.jpg" },
        ],
    },
    {
        name: "OPPO A17",
        description: "OPPO A17 với chip MediaTek Helio G35, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.56 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_trang_5_9d886c971d.jpg",
        options: [
            { color: "Trắng", version: "64GB", price: 2990000, salePrice: 2490000, stockQuantity: 130, sku: "OPA17-64-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_trang_5_9d886c971d.jpg" },
            { color: "Xanh", version: "128GB", price: 3490000, salePrice: 2990000, stockQuantity: 120, sku: "OPA17-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno12_f_green_800b5588d2.png" },
        ],
    },
    {
        name: "OPPO Find X3 Pro",
        description: "OPPO Find X3 Pro với chip Snapdragon 888, camera 50MP và pin 4500mAh. Màn hình AMOLED 6.7 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_xam_5_1df20c71b7.png",
        options: [
            { color: "Đen", version: "256GB", price: 15990000, salePrice: 13990000, stockQuantity: 60, sku: "OPX3P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2023_11_7_638349536349641250_oppo-find-n3-5g-den-7.jpg" },
            { color: "Xanh", version: "512GB", price: 18990000, salePrice: 16990000, stockQuantity: 50, sku: "OPX3P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_xanh_la_31622e5c87.jpg" },
        ],
    },
    {
        name: "OPPO Reno7",
        description: "OPPO Reno7 với chip MediaTek Dimensity 900, camera 64MP và pin 4500mAh. Màn hình AMOLED 6.43 inch.",
        categoryName: "OPPO",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_reno14_f_xanh_0a5b091f91.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 7990000, salePrice: 6990000, stockQuantity: 85, sku: "OPR7-128-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_a3_trang_5_9d886c971d.jpg" },
            { color: "Xanh", version: "256GB", price: 8990000, salePrice: 7990000, stockQuantity: 75, sku: "OPR7-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/oppo_find_x9_hong_1_86503fe881.png" },
        ],
    },
    // Vivo - 13 sản phẩm
    {
        name: "Vivo X100 Pro",
        description: "Vivo X100 Pro với chip MediaTek Dimensity 9300, camera Zeiss 50MP và pin 5400mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 21990000, salePrice: 19990000, stockQuantity: 48, sku: "VX100P-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
            { color: "Đen", version: "512GB", price: 24990000, salePrice: 22990000, stockQuantity: 38, sku: "VX100P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
        ],
    },
    {
        name: "Vivo X90 Pro",
        description: "Vivo X90 Pro với chip MediaTek Dimensity 9200, camera Zeiss 50MP và pin 4870mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_5_23_636626646179712812_1o.png",
        options: [
            { color: "Trắng", version: "256GB", price: 19990000, salePrice: 17990000, stockQuantity: 52, sku: "VX90P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_5_23_636626646179712812_1o.png" },
            { color: "Đen", version: "512GB", price: 22990000, salePrice: 20990000, stockQuantity: 42, sku: "VX90P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
        ],
    },
    {
        name: "Vivo X80 Pro",
        description: "Vivo X80 Pro với chip Snapdragon 8 Gen 1, camera Zeiss 50MP và pin 4700mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 17990000, salePrice: 15990000, stockQuantity: 58, sku: "VX80P-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
            { color: "Đen", version: "512GB", price: 20990000, salePrice: 18990000, stockQuantity: 48, sku: "VX80P-512-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
        ],
    },
    {
        name: "Vivo V30 Pro",
        description: "Vivo V30 Pro với chip MediaTek Dimensity 8200, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_4_20_636598349121977350_1o.png",
        options: [
            { color: "Trắng", version: "256GB", price: 12990000, salePrice: 11990000, stockQuantity: 65, sku: "VV30P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_4_20_636598349121977350_1o.png" },
            { color: "Xanh", version: "512GB", price: 14990000, salePrice: 13990000, stockQuantity: 55, sku: "VV30P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
        ],
    },
    {
        name: "Vivo V29",
        description: "Vivo V29 với chip Snapdragon 778G, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 10990000, salePrice: 9990000, stockQuantity: 70, sku: "VV29-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
            { color: "Tím", version: "512GB", price: 12990000, salePrice: 11990000, stockQuantity: 60, sku: "VV29-512-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2017_11_17_636465150380298592_1o.png" },
        ],
    },
    {
        name: "Vivo Y100",
        description: "Vivo Y100 với chip Snapdragon 695, camera 64MP và pin 5000mAh. Màn hình AMOLED 6.38 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_9_637983383787368693_vivo-y16-vang-dd.jpg",
        options: [
            { color: "Trắng", version: "128GB", price: 6990000, salePrice: 5990000, stockQuantity: 95, sku: "VY100-128-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_5_23_636626646179712812_1o.png" },
            { color: "Xanh", version: "256GB", price: 7990000, salePrice: 6990000, stockQuantity: 85, sku: "VY100-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
        ],
    },
    {
        name: "Vivo Y78",
        description: "Vivo Y78 với chip MediaTek Helio G99, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.64 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_11_14_636778049401352669_vivo-y81i-1o.png",
        options: [
            { color: "Trắng", version: "128GB", price: 5990000, salePrice: 4990000, stockQuantity: 105, sku: "VY78-128-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_4_20_636598349121977350_1o.png" },
            { color: "Xanh", version: "256GB", price: 6990000, salePrice: 5990000, stockQuantity: 95, sku: "VY78-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
        ],
    },
    {
        name: "Vivo X70 Pro",
        description: "Vivo X70 Pro với chip MediaTek Dimensity 1200, camera Zeiss 50MP và pin 4450mAh. Màn hình AMOLED 6.56 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg",
        options: [
            { color: "Đen", version: "256GB", price: 14990000, salePrice: 12990000, stockQuantity: 62, sku: "VX70P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
            { color: "Xanh", version: "512GB", price: 17990000, salePrice: 15990000, stockQuantity: 52, sku: "VX70P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
        ],
    },
    {
        name: "Vivo V27",
        description: "Vivo V27 với chip MediaTek Dimensity 7200, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987654083012579_vivo-v25e-vang-dd.jpg",
        options: [
            { color: "Xanh", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 75, sku: "VV27-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
            { color: "Tím", version: "512GB", price: 11990000, salePrice: 10990000, stockQuantity: 65, sku: "VV27-512-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2017_11_17_636465150380298592_1o.png" },
        ],
    },
    {
        name: "Vivo Y36",
        description: "Vivo Y36 với chip Snapdragon 680, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.64 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2017_9_25_636419474934628000_Vivo%20Y53.png",
        options: [
            { color: "Trắng", version: "128GB", price: 4990000, salePrice: 3990000, stockQuantity: 115, sku: "VY36-128-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_12_18_636807491091136285_vivo-y91.png" },
            { color: "Xanh", version: "256GB", price: 5990000, salePrice: 4990000, stockQuantity: 105, sku: "VY36-256-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
        ],
    },
    {
        name: "Vivo S17 Pro",
        description: "Vivo S17 Pro với chip MediaTek Dimensity 8200, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2019_10_8_637061536225899392_vivo-u10-dd.png",
        options: [
            { color: "Trắng", version: "256GB", price: 11990000, salePrice: 10990000, stockQuantity: 68, sku: "VS17P-256-T", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_5_23_636626646179712812_1o.png" },
            { color: "Xanh", version: "512GB", price: 13990000, salePrice: 12990000, stockQuantity: 58, sku: "VS17P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_7_21_637939995401683559_vivo-t1x-xanh-dd.jpg" },
        ],
    },
    {
        name: "Vivo X60 Pro",
        description: "Vivo X60 Pro với chip Snapdragon 870, camera Zeiss 48MP và pin 4200mAh. Màn hình AMOLED 6.56 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg",
        options: [
            { color: "Đen", version: "256GB", price: 12990000, salePrice: 11990000, stockQuantity: 72, sku: "VX60P-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
            { color: "Xanh", version: "512GB", price: 15990000, salePrice: 14990000, stockQuantity: 62, sku: "VX60P-512-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
        ],
    },
    {
        name: "Vivo Y55",
        description: "Vivo Y55 với chip Snapdragon 680, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.58 inch.",
        categoryName: "Vivo",
        thumbnail: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2018_6_15_636646808900752301_vivoY81-do-1o.png",
        options: [
            { color: "Xanh", version: "128GB", price: 4490000, salePrice: 3490000, stockQuantity: 125, sku: "VY55-128-X", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2024_3_20_638465432003015733_vivo-y03-xanh-4.jpg" },
            { color: "Đen", version: "256GB", price: 5490000, salePrice: 4490000, stockQuantity: 115, sku: "VY55-256-D", image: "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/2022_9_14_637987655741141806_vivo-v25-den-dd.jpg" },
        ],
    },
    // Realme - 13 sản phẩm
    {
        name: "Realme GT 5 Pro",
        description: "Realme GT 5 Pro với chip Snapdragon 8 Gen 3, camera Sony IMX890 50MP và pin 5400mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/1/0/10_pro_1_.jpg",
        options: [
            { color: "Đen", version: "256GB", price: 14990000, salePrice: 13990000, stockQuantity: 55, sku: "RGT5P-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/1/0/10_pro_1_.jpg" },
            { color: "Cam", version: "512GB", price: 16990000, salePrice: 15990000, stockQuantity: 45, sku: "RGT5P-512-C", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/p/u/purple-be8e0ce5d0.png" },
        ],
    },
    {
        name: "Realme 12 Pro",
        description: "Realme 12 Pro với chip Snapdragon 6 Gen 1, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.7 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png",
        options: [
            { color: "Xanh", version: "128GB", price: 8990000, salePrice: 7990000, stockQuantity: 85, sku: "R12P-128-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
            { color: "Đen", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 75, sku: "R12P-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
        ],
    },
    {
        name: "Realme GT 6",
        description: "Realme GT 6 với chip Snapdragon 8s Gen 3, camera 50MP và pin 5500mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-13-plus-5g_6_.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 12990000, salePrice: 11990000, stockQuantity: 60, sku: "RGT6-256-T", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-13-plus-5g_6_.jpg" },
            { color: "Xanh", version: "512GB", price: 14990000, salePrice: 13990000, stockQuantity: 50, sku: "RGT6-512-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
        ],
    },
    {
        name: "Realme GT 5",
        description: "Realme GT 5 với chip Snapdragon 8 Gen 2, camera 50MP và pin 5240mAh. Màn hình AMOLED 6.74 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png",
        options: [
            { color: "Đen", version: "256GB", price: 11990000, salePrice: 10990000, stockQuantity: 65, sku: "RGT5-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
            { color: "Cam", version: "512GB", price: 13990000, salePrice: 12990000, stockQuantity: 55, sku: "RGT5-512-C", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/p/u/purple-be8e0ce5d0.png" },
        ],
    },
    {
        name: "Realme 11 Pro",
        description: "Realme 11 Pro với chip MediaTek Dimensity 7050, camera 200MP và pin 5000mAh. Màn hình AMOLED 6.7 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png",
        options: [
            { color: "Xanh", version: "256GB", price: 7990000, salePrice: 6990000, stockQuantity: 90, sku: "R11P-256-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
            { color: "Đen", version: "512GB", price: 8990000, salePrice: 7990000, stockQuantity: 80, sku: "R11P-512-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
        ],
    },
    {
        name: "Realme C55",
        description: "Realme C55 với chip MediaTek Helio G88, camera 64MP và pin 5000mAh. Màn hình IPS LCD 6.72 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-c61_2__2.png",
        options: [
            { color: "Trắng", version: "128GB", price: 4990000, salePrice: 3990000, stockQuantity: 120, sku: "RC55-128-T", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-c61_2__2.png" },
            { color: "Xanh", version: "256GB", price: 5990000, salePrice: 4990000, stockQuantity: 110, sku: "RC55-256-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
        ],
    },
    {
        name: "Realme GT Neo 6",
        description: "Realme GT Neo 6 với chip Snapdragon 8s Gen 3, camera 50MP và pin 5500mAh. Màn hình AMOLED 6.78 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-13-plus-5g_6__2.jpg",
        options: [
            { color: "Trắng", version: "256GB", price: 10990000, salePrice: 9990000, stockQuantity: 70, sku: "RGTN6-256-T", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-13-plus-5g_6__2.jpg" },
            { color: "Xanh", version: "512GB", price: 12990000, salePrice: 11990000, stockQuantity: 60, sku: "RGTN6-512-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
        ],
    },
    {
        name: "Realme 10 Pro",
        description: "Realme 10 Pro với chip MediaTek Helio G99, camera 108MP và pin 5000mAh. Màn hình AMOLED 6.72 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/5/0/50_1_16.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 5990000, salePrice: 4990000, stockQuantity: 100, sku: "R10P-128-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
            { color: "Đen", version: "256GB", price: 6990000, salePrice: 5990000, stockQuantity: 90, sku: "R10P-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
        ],
    },
    {
        name: "Realme C53",
        description: "Realme C53 với chip Unisoc Tiger T612, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.74 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-c51_2_1.png",
        options: [
            { color: "Trắng", version: "64GB", price: 2990000, salePrice: 2490000, stockQuantity: 140, sku: "RC53-64-T", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-c51_2_1.png" },
            { color: "Xanh", version: "128GB", price: 3490000, salePrice: 2990000, stockQuantity: 130, sku: "RC53-128-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
        ],
    },
    {
        name: "Realme GT Neo 5",
        description: "Realme GT Neo 5 với chip Snapdragon 8+ Gen 1, camera 50MP và pin 5000mAh. Màn hình AMOLED 6.74 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/f/r/frame3935-640x640_2.png",
        options: [
            { color: "Đen", version: "256GB", price: 9990000, salePrice: 8990000, stockQuantity: 75, sku: "RGTN5-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
            { color: "Cam", version: "512GB", price: 11990000, salePrice: 10990000, stockQuantity: 65, sku: "RGTN5-512-C", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/p/u/purple-be8e0ce5d0.png" },
        ],
    },
    {
        name: "Realme 9 Pro",
        description: "Realme 9 Pro với chip Snapdragon 695, camera 64MP và pin 5000mAh. Màn hình AMOLED 6.4 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/r/sr66_4_.jpg",
        options: [
            { color: "Xanh", version: "128GB", price: 5490000, salePrice: 4490000, stockQuantity: 110, sku: "R9P-128-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
            { color: "Đen", version: "256GB", price: 6490000, salePrice: 5490000, stockQuantity: 100, sku: "R9P-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
        ],
    },
    {
        name: "Realme C35",
        description: "Realme C35 với chip Unisoc Tiger T616, camera 50MP và pin 5000mAh. Màn hình IPS LCD 6.6 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-c61_2_.png",
        options: [
            { color: "Trắng", version: "64GB", price: 2490000, salePrice: 1990000, stockQuantity: 150, sku: "RC35-64-T", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-c61_2__2.png" },
            { color: "Xanh", version: "128GB", price: 2990000, salePrice: 2490000, stockQuantity: 140, sku: "RC35-128-X", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/a/xanh_5.png" },
        ],
    },
    {
        name: "Realme GT 3",
        description: "Realme GT 3 với chip Snapdragon 8+ Gen 1, camera 50MP và pin 4600mAh. Màn hình AMOLED 6.74 inch.",
        categoryName: "Realme",
        thumbnail: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/r/e/realme-c67-1.png",
        options: [
            { color: "Đen", version: "256GB", price: 8990000, salePrice: 7990000, stockQuantity: 80, sku: "RGT3-256-D", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-realme-note-60x.png" },
            { color: "Cam", version: "512GB", price: 10990000, salePrice: 9990000, stockQuantity: 70, sku: "RGT3-512-C", image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/p/u/purple-be8e0ce5d0.png" },
        ],
    },
];

async function seed() {
    try {
        console.log("🌱 Bắt đầu seed data...");

        // Xóa dữ liệu cũ (optional - comment nếu muốn giữ lại)
        // await prisma.productOption.deleteMany();
        // await prisma.product.deleteMany();
        // await prisma.category.deleteMany();

        // Tạo Categories
        console.log("📁 Đang tạo categories...");
        const categoryMap = {};
        for (const category of categories) {
            // Kiểm tra category đã tồn tại chưa
            let existing = await prisma.category.findFirst({
                where: { name: category.name },
            });

            if (!existing) {
                existing = await prisma.category.create({
                    data: category,
                });
            } else {
                // Update nếu đã tồn tại
                existing = await prisma.category.update({
                    where: { categoryId: existing.categoryId },
                    data: category,
                });
            }

            categoryMap[category.name] = existing.categoryId;
            console.log(`✅ Đã tạo/cập nhật category: ${category.name}`);
        }

        // Tạo Products với Options
        console.log("📱 Đang tạo products...");
        for (const product of products) {
            const categoryId = categoryMap[product.categoryName];
            if (!categoryId) {
                console.error(`❌ Không tìm thấy category: ${product.categoryName}`);
                continue;
            }

            // Tính discountPercent cho mỗi option
            const optionsWithDiscount = product.options.map((option) => {
                let discountPercent = null;
                if (option.salePrice && option.price) {
                    discountPercent = Math.round(
                        ((option.price - option.salePrice) / option.price) * 100
                    );
                }
                return {
                    ...option,
                    discountPercent,
                };
            });

            const created = await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    categoryId: categoryId,
                    thumbnail: product.thumbnail,
                    options: {
                        create: optionsWithDiscount,
                    },
                },
            });
            console.log(`✅ Đã tạo product: ${product.name} với ${product.options.length} options`);
        }

        console.log("🎉 Seed data hoàn tất!");
    } catch (error) {
        console.error("❌ Lỗi khi seed data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();

