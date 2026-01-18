import crypto from "crypto";
import "dotenv/config";

function createVNPayService() {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secureSecret = process.env.VNPAY_SECURE_SECRET;
    const vnpayHost = process.env.VNPAY_HOST;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const missing = [];

    if (!tmnCode) missing.push('VNPAY_TMN_CODE');
    if (!secureSecret) missing.push('VNPAY_SECURE_SECRET');
    if (!vnpayHost) missing.push('VNPAY_HOST');
    if (!returnUrl) missing.push('VNPAY_RETURN_URL');

    if (missing.length) {
        const message = `Missing VNPay environment variables: ${missing.join(', ')}`;
        console.error('VNPay Service Error:', message);
        console.error('Available env vars:', {
            VNPAY_TMN_CODE: tmnCode ? '***' : 'MISSING',
            VNPAY_SECURE_SECRET: secureSecret ? '***' : 'MISSING',
            VNPAY_HOST: vnpayHost || 'MISSING',
            VNPAY_RETURN_URL: returnUrl || 'MISSING'
        });
        throw new Error(message);
    }
    const hashAlgorithm = (process.env.VNPAY_HASH_ALGORITHM || 'SHA512').toLowerCase();
    const testMode = process.env.VNPAY_TEST_MODE === 'true';

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    const sortObject = (obj) => {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    };

    const createPaymentUrl = async (
        amount,
        txnRef,
        orderInfo = 'Thanh toán đơn hàng',
        clientIp = '127.0.0.1',
        locale = 'vn',
        orderType = 'other',
    ) => {
        try {
            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                throw new Error('Invalid amount value');
            }

            const now = new Date();
            const createDate = formatDate(now);
            const expireDateObj = new Date(now);
            expireDateObj.setMinutes(expireDateObj.getMinutes() + 30);
            const expireDate = formatDate(expireDateObj);

            const vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: tmnCode,
                vnp_Locale: locale,
                vnp_CurrCode: 'VND',
                vnp_TxnRef: txnRef,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: orderType,
                vnp_Amount: Math.round(numericAmount * 100),
                vnp_ReturnUrl: returnUrl,
                vnp_IpAddr: clientIp,
                vnp_CreateDate: createDate,
                vnp_ExpireDate: expireDate,
            };

            const sortedParams = sortObject(vnp_Params);
            const signData = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
                .join('&');

            const hmac = crypto.createHmac(hashAlgorithm, secureSecret);
            const signed = hmac.update(signData).digest('hex');

            vnp_Params.vnp_SecureHash = signed;

            const paymentUrl = `${vnpayHost}?${Object.keys(vnp_Params)
                .map(key => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
                .join('&')}`;

            return paymentUrl;
        } catch (error) {
            console.error('Error generating payment URL:', error);
            throw error;
        }
    };

    const verifyPayment = async (vnpayParams) => {
        try {
            const params = { ...vnpayParams };
            const secureHash = String(params.vnp_SecureHash || '');
            delete params.vnp_SecureHash;
            delete params.vnp_SecureHashType;

            const sortedParams = sortObject(params);
            const signData = Object.keys(sortedParams)
                .map(key => `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, '+')}`)
                .join('&');

            const algo = hashAlgorithm;
            const hmac = crypto.createHmac(algo, secureSecret);
            const signed = hmac.update(signData).digest('hex');

            return signed.toLowerCase() === secureHash.toLowerCase();
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    };

    return { createPaymentUrl, verifyPayment };
}

let vnpayServiceInstance = null;

const getVNPayService = () => {
    if (!vnpayServiceInstance) {
        vnpayServiceInstance = createVNPayService();
    }
    return vnpayServiceInstance;
};

export const createVnpayPaymentUrl = async (orderId, amount, orderInfo = "", ipAddr = "127.0.0.1") => {
    const cleanOrderInfo = (orderInfo || `Thanh toan don hang ${orderId}`)
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .substring(0, 255)
        .trim();

    const service = getVNPayService();
    return await service.createPaymentUrl(
        amount,
        orderId.toString().substring(0, 34),
        cleanOrderInfo,
        ipAddr,
        'vn',
        'other'
    );
};

export const verifyVnpayCallback = async (vnp_Params) => {
    const service = getVNPayService();
    return await service.verifyPayment(vnp_Params);
};
