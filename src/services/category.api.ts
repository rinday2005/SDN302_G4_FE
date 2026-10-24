import api from "./api";

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  type?: "RENT" | "THRIFT" | "BOTH" | string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getCategoriesApi = async (): Promise<CategoryItem[]> => {
  try {
    const res = await api.get("/categories");
    const data = res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn("Failed to fetch categories:", err);
    return [];
  }
};

export default {
  getCategoriesApi,
};
