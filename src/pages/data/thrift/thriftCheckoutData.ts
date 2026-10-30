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
    code: '#ATELIER-COUTURE-01',
    title: 'Đầm Dạ Hội Lụa Tơ Tằm Thêu Chỉ Vàng Atelier',
    category: 'Haute Couture Evening Wear',
    grade: 'Grade Mint 99%',
    image:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    price: 18500000,
    quantity: 1,
    conditionNote: 'Thiết kế thủ công Atelier · 100% Lụa tơ tằm dệt tay · Size S/M ôm phom duyên dáng.',
    specDetails: 'Kèm túi bảo quản lụa kháng ẩm chuyên dụng · Đã khử khuẩn buồng Ozone',
    warranty: 'Bảo hành đường may & form dáng: 12 tháng',
    vaultOrigin: 'Atelier Heritage Vault',
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

export const THRIFT_SHIPPING_FEE = 30000;
