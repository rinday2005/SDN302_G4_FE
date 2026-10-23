import api from "./api";

export interface CreateVnPayUrlRequest {
  orderId?: string;
  orderCode?: string;
  amount?: number;
  type?: "RENT" | "THRIFT";
  productId?: string;
  startDate?: string;
  endDate?: string;
  items?: unknown[];
  shippingAddress?: unknown;
  rentalFee?: number;
  depositAmount?: number;
  shippingFee?: number;
}

/**
 * [BE-S3-04] Gọi API Backend để tạo VNPay Sandbox URL
 * Gửi Bearer Token (qua interceptor của api.ts) và { orderId, orderCode, amount, type, productId, startDate, endDate }
 * - Nếu thành công: Chuyển hướng sang VNPay Sandbox
 * - Nếu thất bại: Chuyển hướng sang trang /payment-failed với thông báo lỗi (không dùng alert)
 */
export const handleVNPayPayment = async (
  request: CreateVnPayUrlRequest | string,
  type: "RENT" | "THRIFT" = "RENT"
): Promise<void> => {
  const reqObj: CreateVnPayUrlRequest =
    typeof request === "string" ? { orderId: request, type } : request;

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  const displayCode = reqObj.orderCode || reqObj.orderId || "RH-ORDER";

  if (!token) {
    window.location.href = `/payment-failed?orderCode=${encodeURIComponent(
      displayCode
    )}&message=${encodeURIComponent(
      "Vui lòng đăng nhập tài khoản để thực hiện thanh toán VNPay."
    )}&code=401`;
    return;
  }

  try {
    const res = await api.post("/payments/create-vnpay-url", {
      orderId: reqObj.orderId,
      orderCode: reqObj.orderCode,
      amount: reqObj.amount,
      type: reqObj.type || type,
      productId: reqObj.productId,
      startDate: reqObj.startDate,
      endDate: reqObj.endDate,
      items: reqObj.items,
      shippingAddress: reqObj.shippingAddress,
      rentalFee: reqObj.rentalFee,
      depositAmount: reqObj.depositAmount,
      shippingFee: reqObj.shippingFee,
    });

    // Lấy URL thanh toán và chuyển hướng sang VNPay Sandbox
    const vnpUrl =
      res.data?.vnpUrl ||
      res.data?.data?.vnpUrl ||
      res.data?.paymentUrl ||
      res.data?.data?.paymentUrl;

    if (vnpUrl) {
      window.location.href = vnpUrl;
    } else {
      window.location.href = `/payment-failed?orderCode=${encodeURIComponent(
        displayCode
      )}&message=${encodeURIComponent(
        "Không lấy được đường dẫn thanh toán từ máy chủ Backend."
      )}`;
    }
  } catch (error: unknown) {
    console.error("Lỗi tạo URL thanh toán:", error);
    const err = error as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };

    const errorMessage =
      err.response?.data?.message ||
      (err.response?.status === 401
        ? "Phiên đăng nhập đã hết hạn (Authentication required). Vui lòng đăng nhập lại!"
        : "Không thể tạo liên kết thanh toán VNPay. Vui lòng kiểm tra lại đơn hàng!");

    window.location.href = `/payment-failed?orderCode=${encodeURIComponent(
      displayCode
    )}&message=${encodeURIComponent(errorMessage)}&code=${
      err.response?.status || ""
    }`;
  }
};

/**
 * Alias tương thích cho các component checkout
 */
export const redirectToVnPayGateway = async (
  request: CreateVnPayUrlRequest
): Promise<void> => {
  return handleVNPayPayment(request, request.type || "RENT");
};

export default {
  handleVNPayPayment,
  redirectToVnPayGateway,
};
