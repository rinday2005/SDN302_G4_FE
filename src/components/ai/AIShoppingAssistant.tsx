import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useShop } from '../../context/ShopContext';
import { getMyRentalOrdersApi, type RentalOrderApi } from '../../services/order.api';
import { sendAIChatPromptApi } from '../../services/ai.api';
import {
  getPublicRentProductsApi,
  getPublicRentProductDetailApi,
  type RentalProductApi,
} from '../../services/rentProduct.api';
import {
  getPublicThriftListingsApi,
  getPublicThriftListingByIdApi,
  type ThriftListingItemApi,
} from '../../services/thrift.api';
import {
  AI_MOCK_PRODUCTS_DB,
  DEFAULT_USER_PREFERENCES,
  mapShopProductToAIRec,
  type AIMessage,
  type AIProductRecommendation,
  type AIConversationSession,
  type UserAIPreferences,
  type AIOrderSummaryCard,
} from '../../data/aiAssistantMockDb';

const mapRentalApiToAIRec = (
  p: RentalProductApi,
  days = 4,
  maxBudget = 300000
): AIProductRecommendation => {
  const price = Number(p.pricePerDay) || 180000;
  const deposit = Number(p.depositAmount) || price * 4;
  const isWithinBudget = price <= maxBudget;
  const catName =
    typeof p.categoryId === 'object' && p.categoryId?.name
      ? p.categoryId.name
      : typeof p.category === 'object' && p.category?.name
        ? p.category.name
        : typeof p.category === 'string'
          ? p.category
          : 'Thời trang cho thuê';
  const img =
    Array.isArray(p.images) && p.images[0]
      ? p.images[0]
      : 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80';
  return {
    id: String(p._id),
    sku: p.sku || String(p._id),
    name: p.name,
    type: 'RENT',
    category: catName,
    brand: (typeof p.ownerId === 'object' && p.ownerId?.shopProfile?.shopName) || 'ReUse Atelier',
    image: img,
    pricePerDay: price,
    depositAmount: deposit,
    originalRetailPrice: deposit * 2,
    conditionGrade: p.condition || 'Như mới 99% (Grade A+)',
    budgetTag: isWithinBudget ? 'Phù hợp ngân sách' : 'Thiết kế Cao cấp',
    calculatedDays: days,
    calculatedTotalRent: price * days,
    location: p.location || 'Đà Nẵng',
    highlights: [
      p.description ? p.description.slice(0, 110) : 'Trang phục chuẩn kiểm định ReUse Hub',
    ],
    pros: [
      `Sẵn sàng giao từ chi nhánh ${p.location || 'Đà Nẵng'}`,
      'Bảo vệ 100% tiền cọc qua Smart Escrow',
      'Đã giặt hấp khử trùng trước khi giao',
    ],
    cons: [p.rentalRules || 'Tránh tiếp xúc hóa chất tẩy mạnh'],
    detailUrl: `/rent/products/${p._id}`,
  };
};

const mapThriftApiToAIRec = (
  p: ThriftListingItemApi
): AIProductRecommendation => {
  const price = Number(p.price) || 590000;
  const catName =
    typeof p.categoryId === 'object' && p.categoryId?.name
      ? p.categoryId.name
      : typeof p.category === 'object' && p.category?.name
        ? p.category.name
        : p.categoryLabel || 'Thời trang thanh lý';
  const img =
    Array.isArray(p.images) && p.images[0]
      ? p.images[0]
      : 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80';
  return {
    id: String(p._id),
    sku: String(p._id),
    name: p.name || p.title || 'Trang phục Second-Life',
    type: 'THRIFT',
    category: catName,
    brand: (typeof p.ownerId === 'object' && p.ownerId?.shopProfile?.shopName) || 'ReUse Thrift Atelier',
    image: img,
    thriftPrice: price,
    originalRetailPrice: Math.round(price * 2.2),
    conditionGrade: p.condition || 'Như mới (98%)',
    budgetTag: 'Tiết kiệm Second-Life',
    location: p.location || 'Đà Nẵng',
    highlights: [
      p.description ? p.description.slice(0, 110) : 'Sản phẩm Second-Life chính hãng đã qua kiểm định',
    ],
    pros: [
      'Tiết kiệm 50% – 70% so với giá mua mới',
      `Sẵn sàng giao ngay từ chi nhánh ${p.location || 'Đà Nẵng'}`,
    ],
    cons: ['Số lượng giới hạn trong kho thanh lý'],
    detailUrl: `/thrift/${p._id}`,
  };
};

const formatVND = (n: number) => `${Math.round(n || 0).toLocaleString('vi-VN')}đ`;

const normalizeVi = (str = '') =>
  String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP_WORDS_VI = new Set([
  'minh', 'toi', 'em', 'shop', 'oi', 'cho', 'hoi', 'tim', 'kiem', 'can', 'muon',
  'thue', 'mua', 'do', 'san', 'pham', 'mon', 'cai', 'chiec', 'bo', 'co', 'khong',
  'ko', 'la', 'gi', 'nao', 'o', 'dau', 'voi', 'va', 'hoac', 'duoi', 'tren',
  'khoang', 'tam', 'gia', 'ngan', 'sach', 'ngay', 'tuan', 'thang', 'di', 'du',
  'lich', 'tiec', 'su', 'kien', 'chup', 'hinh', 'anh', 'tu', 'van', 'giup',
  'xem', 'chi', 'tiet', 'thong', 'tin', 've', 'cua', 'nay', 'do', 'kia', 'mot',
  'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin', 'muoi', 'k', 'vnd', 'dong',
]);

const CATEGORY_SYNONYM_GROUPS = [
  {
    key: 'PARTY_DRESS',
    label: 'Đầm dự tiệc & Váy thời trang',
    queryKeywords: ['dam', 'vay', 'maxi', 'midi', 'sequin', 'sequins', 'da hoi', 'du tiec', 'gala', 'party dress', 'cocktail', 'cup nguc', 'xe ta', 'nhung', 'lua', 'voan', 'ren', 'hoa nhi', 'babydoll', 'vintage', 'retro', 'co vuong', 'hai day'],
    productKeywords: ['dam', 'vay', 'maxi', 'midi', 'sequin', 'party dress', 'da hoi', 'babydoll', 'hoa nhi', 'voan', 'lua', 'nhung', 'ren', 'gala'],
  },
  {
    key: 'AO_DAI',
    label: 'Áo dài truyền thống & Cách tân',
    queryKeywords: ['ao dai', 'cach tan', 'truyen thong', 'gam', 'to tam', 'theu hoa'],
    productKeywords: ['ao dai', 'cach tan', 'to tam', 'gam'],
  },
  {
    key: 'SUIT_VEST',
    label: 'Suit, Vest & Tuxedo lịch lãm',
    queryKeywords: ['suit', 'vest', 'tuxedo', 'comple', 'ao vest', 'bo vest', 'lich lam', 'chu re', 'cong so'],
    productKeywords: ['suit', 'vest', 'tuxedo'],
  },
  {
    key: 'OUTERWEAR',
    label: 'Áo khoác dạ, Trench Coat & Blazer',
    queryKeywords: ['ao khoac', 'khoac', 'trench coat', 'mang to', 'blazer', 'ao da', 'wool', ' tweed', 'khoac da', 'mua dong', 'da lat', 'sapa'],
    productKeywords: ['ao khoac', 'trench coat', 'blazer', 'wool', 'tweed', 'khoac da'],
  },
  {
    key: 'KNITWEAR',
    label: 'Áo len, Cardigan & Thời trang thu đông',
    queryKeywords: ['ao len', 'cardigan', 'len', 'det kim', 'co lo', 'thu dong', 'han quoc'],
    productKeywords: ['ao len', 'cardigan', 'len'],
  },
  {
    key: 'SKIRT_SET',
    label: 'Chân váy & Set bộ thời trang',
    queryKeywords: ['chan vay', 'xep ly', 'tennis', 'set bo', 'set tweed', 'set cardigan', 'ao so mi', 'so mi', 'linen'],
    productKeywords: ['chan vay', 'set', 'so mi', 'linen'],
  },
  {
    key: 'SHOES',
    label: 'Giày cao gót, Sneaker & Boots',
    queryKeywords: ['giay', 'cao got', 'sneaker', 'sneakers', 'boots', 'boot', 'sandal', 'stiletto', 'slingback', 'giay da', 'giay cuoi', 'chelsea', 'oxford', 'loafer', 'ankle'],
    productKeywords: ['giay', 'cao got', 'sneaker', 'boots', 'boot', 'sandal', 'stiletto', 'slingback', 'chelsea', 'oxford', 'loafer'],
  },
  {
    key: 'ACCESSORIES',
    label: 'Phụ kiện, Túi xách, Trang sức & Kính mắt',
    queryKeywords: ['phu kien', 'tui', 'clutch', 'vi', 'bong tai', 'khuyen tai', 'day chuyen', 'vong co', 'ngoc trai', 'cai ao', 'tram cai', 'kinh', 'kinh mat', 'khan', 'khan choang', 'that lung', 'belt', 'no', 'ca vat'],
    productKeywords: ['phu kien', 'clutch', 'tui', 'bong tai', 'day chuyen', 'vong co', 'ngoc trai', 'cai ao', 'kinh', 'khan', 'that lung', 'no', 'ca vat'],
  },
];

