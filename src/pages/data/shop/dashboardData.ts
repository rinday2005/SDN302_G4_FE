export interface MetricOverview {
  id: string;
  title: string;
  count: string;
  unit: string;
  subtitle: string;
  icon: string;
  link: string;
  highlightColor?: string;
}

export interface RentAttentionItem {
  id: string;
  orderCode: string;
  customerName: string;
  statusText: string;
  statusType: 'URGENT' | 'ESCROW_PAID' | 'PENDING' | 'EARLY_RETURN';
  productTitle: string;
  depositAmount: string;
  imageUrl: string;
  notice: string;
  actionText: string;
  detailUrl: string;
  duration?: string;
  actionIcon: string;
}

export interface ThriftAttentionItem {
  id: string;
  orderCode: string;
  buyerName: string;
  statusText: string;
  productTitle: string;
  price: string;
  imageUrl: string;
  notice: string;
  actionText: string;
  detailUrl: string;
  trackingCode?: string;
  actionIcon?: string;
}

export interface CircularProtocolStep {
  step: string;
  title: string;
  description: string;
  isHighlight?: boolean;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
}

export interface MarketplacePreviewItem {
  id: string;
  badge: string;
  badgeColorClass: string;
  displayId: string;
  title: string;
  price: string;
  statusText: string;
  imageUrl: string;
}

export interface ShopHeaderNav {
  to: string;
  label: string;
}

export interface ShopHeaderProfile {
  shopName: string;
  ownerName: string;
  roleBadge: string;
}

