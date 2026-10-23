import api from "./api";

export interface CartProductRent {
  _id: string;
  name: string;
  pricePerDay?: number;
  price?: number;
  depositAmount?: number;
  images: string[];
  status: string;
  totalQuantity?: number;
  ownerId?: string;
  location?: string;
  condition?: string;
  gradeBadge?: string;
}

export interface CartItemApi {
  productId: CartProductRent | string;
  quantity: number;
}

export interface CartResponseApi {
  _id: string;
  userId: string;
  rentItems: CartItemApi[];
  thriftItems: CartItemApi[];
  createdAt?: string;
  updatedAt?: string;
}

export const getCartApi = async (): Promise<CartResponseApi | null> => {
  try {
    const res = await api.get("/cart");
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn("Could not fetch cart from backend:", error);
    return null;
  }
};

export const addCartItemApi = async (data: {
  type?: "RENT" | "THRIFT";
  productId: string;
  quantity?: number;
}): Promise<CartResponseApi | null> => {
  const res = await api.post("/cart/items", {
    type: data.type || "RENT",
    productId: data.productId,
    quantity: data.quantity || 1,
  });
  return res.data?.data || res.data || null;
};

export const updateCartItemQuantityApi = async (
  productId: string,
  quantity: number,
  type: "RENT" | "THRIFT" = "RENT"
): Promise<CartResponseApi | null> => {
  const res = await api.patch(`/cart/items/${productId}`, {
    type,
    quantity,
  });
  return res.data?.data || res.data || null;
};

export const removeCartItemApi = async (
  productId: string,
  type: "RENT" | "THRIFT" = "RENT"
): Promise<CartResponseApi | null> => {
  const res = await api.delete(`/cart/items/${productId}`, {
    params: { type },
  });
  return res.data?.data || res.data || null;
};

export default {
  getCartApi,
  addCartItemApi,
  updateCartItemQuantityApi,
  removeCartItemApi,
};
