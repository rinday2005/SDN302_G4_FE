/**
 * Utility tính toán khấu hao và định giá bán THRIFT dựa trên số lần cho thuê
 * 
 * Quy tắc bậc giảm giá khấu hao theo số lần thuê:
 * - Thuê từ 1 đến 3 lần: Giảm 15%
 * - Thuê từ 4 đến 7 lần: Giảm 30%
 * - Thuê từ 8 đến 12 lần: Giảm 45%
 * - Thuê trên 12 lần: Giảm 60%
 * - Thuê 0 lần (hàng xưởng/tồn kho): Giảm 10%
 * 
 * Công thức: thriftPrice = Math.round(originalPrice * (1 - discountPercent / 100))
 */

export interface ThriftDepreciationResult {
  discountPercent: number;
  suggestedPrice: number;
  tierDescription: string;
}

export function calculateThriftDiscount(
  rentalCount: number,
  originalPrice: number
): ThriftDepreciationResult {
  let discountPercent: number;
  let tierDescription: string;

  if (rentalCount > 12) {
    discountPercent = 60;
    tierDescription = 'Bậc 4 (> 12 lần thuê): Khấu hao tối đa 60%';
  } else if (rentalCount >= 8) {
    discountPercent = 45;
    tierDescription = 'Bậc 3 (8 - 12 lần thuê): Khấu hao chuyên sâu 45%';
  } else if (rentalCount >= 4) {
    discountPercent = 30;
    tierDescription = 'Bậc 2 (4 - 7 lần thuê): Khấu hao định kỳ 30%';
  } else if (rentalCount >= 1) {
    discountPercent = 15;
    tierDescription = 'Bậc 1 (1 - 3 lần thuê): Khấu hao trải nghiệm 15%';
  } else {
    discountPercent = 10;
    tierDescription = 'Chưa qua thuê: Giảm 10% mở bán Thrift';
  }

  // Làm tròn giá trị đến hàng nghìn gần nhất (ví dụ 1.250.000)
  const rawPrice = originalPrice * (1 - discountPercent / 100);
  const suggestedPrice = Math.max(0, Math.round(rawPrice / 1000) * 1000);

  return {
    discountPercent,
    suggestedPrice,
    tierDescription,
  };
}

export function parseVndPrice(priceStr: string | number | undefined): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  // Loại bỏ ký tự không phải số
  const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatVndPrice(price: number): string {
  return `${price.toLocaleString('vi-VN')} ₫`;
}
