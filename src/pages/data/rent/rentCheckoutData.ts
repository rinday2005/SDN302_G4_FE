export interface CheckoutRentItem {
  id: string;
  code: string;
  title: string;
  category: string;
  grade: string;
  image: string;
  price: number;
  deposit: number;
  quantity: number;
  accessories: string;
  packagingNote: string;
  vaultOrigin: string;
}

export const DEFAULT_CHECKOUT_RENT_ITEMS: CheckoutRentItem[] = [];

export const NANUK_SHIPPING_FEE = 150000;
