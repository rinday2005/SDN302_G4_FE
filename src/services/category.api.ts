import api from "./api";

export interface CategoryItem {
  _id: string;
  id?: string;
  name: string;
  title?: string;
  slug: string;
  code?: string;
  type?: "RENT" | "THRIFT" | "BOTH" | string;
  market?: "RENT" | "THRIFT" | "COMMON" | string;
  description?: string;
  subtitle?: string;
  image?: string;
  icon?: string;
  inspectionBadge?: string;
  escrowBadge?: string;
  isActive?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  rentItems?: number;
  thriftItems?: number;
  rentCount?: number;
  thriftCount?: number;
  totalItems?: number;
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

export const getCategoryBySlugApi = async (slug: string): Promise<CategoryItem | null> => {
  try {
    const cleanSlug = slug.replace(/^\/categories\//i, "").replace(/^\/+/, "").trim();
    const res = await api.get(`/categories/${encodeURIComponent(cleanSlug)}`);
    const data = res.data?.data || res.data;
    if (data && (data._id || data.slug)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export default {
  getCategoriesApi,
  getCategoryBySlugApi,
};
