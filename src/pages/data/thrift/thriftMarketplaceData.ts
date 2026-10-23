export interface ThriftProduct {
  id: string;
  slug: string;
  title: string;
  category: 'fashion' | 'camera' | 'electronics' | 'lifestyle';
  categoryLabel: string;
  location: string;
  rating: number;
  reviewCount: number;
  condition: string;
  conditionLevel: '99' | '98' | '95' | '90' | 'used';
  source: 'used' | 'rent';
  sourceLabel: string;
  price: number;
  href: string;
  image: string;
  verifiedBy: string;
  quantity?: number;
  size?: string;
  sizes?: string[];
  status?: string;
  sourceType?: string;
  name?: string;
}

export type ThriftSortKey = 'recommended' | 'price-asc' | 'price-desc' | 'latest';

export interface ThriftFilterOption {
  label: string;
  value: string;
}

export interface CircularProcessStep {
  step: string;
  title: string;
  description: string;
}

export const THRIFT_PRODUCTS: ThriftProduct[] = [
  {
    id: 'vintage-leather-jacket',
    slug: 'vintage-leather-jacket',
    title: 'Vintage Leather Jacket',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'Đà Nẵng',
    rating: 4.9,
    reviewCount: 42,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 850000,
    href: '/thrift/vintage-leather-jacket',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNH-0eROeU6E1QWBPqGUZxtudCKHUCDCiHWUb3nUY6dQgFrc_2yUZ3WM-68q1qK9W8xAhgkGAPyQfNsDHJfCzBY2gVYh-GAYZOeFmJtP396Wroljg8SHqbpHAxAApJv1Kl2b_uN8HjNNKUmPSfoWs_D4zcZ1CcCTTfbgOSygaUl68Ol-TCeoyceH8WU0MarU1LfIwm4HnJNziZwGjSvkrQ0b80uI6d1jK6Kcmdu_CJ',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'classic-sneakers',
    slug: 'classic-sneakers',
    title: 'Classic Sneakers',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    rating: 4.7,
    reviewCount: 38,
    condition: 'Đã qua sử dụng (90%)',
    conditionLevel: '90',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 1200000,
    href: '/thrift/classic-sneakers',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRX9_Lupi6ioKrTI6CdqUT2LoTPoPPDYope2NS1SXs83eJ30IPao3gwJ2NOmYoeYV4y3JS0AuNH--7g5Z4qFhIOpyB1JWHyTRX5CQamxtzAZ7CDYtmPQI_-JgQ4ew31pRDRXNyWYGanKJWjVqqovQffSBtjOHr9dPh9_adUdEZqnn0AAdm8-0zoHagZYrmYFdjimASLAe40LrLzXCmTK-J31sByBu4qvD_G6bfiVzO',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'canon-eos-camera-kit',
    slug: 'canon-eos-camera-kit',
    title: 'Canon EOS Camera Kit',
    category: 'camera',
    categoryLabel: 'Camera & Quang học',
    location: 'Đà Nẵng',
    rating: 4.9,
    reviewCount: 86,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 6500000,
    href: '/thrift/canon-eos-camera-kit',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMAKgDMSt6wNOlVFkkr0lPT5lLpBq4yxdV9cvFVYiIglQtjUxbPXaEIUa90if6y7j1b-xwqtrv6DvB5AwdmnNtTGdhMpXr9LywaWWRKSyy8FsuQAaQrntoCgwMonixUaVaqk-5y_DhVTse9ZhZkcztFMrg1pUReap6uTAzwWmuCUyltP8yTAlzi_FjNxH0FGs0USpuKxbhEy_knpnJuDtgauRkEA3IcCxHaZ9oZ9nl',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'minimal-backpack',
    slug: 'minimal-backpack',
    title: 'Minimal Backpack',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle & Đồ da',
    location: 'Hà Nội',
    rating: 4.8,
    reviewCount: 24,
    condition: 'Như mới (99%)',
    conditionLevel: '99',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 650000,
    href: '/thrift/minimal-backpack',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHn2VdmkJTBi6OoWqffG5cpLJJQ0LGMBBpNLIASNuqZPRbuUBn3-AxfUmHNjoJQGYxRo9SL62-3K_i2lWhrPVXAFw71PeoS8bWtJ-zZ2h5-qYRHqh7PVykzS5WGVcNb4S34RaYvn1Td5pfuxbPQdUVHJ_3KqIfQcpkquMLLEsIEBeiC6zvBMVqhiDqQTDBPNXalmXpYZTDVw5CGt5zPyp0PaZXhXnJQcnEJ7WgTLnS',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'leica-m6-classic',
    slug: 'leica-m6-classic',
    title: 'Leica M6 Classic Rangefinder',
    category: 'camera',
    categoryLabel: 'Camera & Quang học',
    location: 'Hà Nội',
    rating: 5.0,
    reviewCount: 19,
    condition: 'Grade Mint (98%)',
    conditionLevel: '98',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 68000000,
    href: '/thrift/leica-m6-classic',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqSEj-qjFlgj4F7C2BHlI_RiTibcpTaqo0YpRL4Fic26yZ39AB8JHfFd9tlhgjJeqPCSldXRsmPDuNgK3rTIuuau-N5YugtaNwYwxbnlmDskyjvDAQdc5g4zyDPKtqITVMDRuFELuBQqJi7j5Fs96tpUGkfObwUSoXGbUNVyP3BGsnrrSu96cjzgKmqdfWrISzgDX0iT1CtUP3N4PoiDV8nxQFUZdIBLQ2r0D8IKGQ',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'ao-khoac-da-wool',
    slug: 'ao-khoac-da-wool',
    title: 'Áo Khoác Dạ Wool Dáng Dài',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    rating: 4.8,
    reviewCount: 31,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 1450000,
    href: '/thrift/ao-khoac-da-wool',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC0JEhXA2GX02l44kXc-KLB8ZswWNd7PNAWiOR7L083YFF0MuCZopf796nCSeWS0rvx7GbBdgXriJJfsHTMLEEu5n7kCRmSvgnDAZ2777GpgwHhP4fUDmU57eG50J5YSukwVXR0aeKZ3I3KaUOL5MDfXVKgfVctXs6f-0BzRpKIbdt4yBEzipU3udGuY6e0G3G526vTQy9sQJQDHxXuL06kEWIltMiAxR_DFBk550cF',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'contax-t2-titanium',
    slug: 'contax-t2-titanium',
    title: 'Contax T2 Titanium Black',
    category: 'camera',
    categoryLabel: 'Camera & Quang học',
    location: 'Đà Nẵng',
    rating: 4.9,
    reviewCount: 54,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 32500000,
    href: '/thrift/contax-t2-titanium',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMboExtxO1P9VaR8kcPXZUS45-ZWH6RYc9iUvMk8M5MmUX1PMBUKJfcHeYYjmgWa1vo3_CrTtazZ3otluDxOW_Es6cAVef4i7UpUvnkeGlsl7sb0ylBBm3wUOhkRkxGAQ3h5MZ6zm6Kan-HRvWZ5mVtBX1G6vfog_DQAGdlcSvs5uQSd9yw7Y5x50FtpUEy5Yd0OsOrOKK0_TSlJEIraPoXvS_uOlwDy-PoLVIN4d-',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'teenage-engineering-op1',
    slug: 'teenage-engineering-op1',
    title: 'Teenage Engineering OP-1 Field',
    category: 'electronics',
    categoryLabel: 'Âm thanh & Điện tử',
    location: 'Đà Nẵng',
    rating: 5.0,
    reviewCount: 12,
    condition: 'Như mới (99%)',
    conditionLevel: '99',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 28500000,
    href: '/thrift/teenage-engineering-op1',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDOnq8zaWE-ytFaHRYvwtxW5qRQdgbHECwE-nyiJIJ6IDhMVdHj46wsH-LDvWyc_it9s1oD30HaY0K3JtCGMZjndhwBcDTFp5XOVAtM5wBrnviK-_UJg3G_0_ZP_LYXV__HOxdAcd-h89E42nKtj1TFRXbAx_iTQtP8rhWf9S25wOSzfSomzAb12J8W7YnuM6u9hR2tG1rxU0DQ4mHwyyuxhVbaO17O6-w-hbA4BRQ1',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'dam-da-hoi-sequin',
    slug: 'dam-da-hoi-sequin',
    title: 'Đầm Dạ Hội Sequin Ánh Kim',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    rating: 4.9,
    reviewCount: 28,
    condition: 'Như mới (99%)',
    conditionLevel: '99',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 950000,
    href: '/thrift/dam-da-hoi-sequin',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'fujifilm-x100v-silver',
    slug: 'fujifilm-x100v-silver',
    title: 'Fujifilm X100V Silver Edition',
    category: 'camera',
    categoryLabel: 'Camera & Quang học',
    location: 'Hà Nội',
    rating: 5.0,
    reviewCount: 63,
    condition: 'Grade Mint (98%)',
    conditionLevel: '98',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 34000000,
    href: '/thrift/fujifilm-x100v-silver',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'ao-blazer-linen-oversized',
    slug: 'ao-blazer-linen-oversized',
    title: 'Áo Blazer Linen Oversized Tối Giản',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'Đà Nẵng',
    rating: 4.8,
    reviewCount: 17,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 620000,
    href: '/thrift/ao-blazer-linen-oversized',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'giay-derby-da-bo',
    slug: 'giay-derby-da-bo',
    title: 'Giày Derby Da Bò Cao Cấp Handmade',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    rating: 4.7,
    reviewCount: 22,
    condition: 'Như mới (99%)',
    conditionLevel: '99',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 1850000,
    href: '/thrift/giay-derby-da-bo',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'sony-alpha-a7c',
    slug: 'sony-alpha-a7c',
    title: 'Sony Alpha A7C Compact Full-frame',
    category: 'camera',
    categoryLabel: 'Camera & Quang học',
    location: 'Hà Nội',
    rating: 4.9,
    reviewCount: 39,
    condition: 'Rất tốt (95%)',
    conditionLevel: '95',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 27500000,
    href: '/thrift/sony-alpha-a7c',
    image: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'tui-tote-canvas-vintage',
    slug: 'tui-tote-canvas-vintage',
    title: 'Túi Canvas Tote Vintage Quân Đội',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle & Đồ da',
    location: 'Đà Nẵng',
    rating: 4.6,
    reviewCount: 15,
    condition: 'Đã qua sử dụng (90%)',
    conditionLevel: '90',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 380000,
    href: '/thrift/tui-tote-canvas-vintage',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'ban-phim-co-custom',
    slug: 'ban-phim-co-custom',
    title: 'Bàn Phím Cơ Custom HHKB Layout',
    category: 'electronics',
    categoryLabel: 'Âm thanh & Điện tử',
    location: 'TP. Hồ Chí Minh',
    rating: 4.9,
    reviewCount: 44,
    condition: 'Grade Mint (98%)',
    conditionLevel: '98',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 4200000,
    href: '/thrift/ban-phim-co-custom',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
  {
    id: 'dam-lua-to-tam',
    slug: 'dam-lua-to-tam',
    title: 'Đầm Lụa Tơ Tằm Sát Nách Dáng Suông',
    category: 'fashion',
    categoryLabel: 'Thời trang',
    location: 'Hà Nội',
    rating: 4.8,
    reviewCount: 19,
    condition: 'Như mới (99%)',
    conditionLevel: '99',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 1100000,
    href: '/thrift/dam-lua-to-tam',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
    verifiedBy: 'Shop Owner',
  },
];
export const THRIFT_CATEGORY_OPTIONS: ThriftFilterOption[] = [
  { label: 'Tất cả danh mục (5)', value: 'all' },
  { label: 'Camera', value: 'camera' },
  { label: 'Giày dép', value: 'shoes' },
  { label: 'Đầm dự tiệc', value: 'dam-du-tiec' },
  { label: 'Quần áo', value: 'clothing' },
  { label: 'Phụ kiện', value: 'phu-kien' },
];

export const THRIFT_PRICE_OPTIONS: ThriftFilterOption[] = [
  { label: 'Tất cả mức giá', value: 'all' },
  { label: 'Dưới 1.000.000đ', value: 'under1m' },
  { label: '1.000.000đ - 5.000.000đ', value: '1mto5m' },
  { label: '5.000.000đ - 20.000.000đ', value: '5mto20m' },
  { label: 'Trên 20.000.000đ', value: 'above20m' },
];

export const THRIFT_CONDITION_OPTIONS: ThriftFilterOption[] = [
  { label: 'Tất cả tình trạng', value: 'all' },
  { label: 'Như mới (99%)', value: '99' },
  { label: 'Grade Mint (98%)', value: '98' },
  { label: 'Rất tốt (95%)', value: '95' },
  { label: 'Đã qua sử dụng (90%)', value: '90' },
];

export const THRIFT_LOCATION_OPTIONS: ThriftFilterOption[] = [
  { label: 'Toàn quốc', value: 'all' },
  { label: 'Đà Nẵng', value: 'Đà Nẵng' },
  { label: 'TP. Hồ Chí Minh', value: 'TP. Hồ Chí Minh' },
  { label: 'Hà Nội', value: 'Hà Nội' },
];

export const THRIFT_SOURCE_OPTIONS: ThriftFilterOption[] = [
  { label: 'Tất cả nguồn gốc', value: 'all' },
  { label: 'Đồ đã qua sử dụng', value: 'used' },
  { label: 'Từ sản phẩm RENT', value: 'rent' },
];

export const THRIFT_CIRCULAR_STEPS: CircularProcessStep[] = [
  {
    step: '01',
    title: 'Tiếp nhận & Phân loại',
    description: 'Thu nhận từ người dùng ký gửi hoặc chuyển tiếp từ thiết bị hoàn tất chu kỳ dịch vụ RENT.',
  },
  {
    step: '02',
    title: 'Kiểm định & Khử trùng',
    description: 'Đo đạc cơ học, kiểm tra chi tiết linh kiện và chiếu xạ UV-C sâu đạt chuẩn y tế.',
  },
  {
    step: '03',
    title: 'Chụp thực tế & Định danh',
    description: 'Hình ảnh không qua bộ lọc, ghi nhận trung thực từng vết xước vi mô trước khi niêm yết.',
  },
  {
    step: '04',
    title: 'Bàn giao vĩnh viễn',
    description: 'Đóng hộp niêm phong bảo an, chứng nhận sở hữu và chính sách đổi trả minh bạch 72 giờ unboxing.',
  },
];
