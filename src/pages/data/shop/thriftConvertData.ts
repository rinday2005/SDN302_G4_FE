import { getUnitVariantAndCondition } from '../../../utils/inventoryUnitHelper';

export interface GalleryImage {
  id: string;
  url: string;
  label: string;
}

export interface ThriftConvertData {
  unitId: string;
  sku: string;
  title: string;
  category: string;
  condition: string;
  price: string;
  originalPrice?: string;
  depreciationText?: string;
  description: string;
  heroImage: string;
  images: GalleryImage[];
  status: 'ELIGIBLE' | 'PENDING_APPROVAL' | 'CONVERTED_TO_THRIFT' | 'REJECTED';
  rejectionReason?: string;
  convertedAt?: string;
  currentRentStatus: 'COMPLETED' | 'RENTING';
  hasFutureBooking: boolean;
  serialNumber: string;
  cycleCount: number;
  daysRented: number;
  totalRevenue: string;
  sourceTag: string;
  inspectorName: string;
  certificateCode: string;
  hashProof: string;
  recentOrderCode?: string;
  recentCustomer?: string;
}

export interface ConvertibleSpecimenProfile {
  id: string;
  sku: string;
  productName: string;
  category: string;
  serialNumber: string;
  conditionGrade: string;
  cycleCount: number;
  daysRented: number;
  totalRevenue: string;
  depreciationRate: string;
  price: string;
  originalPrice: string;
  depreciationText: string;
  status: 'ELIGIBLE' | 'RENTING' | 'FUTURE_BOOKING' | 'PENDING_APPROVAL';
  currentRentStatus: 'COMPLETED' | 'RENTING';
  hasFutureBooking: boolean;
  recentOrderCode: string;
  recentCustomer: string;
  location: string;
  curatorName: string;
  certificateCode: string;
  hashProof: string;
  description: string;
  heroImage: string;
  images: GalleryImage[];
}

