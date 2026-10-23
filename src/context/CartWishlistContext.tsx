import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  getCartApi,
  addCartItemApi,
  updateCartItemQuantityApi,
  removeCartItemApi,
} from '../services/cart.api';
import { AuthContext } from './auth-context';
import { resolveWishlistProduct } from '../services/wishlistProductResolver';
import {
  getWishlistApi,
  toggleWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi,
} from '../services/wishlist.api';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  mode?: 'rent' | 'thrift';
  deposit?: number | string;
  location?: string;
  categoryLabel?: string;
  gradeBadge?: string;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
  sourceOrigin?: string;
  sizeOrSpec?: string;
  material?: string;
  warranty?: string;
  vaultOrigin?: string;
  sourceType?: string;
  isUnique?: boolean;
  maxQuantity?: number;
  stock?: number;
  size?: string;
  sizes?: string[];
}

interface CartWishlistContextType {
  wishlist: string[];
  wishlistCount: number;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string, type?: "RENT" | "THRIFT") => boolean;
  addToWishlist: (id: string, type?: "RENT" | "THRIFT") => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;

  cart: CartItem[];
  cartCount: number;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  removeMultipleFromCart: (ids: string[]) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  setCartItems: (items: CartItem[]) => void;
  clearCart: () => void;
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined);

export const CartWishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const currentUserId = auth?.user?._id || auth?.user?.id || 'guest';

  return (
    <CartWishlistProviderInner key={currentUserId} currentUserId={currentUserId}>
      {children}
    </CartWishlistProviderInner>
  );
};

