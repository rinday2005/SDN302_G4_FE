import api from "./api";

export interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  type?: string;
}

export interface ShopOwnerInfo {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
  address?: {
    province?: string;
    district?: string;
    ward?: string;
    detail?: string;
  };
}

export interface RentalProductApi {
  _id: string;
  name: string;
  description?: string;
  categoryId: CategoryInfo | string;
  ownerId: ShopOwnerInfo | string;
  pricePerDay: number;
  depositAmount: number;
  images: string[];
  condition: string;
  rentalRules?: string;
  location: string;
  status: string;
  totalQuantity: number;
  category?: CategoryInfo | string;
  size?: string;
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const getPublicRentProductsApi = async (params?: {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<RentalProductApi[]> => {
  try {
    const res = await api.get("/rent/products", { params });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload?.products && Array.isArray(payload.products)) {
      return payload.products;
    }
    return [];
  } catch (error) {
    console.warn("Could not fetch rent products from backend:", error);
    return [];
  }
};

export const getPublicRentProductDetailApi = async (
  id: string
): Promise<{ product: RentalProductApi; availability?: unknown } | null> => {
  try {
    const res = await api.get(`/rent/products/${id}`);
    const data = res.data?.data || res.data;
    return data || null;
  } catch (error) {
    console.warn(`Could not fetch rent product detail ${id}:`, error);
    return null;
  }
};

export const getShopRentProductsApi = async (): Promise<RentalProductApi[]> => {
  try {
    const res = await api.get("/rent/products/shop/mine");
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    return [];
  } catch (error) {
    console.warn("Could not fetch shop rent products from backend:", error);
    return [];
  }
};

export const createRentProductApi = async (
  data: Partial<RentalProductApi>
): Promise<RentalProductApi> => {
  const res = await api.post("/rent/products", data);
  return res.data?.data || res.data;
};

export const updateRentProductApi = async (
  id: string,
  data: Partial<RentalProductApi>
): Promise<RentalProductApi> => {
  const res = await api.put(`/rent/products/${id}`, data);
  return res.data?.data || res.data;
};

export const deleteRentProductApi = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  const res = await api.delete(`/rent/products/${id}`);
  return res.data;
};

export default {
  getPublicRentProductsApi,
  getPublicRentProductDetailApi,
  getShopRentProductsApi,
  createRentProductApi,
  updateRentProductApi,
  deleteRentProductApi,
};

