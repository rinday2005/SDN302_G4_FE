/**
 * Utility functions for resolving, formatting, and deduplicating customer delivery addresses.
 * Prioritizes dynamic profile address over legacy mock placeholders.
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
 * Lấy địa chỉ mới nhất từ Hồ sơ người dùng (localStorage user_profile_${uId} hoặc user.address)
 */
export function getUserProfileAddress(user?: UserLike | null): {
  detail: string;
  ward: string;
  district: string;
  province: string;
  full: string;
} {
  try {
    const uId = user?._id || user?.id;
    if (uId) {
      const rawProfile = localStorage.getItem(`user_profile_${uId}`);
      if (rawProfile) {
        const p = JSON.parse(rawProfile);
        if (p?.address) {
          if (typeof p.address === 'string' && p.address.trim()) {
            const cleanStr = deduplicateAddressString(p.address.trim());
            return {
              detail: cleanStr,
              ward: 'Phường Hải Châu 1',
              district: 'Quận Hải Châu',
              province: 'Thành phố Đà Nẵng',
              full: cleanStr,
            };
          }
          if (typeof p.address === 'object' && p.address !== null) {
            const a = p.address as StructuredAddress;
            const full = formatStructuredParts(a) || DEFAULT_FALLBACK_ADDRESS;
            return {
              detail: a.detail || '48 Bạch Đằng',
              ward: a.ward || 'Phường Hải Châu 1',
              district: a.district || 'Quận Hải Châu',
              province: a.province || 'Thành phố Đà Nẵng',
              full,
            };
          }
        }
      }
    }

    if (user?.address) {
      if (typeof user.address === 'string' && user.address.trim()) {
        const cleanStr = deduplicateAddressString(user.address.trim());
        return {
          detail: cleanStr,
          ward: 'Phường Hải Châu 1',
          district: 'Quận Hải Châu',
          province: 'Thành phố Đà Nẵng',
          full: cleanStr,
        };
      }
      if (typeof user.address === 'object' && user.address !== null) {
        const a = user.address as StructuredAddress;
        const full = formatStructuredParts(a) || DEFAULT_FALLBACK_ADDRESS;
        return {
          detail: a.detail || '48 Bạch Đằng',
          ward: a.ward || 'Phường Hải Châu 1',
          district: a.district || 'Quận Hải Châu',
          province: a.province || 'Thành phố Đà Nẵng',
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
    lower.includes('123 lê lợi') ||
    lower.includes('123 le loi') ||
    lower.includes('địa chỉ mặc định') ||
    lower.includes('dia chi mac dinh') ||
    lower.includes('địa chỉ nhận hàng') ||
    lower.includes('dia chi nhan hang') ||
    lower.includes('bến nghé, quận 1') ||
    lower.includes('ben nghe, quan 1') ||
    lower.trim() === 'hồ chí minh' ||
    lower.trim() === 'thành phố hồ chí minh'
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
