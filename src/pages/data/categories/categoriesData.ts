export interface CategoryItem {
  id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  subtitle: string;
  tags: string[];
  spanClass: string;
  image: string;
  alt: string;
  rentCount: number;
  thriftCount: number;
  href: string;
  categoryQuery: string;
  isThriftOnly?: boolean;
  thriftCustomBadge?: string;
}

export interface CategoryMetric {
  value: string;
  label: string;
}

export type CategoryFilterKey =
  | 'all'
  | 'rent'
  | 'thrift'
  | 'camera'
  | 'shoes'
  | 'dam-du-tiec'
  | 'clothing'
  | 'phu-kien'
  | string;

export interface CategoryFilterOption {
  key: CategoryFilterKey;
  label: string;
}

export const CATEGORY_FILTER_OPTIONS: CategoryFilterOption[] = [
  { key: 'all', label: 'Tất cả danh mục' },
  { key: 'rent', label: 'Sản phẩm RENT' },
  { key: 'thrift', label: 'Sản phẩm THRIFT' },
  { key: 'camera', label: 'Camera' },
  { key: 'shoes', label: 'Giày dép' },
  { key: 'dam-du-tiec', label: 'Đầm dự tiệc' },
  { key: 'clothing', label: 'Quần áo' },
  { key: 'phu-kien', label: 'Phụ kiện' },
];

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: 'camera',
    code: 'CAT.01',
    slug: 'camera',
    title: 'Camera',
    description:
      'Máy ảnh và thiết bị quang học cao cấp cho những chuyến đi và khoảnh khắc đáng nhớ. Đầy đủ dòng máy film vintage lẫn mirrorless hiện đại.',
    subtitle: 'Bao gồm body, lens prime & gimbal',
    tags: ['rent', 'thrift', 'camera'],
    spanClass: 'lg:col-span-7',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBCiuIvnSlvlPHfRYWN3kvVrSBf-X-NXh3IOKA2bmcfyxUoiAJ9MmzsZz0zqHz8KE7Nso8XF2rgckdUaH1_Uqw-6kX36GVw8hLbF0mnWg1dfrfs9E32RYGdz53gzL5M4BdI0ijpd9hm_I9ZB5LQFR2taIbJqQnaIPLuxsqAXRjgaT2DeTavUVuTZX4oTIxtj0aft9Zcf0o_EjFwLUWLlIez1PBTsvg6s_yE3xZITw4V',
    alt: 'Vintage Leica rangefinder và máy ảnh Sony mirrorless trên bàn vải tự nhiên',
    rentCount: 7,
    thriftCount: 7,
    href: '/categories/camera',
    categoryQuery: 'camera',
  },
  {
    id: 'shoes',
    code: 'CAT.02',
    slug: 'shoes',
    title: 'Giày dép',
    description:
      'Giày sneaker và những đôi giày da cao cấp, giày cao gót dự tiệc đã sẵn sàng cho vòng đời tiếp theo. Đã vệ sinh và khử trùng theo tiêu chuẩn chuyên sâu.',
    subtitle: 'Khử khuẩn UV 100% · Archive Designer',
    tags: ['rent', 'thrift', 'shoes'],
    spanClass: 'lg:col-span-5',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACMscvmXGwh7zyGaJb19IGg6jPGmEHKJYQLEwi3bCyZrwcBMcZ6uRSSWJDetS72ao2M3ENr_Pq2AQYDF98dZf4mJR2Xe9TQ3llFPVdaj5wm-71MNeZE_pMSl0jUTPzv-jluamlcKRAc_fra-DM9oKdekcwzNdTAu66YfNE5ED2hbfZ2iwYnoBuj1lRqK-MSEioVaZ_ox_3eaiTrU8VdcefZDS_mteTeek9wggXh9aa',
    alt: 'Giày da derby cổ điển và sneaker retro tối giản trên bục đá tự nhiên',
    rentCount: 7,
    thriftCount: 6,
    href: '/categories/shoes',
    categoryQuery: 'shoes',
  },
  {
    id: 'dam-du-tiec',
    code: 'CAT.03',
    slug: 'dam-du-tiec',
    title: 'Đầm dự tiệc',
    description:
      'Đầm dạ hội, đầm dự tiệc thiết kế sang trọng cho dạ tiệc, sự kiện cưới hỏi. Giặt hấp công nghệ Ozone vô trùng bảo vệ từng sợi vải cao cấp.',
    subtitle: 'Silk Satin · Haute Couture · Giặt hấp Ozone',
    tags: ['rent', 'thrift', 'dam-du-tiec'],
    spanClass: 'lg:col-span-4',
    image:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60',
    alt: 'Đầm dạ hội lụa satin cao cấp cho tiệc tối',
    rentCount: 7,
    thriftCount: 6,
    href: '/categories/dam-du-tiec',
    categoryQuery: 'dam-du-tiec',
  },
  {
    id: 'clothing',
    code: 'CAT.04',
    slug: 'clothing',
    title: 'Quần áo',
    description:
      'Trang phục, áo khoác dạ wool dáng dài, vintage leather jacket được chọn lọc từ các thương hiệu thiết kế cao cấp và phong cách minimalism.',
    subtitle: 'Wool · Leather · Archive Designer',
    tags: ['rent', 'thrift', 'clothing'],
    spanClass: 'lg:col-span-4',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDr11lugRFs6zsTZmVNcSME1kz5ux0hrbhG-XXQIm-4f_Il3Ph0g2dfju2PRWd9mMYXMfmHERjkL-hVp0ST8G57HyLKQMKwch2lGXi8VO5inPOi-UheEjaLYAw9obCpHmmVoMwXTB-eKiEKc91qiIRL2ZvfIqwHo9c_zlo5Cy9awI7f7Bj6wlaCbBpKvRFujIRBV6BYZpAdrJKvBz3El5u-XzeepTcLdF3MoxY-WLH6',
    alt: 'Trang phục thiết kế tự nhiên, áo trench coat len và sơ mi linen tối giản',
    rentCount: 6,
    thriftCount: 7,
    href: '/categories/clothing',
    categoryQuery: 'clothing',
  },
  {
    id: 'phu-kien',
    code: 'CAT.05',
    slug: 'phu-kien',
    title: 'Phụ kiện',
    description:
      'Dây chuyền ngọc trai, bông tai bạc Ý đính đá, quạt lụa cầm tay thủ công và trang sức phụ kiện cao cấp cho dạ tiệc và đời sống.',
    subtitle: 'Dây chuyền · Bông tai · Quạt lụa · Trang sức',
    tags: ['rent', 'thrift', 'phu-kien'],
    spanClass: 'lg:col-span-4',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60',
    alt: 'Dây chuyền ngọc trai và trang sức phụ kiện sang trọng',
    rentCount: 6,
    thriftCount: 7,
    href: '/categories/phu-kien',
    categoryQuery: 'phu-kien',
  },
];

export const CATEGORY_METRICS: CategoryMetric[] = [
  { value: '100%', label: 'Khử trùng y tế' },
  { value: '72h', label: 'Bảo hành đổi trả' },
  { value: '5,200+', label: 'Vòng đời đã tái tạo' },
];

export function getCategoryBySlug(slug?: string): CategoryItem | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase();
  const aliasMap: Record<string, string> = {
    cameras: 'camera',
    fashion: 'clothing',
    'thoi-trang': 'clothing',
    electronics: 'phu-kien',
    'dien-tu': 'phu-kien',
    camping: 'phu-kien',
    books: 'phu-kien',
    lifestyle: 'phu-kien',
  };
  const targetSlug = aliasMap[normalized] || normalized;
  return CATEGORIES_DATA.find((c) => c.slug === targetSlug || c.id === targetSlug);
}
