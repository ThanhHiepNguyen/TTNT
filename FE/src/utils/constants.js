export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Chờ xử lý",
  [ORDER_STATUS.PROCESSING]: "Đang xử lý",
  [ORDER_STATUS.SHIPPING]: "Đang giao hàng",
  [ORDER_STATUS.DELIVERED]: "Đã giao hàng",
  [ORDER_STATUS.CANCELLED]: "Đã hủy",
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [ORDER_STATUS.PROCESSING]: "bg-blue-100 text-blue-800",
  [ORDER_STATUS.SHIPPING]: "bg-purple-100 text-purple-800",
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-800",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD = {
  COD: "COD",
  VNPAY: "VNPAY",
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.COD]: "Thanh toán khi nhận hàng",
  [PAYMENT_METHOD.VNPAY]: "VNPay",
};

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.UNPAID]: "Chưa thanh toán",
  [PAYMENT_STATUS.PAID]: "Đã thanh toán",
  [PAYMENT_STATUS.REFUNDED]: "Đã hoàn tiền",
  [PAYMENT_STATUS.FAILED]: "Thanh toán thất bại",
};