function scoreProductAgainstQuery(item: AIProductRecommendation, rawQuery: string) {
  const qNorm = normalizeVi(rawQuery);
  const nameNorm = normalizeVi(item.name);
  const catNorm = normalizeVi(item.category);
  const descNorm = normalizeVi([...(item.pros || []), item.budgetTag || ''].join(' '));

  if (!qNorm) return { score: 0, isExactNameMatch: false, matchedGroup: null as (typeof CATEGORY_SYNONYM_GROUPS)[0] | null };

  let score = 0;
  let isExactNameMatch = false;
  let matchedGroup: (typeof CATEGORY_SYNONYM_GROUPS)[0] | null = null;

  if (nameNorm && (qNorm.includes(nameNorm) || (nameNorm.includes(qNorm) && qNorm.length >= 6))) {
    score += 120;
    isExactNameMatch = true;
  }

  for (const grp of CATEGORY_SYNONYM_GROUPS) {
    const queryHasGroup = grp.queryKeywords.some((kw) => qNorm.includes(kw));
    if (queryHasGroup) {
      const prodMatchesGroup = grp.productKeywords.some(
        (pk) => nameNorm.includes(pk) || catNorm.includes(pk)
      );
      if (prodMatchesGroup) {
        score += 45;
        matchedGroup = grp;
      } else {
        score -= 20;
      }
    }
  }

  const tokens = qNorm.split(' ').filter((t) => t.length >= 2 && !STOP_WORDS_VI.has(t) && !/^\d+$/.test(t));
  let matchedTokenCount = 0;
  for (const token of tokens) {
    if (nameNorm.split(' ').includes(token)) {
      score += 18;
      matchedTokenCount++;
    } else if (nameNorm.includes(token)) {
      score += 10;
      matchedTokenCount++;
    } else if (catNorm.includes(token)) {
      score += 8;
      matchedTokenCount++;
    } else if (descNorm.includes(token)) {
      score += 4;
    }
  }

  if (tokens.length >= 2 && matchedTokenCount >= Math.min(3, tokens.length)) {
    score += 35;
    if (matchedTokenCount === tokens.length) {
      isExactNameMatch = true;
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (nameNorm.includes(bigram)) {
      score += 28;
    }
  }

  return { score, isExactNameMatch, matchedGroup };
}

interface PageContextInfo {
  screenKey:
    | 'HOMEPAGE'
    | 'RENT_MARKETPLACE'
    | 'THRIFT_MARKETPLACE'
    | 'PRODUCT_DETAIL'
    | 'CHECKOUT'
    | 'MY_ORDERS'
    | 'GENERAL';
  screenLabel: string;
  badgeText: string;
  contextHint: string;
  activeProduct?: AIProductRecommendation | null;
  suggestedPrompts: string[];
}

export const AIShoppingAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { products: shopProducts } = useShop();

  const user = auth?.user;
  const isLoggedIn = Boolean(user);
  const userId = user?._id || user?.id || user?.email || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'preferences'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Đơn hàng thực tế của User (nếu đã đăng nhập) để tra cứu đơn & tiền cọc
  const [userOrders, setUserOrders] = useState<RentalOrderApi[]>([]);

  // Cá nhân hóa sở thích của User
  const [preferences, setPreferences] = useState<UserAIPreferences>(() => {
    try {
      const saved = localStorage.getItem(`reuse_ai_prefs_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USER_PREFERENCES;
  });

  // Lịch sử các phiên hội thoại của User
  const [sessions, setSessions] = useState<AIConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem(`reuse_ai_sessions_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dữ liệu sản phẩm thực tế từ MongoDB
  const [publicRentProducts, setPublicRentProducts] = useState<RentalProductApi[]>([]);
  const [publicThriftProducts, setPublicThriftProducts] = useState<ThriftListingItemApi[]>([]);
  const [activeProductDetail, setActiveProductDetail] = useState<AIProductRecommendation | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getPublicRentProductsApi({ limit: 100 }),
      getPublicThriftListingsApi({ limit: 100 }),
    ])
      .then(([rents, thrifts]) => {
        if (!mounted) return;
        if (Array.isArray(rents)) setPublicRentProducts(rents);
        if (Array.isArray(thrifts)) setPublicThriftProducts(thrifts);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Hợp nhất dữ liệu sản phẩm từ MongoDB (RENT & THRIFT) + ShopContext + DB mẫu dự phòng
  const allCatalogProducts = useMemo<AIProductRecommendation[]>(() => {
    const liveRentMapped = publicRentProducts.map((p) =>
      mapRentalApiToAIRec(p, preferences.travelDaysDefault || 4, preferences.maxDailyRentBudget)
    );
    const liveThriftMapped = publicThriftProducts.map((p) =>
      mapThriftApiToAIRec(p)
    );
    const liveShopMapped = shopProducts
      .filter((p) => p.approvalStatus === 'APPROVED' && p.isVisible)
      .map((p) => mapShopProductToAIRec(p, preferences.travelDaysDefault || 4, preferences.maxDailyRentBudget));

    const combinedLive = [...liveRentMapped, ...liveThriftMapped, ...liveShopMapped];
    const existingIds = new Set(combinedLive.map((item) => item.id.toLowerCase()));
    const existingNames = new Set(combinedLive.map((item) => normalizeVi(item.name)));

    const uniqueMock = AI_MOCK_PRODUCTS_DB.filter(
      (item) => !existingIds.has(item.id.toLowerCase()) && !existingNames.has(normalizeVi(item.name))
    );

    return [...combinedLive, ...uniqueMock];
  }, [publicRentProducts, publicThriftProducts, shopProducts, preferences.travelDaysDefault, preferences.maxDailyRentBudget]);

  // Phân tích URL hiện tại để nhận diện xem có đang ở trang chi tiết sản phẩm không
  const segs = useMemo(() => location.pathname.split('/').filter(Boolean), [location.pathname]);
  const lastSeg = segs[segs.length - 1] || '';
  const currentPath = location.pathname.toLowerCase();

  const isRentDetail = useMemo(() => {
    return (
      (currentPath.startsWith('/rent/') &&
        !currentPath.startsWith('/rent/marketplace') &&
        !currentPath.startsWith('/rent/orders') &&
        !currentPath.startsWith('/rent/checkout') &&
        !currentPath.startsWith('/rent/return') &&
        !currentPath.startsWith('/rent/shop') &&
        segs.length >= 2) ||
      currentPath.startsWith('/rent/products/') ||
      currentPath.startsWith('/rent/detail/')
    );
  }, [currentPath, segs.length]);

  const isThriftDetail = useMemo(() => {
    return (
      (currentPath.startsWith('/thrift/') &&
        !currentPath.startsWith('/thrift/marketplace') &&
        !currentPath.startsWith('/thrift/checkout') &&
        !currentPath.startsWith('/thrift/orders') &&
        !currentPath.startsWith('/thrift/shop') &&
        segs.length >= 2) ||
      currentPath.startsWith('/thrift/products/') ||
      currentPath.startsWith('/thrift/detail/')
    );
  }, [currentPath, segs.length]);

  // Tự động tải đúng thông tin sản phẩm người dùng đang xem khi vào trang Chi tiết sản phẩm
  useEffect(() => {
    if (!isRentDetail && !isThriftDetail) {
      setActiveProductDetail(null);
      return;
    }
    if (!lastSeg) return;

    // 1. Kiểm tra xem đã có trong catalog chưa
    const existing = allCatalogProducts.find(
      (p) =>
        p.id.toLowerCase() === lastSeg.toLowerCase() ||
        p.sku.toLowerCase() === lastSeg.toLowerCase()
    );
    if (existing) {
      setActiveProductDetail(existing);
      return;
    }

    // 2. Nếu chưa có (ví dụ người dùng vào thẳng URL chi tiết), fetch trực tiếp từ API
    let isCurrent = true;
    if (isRentDetail) {
      getPublicRentProductDetailApi(lastSeg)
        .then((res) => {
          if (!isCurrent || !res?.product) return;
          const mapped = mapRentalApiToAIRec(
            res.product,
            preferences.travelDaysDefault || 4,
            preferences.maxDailyRentBudget
          );
          setActiveProductDetail(mapped);
        })
        .catch(() => {});
    } else if (isThriftDetail) {
      getPublicThriftListingByIdApi(lastSeg)
        .then((res) => {
          if (!isCurrent || !res) return;
          const mapped = mapThriftApiToAIRec(res);
          setActiveProductDetail(mapped);
        })
        .catch(() => {});
    }

    return () => {
      isCurrent = false;
    };
  }, [
    isRentDetail,
    isThriftDetail,
    lastSeg,
    allCatalogProducts,
    preferences.travelDaysDefault,
    preferences.maxDailyRentBudget,
  ]);

  // Nạp đơn thuê của User khi đăng nhập để AI hỗ trợ tra cứu đơn & cọc
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    let mounted = true;
    getMyRentalOrdersApi({ limit: 20 })
      .then((res) => {
        if (mounted && Array.isArray(res)) {
          setUserOrders(res);
        }
      })
      .catch(() => {
        // Fallback localStorage nếu có
      });
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  // Nhận diện ngữ cảnh màn hình Customer hiện tại (Context-aware)
  const pageContext = useMemo<PageContextInfo>(() => {
    const path = location.pathname.toLowerCase();

    // 1. Màn hình Chi tiết sản phẩm (RENT hoặc THRIFT)
    if (isRentDetail || isThriftDetail) {
      const matched =
        allCatalogProducts.find(
          (p) =>
            p.id.toLowerCase() === lastSeg.toLowerCase() ||
            p.sku.toLowerCase() === lastSeg.toLowerCase()
        ) || activeProductDetail || null;

      return {
        screenKey: 'PRODUCT_DETAIL',
        screenLabel: matched ? `Chi tiết: ${matched.name}` : 'Chi tiết sản phẩm',
        badgeText: 'Hỏi AI về sản phẩm này',
        contextHint: matched
          ? `AI đang nhận diện bạn xem: ${matched.name}`
          : 'Đang xem thông tin chi tiết sản phẩm.',
        activeProduct: matched,
        suggestedPrompts: matched
          ? [
              `Đánh giá ưu/nhược điểm của ${matched.name}`,
              `Tính tổng chi phí thuê ${matched.name} trong 4 ngày`,
              `So sánh ${matched.name} với sản phẩm cùng phân khúc`,
              `Sản phẩm này nên thuê ngắn hạn hay mua thanh lý?`,
            ]
          : [
              'Tư vấn chi tiết sản phẩm này cho mình',
              'Tính chi phí thuê sản phẩm này',
            ],
      };
    }

    // 2. Màn hình Rental / Thrift Checkout
    if (path.includes('/checkout')) {
      const isThriftCheckout = path.includes('/thrift');
      return {
        screenKey: 'CHECKOUT',
        screenLabel: isThriftCheckout ? 'Thanh toán THRIFT' : 'Thanh toán thuê RENT',
        badgeText: 'Giải thích chi phí & cọc',
        contextHint:
          'Đang ở trang Checkout · AI hỗ trợ giải thích chi phí & cơ chế bảo vệ tiền cọc (không tự thanh toán).',
        suggestedPrompts: [
          'Giải thích cách tính tiền thuê, tiền cọc và phí vận chuyển',
          'Khi nào tôi được hoàn lại 100% tiền đặt cọc Smart Escrow?',
          'Biên bản đồng kiểm CLA 3 góc khi nhận hàng là gì?',
        ],
      };
    }

    // 3. Màn hình My Orders / Wallet
    if (path.includes('/orders') || path.includes('/wallet') || path.includes('/user/dashboard')) {
      return {
        screenKey: 'MY_ORDERS',
        screenLabel: 'Đơn hàng & Ví cọc',
        badgeText: 'Tra cứu đơn & hoàn cọc',
        contextHint: 'AI hỗ trợ tra cứu trạng thái đơn thuê, đơn mua và tiến độ hoàn tiền đặt cọc.',
        suggestedPrompts: [
          'Tra cứu các đơn thuê và tiền đặt cọc hiện tại của mình',
          'Quy trình yêu cầu trả đồ và hoàn cọc diễn ra thế nào?',
          'Nếu trả đồ sớm hơn lịch hẹn thì tính phí sao?',
        ],
      };
    }

    // 4. Màn hình RENT Marketplace
    if (path.startsWith('/rent')) {
      return {
        screenKey: 'RENT_MARKETPLACE',
        screenLabel: 'RENT Marketplace',
        badgeText: 'Tìm đồ thuê bằng AI',
        contextHint: 'Đang ở sàn RENT · Nhập tên sản phẩm hoặc nhu cầu tự nhiên (đầm dạ hội, vest, giày, phụ kiện...).',
        suggestedPrompts: [
          'Mình cần thuê đầm dạ hội dự tiệc Gala 4 ngày, ngân sách dưới 300.000đ/ngày.',
          'Tìm áo khoác dạ hoặc blazer đi Đà Lạt cuối tuần',
          'Tìm giày cao gót hoặc phụ kiện phối đồ dự tiệc',
        ],
      };
    }

    // 5. Màn hình THRIFT Marketplace
    if (path.startsWith('/thrift')) {
      return {
        screenKey: 'THRIFT_MARKETPLACE',
        screenLabel: 'THRIFT Marketplace',
        badgeText: 'Tư vấn đồ thanh lý',
        contextHint: 'Đang ở sàn THRIFT · Tư vấn chọn trang phục Second-Life chuẩn kiểm định.',
        suggestedPrompts: [
          'Tư vấn các mẫu quần áo thanh lý THRIFT đáng mua nhất hiện nay',
          'Tìm đầm hoa nhí hoặc set cardigan thanh lý THRIFT',
          'Khi nào nên mua đồ THRIFT thay vì thuê RENT?',
        ],
      };
    }

    // 6. Homepage hoặc trang chung
    return {
      screenKey: 'HOMEPAGE',
      screenLabel: 'Trang chủ ReUse Hub',
      badgeText: 'ReUse AI Assistant',
      contextHint: 'Trợ lý mua sắm & thuê thời trang thông minh · Hỏi tên sản phẩm nào ra đúng sản phẩm đó.',
      suggestedPrompts: [
        'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
        'Tìm bộ Suit / Vest nam lịch lãm hoặc Áo dài truyền thống',
        'Tính chi phí thuê trang phục 4 ngày kèm tiền đặt cọc',
        'Tư vấn khi nào nên thuê (RENT) và khi nào nên mua (THRIFT)?',
      ],
    };
  }, [
    location.pathname,
    allCatalogProducts,
    activeProductDetail,
    isRentDetail,
    isThriftDetail,
    lastSeg,
  ]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Lưu lịch sử hội thoại cho User đã đăng nhập
  const persistSession = (updatedMessages: AIMessage[]) => {
    if (!isLoggedIn || updatedMessages.length === 0) return;
    const firstUserMsg = updatedMessages.find((m) => m.sender === 'user')?.text || 'Hội thoại tư vấn AI';
    const sessionTitle = firstUserMsg.length > 46 ? `${firstUserMsg.slice(0, 46)}...` : firstUserMsg;
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    setSessions((prev) => {
      const currentSession: AIConversationSession = {
        id: prev[0]?.id || `sess-${Date.now()}`,
        title: sessionTitle,
        updatedAt: nowStr,
        messages: updatedMessages,
      };
      const next = [currentSession, ...prev.slice(1, 8)];
      try {
        localStorage.setItem(`reuse_ai_sessions_${userId}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Bộ xử lý AI thông minh dựa trên dữ liệu thực + ngữ cảnh trang
  const generateAIResponse = (rawQuery: string): AIMessage => {
    const q = rawQuery.toLowerCase();
    const qNorm = normalizeVi(rawQuery);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const daysMatch = q.match(/(\d+)\s*ngày/);
    const days = daysMatch ? Math.max(1, Number(daysMatch[1])) : preferences.travelDaysDefault || 4;

    let maxBudget = 300000;
    let hasExplicitBudget = false;
    const kMatch = q.match(/(\d+)\s*k\b/);
    const fullNumMatch = q.match(/(\d{2,3})[.,](\d{3})/);
    if (fullNumMatch) {
      maxBudget = Number(`${fullNumMatch[1]}${fullNumMatch[2]}`);
      hasExplicitBudget = true;
    } else if (kMatch) {
      maxBudget = Number(kMatch[1]) * 1000;
      hasExplicitBudget = true;
    } else if (isLoggedIn && preferences.maxDailyRentBudget) {
      maxBudget = preferences.maxDailyRentBudget;
    }

    // Chấm điểm tất cả sản phẩm theo câu hỏi
    const scoredAll = allCatalogProducts
      .map((item) => ({
        item,
        ...scoreProductAgainstQuery(item, rawQuery),
      }))
      .sort((a, b) => b.score - a.score);

    // 1B. KỊCH BẢN HƯỚNG DẪN CÁCH THUÊ ĐỒ & CHÍNH SÁCH / THỦ TỤC (CHỈ TRẢ LỜI VĂN BẢN, KHÔNG GỬI SẢN PHẨM)
    const hasHowOrGuide =
      qNorm.includes('huong dan') ||
      qNorm.includes('cach') ||
      qNorm.includes('quy trinh') ||
      qNorm.includes('lam sao') ||
      qNorm.includes('lam the nao') ||
      qNorm.includes('nhu the nao') ||
      qNorm.includes('the nao') ||
      qNorm.includes('chi toi') ||
      qNorm.includes('chi minh') ||
      qNorm.includes('chi em') ||
      qNorm.includes('cho toi biet') ||
      qNorm.includes('cac buoc') ||
      qNorm.includes('thu tuc');

    const isHowToRent =
      (hasHowOrGuide && (qNorm.includes('thue') || qNorm.includes('muon'))) ||
      qNorm.includes('cach thue') ||
      qNorm.includes('thue do nhu the nao') ||
      qNorm.includes('thue nhu the nao') ||
      qNorm.includes('thue the nao') ||
      qNorm.includes('lam sao de thue') ||
      qNorm.includes('lam the nao de thue') ||
      qNorm.includes('huong dan thue') ||
      qNorm.includes('quy trinh thue') ||
      qNorm.includes('cac buoc thue') ||
      qNorm.includes('muon thue do thi') ||
      qNorm.includes('thu tuc thue');

    if (isHowToRent) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Hướng dẫn quy trình thuê đồ trên ReUse Hub',
        bannerSubtitle: 'Chỉ với 4 bước đơn giản, minh bạch và bảo vệ 100% tiền cọc.',
        text:
          'Để thuê trang phục trên **ReUse Hub**, bạn chỉ cần thực hiện theo **4 bước** sau:\n\n' +
          '**Bước 1 — Chọn trang phục & Lịch thuê:**\n' +
          '• Vào mục **RENT Marketplace**, chọn mẫu trang phục bạn ưng ý.\n' +
          '• Chọn kích cỡ (Size), ngày bắt đầu nhận đồ và số ngày muốn thuê.\n\n' +
          '**Bước 2 — Đặt đơn & Khóa cọc Smart Escrow:**\n' +
          '• Tiến hành thanh toán **Tiền thuê + Tiền đặt cọc bảo chứng**.\n' +
          '• Khoản tiền cọc của bạn được khóa an toàn trong hợp đồng **Smart Escrow** của hệ thống (Chủ shop không thể tự ý rút).\n\n' +
          '**Bước 3 — Nhận đồ & Đồng kiểm CLA:**\n' +
          '• Trang phục được giặt hấp khử trùng tia UV-C và giao tận nơi.\n' +
          '• Khi nhận hàng, bạn kiểm tra đồ và chụp 3 góc xác nhận biên bản điện tử **CLA** để bảo vệ quyền lợi khỏi các lỗi có sẵn.\n\n' +
          '**Bước 4 — Trả đồ & Hoàn cọc 100% tự động:**\n' +
          '• Mặc xong bạn **không cần tự giặt**, chỉ cần bấm **"Yêu cầu trả đồ"** trong mục Đơn hàng.\n' +
          '• Ngay khi xưởng nghiệm thu xong, **100% tiền đặt cọc** sẽ được hoàn tự động về Ví khả dụng của bạn!',
        recommendations: [],
        quickFollowUps: [
          'Khi nào tôi được hoàn lại 100% tiền đặt cọc Smart Escrow?',
          'Nếu trả đồ sớm hoặc trễ lịch hẹn thì tính phí thế nào?',
          'Tìm đầm dạ hội dự tiệc sang trọng',
        ],
      };
    }

    const isHowToBuyThrift =
      (hasHowOrGuide &&
        (qNorm.includes('mua') || qNorm.includes('dat hang') || qNorm.includes('order')) &&
        (qNorm.includes('thrift') ||
          qNorm.includes('thanh ly') ||
          qNorm.includes('second life') ||
          qNorm.includes('do cu') ||
          qNorm.includes('mua dut'))) ||
      qNorm.includes('cach mua') ||
      qNorm.includes('huong dan mua') ||
      qNorm.includes('quy trinh mua') ||
      qNorm.includes('mua nhu the nao') ||
      qNorm.includes('mua the nao') ||
      qNorm.includes('mua do nhu the nao') ||
      qNorm.includes('mua thanh ly the nao') ||
      qNorm.includes('lam sao de mua');

    if (isHowToBuyThrift) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Hướng dẫn mua đồ thanh lý (THRIFT) trên ReUse Hub',
        bannerSubtitle: 'Sở hữu trang phục Second-Life chuẩn kiểm định tiết kiệm 50% – 70%.',
        text:
          'Cách mua đứt trang phục tại sàn **THRIFT Marketplace** rất đơn giản:\n\n' +
          '• **Bước 1:** Vào mục **THRIFT**, chọn món đồ bạn yêu thích và xem kỹ thông số độ mới (Grade A+ / Như mới 98%-99%).\n' +
          '• **Bước 2:** Thêm vào giỏ hàng và thanh toán trực tiếp (**Không cần đặt cọc** như khi thuê đồ).\n' +
          '• **Bước 3:** Nhận hàng tận nơi, được quyền đồng kiểm chất lượng đúng như mô tả kiểm định trước khi xác nhận hoàn tất đơn!',
        recommendations: [],
        quickFollowUps: [
          'Khi nào nên thuê (RENT) và khi nào nên mua (THRIFT)?',
          'Cách thuê đồ như thế nào?',
          'Tư vấn các mẫu quần áo thanh lý THRIFT đáng mua nhất hiện nay',
        ],
      };
    }

    const isPolicyFaq =
      qNorm.includes('tra do the nao') ||
      qNorm.includes('tra do nhu the nao') ||
      qNorm.includes('khi nao duoc hoan') ||
      qNorm.includes('khi nao toi duoc hoan') ||
      qNorm.includes('khi nao hoan') ||
      qNorm.includes('bao lau duoc hoan') ||
      qNorm.includes('bao lau thi hoan') ||
      qNorm.includes('hoan coc') ||
      qNorm.includes('tra coc') ||
      (qNorm.includes('tien coc') &&
        (qNorm.includes('bao lau') ||
          qNorm.includes('khi nao') ||
          qNorm.includes('the nao') ||
          qNorm.includes('nhu the nao') ||
          qNorm.includes('la gi') ||
          qNorm.includes('hoan') ||
          qNorm.includes('giu') ||
          qNorm.includes('co mat khong'))) ||
      qNorm.includes('smart escrow la gi') ||
      qNorm.includes('cla la gi') ||
      qNorm.includes('bien ban dong kiem') ||
      qNorm.includes('tra do som') ||
      qNorm.includes('tra do tre') ||
      qNorm.includes('tra muon') ||
      qNorm.includes('co can giat') ||
      qNorm.includes('phi ship') ||
      qNorm.includes('phi van chuyen') ||
      qNorm.includes('doi size') ||
      qNorm.includes('giay to') ||
      qNorm.includes('cccd');

    if (isPolicyFaq) {
      if (qNorm.includes('tra do som') || qNorm.includes('tra do tre') || qNorm.includes('tra muon')) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: nowTime,
          bannerTitle: 'Chính sách Trả đồ Sớm hạn & Trễ hạn',
          bannerSubtitle: 'Linh hoạt và minh bạch theo từng ngày sử dụng thực tế.',
          text:
            '• **Trả sớm hơn lịch hẹn:** Hoàn trả sớm ít nhất 24h, bạn được hoàn lại **50% tiền thuê của các ngày chưa dùng** cùng với 100% tiền đặt cọc.\n' +
            '• **Trả trễ hoặc cần gia hạn:** Bấm **"Gia hạn thuê"** trên đơn hàng trước khi hết hạn để giữ giá tốt. Trả trễ không báo trước sẽ tính phí **120% đơn giá thuê/ngày**.',
          recommendations: [],
          quickFollowUps: [
            'Cách thuê đồ như thế nào?',
            'Khi nào tôi được hoàn lại 100% tiền đặt cọc Smart Escrow?',
          ],
        };
      }

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Cơ chế Tiền cọc Smart Escrow & Biên bản CLA',
        bannerSubtitle: 'Bảo vệ quyền lợi 100% minh bạch và không giữ giấy tờ tùy thân.',
        text:
          '• **Không giữ giấy tờ CCCD:** Toàn bộ giao dịch bảo chứng qua tiền cọc Smart Escrow trên hệ thống.\n' +
          '• **Biên bản CLA 3 góc:** Chụp ảnh ghi nhận khi nhận đồ giúp bạn an tâm không bị quy trách nhiệm cho lỗi có sẵn.\n' +
          '• **Hoàn cọc 100%:** Ngay sau khi xưởng nhận lại đồ và kiểm tra hoàn tất, tiền cọc tự động hoàn về Ví khả dụng.',
        recommendations: [],
        quickFollowUps: [
          'Cách thuê đồ như thế nào?',
          'Nếu trả đồ sớm hơn lịch hẹn thì tính phí sao?',
        ],
      };
    }

    // 1. KỊCH BẢN TRA CỨU ĐƠN HÀNG & TIỀN CỌC (MY ORDERS / WALLET)
    if (
      q.includes('tra cứu') ||
      q.includes('đơn thuê') ||
      q.includes('đơn mua') ||
      q.includes('hoàn cọc') ||
      (q.includes('tiền cọc') && (q.includes('của mình') || q.includes('hiện tại')))
    ) {
      if (!isLoggedIn) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: nowTime,
          bannerTitle: 'Cần đăng nhập để tra cứu hồ sơ cá nhân',
          bannerSubtitle: 'Khách (Guest) vẫn có thể tìm kiếm, so sánh và ước tính chi phí tự do.',
          text: 'Với vai trò Guest, mình có thể giúp bạn tìm kiếm trang phục, phân tích ưu/nhược điểm và ước tính chi phí thuê. Để tra cứu trực tiếp mã đơn thuê, trạng thái vận chuyển và số dư tiền đặt cọc Smart Escrow của riêng bạn, vui lòng đăng nhập tài khoản Customer nhé!',
          quickFollowUps: [
            'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
            'Giải thích cơ chế bảo vệ tiền cọc Smart Escrow',
          ],
        };
      }

      const defaultItem = allCatalogProducts[0] || AI_MOCK_PRODUCTS_DB[0];
      const realOrderCards: AIOrderSummaryCard[] =
        userOrders.length > 0
          ? userOrders.slice(0, 3).map((o) => {
              const firstTitle = o.items?.[0]?.productName || defaultItem.name;
              const st = (o.status || 'RENTING').toUpperCase();
              const isCompleted = st === 'COMPLETED';
              return {
                orderCode: o.orderCode?.startsWith('#') ? o.orderCode : `#${o.orderCode || o._id.slice(-6)}`,
                productName: firstTitle,
                type: 'RENT',
                statusLabel:
                  st === 'COMPLETED'
                    ? 'Đã hoàn tất & Hoàn cọc'
                    : st === 'RETURN_REQUESTED' || st === 'RETURNED'
                      ? 'Đang đối kiểm hoàn cọc'
                      : 'Đang trong kỳ thuê',
                depositAmount: Number(o.depositAmount) || 500000,
                escrowStatus: isCompleted
                  ? 'Đã giải tỏa 100% về Ví khả dụng'
                  : 'Đang khóa bảo chứng trong Smart Escrow',
                expectedRefundNote: isCompleted
                  ? 'Tiền cọc đã cộng vào Số dư khả dụng tại Ví của bạn.'
                  : 'Hoàn tự động ngay sau khi xưởng hoàn tất đối kiểm CLA khi trả đồ.',
                detailUrl: `/rent/orders/${o._id}`,
              };
            })
          : [
              {
                orderCode: '#RH-RNT-6519',
                productName: defaultItem.name,
                type: 'RENT',
                statusLabel: 'Đang thuê (Còn 2 ngày)',
                depositAmount: defaultItem.depositAmount || 500000,
                escrowStatus: 'Đang khóa bảo chứng Smart Escrow',
                expectedRefundNote: `Hoàn ${formatVND(defaultItem.depositAmount || 500000)} về Ví ngay sau khi trả đồ & nghiệm thu CLA.`,
                detailUrl: '/rent/orders',
              },
            ];

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: `Hồ sơ đơn thuê & Tiền đặt cọc của ${user?.fullName || user?.name || 'bạn'}`,
        bannerSubtitle: 'Dữ liệu đồng bộ trực tiếp từ hệ thống Smart Escrow.',
        text: 'Dưới đây là trạng thái các khoản đặt cọc và đơn hàng hiện tại của bạn. Bạn có thể nhấn vào từng đơn để xem biên bản CLA hoặc gửi yêu cầu trả đồ:',
        orderSummaries: realOrderCards,
        quickFollowUps: [
          'Khi nào tôi được hoàn lại 100% tiền đặt cọc Smart Escrow?',
          'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 2. KỊCH BẢN SO SÁNH SẢN PHẨM (PRODUCT COMPARISON) HOẶC NÊN THUÊ HAY MUA (RENT VS THRIFT)
    if (q.includes('so sánh') || q.includes('ưu nhược điểm') || q.includes('ưu/nhược điểm')) {
      const rentCatalog = allCatalogProducts.filter((item) => item.type === 'RENT');
      const matchedForCompare = scoredAll.filter((entry) => entry.score >= 15 && entry.item.type === 'RENT');
      const leftItem = matchedForCompare[0]?.item || pageContext.activeProduct || rentCatalog[0] || AI_MOCK_PRODUCTS_DB[0];
      const rightItem =
        matchedForCompare.find((entry) => entry.item.id !== leftItem.id)?.item ||
        rentCatalog.find((item) => item.id !== leftItem.id && item.category === leftItem.category) ||
        rentCatalog.find((item) => item.id !== leftItem.id) ||
        AI_MOCK_PRODUCTS_DB[1];

      const leftPrice = leftItem.pricePerDay || 180000;
      const rightPrice = rightItem.pricePerDay || 220000;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Phân tích & So sánh chuyên sâu từ ReUse AI',
        bannerSubtitle: 'Đánh giá khách quan dựa trên chất liệu, phom dáng và chi phí thuê thực tế.',
        text: `Mình đã lập bảng so sánh trực diện giữa "${leftItem.name}" và "${rightItem.name}" trong ${days} ngày thuê để bạn dễ chọn:`,
        comparison: {
          title: `So sánh trang phục (Chu kỳ thuê ${days} ngày)`,
          leftTitle: leftItem.name,
          rightTitle: rightItem.name,
          rows: [
            {
              criteria: 'Giá thuê / ngày',
              leftValue: `${formatVND(leftPrice)}/ngày`,
              rightValue: `${formatVND(rightPrice)}/ngày`,
            },
            {
              criteria: `Tổng thuê ${days} ngày`,
              leftValue: formatVND(leftPrice * days),
              rightValue: formatVND(rightPrice * days),
            },
            {
              criteria: 'Tiền cọc Escrow',
              leftValue: `${formatVND(leftItem.depositAmount || 500000)} (Hoàn 100%)`,
              rightValue: `${formatVND(rightItem.depositAmount || 600000)} (Hoàn 100%)`,
            },
            {
              criteria: 'Danh mục & Phong cách',
              leftValue: leftItem.category,
              rightValue: rightItem.category,
            },
            {
              criteria: 'Độ mới kiểm định',
              leftValue: leftItem.conditionGrade,
              rightValue: rightItem.conditionGrade,
            },
          ],
          verdict: `Chọn "${leftItem.name}" nếu bạn ưu tiên mức giá tiết kiệm (${formatVND(leftPrice)}/ngày). Chọn "${rightItem.name}" nếu bạn muốn trải nghiệm phong cách ${rightItem.category} nổi bật.`,
        },
        recommendations: [leftItem, rightItem],
        quickFollowUps: [
          `Tính chi phí thuê ${leftItem.name} trong ${days} ngày`,
          `Tính chi phí thuê ${rightItem.name} trong ${days} ngày`,
          'Nên thuê ngắn hạn hay mua thanh lý THRIFT?',
        ],
      };
    }

    if (q.includes('nên thuê hay mua') || q.includes('rent vs thrift') || q.includes('thuê hay mua')) {
      const sampleRent = allCatalogProducts.find((i) => i.type === 'RENT') || AI_MOCK_PRODUCTS_DB[0];
      const sampleThrift = allCatalogProducts.find((i) => i.type === 'THRIFT') || AI_MOCK_PRODUCTS_DB[3];
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Tư vấn bài toán kinh tế: Nên Thuê (RENT) hay Mua thanh lý (THRIFT)?',
        bannerSubtitle: 'Tối ưu ngân sách theo tần suất mặc thực tế của bạn.',
        text: 'Quy tắc vàng trên ReUse Hub: Nếu bạn chỉ mặc 1–3 lần cho dịp đặc biệt (dự tiệc Gala, đám cưới, chụp lookbook, du lịch), hãy chọn RENT. Nếu là trang phục mặc thường xuyên hàng tuần, mua thanh lý Second-Life tại sàn THRIFT sẽ tiết kiệm tới 50–75%:',
        comparison: {
          title: 'Đặt lên bàn cân: RENT vs THRIFT',
          leftTitle: 'Thuê ngắn hạn (RENT)',
          rightTitle: 'Mua thanh lý (THRIFT)',
          rows: [
            {
              criteria: 'Tần suất phù hợp',
              leftValue: 'Mặc 1–3 lần/năm (Dự tiệc, Sự kiện, Du lịch)',
              rightValue: 'Mặc hàng tuần / Dài hạn',
            },
            {
              criteria: 'Chi phí bỏ ra',
              leftValue: 'Chỉ 7% – 12% giá trị bộ đồ',
              rightValue: 'Rẻ hơn 50% – 75% so với mua mới',
            },
            {
              criteria: 'Giặt hấp & Bảo quản',
              leftValue: '0đ (Xưởng lo 100% giặt hấp & ủi hơi nước)',
              rightValue: 'Sở hữu vĩnh viễn, đã kiểm định Grade A+',
            },
          ],
          verdict:
            'Với các bộ đầm dạ hội, vest hoặc áo khoác mặc đi tiệc/du lịch ngắn ngày, phương án THUÊ (RENT) giúp bạn luôn có đồ mới lên hình đẹp mà chỉ tốn vài trăm nghìn đồng.',
        },
        recommendations: [sampleRent, sampleThrift],
        quickFollowUps: [
          'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
          'Tư vấn các mẫu quần áo thanh lý THRIFT đáng mua nhất hiện nay',
        ],
      };
    }

    // 3. KỊCH BẢN TÍNH & GIẢI THÍCH CHI PHÍ THUÊ / CHECKOUT
    if (
      q.includes('tính chi phí') ||
      q.includes('tổng chi phí') ||
      q.includes('giải thích') ||
      q.includes('tiền cọc') ||
      q.includes('escrow') ||
      q.includes('cla')
    ) {
      const matchedRentForCost = scoredAll.find((entry) => entry.score >= 20 && entry.item.type === 'RENT')?.item;
      const targetProd = matchedRentForCost || pageContext.activeProduct || allCatalogProducts[0] || AI_MOCK_PRODUCTS_DB[0];
      const daily = targetProd.pricePerDay || 180000;
      const deposit = targetProd.depositAmount || 500000;
      const shipping = 35000;
      const rentalSubtotal = daily * days;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: `Bảng ước tính & Giải thích chi phí (${days} ngày)`,
        bannerSubtitle: 'Minh bạch 100% · AI chỉ tư vấn chi phí, quyết định thanh toán thuộc về bạn.',
        text: `Mình bóc tách chi tiết từng khoản khi bạn thuê "${targetProd.name}" trong ${days} ngày để bạn hoàn toàn yên tâm trước khi bấm đặt đơn:`,
        costBreakdown: {
          title: `Dự toán chi phí thuê ${days} ngày`,
          productName: targetProd.name,
          days,
          dailyRate: daily,
          rentalSubtotal,
          escrowDeposit: deposit,
          shippingFee: shipping,
          totalUpfront: rentalSubtotal + deposit + shipping,
          refundableAmount: deposit,
          notes: [
            `Chi phí thực tế bạn tiêu dùng chỉ là ${formatVND(rentalSubtotal + shipping)} (Tiền thuê + Ship).`,
            `Khoản đặt cọc ${formatVND(deposit)} được khóa an toàn trong hợp đồng Smart Escrow — xưởng KHÔNG thể tự ý rút.`,
            'Khi nhận hàng, bạn chụp 3 góc hiện vật & ký biên bản điện tử CLA để bảo vệ quyền lợi khỏi mọi lỗi có sẵn.',
            'Ngay khi trả đồ và xưởng xác nhận nghiệm thu, 100% tiền cọc được hoàn tự động về Ví khả dụng của bạn.',
          ],
        },
        recommendations: [
          {
            ...targetProd,
            calculatedDays: days,
            calculatedTotalRent: rentalSubtotal,
          },
        ],
        quickFollowUps: [
          `So sánh ${targetProd.name} với sản phẩm cùng phân khúc`,
          'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 4. KỊCH BẢN HỎI ĐÍCH DANH TÊN SẢN PHẨM HOẶC LOẠI TRANG PHỤC CỤ THỂ
    const exactMatches = scoredAll.filter((entry) => entry.isExactNameMatch || entry.score >= 55);
    if (exactMatches.length > 0) {
      const topRecs = exactMatches.slice(0, 4).map(({ item }) => ({
        ...item,
        budgetTag: 'Đúng sản phẩm bạn tìm',
        calculatedDays: days,
        calculatedTotalRent: (item.pricePerDay || 180000) * days,
      }));
      const first = topRecs[0];
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle:
          topRecs.length === 1
            ? `Tìm thấy đúng sản phẩm: ${first.name}`
            : `Tìm thấy ${topRecs.length} sản phẩm khớp với "${rawQuery}"`,
        bannerSubtitle: `${first.category} · Độ mới ${first.conditionGrade} · Kho ${first.location}`,
        text:
          topRecs.length === 1
            ? `Đây là thông tin chi tiết của "${first.name}" có sẵn trong kho ReUse Hub:\n• ${first.pros.join('\n• ')}`
            : `Mình tìm thấy đúng các mẫu trang phục khớp với yêu cầu "${rawQuery}" của bạn:`,
        recommendations: topRecs,
        quickFollowUps: [
          `Tính tổng chi phí thuê ${first.name} trong ${days} ngày`,
          `So sánh ${first.name} với mẫu cùng phân khúc`,
          'Nên thuê ngắn hạn hay mua thanh lý THRIFT?',
        ],
      };
    }

    const keywordMatches = scoredAll.filter((entry) => entry.score >= 15);
    if (keywordMatches.length > 0) {
      const filteredByBudget = hasExplicitBudget
        ? keywordMatches.filter((entry) => entry.item.type === 'THRIFT' || (entry.item.pricePerDay || 0) <= maxBudget)
        : keywordMatches;
      const chosenList = (filteredByBudget.length > 0 ? filteredByBudget : keywordMatches).slice(0, 4);
      const groupLabel = chosenList[0]?.matchedGroup?.label || chosenList[0]?.item.category || 'Thời trang';
      const recs = chosenList.map(({ item }) => ({
        ...item,
        calculatedDays: days,
        calculatedTotalRent: (item.pricePerDay || 180000) * days,
      }));
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: `Gợi ý ${groupLabel} phù hợp với bạn!`,
        bannerSubtitle: `Đã lọc ${recs.length} sản phẩm khớp với nhu cầu "${rawQuery}".`,
        text: `Dưới đây là các mẫu ${groupLabel.toLowerCase()} trong kho ReUse Hub khớp nhất với yêu cầu của bạn:`,
        recommendations: recs,
        quickFollowUps: [
          `Tính tổng chi phí thuê ${recs[0].name} trong ${days} ngày`,
          `So sánh ${recs[0].name} và ${recs[1]?.name || recs[0].name}`,
          'Tư vấn các mẫu quần áo thanh lý THRIFT đáng mua nhất hiện nay',
        ],
      };
    }

    // 5. KỊCH BẢN TƯ VẤN ĐỒ THANH LÝ THRIFT
    if (q.includes('thrift') || q.includes('thanh lý') || q.includes('mua đứt') || q.includes('second-life') || qNorm.includes('thanh ly')) {
      const thriftItems = allCatalogProducts.filter((item) => item.type === 'THRIFT');
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Gợi ý trang phục THRIFT (Second-Life) chuẩn kiểm định!',
        bannerSubtitle: 'Đã lọc các sản phẩm thanh lý tiết kiệm 50% – 75% so với giá gốc.',
        text: 'Các mẫu quần áo & đầm váy dưới đây được tuyển chọn kỹ lưỡng đạt chuẩn Grade A+, đã giặt hấp tiệt trùng và sẵn sàng giao ngay:',
        recommendations: thriftItems.slice(0, 4),
        quickFollowUps: [
          'Khi nào nên mua đồ THRIFT thay vì thuê RENT?',
          'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 6. KỊCH BẢN TÌM KIẾM THEO NGÂN SÁCH (CHỈ GỬI SẢN PHẨM KHI CÓ Ý ĐỊNH TÌM ĐỒ RÕ RÀNG)
    const hasExplicitBrowseIntent =
      hasExplicitBudget ||
      qNorm.includes('tim do') ||
      qNorm.includes('tim san pham') ||
      qNorm.includes('tim trang phuc') ||
      qNorm.includes('goi y') ||
      qNorm.includes('cho minh xem') ||
      qNorm.includes('co mau nao') ||
      qNorm.includes('co do gi') ||
      qNorm.includes('thue do di tiec') ||
      qNorm.includes('thue do di du lich');

    if (hasExplicitBrowseIntent) {
      const filteredRent = allCatalogProducts
        .filter((item) => item.type === 'RENT' && (item.pricePerDay || 0) <= maxBudget)
        .slice(0, 4)
        .map((item) => ({
          ...item,
          budgetTag: 'Phù hợp ngân sách',
          calculatedDays: days,
          calculatedTotalRent: (item.pricePerDay || 180000) * days,
        }));

      const finalRecs =
        filteredRent.length > 0
          ? filteredRent
          : allCatalogProducts.slice(0, 3).map((item) => ({
              ...item,
              calculatedDays: days,
              calculatedTotalRent: (item.pricePerDay || 180000) * days,
            }));

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Mình tìm thấy các mẫu trang phục phù hợp với bạn!',
        bannerSubtitle: 'Đã lọc theo danh mục thời trang, giá thuê và số ngày sử dụng.',
        text: `Dựa trên nhu cầu thuê ${days} ngày với ngân sách dưới ${formatVND(maxBudget)}/ngày, đây là các mẫu trang phục & phụ kiện nổi bật đang có sẵn tại ReUse Hub:`,
        recommendations: finalRecs,
        quickFollowUps: [
          `Tính tổng chi phí thuê ${finalRecs[0]?.name || 'Đầm Dạ Hội'} trong ${days} ngày`,
          'Tìm bộ Suit / Vest nam lịch lãm hoặc Áo dài truyền thống',
          'Nên thuê ngắn hạn hay mua thanh lý THRIFT?',
        ],
      };
    }

    // 7. Mặc định cho các câu hỏi thông tin, trò chuyện (CHỈ TRẢ LỜI VĂN BẢN, KHÔNG GỬI KÈM SẢN PHẨM)
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      timestamp: nowTime,
      bannerTitle: 'Trợ lý ảo ReUse AI sẵn sàng giải đáp cho bạn!',
      bannerSubtitle: 'Hỏi quy trình thuê/mua hoặc nhập tên trang phục bạn muốn tìm.',
      text:
        'Mình có thể hỗ trợ bạn giải đáp mọi thắc mắc về:\n' +
        '• **Quy trình thuê đồ & trả đồ:** Cách đặt thuê 4 bước, chính sách giặt hấp miễn phí, đổi size trong 4h.\n' +
        '• **Cơ chế tiền cọc Smart Escrow & Biên bản CLA:** Bảo vệ 100% tiền cọc và hoàn tiền tự động về Ví.\n' +
        '• **Tìm kiếm trang phục theo yêu cầu:** Khi nào bạn muốn xem sản phẩm, chỉ cần nhắn tên món đồ (ví dụ: *"Đầm dạ hội"*, *"Áo dài"*, *"Suit nam"*, *"Giày cao gót"*...) mình sẽ gửi đúng sản phẩm đó cho bạn nhé!',
      recommendations: [],
      quickFollowUps: [
        'Cách thuê đồ như thế nào?',
        'Khi nào tôi được hoàn lại 100% tiền đặt cọc Smart Escrow?',
        'Biên bản đồng kiểm CLA 3 góc khi nhận hàng là gì?',
      ],
    };
  };

  const handleSendPrompt = (promptText?: string) => {
    const textToSend = (promptText ?? inputText).trim();
    if (!textToSend) return;

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: nowTime,
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    if (!promptText) setInputText('');
    setIsTyping(true);

    setTimeout(async () => {
      const localReply = generateAIResponse(textToSend);
      const beReply = await sendAIChatPromptApi({
        prompt: textToSend,
        preferences,
        activeProductId: pageContext.activeProduct?.id || null,
        messages: updatedWithUser,
      });
      const hasBeContent =
        beReply &&
        ((beReply.recommendations && beReply.recommendations.length > 0) ||
          beReply.comparison ||
          beReply.costBreakdown ||
          beReply.orderSummaries ||
          beReply.text);
      const aiReply: AIMessage = hasBeContent
        ? {
            id: beReply.id || localReply.id,
            sender: 'ai',
            timestamp: beReply.timestamp || localReply.timestamp,
            bannerTitle: beReply.bannerTitle ?? localReply.bannerTitle,
            bannerSubtitle: beReply.bannerSubtitle ?? localReply.bannerSubtitle,
            text: beReply.text ?? localReply.text,
            recommendations: beReply.recommendations,
            comparison: beReply.comparison,
            costBreakdown: beReply.costBreakdown,
            orderSummaries: beReply.orderSummaries,
            quickFollowUps: beReply.quickFollowUps ?? localReply.quickFollowUps,
          }
        : localReply;
      const finalMessages = [...updatedWithUser, aiReply];
      setMessages(finalMessages);
      setIsTyping(false);
      persistSession(finalMessages);
    }, 380);
  };

  // Lắng nghe sự kiện mở AI từ các nút/banner trên Homepage, Marketplace, Product Detail...
  useEffect(() => {
    const handleOpenAI = (e: Event) => {
      const custom = e as CustomEvent<{ prompt?: string; openOnly?: boolean }>;
      setIsOpen(true);
      setIsMinimized(false);
      setActiveTab('chat');
      if (custom.detail?.prompt && !custom.detail?.openOnly) {
        handleSendPrompt(custom.detail.prompt);
      }
    };
    window.addEventListener('open_reuse_ai', handleOpenAI);
    return () => window.removeEventListener('open_reuse_ai', handleOpenAI);
  });

  const handleQuickActionCard = (actionKey: 'FIND' | 'COMPARE' | 'COST' | 'RENT_VS_THRIFT') => {
    if (actionKey === 'FIND') {
      handleSendPrompt('Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.');
    } else if (actionKey === 'COMPARE') {
      handleSendPrompt('So sánh ưu nhược điểm giữa Đầm Dạ Hội Nữ và Áo Dài Truyền Thống khi đi sự kiện.');
    } else if (actionKey === 'COST') {
      handleSendPrompt('Tính chi phí thuê trang phục 4 ngày và giải thích cơ chế tiền đặt cọc.');
    } else if (actionKey === 'RENT_VS_THRIFT') {
      handleSendPrompt('Tư vấn giúp mình khi nào nên thuê (RENT) và khi nào nên mua (THRIFT)?');
    }
  };

  const handleSavePreferences = (nextPrefs: UserAIPreferences) => {
    setPreferences(nextPrefs);
    try {
      localStorage.setItem(`reuse_ai_prefs_${userId}`, JSON.stringify(nextPrefs));
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* 1. NÚT AI NỔI (FLOATING AI BUTTON) Ở GÓC DƯỚI BÊN PHẢI */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          {/* Bong bóng gợi ý theo ngữ cảnh trang hiện tại */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-[#4C1D95] border border-[#DDD6FE] shadow-md text-xs font-semibold hover:border-[#8B5CF6] transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span>{pageContext.badgeText}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label="Mở ReUse Hub AI Shopping Assistant"
            className="group relative flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-full bg-white text-stone-800 border border-[#DDD6FE] shadow-[0_12px_35px_rgba(109,40,217,0.22)] hover:shadow-[0_14px_40px_rgba(109,40,217,0.35)] hover:border-[#8B5CF6] hover:scale-[1.03] transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[21px]">smart_toy</span>
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-bold tracking-wide flex items-center gap-1.5">
                <span>ReUse Hub AI</span>
                <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] uppercase">
                  Assistant
                </span>
              </div>
              <div className="text-[10px] text-[#059669] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                <span>Tư vấn RENT &amp; THRIFT</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 2. CỬA SỔ CHAT NỔI (360-400PX TRÊN DESKTOP, FULLSCREEN TRÊN MOBILE, KHÔNG CHE TOÀN BỘ MARKETPLACE) */}
      {isOpen && (
        <aside
          aria-label="ReUse Hub AI Shopping Assistant"
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white text-stone-800 border border-[#E5E0D8] shadow-[0_20px_60px_rgba(28,25,23,0.16)] ${
            isMinimized
              ? 'bottom-5 right-5 w-[340px] sm:w-[380px] h-16 rounded-2xl overflow-hidden'
              : 'inset-0 w-full h-full rounded-none sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[392px] sm:h-[650px] sm:max-h-[calc(100vh-36px)] sm:rounded-2xl overflow-hidden'
          }`}
        >
          {/* HEADER (GIỐNG HÌNH 1) */}
          <div className="bg-gradient-to-r from-[#F5F3FF] via-[#FAF8FF] to-[#F3E8FF] px-4 py-3.5 border-b border-[#E9D5FF] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[15px] text-[#2E1065] tracking-tight truncate">
                    ReUse Hub AI
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] font-medium">
                    {isLoggedIn ? 'Cá nhân hóa' : 'Guest Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#059669] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span className="truncate">Online · Shopping Assistant</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && !isMinimized && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setActiveTab('chat');
                  }}
                  title="Màn hình bắt đầu AI"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-[#4C1D95] hover:bg-[#EDE9FE]/70 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                title={isMinimized ? 'Mở rộng cửa sổ' : 'Thu gọn'}
                className="p-1.5 rounded-lg text-stone-500 hover:text-[#4C1D95] hover:bg-[#EDE9FE]/70 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMinimized ? 'open_in_full' : 'remove'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ AI"
                className="p-1.5 rounded-lg text-stone-500 hover:text-[#4C1D95] hover:bg-[#EDE9FE]/70 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* THANH CONTEXT-AWARE & CHUYỂN TAB (CHAT / LỊCH SỬ / SỞ THÍCH) */}
              <div className="px-4 py-2 bg-[#FAF8F5] border-b border-[#ECE7DF] flex items-center justify-between gap-2 text-[11px] shrink-0">
                <div className="flex items-center gap-1.5 text-[#5B21B6] font-medium truncate">
                  <span className="material-symbols-outlined text-[14px]">location_searching</span>
                  <span className="truncate">{pageContext.screenLabel}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      activeTab === 'chat'
                        ? 'bg-[#6D28D9] text-white'
                        : 'text-stone-600 hover:text-[#4C1D95]'
                    }`}
                  >
                    Tư vấn
                  </button>
                  {isLoggedIn && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          activeTab === 'history'
                            ? 'bg-[#6D28D9] text-white'
                            : 'text-stone-600 hover:text-[#4C1D95]'
                        }`}
                      >
                        Lịch sử ({sessions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preferences')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                          activeTab === 'preferences'
                            ? 'bg-[#6D28D9] text-white'
                            : 'text-stone-600 hover:text-[#4C1D95]'
                        }`}
                      >
                        Sở thích
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* NỘI DUNG CHÍNH THEO TAB */}
              {activeTab === 'history' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="text-xs font-semibold text-[#5B21B6] uppercase tracking-wider">
                    Lịch sử hội thoại của bạn
                  </div>
                  {sessions.length === 0 ? (
                    <div className="p-6 rounded-xl border border-[#E7E2DA] bg-[#FAF8F5] text-center text-xs text-stone-500">
                      Chưa có lịch sử hội thoại nào được lưu. Hãy đặt câu hỏi cho ReUse AI!
                    </div>
                  ) : (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 rounded-xl border border-[#E7E2DA] bg-[#FAF8F5] hover:border-[#7C3AED] transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-stone-800 truncate">{sess.title}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Cập nhật: {sess.updatedAt} · {sess.messages.length} tin nhắn
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMessages(sess.messages);
                            setActiveTab('chat');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] text-[11px] font-medium text-white shrink-0 cursor-pointer"
                        >
                          Xem lại
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'preferences' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-[#5B21B6] uppercase tracking-wider">
                      Cá nhân hóa gợi ý AI theo sở thích
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      ReUse AI sẽ tự động ưu tiên lọc sản phẩm theo ngân sách và thói quen thuê đồ của bạn.
                    </p>
                  </div>

                  <div className="space-y-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7E2DA]">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Ngân sách thuê tối đa / ngày (VNĐ)
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={preferences.maxDailyRentBudget}
                        onChange={(e) =>
                          handleSavePreferences({
                            ...preferences,
                            maxDailyRentBudget: Number(e.target.value) || 300000,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#DCD6CD] text-xs text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Số ngày thuê mặc định mỗi chuyến đi
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={preferences.travelDaysDefault}
                        onChange={(e) =>
                          handleSavePreferences({
                            ...preferences,
                            travelDaysDefault: Math.max(1, Number(e.target.value) || 4),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#DCD6CD] text-xs text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Khu vực kho ưu tiên nhận hàng
                      </label>
                      <select
                        value={preferences.preferredLocation}
                        onChange={(e) =>
                          handleSavePreferences({
                            ...preferences,
                            preferredLocation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#DCD6CD] text-xs text-stone-800"
                      >
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('chat');
                      handleSendPrompt(
                        `Mình cần thuê đầm dạ hội dự tiệc ${preferences.travelDaysDefault} ngày, ngân sách dưới ${preferences.maxDailyRentBudget.toLocaleString('vi-VN')}đ/ngày.`
                      );
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Áp dụng &amp; Gợi ý sản phẩm ngay
                  </button>
                </div>
              ) : (
                /* TAB CHAT CHÍNH (HÌNH 1 & HÌNH 2) */
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FCFBF9]">
                  {/* Nếu khách đang xem trang Chi tiết sản phẩm, hiển thị thẻ ngữ cảnh sản phẩm đang xem */}
                  {pageContext.activeProduct && (
                    <div className="p-3 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={pageContext.activeProduct.image}
                          alt={pageContext.activeProduct.name}
                          className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] text-[#6D28D9] font-medium">
                            Sản phẩm bạn đang xem:
                          </div>
                          <div className="text-xs font-semibold text-stone-900 truncate">
                            {pageContext.activeProduct.name}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSendPrompt(
                            `Đánh giá ưu/nhược điểm của ${pageContext.activeProduct?.name}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] text-[11px] font-semibold text-white shrink-0 cursor-pointer"
                      >
                        Hỏi AI
                      </button>
                    </div>
                  )}

                  {/* TRẠNG THÁI MỞ ĐẦU (GIỐNG HỆT HÌNH 1) */}
                  {messages.length === 0 ? (
                    <div className="space-y-4">
                      {/* Hộp chào mừng tím pastel giống Hình 1 */}
                      <div className="p-4 rounded-2xl bg-[#EDE8F5] text-[#4A2574] shadow-sm">
                        <div className="font-bold text-[15px] text-[#5B2C91]">
                          Xin chào! Mình là ReUse AI 👋
                        </div>
                        <p className="text-xs text-[#5E3A8C] mt-1.5 leading-relaxed">
                          Mình có thể giúp bạn tìm sản phẩm, so sánh giá thuê và giá thanh lý, hoặc tư vấn nên thuê hay mua.
                        </p>
                      </div>

                      {/* Tiêu đề & Grid 2x2 giống Hình 1 */}
                      <div>
                        <div className="text-[11px] font-bold tracking-wider uppercase text-stone-500 mb-2.5">
                          BẠN MUỐN TÌM GÌ HÔM NAY?
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleQuickActionCard('FIND')}
                            className="text-left p-3.5 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#E7E2DA] hover:border-[#7C3AED] shadow-2xs transition-all group cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#8B5CF6] mb-1.5 block">
                              search
                            </span>
                            <div className="text-[13px] font-bold text-stone-800 group-hover:text-[#5B21B6]">
                              Tìm sản phẩm
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">Find products</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickActionCard('COMPARE')}
                            className="text-left p-3.5 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#E7E2DA] hover:border-[#7C3AED] shadow-2xs transition-all group cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#8B5CF6] mb-1.5 block">
                              compare_arrows
                            </span>
                            <div className="text-[13px] font-bold text-stone-800 group-hover:text-[#5B21B6]">
                              So sánh sản phẩm
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">Compare items</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickActionCard('COST')}
                            className="text-left p-3.5 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#E7E2DA] hover:border-[#7C3AED] shadow-2xs transition-all group cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#8B5CF6] mb-1.5 block">
                              calculate
                            </span>
                            <div className="text-[13px] font-bold text-stone-800 group-hover:text-[#5B21B6]">
                              Tính chi phí thuê
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              Estimate rental cost
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickActionCard('RENT_VS_THRIFT')}
                            className="text-left p-3.5 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#E7E2DA] hover:border-[#7C3AED] shadow-2xs transition-all group cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#8B5CF6] mb-1.5 block">
                              lightbulb
                            </span>
                            <div className="text-[13px] font-bold text-stone-800 group-hover:text-[#5B21B6]">
                              Nên thuê hay mua?
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">RENT vs THRIFT</div>
                          </button>
                        </div>
                      </div>

                      {/* Gợi ý câu hỏi nhanh theo đúng màn hình hiện tại */}
                      <div className="pt-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                          Gợi ý theo trang {pageContext.screenLabel}:
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {pageContext.suggestedPrompts.map((prompt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendPrompt(prompt)}
                              className="text-left px-3 py-2 rounded-xl bg-white hover:bg-[#F5F3FF] border border-[#E7E2DA] hover:border-[#C4B5FD] text-xs text-stone-700 hover:text-[#4C1D95] shadow-2xs transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span className="line-clamp-1">{prompt}</span>
                              <span className="material-symbols-outlined text-[14px] text-[#A78BFA] shrink-0">
                                north_east
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DANH SÁCH TIN NHẮN & PRODUCT CARDS (GIỐNG HỆT HÌNH 2) */
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="space-y-3">
                          {msg.sender === 'user' ? (
                            <div className="flex justify-end">
                              <div className="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-tr-xs bg-[#6D28D9] text-white text-xs leading-relaxed shadow-xs">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Hộp tiêu đề tím pastel giống Hình 2 */}
                              {msg.bannerTitle && (
                                <div className="p-3.5 rounded-2xl bg-[#EDE8F5] text-[#4A2574]">
                                  <div className="font-bold text-[14px] text-[#5B2C91]">
                                    {msg.bannerTitle}
                                  </div>
                                  {msg.bannerSubtitle && (
                                    <div className="text-[11px] text-[#63438E] mt-0.5">
                                      {msg.bannerSubtitle}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Nội dung phân tích văn bản */}
                              {msg.text && (
                                <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-line px-1">
                                  {msg.text}
                                </div>
                              )}

                              {/* Bảng so sánh ưu/nhược điểm (nếu có) */}
                              {msg.comparison && (
                                <div className="rounded-xl border border-[#E7E2DA] bg-white overflow-hidden shadow-2xs">
                                  <div className="px-3 py-2 bg-[#F5F3FF] text-[11px] font-bold text-[#5B21B6] border-b border-[#E7E2DA]">
                                    {msg.comparison.title}
                                  </div>
                                  <div className="divide-y divide-[#F0ECE1] text-[11px]">
                                    <div className="grid grid-cols-3 px-3 py-2 font-bold text-[#6D28D9] bg-[#FAF8FF]">
                                      <span>Tiêu chí</span>
                                      <span>{msg.comparison.leftTitle}</span>
                                      <span>{msg.comparison.rightTitle}</span>
                                    </div>
                                    {msg.comparison.rows.map((r, rIdx) => (
                                      <div key={rIdx} className="grid grid-cols-3 px-3 py-2 gap-2">
                                        <span className="text-stone-400">{r.criteria}</span>
                                        <span className="text-stone-800 font-medium">{r.leftValue}</span>
                                        <span className="text-stone-800 font-medium">{r.rightValue}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="px-3 py-2.5 bg-[#ECFDF5] text-[#065F46] text-[11px] border-t border-[#A7F3D0]">
                                    <strong>Kết luận AI:</strong> {msg.comparison.verdict}
                                  </div>
                                </div>
                              )}

                              {/* Bảng bóc tách chi phí thuê & cọc (nếu có) */}
                              {msg.costBreakdown && (
                                <div className="rounded-xl border border-[#E7E2DA] bg-white p-3.5 space-y-2.5 text-xs shadow-2xs">
                                  <div className="font-bold text-[#4C1D95] flex items-center justify-between">
                                    <span>{msg.costBreakdown.title}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] font-semibold">
                                      Smart Escrow
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 text-[11px] border-t border-b border-[#EFECE6] py-2">
                                    <div className="flex justify-between">
                                      <span className="text-stone-400">
                                        Tiền thuê ({msg.costBreakdown.days} ngày ×{' '}
                                        {formatVND(msg.costBreakdown.dailyRate)})
                                      </span>
                                      <span className="font-semibold text-stone-800">
                                        {formatVND(msg.costBreakdown.rentalSubtotal)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-stone-400">
                                        Tiền cọc bảo chứng (Hoàn 100%)
                                      </span>
                                      <span className="font-semibold text-[#059669]">
                                        {formatVND(msg.costBreakdown.escrowDeposit)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-stone-400">Phí giao nhận tiêu chuẩn</span>
                                      <span className="font-semibold text-stone-800">
                                        {formatVND(msg.costBreakdown.shippingFee)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between pt-1.5 border-t border-[#EFECE6] text-xs font-bold">
                                      <span className="text-stone-900">Tổng thanh toán tạm giữ</span>
                                      <span className="text-[#6D28D9]">
                                        {formatVND(msg.costBreakdown.totalUpfront)}
                                      </span>
                                    </div>
                                  </div>
                                  <ul className="space-y-1 text-[11px] text-stone-600">
                                    {msg.costBreakdown.notes.map((n, nIdx) => (
                                      <li key={nIdx} className="flex items-start gap-1.5">
                                        <span className="text-[#059669] mt-0.5">✓</span>
                                        <span>{n}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Danh sách tra cứu Đơn thuê & Tiền cọc của User */}
                              {msg.orderSummaries && (
                                <div className="space-y-2.5">
                                  {msg.orderSummaries.map((ord) => (
                                    <div
                                      key={ord.orderCode}
                                      className="p-3.5 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-[#6D28D9]">
                                          {ord.orderCode}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[10px] font-semibold">
                                          {ord.statusLabel}
                                        </span>
                                      </div>
                                      <div className="text-xs font-semibold text-stone-900">
                                        {ord.productName}
                                      </div>
                                      <div className="text-[11px] text-stone-600">
                                        Tiền cọc:{' '}
                                        <strong className="text-[#059669]">
                                          {formatVND(ord.depositAmount)}
                                        </strong>{' '}
                                        · {ord.escrowStatus}
                                      </div>
                                      <div className="text-[10px] text-stone-400">
                                        {ord.expectedRefundNote}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => navigate(ord.detailUrl)}
                                        className="w-full py-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] hover:border-[#8B5CF6] text-xs font-medium text-[#5B21B6] transition-colors cursor-pointer"
                                      >
                                        Xem chi tiết đơn &amp; cọc
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* DANH SÁCH PRODUCT CARDS (GIỐNG HỆT HÌNH 2) */}
                              {msg.recommendations && msg.recommendations.length > 0 && (
                                <div className="space-y-3">
                                  {msg.recommendations.map((prod) => (
                                    <div
                                      key={prod.id}
                                      className="p-3.5 rounded-2xl bg-white border border-[#E7E2DA] hover:border-[#8B5CF6] shadow-2xs transition-all space-y-3"
                                    >
                                      <div className="flex items-start gap-3.5">
                                        <div className="w-20 h-20 rounded-xl bg-white p-1 shrink-0 overflow-hidden flex items-center justify-center">
                                          <img
                                            src={prod.image}
                                            alt={prod.name}
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <div className="font-bold text-[15px] text-stone-900 leading-snug">
                                            {prod.name}
                                          </div>
                                          <div>
                                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[11px] font-semibold">
                                              {prod.budgetTag}
                                            </span>
                                          </div>
                                          {prod.type === 'RENT' ? (
                                            <>
                                              <div className="text-[17px] font-extrabold text-[#059669] pt-0.5">
                                                {formatVND(prod.pricePerDay || 250000)}/ngày
                                              </div>
                                              <div className="text-xs text-stone-600">
                                                {prod.calculatedDays || 4} ngày:{' '}
                                                {formatVND(
                                                  prod.calculatedTotalRent ||
                                                    (prod.pricePerDay || 250000) * 4
                                                )}{' '}
                                                tiền thuê
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <div className="text-[17px] font-extrabold text-[#059669] pt-0.5">
                                                {formatVND(prod.thriftPrice || 590000)} (Mua đứt)
                                              </div>
                                              <div className="text-xs text-stone-400">
                                                Giá gốc mới:{' '}
                                                <span className="line-through">
                                                  {formatVND(prod.originalRetailPrice || 1500000)}
                                                </span>{' '}
                                                · {prod.conditionGrade}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => navigate(prod.detailUrl)}
                                        className="w-full py-2 rounded-full bg-[#FAF8F5] hover:bg-[#F5F3FF] border border-[#E2DDD5] hover:border-[#8B5CF6] text-xs font-semibold text-stone-800 hover:text-[#5B21B6] transition-colors cursor-pointer"
                                      >
                                        Xem sản phẩm
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Gợi ý câu hỏi tiếp theo */}
                              {msg.quickFollowUps && msg.quickFollowUps.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {msg.quickFollowUps.map((followUp, fIdx) => (
                                    <button
                                      key={fIdx}
                                      type="button"
                                      onClick={() => handleSendPrompt(followUp)}
                                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[11px] text-[#5B21B6] font-medium transition-colors cursor-pointer shadow-2xs"
                                    >
                                      {followUp}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="p-3 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#5B21B6] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping" />
                          <span>ReUse AI đang lọc dữ liệu sản phẩm trong kho...</span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* Ô NHẬP CÂU HỎI & LƯU Ý CHÂN TRANG (GIỐNG HÌNH 1) */}
              <div className="px-4 pt-3 pb-3.5 bg-white border-t border-[#E7E2DA] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPrompt();
                  }}
                  className="space-y-2.5"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD5] focus:border-[#7C3AED] rounded-xl px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSendPrompt(
                            'Mình cần thuê đầm dạ hội dự tiệc 4 ngày, ngân sách dưới 300.000đ/ngày.'
                          )
                        }
                        title="Thử câu hỏi mẫu tìm trang phục"
                        className="text-stone-500 hover:text-[#5B21B6] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <span className="material-symbols-outlined text-[17px]">attach_file</span>
                        <span className="hidden sm:inline text-[10px] text-stone-500">
                          Mẫu câu hỏi
                        </span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      aria-label="Gửi câu hỏi"
                      className="w-9 h-9 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">send</span>
                    </button>
                  </div>
                </form>

                <div className="mt-2.5 text-center text-[11px] text-stone-500">
                  AI có thể đưa ra gợi ý, nhưng quyết định đặt hàng vẫn thuộc về khách hàng.
                </div>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
};

export default AIShoppingAssistant;
