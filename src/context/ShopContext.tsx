import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockRentProducts } from '../pages/data/shop/rentProductsData';
import { AuthContext } from './auth-context';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

// Thêm module augmentation để ép TypeScript hiểu User có name và username
// (Giúp fix lỗi ở cả file header.tsx)
declare module './auth-context' {
  interface User {
    id?: string;
    name?: string;
    username?: string;
  }
}

// Định nghĩa kiểu dữ liệu trực tiếp tại đây để tránh lỗi Vite Type Import
export interface RentProductItem {
  sku: string;
  name: string;
  category: string;
  brand: string;
  mountSensor?: string;
  pricePerDay: number;
  deposit: number;
  replacementValue?: number;
  totalUnits: number;
  readyUnits: number;
  rentingUnits: number;
  inspectionUnits?: number;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
  approvalDate?: string;
  rejectionReason?: string;
  coverImage: string;
  inspectionImages?: string[];
  description?: string;
  accessoriesIncluded?: string;
  minDays?: number;
  maxDays?: number;
}

export interface ShopProductItem extends RentProductItem {
  ownerId: string;
  isVisible: boolean; // Dùng cho tính năng Ẩn / Hiện
  maintenanceUnits: number; // Nghiệp vụ bảo trì
  convertedToThrift?: boolean;
  thriftListingId?: string;
}

interface ShopContextType {
  products: ShopProductItem[];
  addProduct: (data: Omit<ShopProductItem, 'ownerId' | 'approvalStatus' | 'isVisible'>) => void;
  updateProduct: (sku: string, data: Partial<ShopProductItem>) => void;
  deleteProduct: (sku: string) => void;
  toggleVisibility: (sku: string) => void;
  updateMaintenanceUnits: (sku: string, newMaintenance: number) => { success: boolean; message?: string };
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_KEY = 'REUSE_HUB_RENT_PRODUCTS_STORE_V1';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  // Do ta đã khai báo mở rộng module ở trên, TS sẽ không báo lỗi username nữa
  const currentOwnerId = auth?.user?.id || auth?.user?.username || 'OWNER-01';

  const [products, setProducts] = useState<ShopProductItem[]>(() => {
    const defaultProducts = (mockRentProducts as unknown as RentProductItem[]).map((p) => ({
      ...p,
      ownerId: 'OWNER-01',
      isVisible: true,
      maintenanceUnits: p.inspectionUnits || 0,
    }));

    const saved = safeGetItem<ShopProductItem[] | null>(STORAGE_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return defaultProducts;
  });

  // Tự động đồng bộ vào localStorage an toàn, chống QuotaExceededError
  useEffect(() => {
    safeSetItem(STORAGE_KEY, products, { cleanLargeBase64: true });
  }, [products]);

  // Lọc sản phẩm thuộc về Shop Owner hiện tại
  const ownerProducts = products.filter((p) => p.ownerId === currentOwnerId || p.ownerId === 'OWNER-01');

  // Thêm mới
  const addProduct = (data: Omit<ShopProductItem, 'ownerId' | 'approvalStatus' | 'isVisible'>) => {
    const newProduct: ShopProductItem = {
      ...data,
      ownerId: currentOwnerId,
      approvalStatus: 'PENDING',
      isVisible: true,
      maintenanceUnits: 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Cập nhật
  const updateProduct = (sku: string, data: Partial<ShopProductItem>) => {
    setProducts((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, ...data } : item))
    );
  };

  // Xóa
  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((item) => item.sku !== sku));
  };

  // Ẩn / Hiện
  const toggleVisibility = (sku: string) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  // Cập nhật số máy bảo trì
  const updateMaintenanceUnits = (sku: string, newMaintenance: number) => {
    const target = products.find((p) => p.sku === sku);
    if (!target) return { success: false, message: 'Không tìm thấy sản phẩm' };

    if (newMaintenance < 0) {
      return { success: false, message: 'Số lượng bảo trì không thể nhỏ hơn 0' };
    }

    if (newMaintenance > target.totalUnits) {
      return {
        success: false,
        message: `Số lượng bảo trì (${newMaintenance}) không được vượt quá tổng tồn kho (${target.totalUnits} máy)`,
      };
    }

    const remainingReady = target.totalUnits - target.rentingUnits - newMaintenance;
    if (remainingReady < 0) {
      return {
        success: false,
        message: `Không đủ máy khả dụng! Đang có ${target.rentingUnits} máy đang thuê, số bảo trì tối đa chỉ được ${
          target.totalUnits - target.rentingUnits
        }`,
      };
    }

    setProducts((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? {
              ...item,
              maintenanceUnits: newMaintenance,
              readyUnits: remainingReady,
            }
          : item
      )
    );

    return { success: true };
  };

  return (
    <ShopContext.Provider
      value={{
        products: ownerProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleVisibility,
        updateMaintenanceUnits,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop phải được sử dụng bên trong ShopProvider');
  }
  return context;
};