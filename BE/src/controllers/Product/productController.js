import { prisma } from "../../config/db.js";
import { sendResponse } from "../../utils/response.js";
import { calculateDiscountFromSalePrice, validateOption } from "../../services/productServices.js";

export const getAllProducts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
        const skip = (page - 1) * limit;

        const search = (req.query.search || "").trim();
        const categoryId = req.query.categoryId;
        const sortBy = req.query.sortBy || "desc";
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

        const where = {
            ...(categoryId ? { categoryId } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };


        const total = await prisma.product.count({ where });


        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                productId: true,
                name: true,
                description: true,
                categoryId: true,
                thumbnail: true,
                createdAt: true,
                updatedAt: true,
                category: {
                    select: {
                        categoryId: true,
                        name: true,
                    },
                },
                options: {
                    where: { isActive: true },
                    select: {
                        optionId: true,
                        price: true,
                        salePrice: true,
                        stockQuantity: true,
                        image: true,
                    },
                    orderBy: sortBy === "asc" ? { price: "asc" } : { price: "desc" },
                },
            },
        });


        const processedProducts = products
            .map((product) => {
                if (!product.options || product.options.length === 0) {
                    return null;
                }


                const prices = product.options
                    .map((opt) => opt.salePrice || opt.price)
                    .filter((p) => p !== null && p !== undefined);

                if (prices.length === 0) {
                    return null;
                }

                const minProductPrice = Math.min(...prices);
                const maxProductPrice = Math.max(...prices);


                if (minPrice !== null && maxProductPrice < minPrice) {
                    return null;
                }
                if (maxPrice !== null && minProductPrice > maxPrice) {
                    return null;
                }


                const cheapestOption = product.options.reduce((min, opt) => {
                    const optPrice = opt.salePrice || opt.price;
                    const minPrice = min.salePrice || min.price;
                    return optPrice < minPrice ? opt : min;
                });

                return {
                    productId: product.productId,
                    name: product.name,
                    description: product.description,
                    categoryId: product.categoryId,
                    category: product.category,
                    thumbnail: product.thumbnail || cheapestOption.image,
                    price: cheapestOption.price,
                    salePrice: cheapestOption.salePrice,
                    minPrice: minProductPrice,
                    maxPrice: maxProductPrice,
                    inStock: product.options.some((opt) => opt.stockQuantity > 0),
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                };
            })
            .filter((p) => p !== null);

        const totalPages = Math.ceil(total / limit);

        return sendResponse(res, 200, "Lấy danh sách sản phẩm thành công", {
            products: processedProducts,
            pagination: {
                total: processedProducts.length,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error("Error getAllProducts:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId;

        const product = await prisma.product.findUnique({
            where: { productId: productId },
            select: {
                productId: true,
                name: true,
                description: true,
                categoryId: true,
                thumbnail: true,
                createdAt: true,
                updatedAt: true,
                category: {
                    select: {
                        categoryId: true,
                        name: true,
                        description: true,
                    },
                },
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
                        updatedAt: true,
                    },
                },
            },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        return sendResponse(res, 200, "Lấy sản phẩm thành công", { product });
    } catch (err) {
        console.error("Error getProductById:", err);
        return sendResponse(res, 500, "Lỗi server");
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, description, categoryId, thumbnail, options, deleteOptionIds } = req.body;

        if (
            name === undefined &&
            description === undefined &&
            categoryId === undefined &&
            thumbnail === undefined &&
            options === undefined &&
            deleteOptionIds === undefined
        ) {
            return sendResponse(res, 400, "Không có dữ liệu để cập nhật");
        }

        const existingProduct = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true, categoryId: true },
        });

        if (!existingProduct) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        if (categoryId !== undefined && categoryId !== null) {
            const category = await prisma.category.findUnique({ where: { categoryId } });
            if (!category) {
                return sendResponse(res, 404, "Danh mục không tồn tại");
            }
        }

        if (options !== undefined && !Array.isArray(options)) {
            return sendResponse(res, 400, "Options phải là mảng");
        }

        if (deleteOptionIds !== undefined && !Array.isArray(deleteOptionIds)) {
            return sendResponse(res, 400, "deleteOptionIds phải là mảng");
        }

        if (Array.isArray(options) && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                try {
                    validateOption(options[i], i);
                } catch (err) {
                    return sendResponse(res, err.status || 400, err.message);
                }
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            if (name !== undefined || description !== undefined || categoryId !== undefined || thumbnail !== undefined) {
                await tx.product.update({
                    where: { productId },
                    data: {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(categoryId !== undefined ? { categoryId } : {}),
                        ...(thumbnail !== undefined ? { thumbnail } : {}),
                    },
                });
            }

            if (Array.isArray(deleteOptionIds) && deleteOptionIds.length > 0) {
                const optionIdsToDeactivate = [];
                const optionIdsToDelete = [];

                for (const optionId of deleteOptionIds) {
                    const used = await tx.orderItem.findFirst({
                        where: { optionId },
                        select: { orderItemId: true },
                    });

                    if (used) {
                        optionIdsToDeactivate.push(optionId);
                    } else {
                        optionIdsToDelete.push(optionId);
                    }
                }

                if (optionIdsToDeactivate.length > 0) {
                    await tx.productOption.updateMany({
                        where: { optionId: { in: optionIdsToDeactivate }, productId },
                        data: { isActive: false },
                    });
                }

                if (optionIdsToDelete.length > 0) {
                    await tx.productOption.deleteMany({
                        where: { optionId: { in: optionIdsToDelete }, productId },
                    });
                }

                const remainingActiveOptions = await tx.productOption.count({
                    where: { productId, isActive: true },
                });

                if (remainingActiveOptions === 0) {
                    await tx.review.deleteMany({ where: { productId } });
                    await tx.productOption.deleteMany({ where: { productId } });
                    await tx.orderItem.deleteMany({ where: { productId } });
                    await tx.product.delete({ where: { productId } });
                    return { deleted: true };
                }
            }

            if (Array.isArray(options) && options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    const resolvedSale = calculateDiscountFromSalePrice(option.price, option.salePrice);

                    await tx.productOption.create({
                        data: {
                            productId,
                            color: option.color ?? null,
                            version: option.version ?? null,
                            price: option.price,
                            salePrice: resolvedSale.salePrice,
                            discountPercent: resolvedSale.discountPercent,
                            stockQuantity: option.stockQuantity,
                            sku: option.sku ?? null,
                            image: option.image,
                            isActive: true,
                        },
                    });
                }
            }

            return await tx.product.findUnique({
                where: { productId },
                select: {
                    productId: true,
                    name: true,
                    description: true,
                    categoryId: true,
                    thumbnail: true,
                    createdAt: true,
                    updatedAt: true,
                    category: {
                        select: {
                            categoryId: true,
                            name: true,
                        },
                    },
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
                            updatedAt: true,
                        },
                    },
                },
            });
        });

        if (result.deleted) {
            return sendResponse(res, 200, "Xóa sản phẩm thành công (do chỉ còn 1 option và đã xóa option đó)");
        }

        return sendResponse(res, 200, "Cập nhật sản phẩm thành công", { product: result });
    } catch (err) {
        console.error("Error updateProduct:", err);
        if (err.status) {
            return sendResponse(res, err.status, err.message);
        }
        if (err.code === "P2002") {
            return sendResponse(res, 409, "SKU đã tồn tại hoặc dữ liệu bị trùng lặp");
        }
        return sendResponse(res, 500, "Lỗi Server!");
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await prisma.product.findUnique({
            where: { productId },
            select: { productId: true },
        });

        if (!product) {
            return sendResponse(res, 404, "Sản phẩm không tồn tại");
        }

        await prisma.$transaction(async (tx) => {
            await tx.review.deleteMany({ where: { productId } });
            await tx.productOption.deleteMany({ where: { productId } });
            await tx.orderItem.deleteMany({ where: { productId } });
            await tx.product.delete({ where: { productId } });
        });

        return sendResponse(res, 200, "Xóa sản phẩm thành công");
    } catch (err) {
        console.error("Error deleteProduct:", err);
        return sendResponse(res, 500, "Lỗi Server!");
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, categoryId, thumbnail, options } = req.body;

        if (!name) {
            return sendResponse(res, 400, "Vui lòng nhập tên sản phẩm");
        }
        if (!description) {
            return sendResponse(res, 400, "Vui lòng nhập mô tả sản phẩm");
        }
        if (!categoryId) {
            return sendResponse(res, 400, "Vui lòng chọn danh mục sản phẩm");
        }

        const category = await prisma.category.findUnique({
            where: { categoryId },
        });

        if (!category) {
            return sendResponse(res, 404, "Danh mục không tồn tại");
        }

        if (!options || !Array.isArray(options) || options.length === 0) {
            return sendResponse(res, 400, "Mỗi sản phẩm phải có ít nhất 1 option (phiên bản)");
        }


        for (let i = 0; i < options.length; i++) {
            try {
                validateOption(options[i], i);
                if (options[i].salePrice !== undefined && options[i].salePrice !== null) {
                    calculateDiscountFromSalePrice(options[i].price, options[i].salePrice);
                }
            } catch (err) {
                return sendResponse(res, err.status || 400, err.message);
            }
        }


        const product = await prisma.$transaction(async (prismaClient) => {

            const newProduct = await prismaClient.product.create({
                data: {
                    name,
                    description,
                    categoryId,
                    thumbnail: thumbnail,
                },
                select: {
                    productId: true,
                    name: true,
                    description: true,
                    categoryId: true,
                    thumbnail: true,
                    createdAt: true,
                },
            });

            await prismaClient.productOption.createMany({
                data: options.map((option) => {
                    const resolvedSale = calculateDiscountFromSalePrice(option.price, option.salePrice);
                    return {
                        productId: newProduct.productId,
                        color: option.color || null,
                        version: option.version || null,
                        price: option.price,
                        salePrice: resolvedSale.salePrice,
                        discountPercent: resolvedSale.discountPercent,
                        stockQuantity: option.stockQuantity,
                        sku: option.sku || null,
                        image: option.image,
                        isActive: true,
                    };
                }),
            });


            return await prismaClient.product.findUnique({
                where: { productId: newProduct.productId },
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
                    },
                },
            });
        });

        return sendResponse(res, 201, "Tạo sản phẩm thành công", { product });
    } catch (err) {
        console.error("Error createProduct:", err);

        if (err.code === "P2002") {
            return sendResponse(res, 409, "SKU đã tồn tại hoặc dữ liệu bị trùng lặp");
        }

        return sendResponse(res, 500, "Lỗi Server!");
    }
};



