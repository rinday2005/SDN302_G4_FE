/**
 * Helper sinh biến thể hiện vật và tình trạng vật lý chân thực, khoa học
 * Tránh lặp tên sản phẩm nhiều lần và loại bỏ số liệu "ảo"
 */

export interface UnitVariantInfo {
  variantTag: string; // VD: "Size S • Trắng Lụa Silk"
  variantShort: string; // VD: "Bản Trắng Silk (Size S)"
  conditionGrade: string; // VD: "Mới 99% (Nguyên bản)", "Tốt (92%)", "Đang phục hồi (86%)", "Chuẩn Thrift (79%)"
  conditionScore: number; // 99, 96, 92, 86, 79
  cycleCount: number; // 0, 1, 2, 4, 8...
  depreciationRate: string; // "5%", "15%", "25%", "35%", "50%"
  discountPercent: number; // 5, 15, 25, 35, 50
  maintenanceNote?: string;
}

// Hàm băm sinh số ngẫu nhiên có định hướng (pseudo-random deterministic)
// Giúp số liệu giữa các món khác nhau ngẫu nhiên phong phú, nhưng không bị giật/nhảy số khi re-render
function getHashSeed(str: string, salt = 0): number {
  let hash = salt;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
  const seed = getHashSeed(`${productName}_specimen_${unitIndex}`);
  const randBetween = (min: number, max: number, offset = 0) =>
    min + ((seed + offset) % (max - min + 1));

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

  // 2. Xác định trạng thái & số liệu vật lý chân thực, ngẫu nhiên tự nhiên (tránh cứng nhắc cùng 1 số):
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
    // Đang cho thuê: từ 2 đến 6 lần thuê ngẫu nhiên theo món
    cycleCount = randBetween(2, 6, 3 + unitIndex);
    conditionScore = randBetween(91, 94, 7 + unitIndex);
    conditionGrade = `Tốt (${conditionScore}%)`;
    discountPercent = Math.min(35, 18 + cycleCount * 3);
    depreciationRate = `${discountPercent}%`;
    maintenanceNote = 'Đang lưu hành trong hợp đồng cho thuê';
  } else if (isMaintenance) {
    // Đang bảo dưỡng: từ 4 đến 8 lần thuê ngẫu nhiên theo món
    cycleCount = randBetween(4, 8, 11 + unitIndex);
    conditionScore = randBetween(84, 88, 13 + unitIndex);
    conditionGrade = `Đang phục hồi (${conditionScore}%)`;
    discountPercent = Math.min(45, 26 + (cycleCount - 4) * 4);
    depreciationRate = `${discountPercent}%`;
    const notes = [
      'Đang giặt hấp khử khuẩn & xông hơi phục hồi form',
      'Đang bảo dưỡng làm sạch bề mặt chất liệu chuyên sâu',
      'Đang phục hồi đường may & khử mùi khoang kín',
    ];
    maintenanceNote = notes[(seed + unitIndex) % notes.length];
  } else if (isThriftEligible) {
    // Đủ chuẩn Thrift: số lần thuê phân tán tự nhiên (7, 8, 9, 10, 11, 12 lần) thay vì chỉ cố định 8
    cycleCount = randBetween(8, 13, 17 + unitIndex);
    conditionScore = randBetween(75, 82, 19 + unitIndex);
    conditionGrade = `Chuẩn Thrift (${conditionScore}%)`;
    discountPercent = Math.min(65, 45 + (cycleCount - 8) * 3);
    depreciationRate = `${discountPercent}%`;
    const thriftNotes = [
      'Khấu hao đạt chuẩn chuyển sàn thanh lý THRIFT',
      'Vải mềm tự nhiên, đủ điều kiện mở bán lại Thrift',
      'Đã hoàn tất kiểm định thẩm định chuyển đổi sàn',
    ];
    maintenanceNote = thriftNotes[(seed + unitIndex) % thriftNotes.length];
  } else {
    // Sẵn sàng xuất kho: phân tán 0, 1, 2 lần thuê
    const isBrandNew = unitIndex === 1 && seed % 2 === 0;
    cycleCount = isBrandNew ? 0 : randBetween(1, 3, 23 + unitIndex);
    conditionScore = cycleCount === 0 ? randBetween(98, 99, 29) : randBetween(95, 97, 31 + unitIndex);
    conditionGrade = cycleCount === 0 ? 'Mới 100% (Nguyên bản)' : `Mới ${conditionScore}% (Like New)`;
    discountPercent = cycleCount === 0 ? 5 : 8 + cycleCount * 3;
    depreciationRate = `${discountPercent}%`;
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
