import { RENT_PRODUCTS, type Product as RentMarketProduct } from '../pages/data/rent/marketplaceData';
import { THRIFT_PRODUCTS, type ThriftProduct } from '../pages/data/thrift/thriftMarketplaceData';
import { RENT_PRODUCT_DETAILS_MAP } from '../pages/data/rent/rentOrderDetailData';
import {
  CAMERA_CATEGORY_CONFIG,
  FASHION_CATEGORY_CONFIG,
  SHOES_CATEGORY_CONFIG,
  CAMPING_CATEGORY_CONFIG,
  ELECTRONICS_CATEGORY_CONFIG,
  BOOKS_CATEGORY_CONFIG,
  LIFESTYLE_CATEGORY_CONFIG,
  type CategoryDetailProduct,
} from '../pages/data/categories/categoryDetailData';

export interface ResolvedWishlistProduct {
  id: string;
  mode: 'rent' | 'thrift';
  title: string;
  description: string;
  image: string;
  category: string;
  categoryLabel: string;
  gradeBadge: string;
  price: number;
  priceUnit: string;
  deposit: number;
  available: boolean;
  availabilityLabel: string;
  availabilityBadge?: string;
  location: string;
  origin: string;
  certLabel: string;
  href: string;
}

// Known MongoDB products fallback dictionary
const MONGO_RENTAL_PRODUCTS: Record<string, Partial<ResolvedWishlistProduct>> = {
  "6acee0804c6e5d97a2389e4f": {
    "title": "Sony Alpha A7 IV Kit",
    "description": "Máy ảnh mirrorless chuyên nghiệp Sony A7 IV kèm ống kính kit, cảm biến 33MP, quay 4K 60p sắc nét.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 450000,
    "deposit": 2000000,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCVnSQ6kvsJ6DxJIvv2pi3AAWJYbGWlRw8oTuyWmVCDILWkQsLSfvD01kMlL9OXDn9YM1K6JYsZivR7ONBnoowg5ng5rnDV6Jr5Z8wD-KrpaLR4fpcu5NCf6i6HQwrd8WI3xqykuYx3ol5LZ9QO3agKknyMUT-2QZmrKNoCBRBjK8nq72d4HvE_ZagqStc9b8LcNnrAbk5HuLJpMBFOWJJhqF6a3k7eHnMQH2cqG3Zg",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e4f"
  },
  "6acee0804c6e5d97a2389e50": {
    "title": "Party Dress Thiết Kế Tối Giản",
    "description": "Đầm dạ hội phong cách tối giản thanh lịch, chất vải lụa cao cấp, thích hợp dự tiệc và sự kiện.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 180000,
    "deposit": 800000,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAtmXKLrFBh-ULvSwIfPH1-6Wt20ZZ6MVkUuMWLCglFjw1kWB6QFMzh2-V6BXtow5H6r3Mbt8RSgMy-DL2iSfu901WIFIU_yZfWuObWTRd4NoP9Nh1jctTIF7wGjHkgI4D5oxH6_dDBVra7zeHdkwYMXvpTTvPzpsf0XKcML75jinBrzziZBMszcYr5tYuRg6PC9_OCoBVNoPUb4MfpHrUPrGF2yzFQQLz7iIk6cPu5",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e50"
  },
  "6acee0804c6e5d97a2389e51": {
    "title": "Classic Sneakers Da Thật Archive",
    "description": "Giày sneaker da thật archive phong cách vintage cổ điển, êm chân và bền bỉ.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 150000,
    "deposit": 600000,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCBGX9MLaXkDPpkpvRKdy2axzNTQbnNx_zdNdPhaZIyGar7jQumeRDAiXCgdqV-vo2remereT9vKy1u0lXTPcTjUwHWw2BUN5nVjtbW3A7Kck2D8oSAuMlA4YWikHGVx2wLPa4O73p6BniZAEsLW2gaF64ui2yqlzuI6QxQw-FAJ6EEbSwiKl9WQGZVRuhW0izycAPRBT0Wp20b8b6yIXFPDTRtD61j3kfI03X6CBtE",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e51"
  },
  "6acee0804c6e5d97a2389e52": {
    "title": "Đầm Dạ Hội Lụa Satin Cao Cấp Dáng Xòe",
    "description": "Đầm dạ hội lụa satin xẻ tà cao cấp, tôn dáng thanh lịch, hoàn hảo cho các buổi tiệc gala sang trọng.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 250000,
    "deposit": 1000000,
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e52"
  },
  "6acee0804c6e5d97a2389e53": {
    "title": "Canon EOS R6 Mark II Mirrorless",
    "description": "Thân máy ảnh Canon EOS R6 Mark II cảm biến 24.2MP, chống rung IBIS, lấy nét tự động mắt cực nhanh.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 500000,
    "deposit": 2500000,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDm9RHp_nAFGyZAGYxDLuSj2aEJ1h1N-U9WI7PAFWW7ZyfVfl1i_9SppV5JiKn77I8cJ_bsDk1yKDbhK7ua6iE0__0FrQpGra28G6Yt_gWfXn44AauvwE85glJuv7mhovOe_fQm_64353WGhh-yXyasdXNywXSTsgjbqL6GWjRg7xe-alf5PYk6YJEQ4Ew9ZErc7V38NU-BCrvgK7m2VReo2j_s_PneV8IEQBWJ0hmx",
    "location": "TP. Hồ Chí Minh",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e53"
  },
  "6acee0804c6e5d97a2389e54": {
    "title": "Áo Khoác Dạ Wool Dáng Dài Cao Cấp",
    "description": "Áo khoác dạ lông cừu dáng dài thời thượng, giữ ấm hoàn hảo cho mùa đông và các chuyến du lịch Đà Lạt, Hà Nội.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 220000,
    "deposit": 900000,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBmFHFDSIg4hOhOPqA36mT1kkDCl3WPEhUJRK08XZrwDTHzuiTwpPS19S9rp72RfWd75ovkeghRObBnjMEjwjM4C-han-LYxuwvvmbNoQxfmQdJ0b32KcCw-X0Jnqe_U23o9wu4QRqi1jvm0k2QIjvQX3uucHyHqIp2-wcXnh_PJzwTUThv7mBwqwtAjiXdUPGAdc-I8uwnLjfVeTg2aWPw2sXhSqhHAp-MSwbmguRZ",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e54"
  },
  "6acee0804c6e5d97a2389e55": {
    "title": "Dây Chuyền Ngọc Trai Nước Ngọt Khóa Vàng 18K Luxury",
    "description": "Dây chuyền ngọc trai nước ngọt tự nhiên thượng hạng kết hợp khóa cài vàng 18K tinh xảo, phụ kiện sang trọng hoàn hảo cho dạ tiệc.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade A (95%)",
    "price": 320000,
    "deposit": 1500000,
    "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e55"
  },
  "6acee0804c6e5d97a2389e56": {
    "title": "Giày Cao Gót Mũi Nhọn Satin Đính Đá Dự Tiệc",
    "description": "Giày cao gót satin đính đá pha lê cao cấp 7cm, êm chân, phom dáng chuẩn couture thời thượng.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 160000,
    "deposit": 700000,
    "image": "/images/shoesrent.jpg",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6acee0804c6e5d97a2389e56"
  },
  "6ad286f6f507857852155c5a": {
    "title": "Fujifilm X-T5 Mirrorless Body Silver Edition",
    "description": "Máy ảnh mirrorless cảm biến X-Trans CMOS 5 HR 40.2MP, giả lập film màu cổ điển tuyệt đẹp.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 380000,
    "deposit": 1800000,
    "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5a"
  },
  "6ad286f6f507857852155c5b": {
    "title": "Sony FE 24-70mm f/2.8 GM II Lens",
    "description": "Ống kính zoom tiêu chuẩn G Master thế hệ 2 siêu nhẹ, độ sắc nét toàn dải khung hình.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 300000,
    "deposit": 1500000,
    "image": "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5b"
  },
  "6ad286f6f507857852155c5c": {
    "title": "Nikon Z6 II Mirrorless Kit 24-70mm f/4 S",
    "description": "Bộ máy ảnh Nikon Z6 II fullframe cảm biến 24.5MP BSI, chip xử lý kép EXPEED 6.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 390000,
    "deposit": 1700000,
    "image": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5c"
  },
  "6ad286f6f507857852155c5d": {
    "title": "DJI RS 3 Pro Gimbal Combo Chống Rung",
    "description": "Hệ thống gimbal chống rung sợi carbon siêu nhẹ chịu tải 4.5kg, lấy nét LiDAR chuẩn xác.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 250000,
    "deposit": 1200000,
    "image": "https://images.unsplash.com/photo-1589872516422-72c723f5e9ce?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5d"
  },
  "6ad286f6f507857852155c5e": {
    "title": "Canon RF 50mm f/1.2L USM Prime Lens",
    "description": "Ống kính tiêu cự cố định cao cấp dòng L của Canon, khẩu độ f/1.2 cho bokeh mịn màng.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 280000,
    "deposit": 1400000,
    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5e"
  },
  "6ad286f6f507857852155c5f": {
    "title": "Giày Derby Da Bò Mộc Cổ Điển Oxford Captoe",
    "description": "Giày tây da bò mộc đánh màu patina thủ công, phom dáng chuẩn phong cách quý ông cổ điển.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 140000,
    "deposit": 700000,
    "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c5f"
  },
  "6ad286f6f507857852155c60": {
    "title": "Giày Cao Gót Louboutin So Kate Da Bóng 10cm",
    "description": "Thiết kế giày cao gót đế đỏ huyền thoại, da bóng sang trọng tôn vinh đường cong phái đẹp.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 220000,
    "deposit": 1200000,
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c60"
  },
  "6ad286f6f507857852155c61": {
    "title": "Giày Loafer Da Thật Đế Vibram Cực Êm",
    "description": "Giày lười penny loafer da bê cao cấp, đế cao su Vibram nhẹ và êm, phù hợp mọi sự kiện.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 130000,
    "deposit": 600000,
    "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c61"
  },
  "6ad286f6f507857852155c62": {
    "title": "Giày Sandal Cao Gót Quai Mảnh Ánh Kim Dự Tiệc",
    "description": "Sandal cao gót quai mảnh mạ ánh kim lấp lánh, đệm lót êm chân chuyên dành cho tiệc tối.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 160000,
    "deposit": 800000,
    "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c62"
  },
  "6ad286f6f507857852155c63": {
    "title": "Giày Chelsea Boots Da Thật Màu Nâu Đất",
    "description": "Chelsea boots da bò sáp tự nhiên bụi bặm cá tính, chun co giãn cao cấp bền đẹp.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 150000,
    "deposit": 750000,
    "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c63"
  },
  "6ad286f6f507857852155c64": {
    "title": "Đầm Dạ Hội Cúp Ngực Đính Pha Lê Đuôi Cá",
    "description": "Đầm dạ hội dáng đuôi cá cúp ngực đính kết pha lê thủ công lấp lánh cho sự kiện thảm đỏ.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 350000,
    "deposit": 1800000,
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c64"
  },
  "6ad286f6f507857852155c65": {
    "title": "Đầm Tiệc Nhung Đỏ Trễ Vai Cổ Điển Hoàng Gia",
    "description": "Chất liệu nhung the cao cấp màu đỏ ruby quyến rũ, thiết kế trễ vai quý phái và tôn da.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 280000,
    "deposit": 1400000,
    "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c65"
  },
  "6ad286f6f507857852155c66": {
    "title": "Váy Dự Tiệc Phối Ren Haute Couture Pháp",
    "description": "Ren chỉ thêu tay nhập khẩu tinh xảo trên nền voan lụa cao cấp, lót lụa tơ tằm mềm mại.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 310000,
    "deposit": 1600000,
    "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c66"
  },
  "6ad286f6f507857852155c67": {
    "title": "Đầm Maxi Tơ Tằm Họa Tiết Hoa Dạ Tiệc Sang Trọng",
    "description": "Đầm dáng dài tơ tằm bồng bềnh nữ tính, họa tiết vẽ tay thủ công cho tiệc cưới ngoài trời.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade A (95%)",
    "price": 260000,
    "deposit": 1200000,
    "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c67"
  },
  "6ad286f6f507857852155c68": {
    "title": "Váy Dạ Hội Xẻ Tà Lụa Satin Màu Vàng Champagne",
    "description": "Màu vàng champagne ánh kim kiêu sa, đường xẻ tà quyến rũ khéo léo khoe đôi chân dài.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 290000,
    "deposit": 1500000,
    "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c68"
  },
  "6ad286f6f507857852155c69": {
    "title": "Bộ Suit May Đo Wool Cao Cấp Phong Cách Ý",
    "description": "Bộ suit 2 mảnh vải wool Super 120s nhập khẩu Ý, đường cắt may đo chuẩn phom lịch lãm.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 260000,
    "deposit": 1300000,
    "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c69"
  },
  "6ad286f6f507857852155c6a": {
    "title": "Áo Măng Tô Trench Coat Kaki Chống Nước Dáng Rộng",
    "description": "Áo măng tô dáng dài kiểu dáng kinh điển, chất vải gabardine chống nước nhẹ cản gió tốt.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 190000,
    "deposit": 950000,
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6a"
  },
  "6ad286f6f507857852155c6b": {
    "title": "Áo Blazer Dạ Tweed Nút Đồng Vintage Anh Quốc",
    "description": "Blazer dạ tweed dệt họa tiết xương cá phong cách cổ điển Anh quốc, nút đồng đúc vintage.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 170000,
    "deposit": 850000,
    "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6b"
  },
  "6ad286f6f507857852155c6c": {
    "title": "Set Áo Dài Tơ Tằm Thêu Tay Truyền Thống Dự Lễ",
    "description": "Áo dài lụa tơ tằm thêu hoa sen thủ công tỉ mỉ kèm quần lụa mềm mại cho lễ tiệc truyền thống.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 220000,
    "deposit": 1100000,
    "image": "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6c"
  },
  "6ad286f6f507857852155c6d": {
    "title": "Áo Len Cashmere Cổ Lọ 100% Tự Nhiên Siêu Mềm",
    "description": "Len lông dê Cashmere Mông Cổ cao cấp giữ ấm hoàn hảo, chạm da êm ái không ngứa ngáy.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 140000,
    "deposit": 700000,
    "image": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6d"
  },
  "6ad286f6f507857852155c6e": {
    "title": "Quạt Gấp Lụa Tơ Tằm Cầm Tay Vẽ Hoa Sen Thủ Công",
    "description": "Quạt xếp lụa tơ tằm cao cấp khung nan tre già hun khói, vẽ tranh hoa sen thủy mặc tinh tế.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 70000,
    "deposit": 350000,
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6e"
  },
  "6ad286f6f507857852155c6f": {
    "title": "Bông Tai Bạc Ý S925 Đính Đá Moissanite Dáng Dài",
    "description": "Bông tai dáng dài lấp lánh đính đá Moissanite giác cắt kim cương, tôn vinh nét thanh tú bờ vai.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 90000,
    "deposit": 450000,
    "image": "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c6f"
  },
  "6ad286f6f507857852155c70": {
    "title": "Vòng Tay Ngọc Bích Phỉ Thúy Tự Nhiên Bọc Vàng 14K",
    "description": "Ngọc phỉ thúy xanh ngọc bích nước ngọc trong veo, bọc họa tiết hoa văn vàng 14K quý phái.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 180000,
    "deposit": 900000,
    "image": "https://images.unsplash.com/photo-1611591475870-20c93a0279c6?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c70"
  },
  "6ad286f6f507857852155c71": {
    "title": "Dây Chuyền Mặt Kim Cương Nhân Tạo Bạc S925 Tinh Xảo",
    "description": "Mặt dây chuyền viên chủ 1 carat đính đá chấu hoa tinh tế, dây bạc Ý mạ bạch kim bóng bẩy.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 110000,
    "deposit": 550000,
    "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c71"
  },
  "6ad286f6f507857852155c72": {
    "title": "Bộ Cài Áo Trâm Ngọc Trai Hoàng Gia Cho Dạ Hội",
    "description": "Trâm cài áo hoa đính ngọc trai tự nhiên và pha lê Swarovski, điểm nhấn sang trọng cho áo vest hoặc đầm.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 80000,
    "deposit": 400000,
    "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "rent",
    "href": "/rent/products/6ad286f6f507857852155c72"
  },
  "6ad273b0f22df3063ffd9985": {
    "title": "Vintage Leather Jacket",
    "description": "Vintage Leather Jacket - Tình trạng Rất tốt (95%). Nguồn: Đồ đã qua sử dụng. Kiểm định bởi: Shop Owner",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 850000,
    "deposit": 0,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDNH-0eROeU6E1QWBPqGUZxtudCKHUCDCiHWUb3nUY6dQgFrc_2yUZ3WM-68q1qK9W8xAhgkGAPyQfNsDHJfCzBY2gVYh-GAYZOeFmJtP396Wroljg8SHqbpHAxAApJv1Kl2b_uN8HjNNKUmPSfoWs_D4zcZ1CcCTTfbgOSygaUl68Ol-TCeoyceH8WU0MarU1LfIwm4HnJNziZwGjSvkrQ0b80uI6d1jK6Kcmdu_CJ",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd9985"
  },
  "6ad273b0f22df3063ffd9986": {
    "title": "Classic Sneakers",
    "description": "Classic Sneakers - Tình trạng Đã qua sử dụng (90%). Nguồn: Đồ đã qua sử dụng. Kiểm định bởi: Shop Owner",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 1200000,
    "deposit": 0,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDRX9_Lupi6ioKrTI6CdqUT2LoTPoPPDYope2NS1SXs83eJ30IPao3gwJ2NOmYoeYV4y3JS0AuNH--7g5Z4qFhIOpyB1JWHyTRX5CQamxtzAZ7CDYtmPQI_-JgQ4ew31pRDRXNyWYGanKJWjVqqovQffSBtjOHr9dPh9_adUdEZqnn0AAdm8-0zoHagZYrmYFdjimASLAe40LrLzXCmTK-J31sByBu4qvD_G6bfiVzO",
    "location": "TP. Hồ Chí Minh",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd9986"
  },
  "6ad273b0f22df3063ffd9987": {
    "title": "Canon EOS Camera Kit",
    "description": "Canon EOS Camera Kit - Tình trạng Rất tốt (95%). Nguồn: Từ sản phẩm RENT. Kiểm định bởi: Shop Owner",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 6500000,
    "deposit": 0,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAMAKgDMSt6wNOlVFkkr0lPT5lLpBq4yxdV9cvFVYiIglQtjUxbPXaEIUa90if6y7j1b-xwqtrv6DvB5AwdmnNtTGdhMpXr9LywaWWRKSyy8FsuQAaQrntoCgwMonixUaVaqk-5y_DhVTse9ZhZkcztFMrg1pUReap6uTAzwWmuCUyltP8yTAlzi_FjNxH0FGs0USpuKxbhEy_knpnJuDtgauRkEA3IcCxHaZ9oZ9nl",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd9987"
  },
  "6ad273b0f22df3063ffd9988": {
    "title": "Bông Tai Ngọc Trai Nước Ngọt Chốt Bạc S925",
    "description": "Bông tai nụ ngọc trai tự nhiên nước ngọc sáng bóng, chốt cài bạc Ý S925 không gây kích ứng da.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade A (95%)",
    "price": 650000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd9988"
  },
  "6ad273b0f22df3063ffd9989": {
    "title": "Leica M6 Classic Rangefinder",
    "description": "Leica M6 Classic Rangefinder - Tình trạng Grade Mint (98%). Nguồn: Đồ đã qua sử dụng. Kiểm định bởi: Shop Owner",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 68000000,
    "deposit": 0,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAqSEj-qjFlgj4F7C2BHlI_RiTibcpTaqo0YpRL4Fic26yZ39AB8JHfFd9tlhgjJeqPCSldXRsmPDuNgK3rTIuuau-N5YugtaNwYwxbnlmDskyjvDAQdc5g4zyDPKtqITVMDRuFELuBQqJi7j5Fs96tpUGkfObwUSoXGbUNVyP3BGsnrrSu96cjzgKmqdfWrISzgDX0iT1CtUP3N4PoiDV8nxQFUZdIBLQ2r0D8IKGQ",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd9989"
  },
  "6ad273b0f22df3063ffd998a": {
    "title": "Áo Khoác Dạ Wool Dáng Dài",
    "description": "Áo Khoác Dạ Wool Dáng Dài - Tình trạng Rất tốt (95%). Nguồn: Từ sản phẩm RENT. Kiểm định bởi: Shop Owner",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 1450000,
    "deposit": 0,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuC0JEhXA2GX02l44kXc-KLB8ZswWNd7PNAWiOR7L083YFF0MuCZopf796nCSeWS0rvx7GbBdgXriJJfsHTMLEEu5n7kCRmSvgnDAZ2777GpgwHhP4fUDmU57eG50J5YSukwVXR0aeKZ3I3KaUOL5MDfXVKgfVctXs6f-0BzRpKIbdt4yBEzipU3udGuY6e0G3G526vTQy9sQJQDHxXuL06kEWIltMiAxR_DFBk550cF",
    "location": "TP. Hồ Chí Minh",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd998a"
  },
  "6ad273b0f22df3063ffd998b": {
    "title": "Đầm Dạ Hội Dự Tiệc Vintage Đính Hạt Tinh Xảo",
    "description": "Đầm dạ hội phong cách vintage đính cườm thủ công, chất liệu voan lụa cao cấp, hoàn hảo cho tiệc đêm.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade A (95%)",
    "price": 3800000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd998b"
  },
  "6ad273b0f22df3063ffd998c": {
    "title": "Quạt Gấp Xếp Nan Gỗ Đàn Hương Khắc Laze Chạm Trổ",
    "description": "Quạt xếp nan gỗ đàn hương tự nhiên tỏa hương thơm dịu, chạm trổ hoa văn rồng phượng cổ điển.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade A (95%)",
    "price": 850000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad273b0f22df3063ffd998c"
  },
  "6ad286f6f507857852155c73": {
    "title": "Fujifilm X100V Black Edition Compact",
    "description": "Máy ảnh compact cao cấp phiên bản màu đen, ống kính 23mm f/2 thế hệ mới, số shot 3.200.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 28500000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c73"
  },
  "6ad286f6f507857852155c74": {
    "title": "Sony Alpha A6400 kèm Kit 16-50mm",
    "description": "Máy ảnh crop lấy nét Real-time Eye AF cực nhanh, ngoại hình đẹp 96%, đầy đủ pin sạc túi.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 13800000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c74"
  },
  "6ad286f6f507857852155c75": {
    "title": "Olympus OM-D E-M10 Mark IV Mirrorless",
    "description": "Máy ảnh phong cách hoài cổ gọn nhẹ, chống rung 5 trục trong thân máy, cảm biến 20MP.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade A (95%)",
    "price": 1120000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c75"
  },
  "6ad286f6f507857852155c76": {
    "title": "Ống Kính Sigma 30mm f/1.4 DC DN for Sony E",
    "description": "Ống kính chân dung khẩu lớn f/1.4 sắc nét ngay từ khẩu tối đa, thấu kính không trầy xước.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 4600000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c76"
  },
  "6ad286f6f507857852155c77": {
    "title": "GoPro Hero 11 Black Action Camera Fullbox",
    "description": "Camera hành trình quay 5.3K 60fps, chống rung HyperSmooth 5.0, kèm 2 pin và thẻ nhớ 128GB.",
    "category": "Camera",
    "categoryLabel": "Camera",
    "gradeBadge": "Grade Mint 99%",
    "price": 6500000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c77"
  },
  "6ad286f6f507857852155c78": {
    "title": "Giày Chelsea Boots Da Lộn Màu Nâu Vintage",
    "description": "Giày boot da lộn màu nâu vintage, đế khâu tay chắc chắn, đã vệ sinh và chống thấm.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 1650000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c78"
  },
  "6ad286f6f507857852155c79": {
    "title": "Giày Sneaker Common Projects Achilles Low White",
    "description": "Đôi sneaker da trắng tối giản cao cấp từ Ý, dập số vàng serial nguyên bản ở gót.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 4200000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c79"
  },
  "6ad286f6f507857852155c7a": {
    "title": "Giày Cao Gót Mũi Vuông Da Nappa Retro",
    "description": "Giày cao gót mũi vuông gót khối 5cm da nappa mềm mại, phong cách retro vintage Pháp.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 1250000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7a"
  },
  "6ad286f6f507857852155c7b": {
    "title": "Giày Mules Da Thật Gót Trụ Thanh Lịch",
    "description": "Giày sục hở gót da cừu êm chân, màu be kem thanh lịch dễ phối đồ công sở và dạo phố.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade A (95%)",
    "price": 950000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7b"
  },
  "6ad286f6f507857852155c7c": {
    "title": "Giày Tây Monkstrap Da Ý Khóa Đồng Cổ Điển",
    "description": "Giày da khóa đôi Double Monkstrap cao cấp, da bóng đẹp không nếp gấp sâu, đế da sang trọng.",
    "category": "Giày dép",
    "categoryLabel": "Giày dép",
    "gradeBadge": "Grade Mint 99%",
    "price": 1850000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7c"
  },
  "6ad286f6f507857852155c7d": {
    "title": "Đầm Tiệc Lụa Satin Màu Xanh Rêu Quý Phái",
    "description": "Đầm lụa satin xanh rêu cổ đổ gợi cảm, phom suông thanh lịch đã giặt hấp vô trùng.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 2450000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7d"
  },
  "6ad286f6f507857852155c7e": {
    "title": "Váy Dạ Hội Thiết Kế Lệch Vai Tôn Dáng Tối Giản",
    "description": "Thiết kế lệch vai một bên hiện đại, chất liệu thun tuyết mưa dày dặn giữ phom chuẩn.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade A (95%)",
    "price": 1950000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7e"
  },
  "6ad286f6f507857852155c7f": {
    "title": "Đầm Dạ Tiệc Dáng Suông Phối Áo Choàng Voan",
    "description": "Set đầm dự tiệc kèm áo choàng voan thêu hoa tinh tế, phù hợp các buổi dạ tiệc trang trọng.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 2100000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c7f"
  },
  "6ad286f6f507857852155c80": {
    "title": "Váy Cưới Đi Bàn Lụa Mikado Tinh Khôi",
    "description": "Váy cưới ngắn đi bàn chất liệu lụa Mikado cao cấp, đính nơ to bản sau lưng điệu đà.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade Mint 99%",
    "price": 3500000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c80"
  },
  "6ad286f6f507857852155c81": {
    "title": "Đầm Cocktail Sequins Ánh Bạc Lấp Lánh Night Out",
    "description": "Đầm cocktail ôm sát đính kim sa ánh bạc lấp lánh dưới ánh đèn, phong cách tiệc đêm cá tính.",
    "category": "Đầm dự tiệc",
    "categoryLabel": "Đầm dự tiệc",
    "gradeBadge": "Grade A (95%)",
    "price": 1650000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c81"
  },
  "6ad286f6f507857852155c82": {
    "title": "Áo Blazer Linen Phom Rộng Phong Cách Minimalism",
    "description": "Blazer vải linen tự nhiên màu cát sa mạc, phom dáng oversize thoải mái thoáng mát.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 1450000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c82"
  },
  "6ad286f6f507857852155c83": {
    "title": "Áo Khoác Biker Da Thật Archive Thập Niên 90",
    "description": "Áo khoác biker da bò dày dặn dập vân tự nhiên, khóa kim loại YKK to bản đậm chất rock.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 3400000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c83"
  },
  "6ad286f6f507857852155c84": {
    "title": "Quần Âu Xếp Ly Dáng Rộng Vải Wool Pha Tuyết Mưa",
    "description": "Quần tây xếp ly đôi cạp cao ống rộng suông thẳng, tôn chiều cao và che khuyết điểm.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 780000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c84"
  },
  "6ad286f6f507857852155c85": {
    "title": "Áo Sơ Mi Lụa Tơ Tằm Cổ Điển Tay Bồng",
    "description": "Sơ mi lụa tơ tằm trắng ngà mềm mướt, cổ áo thắt nơ nhẹ nhàng và cổ tay bồng duyên dáng.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade Mint 99%",
    "price": 890000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c85"
  },
  "6ad286f6f507857852155c86": {
    "title": "Áo Cardigan Dệt Kim Họa Tiết Retro Cổ Điển",
    "description": "Áo khoác cardigan len mềm ấm cúng, hàng cúc sừng tự nhiên, phối đồ thu đông cực xinh.",
    "category": "Quần áo",
    "categoryLabel": "Quần áo",
    "gradeBadge": "Grade A (95%)",
    "price": 650000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c86"
  },
  "6ad286f6f507857852155c87": {
    "title": "Dây Chuyền Bạc Ý S925 Mặt Cỏ Bốn Lá May Mắn",
    "description": "Dây chuyền bạc S925 mặt cỏ bốn lá xà cừ đen hai mặt viền hạt bi, phong cách Van Cleef sang chảnh.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 750000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c87"
  },
  "6ad286f6f507857852155c88": {
    "title": "Lắc Tay Bạc S925 Đính Đá Pha Lê Lấp Lánh",
    "description": "Lắc tay bạc dạng chuỗi tennis đính đá pha lê trắng trong suốt, khóa gài hai nấc an toàn.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade A (95%)",
    "price": 680000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1611591475870-20c93a0279c6?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c88"
  },
  "6ad286f6f507857852155c89": {
    "title": "Bông Tai Kẹp Vành Tai Họa Tiết Bướm Đính Đá Retro",
    "description": "Khuyên kẹp vành tai không cần xỏ lỗ hình cánh bướm tiên cảnh, đính đá vi lượng sáng rực.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 420000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=60",
    "location": "TP. HCM",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c89"
  },
  "6ad286f6f507857852155c8a": {
    "title": "Quạt Tròn Cầm Tay Lụa Cung Đình Thêu Hạc Thủ Công",
    "description": "Quạt tròn lụa tơ tằm thêu chim hạc và mây lành cổ phong, cán quạt gỗ mun gắn tua rua mềm mại.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade Mint 99%",
    "price": 580000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=60",
    "location": "Hà Nội",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c8a"
  },
  "6ad286f6f507857852155c8b": {
    "title": "Bộ Trâm Cài Tóc Cổ Phong Đính Ngọc Mạ Vàng Cổ Điển",
    "description": "Trâm cài tóc búi phong cách hoàng kim cổ điển, hoa mai đính ngọc bích nhân tạo và tua rua vàng.",
    "category": "Phụ kiện",
    "categoryLabel": "Phụ kiện",
    "gradeBadge": "Grade A (95%)",
    "price": 490000,
    "deposit": 0,
    "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=60",
    "location": "Đà Nẵng",
    "mode": "thrift",
    "href": "/thrift/6ad286f6f507857852155c8b"
  }
};

