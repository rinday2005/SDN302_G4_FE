import api from "./api";

export interface WishlistItemApi {
  _id: string;
  productId: string | { _id: string; name?: string; [key: string]: unknown };
  productType: "RENT" | "THRIFT";
  addedAt: string;
}

export interface WishlistResponseApi {
  _id: string;
  userId: string;
  items: WishlistItemApi[];
  totalItems: number;
}

export const getWishlistApi = async (): Promise<WishlistResponseApi | null> => {
  try {
    const res = await api.get("/wishlist");
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn("Could not fetch wishlist from backend:", error);
    return null;
  }
};

export const toggleWishlistApi = async (
  productId: string,
  productType?: "RENT" | "THRIFT"
): Promise<{ isFavorited: boolean; totalItems: number } | null> => {
  try {
    const res = await api.post("/wishlist/toggle", { productId, ...(productType ? { productType } : {}) });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn("Could not toggle wishlist on backend:", error);
    return null;
  }
};

export const addToWishlistApi = async (
  productId: string,
  productType?: "RENT" | "THRIFT"
): Promise<WishlistResponseApi | null> => {
  try {
    const res = await api.post("/wishlist", { productId, ...(productType ? { productType } : {}) });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn("Could not add to wishlist on backend:", error);
    return null;
  }
};

export const removeFromWishlistApi = async (
  productId: string
): Promise<WishlistResponseApi | null> => {
  try {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn("Could not remove from wishlist on backend:", error);
    return null;
  }
};

export const clearWishlistApi = async (): Promise<boolean> => {
  try {
    await api.delete("/wishlist");
    return true;
  } catch (error) {
    console.warn("Could not clear wishlist on backend:", error);
    return false;
  }
};
