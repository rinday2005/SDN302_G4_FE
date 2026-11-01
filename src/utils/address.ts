/**
 * Utility functions for resolving, formatting, and deduplicating customer delivery addresses,
 * and calculating dynamic 2-way Nanuk shipping fees based on Shop location vs User Profile location.
 */

export interface StructuredAddress {
  province?: string;
  district?: string;
  ward?: string;
  detail?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface UserLike {
  _id?: string;
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  phone?: string;
  address?: StructuredAddress | string;
}

const DEFAULT_FALLBACK_ADDRESS = '48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Thành phố Đà Nẵng';

export const VIETNAM_REGIONS: Record<'NORTH' | 'CENTRAL' | 'SOUTH', string[]> = {
  NORTH: [
    'Hà Nội', 'Hải Phòng', 'Hải Dương', 'Hưng Yên', 'Bắc Ninh', 'Hà Nam', 'Nam Định',
    'Ninh Bình', 'Thái Bình', 'Vĩnh Phúc', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn',
    'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ', 'Bắc Giang', 'Quảng Ninh',
    'Lào Cai', 'Yên Bái', 'Điện Biên', 'Hòa Bình', 'Lai Châu', 'Sơn La',
  ],
  CENTRAL: [
    'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế',
    'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Nha Trang',
    'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Đà Lạt',
  ],
  SOUTH: [
    'Hồ Chí Minh', 'TP Hồ Chí Minh', 'TP.HCM', 'Sài Gòn', 'Bình Dương', 'Bình Phước', 'Đồng Nai',
    'Tây Ninh', 'Bà Rịa - Vũng Tàu', 'Vũng Tàu', 'Long An', 'Đồng Tháp', 'Tiền Giang', 'An Giang',
    'Bến Tre', 'Vĩnh Long', 'Trà Vinh', 'Hậu Giang', 'Kiên Giang', 'Sóc Trăng',
    'Bạc Liêu', 'Cà Mau', 'Cần Thơ',
  ],
};

export const DYNAMIC_SHIPPING_RATES = {
  LOCAL: 25000,        // Cùng tỉnh/thành phố với Chi nhánh Shop (VD: cùng Đà Nẵng, Hà Nội, hoặc TP. Hồ Chí Minh)
  REGIONAL: 35000,     // Khác tỉnh nhưng cùng miền với Chi nhánh Shop
  INTER_REGION: 45000, // Khác miền xa với Chi nhánh Shop
};

export type ShopBranchName = 'Đà Nẵng' | 'Hà Nội' | 'TP. Hồ Chí Minh';

export const SHOP_BRANCH_OPTIONS: { value: ShopBranchName; label: string; regionLabel: string }[] = [
  { value: 'Đà Nẵng', label: 'Chi nhánh Đà Nẵng (Kho Miền Trung)', regionLabel: 'Miền Trung' },
  { value: 'Hà Nội', label: 'Chi nhánh Hà Nội (Kho Miền Bắc)', regionLabel: 'Miền Bắc' },
  { value: 'TP. Hồ Chí Minh', label: 'Chi nhánh TP. Hồ Chí Minh (Kho Miền Nam)', regionLabel: 'Miền Nam' },
];

export function normalizeShopBranch(rawLocation?: string | null): ShopBranchName {
  if (!rawLocation || typeof rawLocation !== 'string' || !rawLocation.trim()) {
    return 'Đà Nẵng';
  }
  const lower = rawLocation.trim().toLowerCase();
  if (lower.includes('hà nội') || lower.includes('ha noi') || lower === 'hn') {
    return 'Hà Nội';
  }
  if (
    lower.includes('hồ chí minh') ||
    lower.includes('ho chi minh') ||
    lower.includes('hcm') ||
    lower.includes('sài gòn') ||
    lower.includes('sai gon')
  ) {
    return 'TP. Hồ Chí Minh';
  }
  if (lower.includes('đà nẵng') || lower.includes('da nang') || lower === 'dn') {
    return 'Đà Nẵng';
  }
  const parsed = extractCanonicalProvince(rawLocation);
  if (parsed.region === 'NORTH') return 'Hà Nội';
  if (parsed.region === 'SOUTH') return 'TP. Hồ Chí Minh';
  return 'Đà Nẵng';
}

/**
 * Chuẩn hóa tên tỉnh/thành phố từ chuỗi địa chỉ hoặc tên tỉnh
 */
export function extractCanonicalProvince(raw?: string | null): {
  canonical: string;
  display: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
} {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { canonical: 'đà nẵng', display: 'Đà Nẵng', region: 'CENTRAL' };
  }

