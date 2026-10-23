export interface CheckoutThriftItem {
  id: string;
  code: string;
  title: string;
  category: string;
  grade: string;
  image: string;
  price: number;
  quantity: number;
  conditionNote: string;
  specDetails: string;
  warranty: string;
  vaultOrigin: string;
}

export const DEFAULT_CHECKOUT_THRIFT_ITEMS: CheckoutThriftItem[] = [
  {
    id: '6ad273b0f22df3063ffd9989',
    code: '#2481902',
    title: 'Leica M6 Classic 0.72x Rangefinder Body',
    category: 'Camera & Vintage Archival',
    grade: 'Mint- 98%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCqa5m8tKywXH9rvvHuNq4GQKyT_WChAp4Q7GDxx0c-RVS6Ndxhhc-vx5CWdcmb515glJDUT6WSRw8j8m2ScaZABpyUQ-y_fmUUt-QT_GeXKWqAylz8RFHDj1i8EFVDj0vmtYbWomJ0jOx75VhWw41o5Ny380x5gx_ONdBt9tQpXqRcl5cz-6xzm9NL_cGSOvvhpXTj3vMjlWdbL6u-Gi7HTgoW7rLzIqGc0OEO-bCE',
    price: 68000000,
    quantity: 1,
    conditionNote: 'Black Chrome Finish · Chuẩn thẩm định 98% Factory Benchmark · Xuất xứ Wetzlar, CHLB Đức.',
    specDetails: 'Khung ngắm quang học 0.72x · Kèm nắp đậy body zin và dây đeo da thuộc Leica',
    warranty: 'Bảo hành cơ học: 12 tháng',
    vaultOrigin: 'Atelier Silvergrain',
  },
  {
    id: '6ad273b0f22df3063ffd998a',
    code: '#YY-FW98-04',
    title: 'Áo khoác len Yohji Yamamoto Wool Jacket',
    category: 'Haute Archive Runway · FW 1998',
    grade: 'Grade A Mint',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIAq6JaaJNSqCYFx4JOHPVFMhe8RFQNnSmQt_USuxAbA1b0Z5qvXnuqdHTd1gZ_vAAO-p-XsM_rsjMItdI-Jzvgn7kRepAiaEy5vC5hCvU42-z4CTcVoUrq4OEJbU9sLgpnU5puxfO6f3Zzquktqd179LC05UDOCGX7FR7p_i77M28F10kXgx_IEc_J6y-S383GXGVRdlZEXDA2_7qsswl1sLw7h7Cmp7AsZySmy-6',
    price: 14850000,
    quantity: 1,
    conditionNote: 'Tokyo Archival Collection · 100% Gabardine Wool cao cấp · Size M (Dáng Oversized bồng bềnh).',
    specDetails: 'Kèm túi bảo quản lụa kháng ẩm chuyên dụng · Đã giặt khô ozone',
    warranty: 'Kèm túi bảo quản lụa kháng ẩm',
    vaultOrigin: 'Curated Archive Tokyo',
  },
];

export const THRIFT_SHIPPING_FEE = 215000;