export const SPECIMEN_PROFILES: Record<string, ConvertibleSpecimenProfile> = {
  'INV-DRES-04': {
    id: 'INV-DRES-04',
    sku: 'DRES-MINI-01',
    productName: 'Party Dress Thiết Kế Tối Giản - Bản Champagne (Size Free)',
    category: 'Thời trang RENT / Đầm Dạ Hội',
    serialNumber: '#SN-DRES-004',
    conditionGrade: 'Chuẩn Thrift 79.0%',
    cycleCount: 9,
    daysRented: 45,
    totalRevenue: '6.480.000 ₫',
    depreciationRate: '50.0%',
    price: '400.000 ₫',
    originalPrice: '800.000 ₫',
    depreciationText: 'Khấu hao -50% so với giá gốc (800.000 ₫)',
    status: 'ELIGIBLE',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-DRES-04',
    recentCustomer: 'Trần Thị Thu Thảo',
    location: 'Kho lưu trữ tiêu chuẩn, ReUse Care Hub, Quận 1, TP. HCM',
    curatorName: 'Chuyên viên kiểm định xưởng ReUse Hub',
    certificateCode: '#CERT-DRES-994',
    hashProof: 'sha256:d894b8e2f073c683b58498ffaa10e8e9766914fa28db323d61b69827b5e49e21',
    description:
      'Đầm dạ hội Party Dress thiết kế tối giản chất liệu lụa cao cấp, đã hoàn thành 9 chu kỳ cho thuê tiêu chuẩn. Bề mặt vải mềm tự nhiên, giữ trọn form dáng thanh lịch. Đã qua quy trình giặt hấp sinh học và khử khuẩn ozone khép kín ngày 25/10/2026.\n\nPhụ kiện đi kèm: Túi zip bảo quản chống bụi ReUse Care, móc treo đầm thiết kế và Thẻ chứng nhận kiểm định tuần hoàn ReUse Hub #CERT-DRES-994.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAtmXKLrFBh-ULvSwIfPH1-6Wt20ZZ6MVkUuMWLCglFjw1kWB6QFMzh2-V6BXtow5H6r3Mbt8RSgMy-DL2iSfu901WIFIU_yZfWuObWTRd4NoP9Nh1jctTIF7wGjHkgI4D5oxH6_dDBVra7zeHdkwYMXvpTTvPzpsf0XKcML75jinBrzziZBMszcYr5tYuRg6PC9_OCoBVNoPUb4MfpHrUPrGF2yzFQQLz7iIk6cPu5',
    images: [
      {
        id: 'hero',
        label: 'MẶT TRƯỚC',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtmXKLrFBh-ULvSwIfPH1-6Wt20ZZ6MVkUuMWLCglFjw1kWB6QFMzh2-V6BXtow5H6r3Mbt8RSgMy-DL2iSfu901WIFIU_yZfWuObWTRd4NoP9Nh1jctTIF7wGjHkgI4D5oxH6_dDBVra7zeHdkwYMXvpTTvPzpsf0XKcML75jinBrzziZBMszcYr5tYuRg6PC9_OCoBVNoPUb4MfpHrUPrGF2yzFQQLz7iIk6cPu5',
      },
      {
        id: 'back',
        label: 'MẶT SAU',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtmXKLrFBh-ULvSwIfPH1-6Wt20ZZ6MVkUuMWLCglFjw1kWB6QFMzh2-V6BXtow5H6r3Mbt8RSgMy-DL2iSfu901WIFIU_yZfWuObWTRd4NoP9Nh1jctTIF7wGjHkgI4D5oxH6_dDBVra7zeHdkwYMXvpTTvPzpsf0XKcML75jinBrzziZBMszcYr5tYuRg6PC9_OCoBVNoPUb4MfpHrUPrGF2yzFQQLz7iIk6cPu5',
      },
    ],
  },

  'INV-SNEK-03': {
    id: 'INV-SNEK-03',
    sku: 'SNK-ARCH-01',
    productName: 'Classic Sneakers Da Thật Archive - Bản Đen Triple (Size 42)',
    category: 'Giày dép / Sneakers Da Thật',
    serialNumber: '#SN-SNEK-003',
    conditionGrade: 'Chuẩn Thrift 81.0%',
    cycleCount: 8,
    daysRented: 40,
    totalRevenue: '4.800.000 ₫',
    depreciationRate: '45.0%',
    price: '330.000 ₫',
    originalPrice: '600.000 ₫',
    depreciationText: 'Khấu hao -45% so với giá gốc (600.000 ₫)',
    status: 'ELIGIBLE',
    currentRentStatus: 'COMPLETED',
    hasFutureBooking: false,
    recentOrderCode: '#RH-RNT-SNEK-03',
    recentCustomer: 'Nguyễn Hoàng Nam',
    location: 'Kệ giày kiểm định, ReUse Care Hub, Quận 1, TP. HCM',
    curatorName: 'Chuyên viên kiểm định xưởng ReUse Hub',
    certificateCode: '#CERT-SNEK-882',
    hashProof: 'sha256:7f3a992bc44101e4a773d1000bb78a2e1f4044c010a3d4f849ef9b071aa57c32',
    description:
      'Đôi sneaker da thật phong cách archive vintage bền bỉ. Đã hoàn thành 8 vòng luân chuyển, đế giày còn nguyên độ bám, da thật có lớp patina cổ điển tự nhiên. Đã được vệ sinh chuyên sâu diệt khuẩn nano bạc.\n\nPhụ kiện đi kèm: Hộp giấy tái chế ReUse, túi vải canvas đựng giày và Thẻ chứng nhận kiểm định tuần hoàn ReUse Hub.',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBGX9MLaXkDPpkpvRKdy2axzNTQbnNx_zdNdPhaZIyGar7jQumeRDAiXCgdqV-vo2remereT9vKy1u0lXTPcTjUwHWw2BUN5nVjtbW3A7Kck2D8oSAuMlA4YWikHGVx2wLPa4O73p6BniZAEsLW2gaF64ui2yqlzuI6QxQw-FAJ6EEbSwiKl9WQGZVRuhW0izycAPRBT0Wp20b8b6yIXFPDTRtD61j3kfI03X6CBtE',
    images: [
      {
        id: 'hero',
        label: 'MẶT TRƯỚC',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBGX9MLaXkDPpkpvRKdy2axzNTQbnNx_zdNdPhaZIyGar7jQumeRDAiXCgdqV-vo2remereT9vKy1u0lXTPcTjUwHWw2BUN5nVjtbW3A7Kck2D8oSAuMlA4YWikHGVx2wLPa4O73p6BniZAEsLW2gaF64ui2yqlzuI6QxQw-FAJ6EEbSwiKl9WQGZVRuhW0izycAPRBT0Wp20b8b6yIXFPDTRtD61j3kfI03X6CBtE',
      },
    ],
  },
};

/**
 * Lấy dữ liệu khởi tạo chuẩn cho một hiện vật bất kỳ dựa trên ID/SKU và đối tượng sản phẩm từ MongoDB
 */
