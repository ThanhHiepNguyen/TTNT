import { throwHttpError } from "../utils/response.js";

export const calculateDiscountFromSalePrice = (price, salePrice) => {
    if (salePrice === undefined || salePrice === null) {
        return { salePrice: null, discountPercent: null };
    }

    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
        throwHttpError(400, "price phải > 0");
    }

    const salePriceNum = Number(salePrice);
    if (Number.isNaN(salePriceNum) || salePriceNum <= 0) {
        throwHttpError(400, "Giá sau giảm (salePrice) phải > 0");
    }

    if (salePriceNum >= priceNum) {
        throwHttpError(400, "Giá sau giảm phải nhỏ hơn giá gốc");
    }

    const discountAmount = priceNum - salePriceNum;
    const discountPercent = Math.round((discountAmount / priceNum) * 100 * 100) / 100;

    return {
        salePrice: salePriceNum,
        discountPercent: discountPercent,
    };
};

export const validateOption = (option, index) => {
    if (!option.price || option.price <= 0) {
        throwHttpError(400, `Option thứ ${index + 1}: Giá (price) là bắt buộc và phải > 0`);
    }

    if (option.discountPercent !== undefined && option.discountPercent !== null) {
        throwHttpError(400, `Option thứ ${index + 1}: Vui lòng chỉ nhập salePrice (giá sau giảm), không nhập discountPercent`);
    }

    if (option.discountAmount !== undefined && option.discountAmount !== null) {
        throwHttpError(400, `Option thứ ${index + 1}: Vui lòng chỉ nhập salePrice (giá sau giảm), không nhập discountAmount`);
    }

    if (option.salePrice !== undefined && option.salePrice !== null) {
        const salePriceNum = Number(option.salePrice);
        if (Number.isNaN(salePriceNum) || salePriceNum <= 0) {
            throwHttpError(400, `Option thứ ${index + 1}: Giá sau giảm (salePrice) phải > 0`);
        }
        if (salePriceNum >= option.price) {
            throwHttpError(400, `Option thứ ${index + 1}: Giá sau giảm phải nhỏ hơn giá gốc`);
        }
    }

    if (!option.image || typeof option.image !== "string" || option.image.trim() === "") {
        throwHttpError(400, `Option thứ ${index + 1}: Ảnh (image) là bắt buộc`);
    }

    if (option.stockQuantity === undefined || option.stockQuantity < 0) {
        throwHttpError(400, `Option thứ ${index + 1}: Số lượng tồn kho (stockQuantity) là bắt buộc và phải >= 0`);
    }
};