// 1. Navigation Header
export const shopHeaderNavLinks: ShopHeaderNav[] = [
  { to: '/', label: 'Home' },
  { to: '/rent', label: 'RENT' },
  { to: '/thrift', label: 'THRIFT' },
  { to: '/categories', label: 'Categories' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/shop/dashboard', label: 'Shop Dashboard' },
];

export const defaultShopProfile: ShopHeaderProfile = {
  shopName: 'Atelier Chronos & Optics',
  ownerName: 'Phạm Thùy Dương',
  roleBadge: 'SHOP OWNER',
};

// 2. 6 Metric Bento Cards
export const shopMetricsData: MetricOverview[] = [
  {
    id: 'm1',
    title: 'Sản phẩm RENT',
    count: '18',
    unit: 'máy',
    subtitle: '8 cho thuê · 10 sẵn sàng',
    icon: 'camera',
    link: '/shop/rent/products',
  },
  {
    id: 'm2',
    title: 'Đơn thuê RENT',
    count: '06',
    unit: 'đơn',
    subtitle: '1 chờ đối kiểm · 2 chờ giao',
    icon: 'sync_alt',
    link: '/shop/rent/orders',
    highlightColor: '#ba1a1a',
  },
  {
    id: 'm3',
    title: 'Kho lưu ký RENT',
    count: '24',
    unit: 'món',
    subtitle: '3 món sẵn sàng THRIFT',
    icon: 'inventory_2',
    link: '/shop/rent/inventory',
  },
  {
    id: 'm4',
    title: 'Mục đăng THRIFT',
    count: '32',
    unit: 'mục',
    subtitle: '28 đang mở · 4 chờ duyệt',
    icon: 'verified',
    link: '/shop/thrift/listings',
  },
  {
    id: 'm5',
    title: 'Đơn mua THRIFT',
    count: '05',
    unit: 'đơn',
    subtitle: '2 giữ cọc Escrow · 1 đóng gói',
    icon: 'shopping_bag',
    link: '/shop/thrift/orders',
  },
  {
    id: 'm6',
    title: 'Doanh thu xưởng',
    count: '148.25M',
    unit: '₫',
    subtitle: '+18.4% chu kỳ tuần',
    icon: 'payments',
    link: '/shop/revenue',
  },
];

// 3. Đơn RENT cần xử lý
export const rentAttentionData: RentAttentionItem[] = [
  {
    id: '8845',
    orderCode: '#RH-RNT-2024-8845',
    customerName: 'Elena Rostova',
    statusText: 'Cần đối kiểm quang học',
    statusType: 'URGENT',
    productTitle: 'Hasselblad 907X 50C + XCD 45mm f/4 P',
    depositAmount: '16.000.000 ₫',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOIs620Y4IWLjBHbcrAgrBBBw7epsAWYxnRXIqsvUr-9cmwlaC-z_PjfxpLuQAC1NCUsAf2qzfUceBxIpeg_Y8w5RJYFH9KHB9vr2EL6lDqlKGeB2sG4pzdz3s40eybTcjvItbUS357PBby79ylYSpIEkmDpkmBsF-To02NuWiB1MdqQKSx54D-P_zqP7dh8fs8tsC8DZjXJ3CjvdIJ4lNOxLL18sQd1rvVOhDxGc',
    notice: 'Khách đã hoàn trả vali Nanuk tại bưu cục. Cần hoàn tất kiểm tra sensor & ngàm ống kính trong 3 giờ 42 phút.',
    actionText: 'Vào bàn nghiệm thu',
    actionIcon: 'smb_share',
    detailUrl: '/shop/rent/orders/8845',
  },
  {
    id: '8904',
    orderCode: '#RH-RNT-2024-8904',
    customerName: 'Đào Minh Quân',
    statusText: 'Đã thanh toán Escrow',
    statusType: 'ESCROW_PAID',
    productTitle: 'Leica M6 Classic Titanium Finish',
    depositAmount: '20.000.000 ₫',
    duration: '03 ngày (14/04 - 17/04)',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCsHEnVQb388HNCcNdbfKL_V-I9aYHS6xRsBy5b3858m863nhj4QmitgMntQLkvFfr65zJq8RB1ldho7yO3k6APml95rdaM_7xdzHTyYWiymFYp3y2kJ5xSwOlEB8LuvMgYD8VYRqzWYEAFhPx1T1nj4zMtA4vkB-od_6SCQXxTLlmbT3AFeUTrbtRak71hGUAt0aFUmhIdkfvAgWGCCwUVgz6Gf0zAMTTt4rRxG6ER',
    notice: 'Chu kỳ thuê: 03 ngày (14/04 - 17/04)',
    actionText: 'Tạo vận đơn Nanuk',
    actionIcon: 'package_2',
    detailUrl: '/shop/rent/orders/8904',
  },
];

export const rentSubCardsData = [
  {
    code: '#8930',
    status: 'Chờ duyệt',
    title: 'Sony FX3 Cinema Line Kit',
    customer: 'Trần Đức Nam',
    link: '/shop/rent/orders/8930',
    linkText: 'Xét duyệt hồ sơ →',
  },
  {
    code: '#8819',
    status: 'Trả sớm',
    title: 'Canon EOS R6 Mark II + 24-70',
    customer: 'Sophie Lin',
    link: '/shop/rent/orders/8819',
    linkText: 'Xem lộ trình thu hồi →',
  },
];

// 4. Đơn THRIFT cần xử lý
export const thriftAttentionData: ThriftAttentionItem[] = [
  {
    id: '0814',
    orderCode: '#RH-THF-2025-0814',
    buyerName: 'Elena Rostova',
    statusText: 'Đang kẹp chì & seal bảo chứng',
    productTitle: 'Leica M6 Classic 0.72x + Summicron 35mm f/2',
    price: '100.750.000 ₫ (Escrow Lock)',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKVyvw0cIaNlPvFnGTaFG1zQxHMkIv74gTSJ0QNcWsn4koGmyL5dPUunopkySWWwOdnnhQaoHxy-gqr6e3z-OqEK4_92dXalDW1UdhnQmccWIJbvXylshnGlmWkwwYzBZeJNb0Wz80eOqJJ8NFA3inNuRrNWJy4HfpQBLhxs0ByKMcjyfpaSzE-ElV0kdrbJvSQCW60eC-ih91Cd6PyjcnwFJuzDS97-xng7otchHt',
    notice: 'Cửa sổ kiểm hàng 72 giờ kích hoạt khi giao',
    actionText: 'Ký số niêm phong',
    actionIcon: 'lock',
    detailUrl: '/shop/thrift/orders/0814',
  },
  {
    id: '0902',
    orderCode: '#RH-THF-2025-0902',
    buyerName: 'Kyoto Minimalist',
    statusText: 'Đã giao bưu tá',
    productTitle: 'Áo khoác Yohji Yamamoto Wool Gabardine 1998',
    price: '34.800.000 ₫',
    trackingCode: 'VN-EXP-992014',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPUnOjap2q-owEeAI5jOSI6Fge7ivQywE09SU4CpCNMQW1lZmPk0z5br5sTTZUFKlF5OzM1tNPbAIhwN6gB3kjYFGz5534CpIP_X_CfnrlSYd_jV-Xz5X-i2N_EQQDhYsN6Zd_mwblCz-uLii03hYLSTIptxfMWTEGehB8INon1Vn0AqM9Y68eOPKBwJsffTcLW_7Md2JJ7qgmq2MgG9jJvOZVA5A80DROVfkSZqpg',
    notice: 'Mã theo dõi: VN-EXP-992014',
    actionText: 'Chi tiết vận đơn →',
    detailUrl: '/shop/thrift/orders/0902',
  },
];

export const thriftSubCardsData = [
  {
    code: '#0720',
    status: 'Khiếu nại',
    title: 'Rolex Oyster Perpetual 34mm',
    meta: '72.150.000 ₫ · Khách: H.N. Minh',
    link: '/shop/thrift/orders/0720',
    linkText: 'Mở biên bản đối thoại →',
    isAlert: true,
  },
  {
    code: '#1021',
    status: 'Chờ Admin duyệt',
    title: 'Bang & Olufsen Beogram 4002',
    meta: '49.300.000 ₫ · Bán đứt 1-of-1',
    link: '/shop/thrift/listings/1021',
    linkText: 'Kiểm tra thông số →',
    isAlert: false,
  },
];

// 5. Chu kỳ khép kín Circular Protocol
export const circularProtocolSteps: CircularProtocolStep[] = [
  { step: '01', title: 'THUÊ (RENT)', description: 'Đăng ký & cọc' },
  { step: '02', title: 'SỬ DỤNG (USE)', description: 'Bảo hiểm trọn gói' },
  { step: '03', title: 'HOÀN TRẢ', description: 'Vali Nanuk bọc thép' },
  { step: '04', title: 'ĐỐI KIỂM', description: 'Phòng sạch xưởng' },
  { step: '05', title: 'TÁI SỬ DỤNG', description: 'Tối đa 15 chu kỳ' },
  { step: '06', title: 'BÁN ĐỨT (THRIFT)', description: 'Di sản sưu tầm', isHighlight: true },
];

// 6. 6 Lối tắt thao tác nhanh
export const quickActionsData: QuickActionItem[] = [
  {
    id: 'qa1',
    title: 'Tạo sản phẩm RENT',
    description: 'Khởi tạo mã tài sản cho thuê mới, thiết lập giá theo ngày, tuần và tiền cọc bảo chứng.',
    icon: 'add_to_photos',
    link: '/shop/rent/create',
  },
  {
    id: 'qa2',
    title: 'Tạo món đồ THRIFT',
    description: 'Niêm yết hiện vật bán đứt 1-of-1, tải ảnh thẩm định quang học và chứng chỉ xuất xưởng.',
    icon: 'sell',
    link: '/shop/thrift/listings/create',
  },
  {
    id: 'qa3',
    title: 'Quản lý kho hiện vật',
    description: 'Theo dõi serial number, lịch sử bảo dưỡng buồng tối và chu kỳ số lần cho thuê của từng máy.',
    icon: 'qr_code_scanner',
    link: '/shop/rent/inventory',
  },
  {
    id: 'qa4',
    title: 'Xem đơn thuê RENT',
    description: 'Điều phối toàn bộ 11 bước vòng đời đơn thuê từ ký quỹ, bàn giao đến nghiệm thu hoàn cọc.',
    icon: 'fact_check',
    link: '/shop/rent/orders',
  },
  {
    id: 'qa5',
    title: 'Xem đơn mua THRIFT',
    description: 'Quản lý đơn mua đứt, theo dõi mã seal bọc chì và kích hoạt giải phóng ký quỹ 72 giờ.',
    icon: 'local_shipping',
    link: '/shop/thrift/orders',
  },
  {
    id: 'qa6',
    title: 'Xem báo cáo doanh thu',
    description: 'Đối soát dòng tiền ký quỹ Smart Escrow, xuất hóa đơn VAT tuần hoàn và lịch rút tiền xưởng.',
    icon: 'account_balance',
    link: '/shop/revenue',
  },
];

// 7. Giao diện khách hàng nhìn thấy
export const marketplacePreviewData: MarketplacePreviewItem[] = [
  {
    id: 'live1',
    badge: 'RENT LIVE',
    badgeColorClass: 'bg-[#D8E3CE] text-[#3F4A3A]',
    displayId: 'ID: #RNT-LIVE-08',
    title: 'Canon EOS R6 Mark II + RF 24-70mm f/2.8L',
    price: '450.000 ₫ / ngày',
    statusText: 'Tình trạng: Khả dụng xuất kho trong 2 giờ',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADrg_p2g9N84EUKMtGae-fliel5TNE4iTDxUzRAtzp4xnT8Vd3WyDVd70OsZOdGWvIUZFd1o-aGRWH8Y0dtLeB8JzzkCk1exNQiRFLYKt-yiKwCMXV5HyfLYJAQyyULPGnbOT1VGQGw7IYZ3OivtASp_J-YJ0N-KG9-XpAXVJjgcYd7Kx6LbzDmazvyb9C6S_C_-Gh5Hy_GSWfxKLZAYE1LjWdVErDBmkML0WOWtJU',
  },
  {
    id: 'live2',
    badge: 'THRIFT LIVE 1-OF-1',
    badgeColorClass: 'bg-[#F0E0CB] text-[#4F4535]',
    displayId: 'ID: #THF-LIVE-24',
    title: 'Leica M6 Classic Silver Chrome (1988 Serial)',
    price: '68.000.000 ₫',
    statusText: 'Tình trạng: Nguyên bản 94%, phòng ẩm bảo quản',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDerwKE8lXShWcwFC6YvQw1F6eMMWMC6fK2YNJOqHVJ-yqaMB31lwzgEKFLbwhNwloIJS3WmDnUiDQfDGxqLtNgTWWEAs-SsXUDKD5RAlsbFN8rjC7qib88hChp_UQ0drQTopsBnLslWlkloE0n61M7iOsg5vnpYo0Ik2fnan1fuaAhA9EvjyH0ggBjyLVCU7nXGPm78kJKSqUXsMcYf2s9Mhn5HAZo-dkoiC8KXE36',
  },
];