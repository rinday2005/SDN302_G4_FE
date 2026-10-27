import api from './api';

export interface ReviewUser {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
}

export interface ReviewProductInfo {
  _id: string;
  name?: string;
  title?: string;
  images?: Array<{ src?: string; url?: string } | string>;
}

export interface ReviewItem {
  _id: string;
  orderId: string;
  productId: string | ReviewProductInfo;
  userId: ReviewUser | string;
  rating: number; // 1 to 5
  comment: string;
  images: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
}

export interface ProductReviewsResponse {
  reviews: ReviewItem[];
  ratingSummary: RatingSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  orderId: string;
  productId: string;
  rating: number; // 1 to 5
  comment?: string;
  images?: string[];
}

export interface OrderReviewsResponse {
  orderId: string;
  orderStatus: string;
  reviews: ReviewItem[];
}

/**
 * Upload ảnh cho review (tối đa 5 ảnh theo quy chuẩn hệ thống)
 */
export const uploadReviewImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (
      res.data?.url ||
      res.data?.data?.url ||
      res.data?.data?.secure_url ||
      res.data?.secure_url ||
      res.data?.avatarUrl ||
      ''
    );
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 404) {
      // Fallback endpoint
      const altRes = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return (
        altRes.data?.url ||
        altRes.data?.data?.url ||
        altRes.data?.data?.secure_url ||
        altRes.data?.secure_url ||
        ''
      );
    }
    throw err;
  }
};

/**
 * Lấy danh sách reviews và rating summary của sản phẩm
 * GET /api/reviews/product/:productId
 */
export const getProductReviewsApi = async (
  productId: string,
  page = 1,
  limit = 10
): Promise<ProductReviewsResponse> => {
  try {
    const res = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit },
    });

    const reviews: ReviewItem[] = res.data?.data || res.data?.reviews || [];
    const ratingSummary: RatingSummary = res.data?.ratingSummary || {
      averageRating: 5.0,
      totalReviews: reviews.length,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: reviews.length },
    };
    const pagination = res.data?.pagination || {
      total: reviews.length,
      page,
      limit,
      totalPages: Math.ceil(reviews.length / limit) || 1,
    };

    return {
      reviews,
      ratingSummary,
      pagination,
    };
  } catch (err) {
    console.warn(`[ReviewAPI] Không thể tải reviews cho product ${productId}, sử dụng cache/fallback:`, err);
    // Trả về dữ liệu trống/fallback từ localStorage nếu có
    const localKey = `reviews_product_${productId}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore parse error
      }
    }
    return {
      reviews: [],
      ratingSummary: {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  }
};

/**
 * Gửi đánh giá cho sản phẩm trong đơn hàng
 * POST /api/reviews
 */
export const createReviewApi = async (payload: CreateReviewPayload): Promise<ReviewItem> => {
  const res = await api.post('/reviews', payload);
  const createdReview: ReviewItem = res.data?.data || res.data;

  // Cập nhật bộ nhớ cục bộ để hiển thị ngay lập tức (AC: review thành công hiển thị ngay trong danh sách)
  try {
    const productKey = `reviews_product_${payload.productId}`;
    const orderKey = `reviews_order_${payload.orderId}`;

    // Lưu vào order reviews cache
    const existingOrderReviews: ReviewItem[] = JSON.parse(localStorage.getItem(orderKey) || '[]');
    existingOrderReviews.push(createdReview);
    localStorage.setItem(orderKey, JSON.stringify(existingOrderReviews));

    // Lưu vào product reviews cache
    const existingProductData: ProductReviewsResponse = JSON.parse(
      localStorage.getItem(productKey) || '{"reviews":[],"ratingSummary":{"averageRating":5,"totalReviews":0,"distribution":{"1":0,"2":0,"3":0,"4":0,"5":0}},"pagination":{"total":0,"page":1,"limit":10,"totalPages":1}}'
    );
    existingProductData.reviews = [createdReview, ...existingProductData.reviews.filter((r) => r._id !== createdReview._id)];
    existingProductData.ratingSummary.totalReviews += 1;
    const rKey = payload.rating as keyof RatingDistribution;
    if (existingProductData.ratingSummary.distribution[rKey] !== undefined) {
      existingProductData.ratingSummary.distribution[rKey] += 1;
    }
    // Tính lại rating trung bình
    const totalScore = existingProductData.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    existingProductData.ratingSummary.averageRating = Number((totalScore / existingProductData.reviews.length).toFixed(1));
    existingProductData.pagination.total = existingProductData.reviews.length;
    localStorage.setItem(productKey, JSON.stringify(existingProductData));
  } catch (storageErr) {
    console.warn('[ReviewAPI] Không thể lưu cache review:', storageErr);
  }

  return createdReview;
};

/**
 * Lấy các review đã gửi trong đơn hàng của User
 * GET /api/reviews/order/:orderId
 */
export const getOrderReviewsApi = async (orderId: string): Promise<OrderReviewsResponse> => {
  try {
    const res = await api.get(`/reviews/order/${orderId}`);
    return res.data?.data || res.data;
  } catch (err) {
    console.warn(`[ReviewAPI] Không thể tải reviews cho order ${orderId}, kiểm tra local cache:`, err);
    const orderKey = `reviews_order_${orderId}`;
    const cached = localStorage.getItem(orderKey);
    const reviews: ReviewItem[] = cached ? JSON.parse(cached) : [];
    return {
      orderId,
      orderStatus: 'COMPLETED',
      reviews,
    };
  }
};