  const lower = raw
    .trim()
    .toLowerCase()
    .replace(/^(thành phố|tp\.?|tỉnh)\s+/i, '')
    .replace(/,\s*(việt nam|vietnam)$/i, '')
    .trim();

  if (
    lower.includes('hồ chí minh') ||
    lower.includes('ho chi minh') ||
    lower.includes('tp.hcm') ||
    lower.includes('tphcm') ||
    lower === 'hcm' ||
    lower.includes('sài gòn') ||
    lower.includes('sai gon')
  ) {
    return { canonical: 'hồ chí minh', display: 'TP. Hồ Chí Minh', region: 'SOUTH' };
  }

  if (lower.includes('hà nội') || lower.includes('ha noi') || lower.includes('hanoi')) {
    return { canonical: 'hà nội', display: 'Hà Nội', region: 'NORTH' };
  }

  if (lower.includes('đà nẵng') || lower.includes('da nang') || lower.includes('danang')) {
    return { canonical: 'đà nẵng', display: 'Đà Nẵng', region: 'CENTRAL' };
  }

  if (lower.includes('huế') || lower.includes('hue')) {
    return { canonical: 'huế', display: 'Thừa Thiên Huế', region: 'CENTRAL' };
  }

  if (lower.includes('cần thơ') || lower.includes('can tho')) {
    return { canonical: 'cần thơ', display: 'Cần Thơ', region: 'SOUTH' };
  }

  if (lower.includes('hải phòng') || lower.includes('hai phong')) {
    return { canonical: 'hải phòng', display: 'Hải Phòng', region: 'NORTH' };
  }

  // Kiểm tra khớp trong danh sách 63 tỉnh thành theo 3 miền
  for (const [regionKey, provinces] of Object.entries(VIETNAM_REGIONS) as [
    'NORTH' | 'CENTRAL' | 'SOUTH',
    string[]
  ][]) {
    for (const prov of provinces) {
      const pLower = prov.toLowerCase();
      if (lower === pLower || lower.includes(pLower)) {
        return {
          canonical: pLower,
          display: prov,
          region: regionKey,
        };
      }
    }
  }

  // Nếu là chuỗi có dấu phẩy, lấy phần cuối cùng làm tên tỉnh
  const lastPart = raw.split(',').pop()?.trim() || raw.trim();
  const cleanLast = lastPart.replace(/^(Thành phố|TP\.?|Tỉnh)\s+/i, '').trim();
  return {
    canonical: cleanLast.toLowerCase(),
    display: cleanLast || 'Đà Nẵng',
    region: 'CENTRAL',
  };
}

/**
 * Tính phí Bưu tá chuyên dụng Nanuk (2 chiều) dựa trên vị trí của Shop (mặc định Đà Nẵng)
 * và địa chỉ trong Profile / Địa chỉ nhận hàng của từng tài khoản.
 */
