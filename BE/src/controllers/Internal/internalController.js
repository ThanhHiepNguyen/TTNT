import { sendResponse } from "../../utils/response.js";
import { prisma } from "../../config/db.js";

export const getProductsForAI = async (req, res) => {
    try {
        const { search } = req.query;
        const searchTerm = search?.trim().toLowerCase() || "";

        let whereCondition = {};

        if (searchTerm) {
            whereCondition = {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
                ],
            };
        }

        const products = await prisma.product.findMany({
            where: whereCondition,
            select: {
                productId: true,
                name: true,
                description: true,
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
                    },
                    orderBy: { price: "asc" },
                    take: 1,
                },
            },
            take: 10,
        });

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
                    price: price,
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