const ALL_CATEGORY_CONFIGS = [
  CAMERA_CATEGORY_CONFIG,
  FASHION_CATEGORY_CONFIG,
  SHOES_CATEGORY_CONFIG,
  CAMPING_CATEGORY_CONFIG,
  ELECTRONICS_CATEGORY_CONFIG,
  BOOKS_CATEGORY_CONFIG,
  LIFESTYLE_CATEGORY_CONFIG,
];

/**
 * Tra cứu thông tin sản phẩm đầy đủ từ bất kỳ ID hoặc Slug nào
 */
export function resolveWishlistProduct(rawId: string): ResolvedWishlistProduct | null {
  if (!rawId) return null;
  const targetId = String(rawId).trim();
  const lower = targetId.toLowerCase();

  // 1. Kiểm tra MongoDB ID mapping
  if (MONGO_RENTAL_PRODUCTS[targetId]) {
    const m = MONGO_RENTAL_PRODUCTS[targetId];
    return {
      id: targetId,
      mode: m.mode || 'rent',
      title: m.title || 'Thiết bị lưu ký ReUse',
      description: m.description || 'Sản phẩm đạt chuẩn kiểm định ReUse Standard.',
      image: m.image || '',
      category: m.category || 'Thiết bị lưu ký',
      categoryLabel: m.categoryLabel || 'Lưu ký',
      gradeBadge: m.gradeBadge || 'Grade A+ (Bench Checked)',
      price: m.price || 200000,
      priceUnit: '/ ngày',
      deposit: m.deposit || 1000000,
      available: true,
      availabilityLabel: 'Có sẵn ngay',
      location: m.location || 'TP. Hồ Chí Minh',
      origin: 'Nanuk White-Glove',
      certLabel: 'Smart Escrow',
      href: m.href || `/rent/products/${targetId}`,
    };
  }

  // 2. Tra cứu trong RENT_PRODUCTS (Marketplace RENT)
  const rentMarket = RENT_PRODUCTS.find(
    (p: RentMarketProduct) =>
      p.id === targetId ||
      p.id.toLowerCase() === lower ||
      p.href.toLowerCase().endsWith(`/${lower}`) ||
      p.title.toLowerCase().includes(lower)
  );
  if (rentMarket) {
    const depNum = parseInt(rentMarket.deposit.replace(/\D/g, ''), 10) || rentMarket.price * 5;
    return {
      id: rentMarket.id,
      mode: 'rent',
      title: rentMarket.title,
      description: `Thiết bị lưu giữ tại kho ${rentMarket.location}, chuẩn kiểm định ${rentMarket.conditionLabel}.`,
      image: rentMarket.image,
      category: rentMarket.categoryLabel || 'Camera & Thiết bị',
      categoryLabel: rentMarket.categoryLabel || 'Thuê',
      gradeBadge: rentMarket.conditionLabel || 'Grade A+ (Bench Checked)',
      price: rentMarket.price,
      priceUnit: '/ ngày',
      deposit: depNum,
      available: rentMarket.available,
      availabilityLabel: rentMarket.available ? 'Có sẵn ngay' : 'Đang thuê',
      location: rentMarket.location,
      origin: 'Smart Escrow ReUse',
      certLabel: 'Smart Escrow',
      href: rentMarket.href,
    };
  }

  // 3. Tra cứu trong THRIFT_PRODUCTS (Marketplace THRIFT)
  const thriftMarket = THRIFT_PRODUCTS.find(
    (p: ThriftProduct) =>
      p.id === targetId ||
      p.slug === targetId ||
      p.id.toLowerCase() === lower ||
      p.slug.toLowerCase() === lower ||
      p.href.toLowerCase().endsWith(`/${lower}`)
  );
  if (thriftMarket) {
    return {
      id: thriftMarket.id,
      mode: 'thrift',
      title: thriftMarket.title,
      description: `Đồ sưu tầm độc bản tuyển chọn từ Atelier, nguồn gốc: ${thriftMarket.sourceLabel}.`,
      image: thriftMarket.image,
      category: thriftMarket.categoryLabel || 'Đồ sưu tầm THRIFT',
      categoryLabel: thriftMarket.categoryLabel || 'Thrift',
      gradeBadge: thriftMarket.condition || 'Grade A Mint',
      price: thriftMarket.price,
      priceUnit: '',
      deposit: 0,
      available: true,
      availabilityLabel: '1-OF-1 ARCHIVE',
      location: thriftMarket.location,
      origin: thriftMarket.verifiedBy || 'Tokyo Vault',
      certLabel: 'Silvergrain Certified',
      href: thriftMarket.href,
    };
  }

  // 4. Tra cứu trong RENT_PRODUCT_DETAILS_MAP
  if (RENT_PRODUCT_DETAILS_MAP[targetId]) {
    const detail = RENT_PRODUCT_DETAILS_MAP[targetId];
    return {
      id: detail.id,
      mode: 'rent',
      title: detail.title,
      description: detail.overview?.[0] || detail.subtitle,
      image: detail.images?.[0]?.src || '',
      category: detail.category || 'Camera & Quang học',
      categoryLabel: detail.category,
      gradeBadge: detail.grade || 'Grade A+ (Bench Checked)',
      price: detail.pricePerDay,
      priceUnit: '/ ngày',
      deposit: detail.deposit,
      available: true,
      availabilityLabel: 'Có sẵn ngay',
      location: detail.location || 'Đà Nẵng',
      origin: 'Nanuk 920 Box',
      certLabel: 'Smart Escrow',
      href: `/rent/products/${detail.slug || detail.id}`,
    };
  }

  // 5. Tra cứu trong tất cả các Category configs (rentItems & thriftItems)
  for (const cat of ALL_CATEGORY_CONFIGS) {
    // Check rentItems
    const rItem = cat.rentItems.find(
      (it: CategoryDetailProduct) =>
        it.id === targetId ||
        it.id.toLowerCase() === lower ||
        it.href.toLowerCase().endsWith(`/${lower}`)
    );
    if (rItem) {
      return {
        id: rItem.id,
        mode: 'rent',
        title: rItem.title,
        description: rItem.description,
        image: rItem.image,
        category: cat.title,
        categoryLabel: cat.title,
        gradeBadge: rItem.gradeBadge || 'Grade A+ (Bench Checked)',
        price: rItem.price,
        priceUnit: '/ ngày',
        deposit: rItem.deposit || rItem.price * 5,
        available: true,
        availabilityLabel: 'Có sẵn ngay',
        location: rItem.locationBadge || 'Toàn quốc',
        origin: 'ReUse Hub Escrow',
        certLabel: 'Smart Escrow',
        href: rItem.href,
      };
    }

    // Check thriftItems
    const tItem = cat.thriftItems.find(
      (it: CategoryDetailProduct) =>
        it.id === targetId ||
        it.id.toLowerCase() === lower ||
        it.href.toLowerCase().endsWith(`/${lower}`)
    );
    if (tItem) {
      return {
        id: tItem.id,
        mode: 'thrift',
        title: tItem.title,
        description: tItem.description,
        image: tItem.image,
        category: cat.title,
        categoryLabel: cat.title,
        gradeBadge: tItem.gradeBadge || 'Grade A Mint',
        price: tItem.price,
        priceUnit: '',
        deposit: 0,
        available: true,
        availabilityLabel: '1-OF-1 ARCHIVE',
        location: tItem.locationBadge || 'Toàn quốc',
        origin: 'Atelier Vault',
        certLabel: 'Silvergrain Certified',
        href: tItem.href,
      };
    }
  }

  return null;
}