export function getShippingZoneInfo(
  customerProvinceOrAddress?: string | null,
  shopProvinceOrAddress: string = 'Đà Nẵng'
): {
  fee: number;
  shopProvince: string;
  userProvince: string;
  zone: 'LOCAL' | 'REGIONAL' | 'INTER_REGION';
  label: string;
} {
  const shopInfo = extractCanonicalProvince(shopProvinceOrAddress || 'Đà Nẵng');
  const userInfo = extractCanonicalProvince(customerProvinceOrAddress || 'Đà Nẵng');

  if (shopInfo.canonical === userInfo.canonical) {
    return {
      fee: DYNAMIC_SHIPPING_RATES.LOCAL,
      shopProvince: shopInfo.display,
      userProvince: userInfo.display,
      zone: 'LOCAL',
      label: `Nội thành ${shopInfo.display} (2 chiều)`,
    };
  }

  if (shopInfo.region === userInfo.region) {
    return {
      fee: DYNAMIC_SHIPPING_RATES.REGIONAL,
      shopProvince: shopInfo.display,
      userProvince: userInfo.display,
      zone: 'REGIONAL',
      label: 'Liên tỉnh nội miền (2 chiều)',
    };
  }

  return {
    fee: DYNAMIC_SHIPPING_RATES.INTER_REGION,
    shopProvince: shopInfo.display,
    userProvince: userInfo.display,
    zone: 'INTER_REGION',
    label: 'Vận chuyển liên miền xa (2 chiều)',
  };
}

export function calculateDynamicShippingFee(
  customerProvinceOrAddress?: string | null,
  shopProvinceOrAddress: string = 'Đà Nẵng'
): number {
  return getShippingZoneInfo(customerProvinceOrAddress, shopProvinceOrAddress).fee;
}

/**
 * Khử các từ lặp lại khi ghép chuỗi địa chỉ (ví dụ: "Bến Nghé, Quận 1, Bến Nghé, Quận 1")
 */
export function deduplicateAddressString(raw: string): string {
  if (!raw) return '';
  const segments = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const seg of segments) {
    const lower = seg.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(seg);
    }
  }

  return unique.join(', ');
}

/**
 * Định dạng đối tượng địa chỉ có cấu trúc, tự động tránh lặp lại tên phường/quận nếu detail đã chứa
 */
export function formatStructuredParts(a: StructuredAddress): string {
  const detail = (a.detail || '').trim();
  const ward = (a.ward || '').trim();
  const district = (a.district || '').trim();
  const province = (a.province || '').trim();

  const dLower = detail.toLowerCase();
  const parts: string[] = [];
  if (detail) parts.push(detail);
  if (ward && !dLower.includes(ward.toLowerCase())) parts.push(ward);
  if (district && !dLower.includes(district.toLowerCase())) parts.push(district);
  if (province && !dLower.includes(province.toLowerCase())) parts.push(province);

  const joined = parts.filter(Boolean).join(', ');
  return deduplicateAddressString(joined);
}

/**
 * Lấy địa chỉ mới nhất từ Hồ sơ người dùng (localStorage user_profile_${uId}, localStorage 'user', hoặc user.address)
 */
