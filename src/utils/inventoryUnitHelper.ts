/**
 * Helper sinh biến thể hiện vật và tình trạng vật lý chân thực, khoa học
 * Tránh lặp tên sản phẩm nhiều lần và loại bỏ số liệu "ảo"
 */

export interface UnitVariantInfo {
  variantTag: string; // VD: "Size S • Trắng Lụa Silk"
  variantShort: string; // VD: "Bản Trắng Silk (Size S)"
  conditionGrade: string; // VD: "Mới 99% (Nguyên bản)", "Tốt (92%)", "Đang phục hồi (86%)", "Chuẩn Thrift (79%)"
  conditionScore: number; // 99, 96, 92, 86, 79
  cycleCount: number; // 0, 1, 2, 4, 8
  depreciationRate: string; // "5%", "15%", "25%", "35%", "50%"
  discountPercent: number; // 5, 15, 25, 35, 50
  maintenanceNote?: string;
}

export function getUnitVariantAndCondition(
  productName: string,
  category: string,
  unitIndex: number, // 1-based index: 1, 2, 3...
  totalUnits: number,
  rentingUnits: number,
  maintenanceUnits: number
): UnitVariantInfo {
  const combined = `${productName} ${category}`.toLowerCase();

  // 1. Phân loại biến thể tên / size / màu / mẫu theo ngành hàng
  let variantTag: string;
  let variantShort: string;

  if (combined.includes('dress') || combined.includes('váy') || combined.includes('đầm') || combined.includes('tiệc')) {
    const list = [
      { tag: 'Size S • Trắng Lụa Silk', short: 'Bản Trắng Silk (Size S)' },
      { tag: 'Size M • Đen Velvet Dạ Hội', short: 'Bản Đen Velvet (Size M)' },
      { tag: 'Size L • Xanh Pastel Satin', short: 'Bản Xanh Pastel (Size L)' },
      { tag: 'Size Free • Champagne Limited', short: 'Bản Champagne (Size Free)' },
      { tag: 'Size S • Đỏ Ruby Sang Trọng', short: 'Bản Đỏ Ruby (Size S)' },
    ];
    const picked = list[(unitIndex - 1) % list.length];
    variantTag = picked.tag;
    variantShort = picked.short;
  } else if (combined.includes('sneaker') || combined.includes('giày') || combined.includes('shoe')) {
    const list = [
      { tag: 'Size 40 • Trắng Vintage OG', short: 'Bản Trắng Vintage (Size 40)' },
      { tag: 'Size 41 • Nâu Da Bò Classic', short: 'Bản Nâu Classic (Size 41)' },
      { tag: 'Size 42 • Đen Triple Black', short: 'Bản Đen Triple (Size 42)' },
      { tag: 'Size 43 • Xám Khói Retro', short: 'Bản Xám Retro (Size 43)' },
    ];
    const picked = list[(unitIndex - 1) % list.length];
    variantTag = picked.tag;
    variantShort = picked.short;
  } else if (
    combined.includes('áo khoác') ||
    combined.includes('dạ') ||
    combined.includes('coat') ||
    combined.includes('jacket') ||
    combined.includes('suit') ||
    combined.includes('vest')
  ) {
    const list = [
      { tag: 'Size M • Nâu Camel Wool', short: 'Bản Nâu Camel (Size M)' },
      { tag: 'Size L • Ghi Xám Melange', short: 'Bản Xám Melange (Size L)' },
      { tag: 'Size XL • Đen Than Charcoal', short: 'Bản Đen Than (Size XL)' },
      { tag: 'Size S • Be Sữa Cashmere', short: 'Bản Be Sữa (Size S)' },
    ];
    const picked = list[(unitIndex - 1) % list.length];
    variantTag = picked.tag;
    variantShort = picked.short;
  } else if (
    combined.includes('tent') ||
    combined.includes('lều') ||
    combined.includes('camping') ||
    combined.includes('dã ngoại')
  ) {
    const list = [
      { tag: 'Bản Sand Khaki • Full Cọc Hợp Kim', short: 'Bản Sand Khaki (Full Cọc)' },
      { tag: 'Bản Rừng Thông Olive • Kèm Tăng Mái', short: 'Bản Rừng Thông (Kèm Tăng)' },
      { tag: 'Bản Đảo Rêu • Kèm Thảm Lót Xốp', short: 'Bản Đảo Rêu (Kèm Thảm)' },
    ];
    const picked = list[(unitIndex - 1) % list.length];
    variantTag = picked.tag;
    variantShort = picked.short;
  } else {
    const list = [
      { tag: 'Bản Tiêu Chuẩn • Full Phụ Kiện Gốc', short: 'Bản Tiêu Chuẩn' },
      { tag: 'Bản Nâng Cấp • Kèm Bao Da Bảo Vệ', short: 'Bản Nâng Cấp' },
      { tag: 'Bản Studio Edition • Phụ Kiện Chuyên Dụng', short: 'Bản Studio' },
      { tag: 'Bản Limited Series • Serial Độc Bản', short: 'Bản Limited' },
    ];
    const picked = list[(unitIndex - 1) % list.length];
    variantTag = picked.tag;
    variantShort = picked.short;
  }

  // 2. Xác định trạng thái & số liệu vật lý chân thực (không ảo):
  const isRenting = unitIndex <= rentingUnits;
  const isMaintenance = !isRenting && unitIndex <= rentingUnits + maintenanceUnits;
  const isThriftEligible = !isRenting && !isMaintenance && unitIndex === totalUnits && totalUnits >= 3;

  let conditionGrade: string;
  let conditionScore: number;
  let cycleCount: number;
  let depreciationRate: string;
  let discountPercent: number;
  let maintenanceNote: string;

  if (isRenting) {
    cycleCount = 2 + (unitIndex - 1); // 2, 3, 4 lần thuê
    conditionGrade = 'Tốt (92%)';
    conditionScore = 92;
    depreciationRate = '25%';
    discountPercent = 25;
    maintenanceNote = 'Đang lưu hành trong hợp đồng cho thuê';
  } else if (isMaintenance) {
    cycleCount = 4 + (unitIndex - rentingUnits); // 4, 5 lần thuê
    conditionGrade = 'Đang phục hồi (86%)';
    conditionScore = 86;
    depreciationRate = '35%';
    discountPercent = 35;
    maintenanceNote = 'Đang giặt hấp khử khuẩn & xông hơi phục hồi form';
  } else if (isThriftEligible) {
    cycleCount = 8; // Đạt ngưỡng chuyển Thrift
    conditionGrade = 'Chuẩn Thrift (79%)';
    conditionScore = 79;
    depreciationRate = '50%';
    discountPercent = 50;
    maintenanceNote = 'Khấu hao đạt chuẩn chuyển sàn thanh lý THRIFT';
  } else {
    // Sẵn sàng xuất kho
    const isBrandNew = unitIndex === 1;
    cycleCount = isBrandNew ? 0 : 1;
    conditionGrade = isBrandNew ? 'Mới 99% (Nguyên bản)' : 'Mới 96% (Like New)';
    conditionScore = isBrandNew ? 99 : 96;
    depreciationRate = isBrandNew ? '5%' : '15%';
    discountPercent = isBrandNew ? 5 : 15;
    maintenanceNote = 'Đã khử trùng ozone & niêm phong kho sẵn sàng';
  }

  return {
    variantTag,
    variantShort,
    conditionGrade,
    conditionScore,
    cycleCount,
    depreciationRate,
    discountPercent,
    maintenanceNote,
  };
}
