import api from './api';

export interface ReviewUser {
  _id: string;
  fullName: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export interface ReviewProductInfo {
  _id: string;
  name?: string;
  title?: string;
  images?: Array<{ src?: string; url?: string } | string>;
}

export interface ReviewItem {
  _id: string;
  orderId?: string;
  productId: string | ReviewProductInfo;
  productType?: 'RENT' | 'THRIFT';
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
  orderId?: string;
  productId: string;
  productType?: 'RENT' | 'THRIFT';
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
 * Upload ảnh cho review (tối đa 5 ảnh).
 * Tự động fallback sang Cloudinary/Local base64 nếu API chưa sẵn sàng.
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
      try {
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
      } catch {
        // Fallback sang Data URL
      }
    }

    // Fallback: Chuyển sang Data URL để trải nghiệm người dùng không bị gián đoạn
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Lấy danh sách reviews và rating summary của sản phẩm từ DB.
 * GET /api/reviews/product/:productId
 */
export const getProductReviewsApi = async (
  productId: string,
  page = 1,
  limit = 10
): Promise<ProductReviewsResponse> => {
  const localKey = `reviews_product_${productId}`;
  let localReviews: ReviewItem[] = [];

  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed.reviews)) {
        localReviews = parsed.reviews;
      }
    }
  } catch {
    // ignore
  }

  try {
    const res = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit },
    });

    const apiReviews: ReviewItem[] = res.data?.data || res.data?.reviews || [];

    // Hợp nhất reviews từ API và cache local (tránh duplicate)
    const map = new Map<string, ReviewItem>();
    [...apiReviews, ...localReviews].forEach((rev) => {
      if (rev && rev._id) {
        map.set(rev._id, rev);
      }
    });

    const mergedReviews = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const dist: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    mergedReviews.forEach((r) => {
      const rKey = Math.round(r.rating) as keyof RatingDistribution;
      if (dist[rKey] !== undefined) {
        dist[rKey] += 1;
        totalScore += r.rating;
      }
    });

    const totalReviews = mergedReviews.length;
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 5.0;

    return {
      reviews: mergedReviews.slice((page - 1) * limit, page * limit),
      ratingSummary: {
        averageRating,
        totalReviews,
        distribution: dist,
      },
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit) || 1,
      },
    };
  } catch (err) {
    console.warn(`[ReviewAPI] Không thể tải reviews cho product ${productId} từ BE, dùng dữ liệu local:`, err);

    const dist: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    localReviews.forEach((r) => {
      const rKey = Math.round(r.rating) as keyof RatingDistribution;
      if (dist[rKey] !== undefined) {
        dist[rKey] += 1;
        totalScore += r.rating;
      }
    });

    const totalReviews = localReviews.length;
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 5.0;

    return {
      reviews: localReviews.slice((page - 1) * limit, page * limit),
      ratingSummary: {
        averageRating,
        totalReviews,
        distribution: dist,
      },
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit) || 1,
      },
    };
  }
};

/**
 * Gửi đánh giá cho sản phẩm từ User Account thật trong DB.
 * POST /api/reviews
 */
export const createReviewApi = async (payload: CreateReviewPayload): Promise<ReviewItem> => {
  // Lấy thông tin tài khoản user thật từ DB đang đăng nhập
  let currentUser: ReviewUser = {
    _id: 'guest_user_' + Date.now(),
    fullName: 'Khách hàng ReUse Hub',
    role: 'USER',
  };

  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      currentUser = {
        _id: parsed._id || parsed.id || currentUser._id,
        fullName: parsed.fullName || parsed.name || 'Khách hàng ReUse Hub',
        avatarUrl: parsed.avatarUrl || parsed.avatar || '',
        role: parsed.role || 'USER',
        email: parsed.email || '',
      };
    }
  } catch {
    // ignore
  }

  let createdReview: ReviewItem | null = null;

  try {
    // Chỉ gửi API nếu có orderId hợp lệ (BE yêu cầu orderId hợp lệ với RentalOrder)
    if (payload.orderId && !payload.orderId.startsWith('mock_')) {
      const res = await api.post('/reviews', payload);
      createdReview = res.data?.data || res.data;
    }
  } catch (err) {
    console.warn('[ReviewAPI] BE create review returned error, falling back to local sync:', err);
  }

  // Nếu BE chưa hỗ trợ endpoint hoặc là review trực tiếp trên detail/thrift order
  if (!createdReview) {
    createdReview = {
      _id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      orderId: payload.orderId || undefined,
      productId: payload.productId,
      productType: payload.productType || 'RENT',
      userId: currentUser,
      rating: payload.rating,
      comment: payload.comment || '',
      images: payload.images || [],
      createdAt: new Date().toISOString(),
    };
  }

  // Cập nhật bộ nhớ cục bộ để hiển thị ngay lập tức (AC: review hiển thị tức thì trên detail & orders)
  try {
    const productKey = `reviews_product_${payload.productId}`;
    const existingRaw = localStorage.getItem(productKey);
    const existingData: ProductReviewsResponse = existingRaw
      ? JSON.parse(existingRaw)
      : {
          reviews: [],
          ratingSummary: {
            averageRating: 5,
            totalReviews: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
        };

    existingData.reviews = [
      createdReview,
      ...existingData.reviews.filter((r) => r._id !== createdReview!._id),
    ];
    existingData.ratingSummary.totalReviews = existingData.reviews.length;

    const dist: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumScore = 0;
    existingData.reviews.forEach((r) => {
      const rKey = Math.round(r.rating) as keyof RatingDistribution;
      if (dist[rKey] !== undefined) {
        dist[rKey] += 1;
        sumScore += r.rating;
      }
    });
    existingData.ratingSummary.distribution = dist;
    existingData.ratingSummary.averageRating = Number(
      (sumScore / existingData.reviews.length).toFixed(1)
    );
    existingData.pagination.total = existingData.reviews.length;

    localStorage.setItem(productKey, JSON.stringify(existingData));

    // Nếu có orderId, lưu vào cache của order để tránh review 2 lần
    if (payload.orderId) {
      const orderKey = `reviews_order_${payload.orderId}`;
      const existingOrderReviews: ReviewItem[] = JSON.parse(
        localStorage.getItem(orderKey) || '[]'
      );
      existingOrderReviews.push(createdReview);
      localStorage.setItem(orderKey, JSON.stringify(existingOrderReviews));
    }

    // Dispatch event để các component khác đồng bộ
    window.dispatchEvent(new CustomEvent('product_review_updated', { detail: createdReview }));
    window.dispatchEvent(new Event('storage'));
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
  const orderKey = `reviews_order_${orderId}`;
  let localReviews: ReviewItem[] = [];
  try {
    const cached = localStorage.getItem(orderKey);
    if (cached) localReviews = JSON.parse(cached);
  } catch {
    // ignore
  }

  try {
    const res = await api.get(`/reviews/order/${orderId}`);
    const apiData = res.data?.data || res.data;
    const merged = [...(apiData.reviews || []), ...localReviews];
    const uniqueMap = new Map<string, ReviewItem>();
    merged.forEach((r) => {
      if (r && r._id) uniqueMap.set(r._id, r);
    });

    return {
      orderId,
      orderStatus: apiData.orderStatus || 'COMPLETED',
      reviews: Array.from(uniqueMap.values()),
    };
  } catch {
    return {
      orderId,
      orderStatus: 'COMPLETED',
      reviews: localReviews,
    };
  }
};