export function getUserProfileAddress(user?: UserLike | null): {
  detail: string;
  ward: string;
  district: string;
  province: string;
  full: string;
} {
  try {
    let effectiveUser = user;
    if (!effectiveUser || !effectiveUser.address) {
      const savedUserRaw = localStorage.getItem('user');
      if (savedUserRaw) {
        const parsedUser = JSON.parse(savedUserRaw);
        if (parsedUser && (!effectiveUser || parsedUser._id === effectiveUser._id || parsedUser.id === effectiveUser.id)) {
          effectiveUser = { ...parsedUser, ...effectiveUser, address: effectiveUser?.address || parsedUser.address };
        }
      }
    }

    const uId = effectiveUser?._id || effectiveUser?.id;
    if (uId) {
      const rawProfile = localStorage.getItem(`user_profile_${uId}`);
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        if (p?.address) {
          if (typeof p.address === 'string' && p.address.trim()) {
            const cleanStr = deduplicateAddressString(p.address.trim());
            const detectedProv = extractCanonicalProvince(cleanStr).display;
            const segments = cleanStr.split(',').map((s) => s.trim()).filter(Boolean);
            return {
              detail: segments[0] || cleanStr,
              ward: segments.length >= 4 ? segments[1] : 'Phường Hải Châu 1',
              district: segments.length >= 3 ? segments[segments.length - 2] : 'Quận Hải Châu',
              province: detectedProv,
              full: cleanStr,
            };
          }
          if (typeof p.address === 'object' && p.address !== null) {
            const a = p.address as StructuredAddress;
            const full = formatStructuredParts(a) || DEFAULT_FALLBACK_ADDRESS;
            const detectedProv = a.province?.trim() || extractCanonicalProvince(full).display;
            return {
              detail: a.detail || '48 Bạch Đằng',
              ward: a.ward || 'Phường Hải Châu 1',
              district: a.district || 'Quận Hải Châu',
              province: detectedProv,
              full,
            };
          }
        }
      }
    }

    if (effectiveUser?.address) {
      if (typeof effectiveUser.address === 'string' && effectiveUser.address.trim()) {
        const cleanStr = deduplicateAddressString(effectiveUser.address.trim());
        const detectedProv = extractCanonicalProvince(cleanStr).display;
        const segments = cleanStr.split(',').map((s) => s.trim()).filter(Boolean);
        return {
          detail: segments[0] || cleanStr,
          ward: segments.length >= 4 ? segments[1] : 'Phường Hải Châu 1',
          district: segments.length >= 3 ? segments[segments.length - 2] : 'Quận Hải Châu',
          province: detectedProv,
          full: cleanStr,
        };
      }
      if (typeof effectiveUser.address === 'object' && effectiveUser.address !== null) {
        const a = effectiveUser.address as StructuredAddress;
        const full = formatStructuredParts(a) || DEFAULT_FALLBACK_ADDRESS;
        const detectedProv = a.province?.trim() || extractCanonicalProvince(full).display;
        return {
          detail: a.detail || '48 Bạch Đằng',
          ward: a.ward || 'Phường Hải Châu 1',
          district: a.district || 'Quận Hải Châu',
          province: detectedProv,
          full,
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    detail: '48 Bạch Đằng',
    ward: 'Phường Hải Châu 1',
    district: 'Quận Hải Châu',
    province: 'Thành phố Đà Nẵng',
    full: DEFAULT_FALLBACK_ADDRESS,
  };
}

/**
 * Kiểm tra xem chuỗi địa chỉ có phải là placeholder / mock cứng hay không
 */
export function isMockAddress(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('địa chỉ mặc định') ||
    lower.includes('dia chi mac dinh') ||
    lower.includes('địa chỉ nhận hàng') ||
    lower.includes('dia chi nhan hang')
  );
}

/**
 * Chuyển đổi và khử trùng lặp chuỗi địa chỉ, tự động ưu tiên địa chỉ Profile của người dùng
 */
export function resolveCleanAddress(orderAddress: unknown, user?: UserLike | null): string {
  const profileAddr = getUserProfileAddress(user);

  if (!orderAddress) {
    return profileAddr.full;
  }

  // 1. Nếu địa chỉ là chuỗi thuần
  if (typeof orderAddress === 'string') {
    const trimmed = orderAddress.trim();
    if (isMockAddress(trimmed)) {
      return profileAddr.full;
    }
    return deduplicateAddressString(trimmed);
  }

  // 2. Nếu địa chỉ là đối tượng có cấu trúc
  if (typeof orderAddress === 'object' && orderAddress !== null) {
    const a = orderAddress as StructuredAddress;
    const detail = (a.detail || '').trim();

    if (isMockAddress(detail)) {
      return profileAddr.full;
    }

    const formatted = formatStructuredParts(a);
    if (!formatted || isMockAddress(formatted)) {
      return profileAddr.full;
    }
    return formatted;
  }

  return profileAddr.full;
}