export function getInitialThriftDataForUnit(
  unitIdOrSku?: string,
  matchedProduct?: {
    sku?: string;
    name?: string;
    category?: unknown;
    pricePerDay?: number;
    replacementValue?: number;
    coverImage?: string;
    description?: string;
    totalUnits?: number;
    rentingUnits?: number;
    maintenanceUnits?: number;
  }
): ThriftConvertData {
  if (matchedProduct && matchedProduct.name) {
    const unitNumber = parseInt(unitIdOrSku?.match(/-(\d+)$/)?.[1] || '1', 10);
    const catName =
      typeof matchedProduct.category === 'object' && matchedProduct.category !== null
        ? (matchedProduct.category as { name?: string }).name || 'Thời trang RENT'
        : String(matchedProduct.category || 'Thời trang RENT');
    const total = Number(matchedProduct.totalUnits) || 1;
    const vInfo = getUnitVariantAndCondition(
      matchedProduct.name,
      catName,
      unitNumber,
      total,
      matchedProduct.rentingUnits || 0,
      matchedProduct.maintenanceUnits || 0
    );
    const origPriceNum =
      matchedProduct.replacementValue || (matchedProduct.pricePerDay || 200000) * 30;
    const thriftPriceNum =
      Math.round((origPriceNum * (1 - vInfo.discountPercent / 100)) / 1000) * 1000;
    const unitSku = matchedProduct.sku || 'RENT-PROD';
    const unitId =
      unitIdOrSku || `INV-${unitSku.slice(-4).toUpperCase()}-${String(unitNumber).padStart(2, '0')}`;
    const serialNumber = `#SN-${unitSku.slice(-4).toUpperCase()}-${String(unitNumber).padStart(3, '0')}`;
    const imgUrl = matchedProduct.coverImage || 'https://placehold.co/600x400';

    return {
      unitId,
      sku: unitSku,
      title: `${matchedProduct.name} - ${vInfo.variantShort} (Thanh lý THRIFT)`,
      category: catName,
      condition: `${vInfo.conditionGrade} - Đã qua thẩm định xưởng`,
      price: `${new Intl.NumberFormat('vi-VN').format(thriftPriceNum)} ₫`,
      originalPrice: `${new Intl.NumberFormat('vi-VN').format(origPriceNum)} ₫`,
      depreciationText: `Khấu hao -${vInfo.discountPercent}% sau ${vInfo.cycleCount} chu kỳ cho thuê`,
      description: `Hiện vật chính hãng lưu kho xưởng ReUse Hub, đã hoàn tất ${vInfo.cycleCount} chu kỳ cho thuê tiêu chuẩn. ${matchedProduct.description || ''}\n\nĐã qua quy trình kiểm định chất lượng, khử trùng ozone và làm sạch chuyên sâu. Phụ kiện đi kèm: Bao bì bảo quản chuyên dụng và Thẻ chứng nhận kiểm định tuần hoàn ReUse Hub.`,
      heroImage: imgUrl,
      images: [
        { id: 'img-1', label: 'MẶT TRƯỚC', url: imgUrl },
        { id: 'img-2', label: 'MẶT SAU', url: imgUrl },
        { id: 'img-3', label: 'CHI TIẾT', url: imgUrl },
        { id: 'img-4', label: 'ĐÓNG GÓI', url: imgUrl },
      ],
      status: 'ELIGIBLE',
      currentRentStatus: 'COMPLETED',
      hasFutureBooking: false,
      serialNumber,
      cycleCount: vInfo.cycleCount,
      daysRented: vInfo.cycleCount * 5,
      totalRevenue: `${new Intl.NumberFormat('vi-VN').format(
        vInfo.cycleCount * (matchedProduct.pricePerDay || 200000) * 4
      )} ₫`,
      sourceTag: 'Kho Cho Thuê RENT (Chuyển giao tuần hoàn)',
      inspectorName: 'Chuyên viên kiểm định xưởng ReUse Hub',
      certificateCode: `#CERT-${unitSku.slice(-4).toUpperCase()}-${unitNumber}94`,
      hashProof: `sha256:${unitSku.toLowerCase()}${unitNumber}d894b8e2f073c683b58498ffaa10e8e9`,
      recentOrderCode: `#RH-RNT-${unitSku.slice(-4).toUpperCase()}-${unitNumber}`,
      recentCustomer: 'Khách hàng ReUse Hub (Hoàn tất)',
    };
  }

  const key = unitIdOrSku || 'INV-DRES-04';
  const profile = SPECIMEN_PROFILES[key] || Object.values(SPECIMEN_PROFILES)[0];

  return {
    unitId: profile.id,
    sku: profile.sku,
    title: profile.productName,
    category: profile.category,
    condition: `${profile.conditionGrade} - Đã qua thẩm định xưởng`,
    price: profile.price,
    originalPrice: profile.originalPrice,
    depreciationText: profile.depreciationText,
    description: profile.description,
    heroImage: profile.heroImage,
    images: profile.images,
    status: profile.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ELIGIBLE',
    currentRentStatus: profile.currentRentStatus,
    hasFutureBooking: profile.hasFutureBooking,
    serialNumber: profile.serialNumber,
    cycleCount: profile.cycleCount,
    daysRented: profile.daysRented,
    totalRevenue: profile.totalRevenue,
    sourceTag: 'Kho Cho Thuê RENT (Chuyển giao tuần hoàn)',
    inspectorName: profile.curatorName,
    certificateCode: profile.certificateCode,
    hashProof: profile.hashProof,
    recentOrderCode: profile.recentOrderCode,
    recentCustomer: profile.recentCustomer,
  };
}

/**
 * Danh sách tóm tắt tất cả hiện vật có thể chuyển đổi để render bộ chuyển đổi nhanh
 */
export const AVAILABLE_CONVERT_SPECIMENS = Object.values(SPECIMEN_PROFILES).map((p) => ({
  id: p.id,
  sku: p.sku,
  name: p.productName,
  price: p.price,
  condition: p.conditionGrade,
  status: p.status,
  isEligible: p.currentRentStatus !== 'RENTING' && !p.hasFutureBooking,
}));