const CartWishlistProviderInner: React.FC<{ children: React.ReactNode; currentUserId: string }> = ({
  children,
  currentUserId,
}) => {
  try {
    localStorage.removeItem('user_wishlist');
    localStorage.removeItem('reuse_hub_wishlist');
  } catch {
    // ignore
  }
  const WISHLIST_KEY = `reuse_hub_wishlist_${currentUserId}`;
  const CART_KEY = `reuse_hub_cart_${currentUserId}`;
  // ── Wishlist State ──
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ── Cart State ──
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (!stored) return [];
      const parsed: CartItem[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => {
        if (!item.image || item.image.trim() === '') {
          const resolved = resolveWishlistProduct(item.id);
          if (resolved?.image) {
            return {
              ...item,
              image: resolved.image,
              title:
                item.title &&
                item.title !== 'Sản phẩm thuê' &&
                item.title !== 'Sản phẩm thanh lý'
                  ? item.title
                  : resolved.title || item.title,
              price: item.price > 0 ? item.price : resolved.price || item.price,
              deposit: item.deposit !== undefined ? item.deposit : resolved.deposit,
              location: item.location || resolved.location,
              categoryLabel: item.categoryLabel || resolved.categoryLabel,
              gradeBadge: item.gradeBadge || resolved.gradeBadge,
            };
          }
        }
        return item;
      });
    } catch {
      return [];
    }
  });

  // Persist Wishlist
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore storage errors
    }
  }, [wishlist, WISHLIST_KEY]);

  // Persist Cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart, CART_KEY]);

  // ── Đồng bộ giỏ hàng từ MongoDB khi người dùng đã đăng nhập ──
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    let isMounted = true;
    // Đồng bộ Wishlist từ MongoDB
    getWishlistApi()
      .then((serverWishlist) => {
        if (!isMounted || !serverWishlist) return;
        if (Array.isArray(serverWishlist.items)) {
          const ids = serverWishlist.items
            .map((item) => {
              const p = item.productId;
              return typeof p === 'object' && p?._id ? String(p._id) : String(p || '');
            })
            .filter(Boolean);
          setWishlist(ids);
        }
      })
      .catch((err) => {
        console.warn('Could not sync wishlist from MongoDB:', err);
      });

    getCartApi()
      .then((serverCart) => {
        if (!isMounted || !serverCart) return;

        // Đọc snapshot giỏ hàng từ localStorage để kế thừa lại ảnh và metadata phong phú
        let localItems: CartItem[] = [];
        try {
          const stored = localStorage.getItem(CART_KEY);
          if (stored) {
            localItems = JSON.parse(stored);
          }
        } catch {
          localItems = [];
        }

        const serverItems: CartItem[] = [];

        // RENT items từ MongoDB
        if (Array.isArray(serverCart.rentItems)) {
          for (const item of serverCart.rentItems) {
            const p = item.productId;
            if (!p) continue;
            const pId = typeof p === 'object' && p._id ? String(p._id) : String(p);
            const resolved = resolveWishlistProduct(pId);
            const existingLocal = localItems.find((c) => String(c.id) === pId);

            const pImages = typeof p === 'object' && Array.isArray(p.images) ? p.images : [];
            const serverImage = pImages[0] || '';
            const finalImage =
              (serverImage && serverImage.trim() !== '' ? serverImage : '') ||
              existingLocal?.image ||
              resolved?.image ||
              '';

            const pName = typeof p === 'object' && p.name ? p.name : '';
            const finalTitle =
              pName && pName !== 'Sản phẩm thuê'
                ? pName
                : existingLocal?.title || resolved?.title || pName || 'Sản phẩm thuê';

            const pPrice =
              typeof p === 'object' && typeof p.pricePerDay === 'number'
                ? p.pricePerDay
                : 0;
            const finalPrice =
              pPrice > 0 ? pPrice : existingLocal?.price || resolved?.price || 0;

            const pDeposit =
              typeof p === 'object' && typeof p.depositAmount === 'number'
                ? p.depositAmount
                : 0;
            const finalDeposit =
              pDeposit > 0 ? pDeposit : existingLocal?.deposit || resolved?.deposit || 0;

            const finalLocation =
              (typeof p === 'object' && p.location) ||
              existingLocal?.location ||
              resolved?.location ||
              'Đà Nẵng';

            const finalCategory =
              existingLocal?.categoryLabel || resolved?.categoryLabel || 'Sản phẩm thuê';

            const finalGrade =
              (typeof p === 'object' && (p.condition || p.gradeBadge)) ||
              existingLocal?.gradeBadge ||
              resolved?.gradeBadge ||
              'Grade A+ (Bench Checked)';

            serverItems.push({
              id: pId,
              title: finalTitle,
              price: finalPrice,
              deposit: finalDeposit,
              quantity: item.quantity || 1,
              mode: 'rent',
              image: finalImage,
              location: finalLocation,
              categoryLabel: finalCategory,
              gradeBadge: finalGrade,
              rentalDays: existingLocal?.rentalDays || 3,
              startDate: existingLocal?.startDate || '2026-11-18',
              endDate: existingLocal?.endDate || '2026-11-21',
              sourceOrigin: existingLocal?.sourceOrigin || 'Nanuk White-Glove Vault',
            });
          }
        }

        // THRIFT items từ MongoDB
        if (Array.isArray(serverCart.thriftItems)) {
          for (const item of serverCart.thriftItems) {
            const p = item.productId;
            if (!p) continue;
            const pId = typeof p === 'object' && p._id ? String(p._id) : String(p);
            const resolved = resolveWishlistProduct(pId);
            const existingLocal = localItems.find((c) => String(c.id) === pId);

            const pImages = typeof p === 'object' && Array.isArray(p.images) ? p.images : [];
            const serverImage = pImages[0] || '';
            const finalImage =
              (serverImage && serverImage.trim() !== '' ? serverImage : '') ||
              existingLocal?.image ||
              resolved?.image ||
              '';

            const pTitle = typeof p === 'object' && p.name ? p.name : '';
            const finalTitle =
              pTitle && pTitle !== 'Sản phẩm thanh lý'
                ? pTitle
                : existingLocal?.title || resolved?.title || pTitle || 'Sản phẩm thanh lý';

            const pPrice =
              typeof p === 'object'
                ? typeof p.price === 'number'
                  ? p.price
                  : typeof p.pricePerDay === 'number'
                  ? p.pricePerDay
                  : 0
                : 0;
            const finalPrice =
              pPrice > 0 ? pPrice : existingLocal?.price || resolved?.price || 0;

            const finalLocation =
              (typeof p === 'object' && p.location) ||
              existingLocal?.location ||
              resolved?.location ||
              'Đà Nẵng';

            const finalCategory =
              existingLocal?.categoryLabel || resolved?.categoryLabel || 'Thanh lý';

            const finalGrade =
              (typeof p === 'object' && (p.condition || p.gradeBadge)) ||
              existingLocal?.gradeBadge ||
              resolved?.gradeBadge ||
              'Grade Mint (98%)';

            serverItems.push({
              id: pId,
              title: finalTitle,
              price: finalPrice,
              deposit: 0,
              quantity: item.quantity || 1,
              mode: 'thrift',
              image: finalImage,
              location: finalLocation,
              categoryLabel: finalCategory,
              gradeBadge: finalGrade,
              vaultOrigin:
                existingLocal?.vaultOrigin || resolved?.origin || 'Provenance Archive Tokyo',
              warranty: existingLocal?.warranty || 'Bảo hành cơ học 12 tháng',
            });
          }
        }

        // Giữ lại các local items không có trên server (nếu là demo items hoặc local non-Mongo IDs)
        const localOnlyItems = localItems.filter(
          (local) => !serverItems.some((s) => String(s.id) === String(local.id))
        );

        const merged = [...serverItems, ...localOnlyItems];
        if (merged.length > 0) {
          setCart(merged);
        }
      })
      .catch((err) => {
        console.warn('Could not sync cart from MongoDB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [CART_KEY]);

  // ── Wishlist Operations ──
  const isWishlisted = useCallback(
    (id: string): boolean => {
      return wishlist.includes(id);
    },
    [wishlist]
  );

  const toggleWishlist = (id: string, type?: "RENT" | "THRIFT"): boolean => {
    let nextState = false;
    setWishlist((prev) => {
      if (prev.includes(id)) {
        nextState = false;
        return prev.filter((item) => item !== id);
      } else {
        nextState = true;
        return [...prev, id];
      }
    });
    // Gọi API đồng bộ với MongoDB
    toggleWishlistApi(id, type).catch((err) => {
      console.warn('Could not toggle wishlist on backend:', err);
    });
    return nextState;
  };

  const addToWishlist = (id: string, type?: "RENT" | "THRIFT") => {
    setWishlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
    addToWishlistApi(id, type).catch((err) => {
      console.warn('Could not add to wishlist on backend:', err);
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item !== id));
    removeFromWishlistApi(id).catch((err) => {
      console.warn('Could not remove from wishlist on backend:', err);
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    clearWishlistApi().catch((err) => {
      console.warn('Could not clear wishlist on backend:', err);
    });
  };

  // ── Cart Operations (Local State + MongoDB API Sync) ──
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    let finalImage = item.image;
    if (!finalImage || finalImage.trim() === '') {
      const resolved = resolveWishlistProduct(item.id);
      if (resolved?.image) {
        finalImage = resolved.image;
      }
    }

    const completeItem: CartItem = {
      ...item,
      image: finalImage,
      quantity: qty,
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => String(c.id) === String(item.id));
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          ...completeItem,
          quantity: next[existingIndex].quantity + qty,
          image: finalImage || next[existingIndex].image,
        };
        return next;
      }
      return [...prev, completeItem];
    });

    // Tự động gọi API Backend lưu vào MongoDB collection carts nếu người dùng đã đăng nhập
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(item.id);
    if (token && isMongoId) {
      addCartItemApi({
        type: item.mode === 'thrift' ? 'THRIFT' : 'RENT',
        productId: item.id,
        quantity: qty,
      }).catch((err) => {
        console.warn('Could not save item to MongoDB Cart collection:', err);
      });
    }
  };

  const removeFromCart = (id: string) => {
    const target = cart.find((c) => c.id === id);
    setCart((prev) => prev.filter((c) => c.id !== id));

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (token && isMongoId) {
      removeCartItemApi(id, target?.mode === 'thrift' ? 'THRIFT' : 'RENT').catch((err) => {
        console.warn('Could not remove item from MongoDB Cart collection:', err);
      });
    }
  };

  const removeMultipleFromCart = (ids: string[]) => {
    setCart((prev) => prev.filter((c) => !ids.includes(c.id)));
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      for (const id of ids) {
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          removeCartItemApi(id).catch(() => {});
        }
      }
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    let targetNewQty = 1;
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const nextQty = c.quantity + delta;
            targetNewQty = nextQty;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter((c): c is CartItem => c !== null)
    );

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    if (token && isMongoId) {
      if (targetNewQty > 0) {
        updateCartItemQuantityApi(id, targetNewQty).catch((err) => {
          console.warn('Could not update quantity in MongoDB Cart collection:', err);
        });
      } else {
        removeCartItemApi(id).catch((err) => {
          console.warn('Could not remove item from MongoDB Cart collection:', err);
        });
      }
    }
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const setCartItems = (items: CartItem[]) => {
    setCart(items);
  };

  const clearCart = () => {
    setCart([]);
  };

  const validWishlist = useMemo(() => {
    return wishlist.filter((id) => resolveWishlistProduct(id) !== null);
  }, [wishlist]);
  const wishlistCount = validWishlist.length;
  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      wishlist,
      wishlistCount,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      removeMultipleFromCart,
      updateCartQuantity,
      updateCartItem,
      setCartItems,
      clearCart,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wishlist, wishlistCount, isWishlisted, cart, cartCount]
  );

  return <CartWishlistContext.Provider value={value}>{children}</CartWishlistContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCartWishlist = (): CartWishlistContextType => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};

export default CartWishlistContext;
