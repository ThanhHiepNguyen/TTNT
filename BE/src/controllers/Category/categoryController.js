import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";

export const getAllCategory = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                categoryId: true,
                name: true,
                description: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return sendResponse(res, 200, "Lấy danh sách category thành công", { categories });
    } catch (err) {
        console.error("Error getAllCategory", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const sortOrder = req.query.sortBy === "asc" ? "asc" : "desc";

        const category = await prisma.category.findUnique({
            where: { categoryId },
            select: {
                categoryId: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!category) {
            return sendResponse(res, 404, "Category không tồn tại");
        }


        const totalProducts = await prisma.product.count({
            where: { categoryId },
        });


        const products = await prisma.product.findMany({
            where: { categoryId },
            select: {
                productId: true,
                name: true,
                description: true,
                categoryId: true,
                thumbnail: true,
                createdAt: true,
                options: {
                    where: { isActive: true },
                    select: {
                        optionId: true,
                        productId: true,
                        color: true,
                        version: true,
                        price: true,
                        salePrice: true,
                        discountPercent: true,
                        stockQuantity: true,
                        sku: true,
                        image: true,
                        isActive: true,
                        createdAt: true,
                    },
                    orderBy: { price: sortOrder },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit,
        });


        const totalPages = Math.ceil(totalProducts / limit);

        return sendResponse(res, 200, "Lấy category thành công", {
            category,
            products,
            pagination: {
                total: totalProducts,
                page: page,
                limit: limit,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error("Error getCategoryById:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return sendResponse(res, 400, "Vui lòng nhập tên danh mục");
        }

        const existingCatergoty = await prisma.category.findFirst({
            where: { name },
        });

        if (existingCatergoty) {
            return sendResponse(res, 409, "Tên danh mục đã tồn tại");
        }
        const category = await prisma.category.create({
            data: { name, description },
            select: {
                categoryId: true,
                name: true,
                description: true,
                createdAt: true,
            },
        });
        return sendResponse(res, 201, "Tạo Thành công danh mục", { category });
    } catch (err) {
        console.log(`Error createCatergory `, err);
        return sendResponse(res, 500, "Lỗi Server!");
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { categoryId } = req.params;

        if (!name && !description) {
            return sendResponse(res, 400, "Không có dữ liệu để cập nhật");
        }

        const existingCatergoty = await prisma.category.findUnique({
            where: { categoryId },
        });

        if (!existingCatergoty) {
            return sendResponse(res, 404, "Category không tồn tại");
        }

        if (name) {
            const duplicate = await prisma.category.findFirst({
                where: { name, NOT: { categoryId } },
            });
            if (duplicate) {
                return sendResponse(res, 409, "Tên danh mục đã tồn tại");
            }
        }

        const category = await prisma.category.update({
            where: { categoryId },
            data: {
                name: name ?? existingCatergoty.name,
                description: description ?? existingCatergoty.description,
            },
            select: {
                categoryId: true,
                name: true,
                description: true,
                createdAt: true,
            },
        });

        return sendResponse(res, 200, "Update thành công category", { category });
    } catch (err) {
        console.log(`Error updateCatergory `, err);
        return sendResponse(res, 500, "Lỗi Server!");
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await prisma.category.findUnique({
            where: { categoryId },
            select: { categoryId: true },
        });

        if (!category) {
            return sendResponse(res, 404, "Category không tồn tại");
        }

        const products = await prisma.product.findMany({
            where: { categoryId },
            select: { productId: true },
        });

        const productIds = products.map((product) => product.productId);


        await prisma.$transaction(async (prismaClient) => {

            if (productIds.length > 0) {
                await prismaClient.review.deleteMany({
                    where: {
                        productId: { in: productIds },
                    },
                });

                await prismaClient.productOption.deleteMany({
                    where: {
                        productId: { in: productIds },
                    },
                });

                await prismaClient.orderItem.deleteMany({
                    where: {
                        productId: { in: productIds },
                    },
                });

                await prismaClient.product.deleteMany({
                    where: { categoryId },
                });
            }

            await prismaClient.category.delete({
                where: { categoryId },
            });
        });

        return sendResponse(res, 200, "Xóa thành công category");
    } catch (err) {
        console.log(`Error deleteCategory `, err);
        return sendResponse(res, 500, "Lỗi Server!");
    }
};