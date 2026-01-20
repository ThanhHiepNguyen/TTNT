import { sendResponse } from "../../utils/response.js";
import { prisma } from "../../config/db.js";

export const getProductsForAI = async (req, res) => {
    try {
        const { search } = req.query;
        const searchTerm = search?.trim().toLowerCase() || "";
 DUCNE

        let whereCondition = {};


        console.log(`[INTERNAL] getProductsForAI called with search: '${searchTerm}'`);

        let whereCondition = {};

        // ISSUE: Không có filter khi searchTerm rỗng, trả về tất cả products
 main
        if (searchTerm) {
            whereCondition = {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
 DUCNE
                ],
            };
        }


                    // Thêm search trong category name
                    { category: { name: { contains: searchTerm, mode: "insensitive" } } }
                ],
            };
        } else {
            // Khi không có search term (vector search), giới hạn số lượng
            console.log(`[INTERNAL] No search term, returning limited products for vector search`);
        }

        // ISSUE: take: 10 quá ít cho vector search
        const limit = searchTerm ? 10 : 50; // Vector search cần nhiều products hơn

main
        const products = await prisma.product.findMany({
            where: whereCondition,
            select: {
                productId: true,
                name: true,
                description: true,
 DUCNE

                thumbnail: true,
main
                category: {
                    select: {
                        name: true,
                    },
                },
                options: {
                    where: { isActive: true },
                    select: {
                        price: true,
                        salePrice: true,
                        stockQuantity: true,
                        color: true,
                        version: true,
 DUCNE

                        image: true,
 main
                    },
                    orderBy: { price: "asc" },
                    take: 1,
                },
            },
 DUCNE
            take: 10,
        });


            take: limit,
        });

        console.log(`[INTERNAL] Found ${products.length} products`);

 main
        const formattedProducts = products
            .filter((p) => p.options && p.options.length > 0)
            .map((product) => {
                const option = product.options[0];
                const price = option.salePrice || option.price;
                return {
                    productId: product.productId,
                    name: product.name,
                    description: product.description,
                    category: product.category.name,
 DUCNE
                    price: price,

                    thumbnail: option.image || product.thumbnail,
                    price: option.price,
                    salePrice: option.salePrice,
                    minPrice: price, // giá thấp nhất (salePrice nếu có, không thì price)
 main
                    stockQuantity: option.stockQuantity,
                    inStock: option.stockQuantity > 0,
                };
            });

        return sendResponse(res, 200, "Lấy danh sách sản phẩm thành công", {
            products: formattedProducts,
        });
    } catch (error) {
        console.error("Error in getProductsForAI:", error);
        return sendResponse(res, 500, "Lỗi khi lấy danh sách sản phẩm");
    }
};

export const getReviewsForAI = async (req, res) => {
    try {
        const { search } = req.query;
        const searchTerm = search?.trim().toLowerCase() || "";

        let whereCondition = {};

        if (searchTerm) {
            whereCondition = {
                OR: [
                    { comment: { contains: searchTerm, mode: "insensitive" } },
                    { product: { name: { contains: searchTerm, mode: "insensitive" } } },
                ],
            };
        }

        const reviews = await prisma.review.findMany({
            where: whereCondition,
            select: {
                reviewId: true,
                productId: true,
                rating: true,
                comment: true,
                product: {
                    select: {
                        productId: true,
                        name: true,
                    },
                },
            },
            take: 5,
            orderBy: {
                createdAt: "desc",
            },
        });

        return sendResponse(res, 200, "Lấy danh sách reviews thành công", {
            reviews: reviews,
        });
    } catch (error) {
        console.error("Error in getReviewsForAI:", error);
        return sendResponse(res, 500, "Lỗi khi lấy danh sách reviews");
    }
};

