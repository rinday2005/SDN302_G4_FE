import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useShop } from '../../context/ShopContext';
import { getMyRentalOrdersApi, type RentalOrderApi } from '../../services/order.api';
import { sendAIChatPromptApi } from '../../services/ai.api';
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

const formatVND = (n: number) => `${Math.round(n || 0).toLocaleString('vi-VN')}đ`;

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

  // Hợp nhất dữ liệu sản phẩm từ DB mẫu + ShopContext thực tế
  const allCatalogProducts = useMemo<AIProductRecommendation[]>(() => {
    const liveMapped = shopProducts
      .filter((p) => p.approvalStatus === 'APPROVED' && p.isVisible)
      .map((p) => mapShopProductToAIRec(p, preferences.travelDaysDefault || 4, preferences.maxDailyRentBudget));

    const existingSkus = new Set(AI_MOCK_PRODUCTS_DB.map((item) => item.sku.toLowerCase()));
    const uniqueLive = liveMapped.filter((item) => !existingSkus.has(item.sku.toLowerCase()));

    return [...AI_MOCK_PRODUCTS_DB, ...uniqueLive];
  }, [shopProducts, preferences.travelDaysDefault, preferences.maxDailyRentBudget]);

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
    if (
      path.startsWith('/rent/products/') ||
      path.startsWith('/rent/detail/') ||
      path.startsWith('/thrift/products/') ||
      path.startsWith('/thrift/detail/') ||
      (path.startsWith('/thrift/') &&
        !path.startsWith('/thrift/marketplace') &&
        !path.startsWith('/thrift/checkout') &&
        !path.startsWith('/thrift/orders'))
    ) {
      const segs = location.pathname.split('/').filter(Boolean);
      const currentId = segs[segs.length - 1] || '';
      const matched =
        allCatalogProducts.find(
          (p) =>
            p.id.toLowerCase() === currentId.toLowerCase() ||
            p.sku.toLowerCase() === currentId.toLowerCase()
        ) || allCatalogProducts[0];

      return {
        screenKey: 'PRODUCT_DETAIL',
        screenLabel: 'Chi tiết sản phẩm',
        badgeText: 'Hỏi AI về sản phẩm này',
        contextHint: `AI đang nhận diện bạn xem: ${matched.name}`,
        activeProduct: matched,
        suggestedPrompts: [
          `Đánh giá ưu/nhược điểm của ${matched.name}`,
          `Tính tổng chi phí thuê ${matched.name} trong 4 ngày`,
          `So sánh ${matched.name} với sản phẩm cùng phân khúc`,
          `Sản phẩm này nên thuê ngắn hạn hay mua thanh lý?`,
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
        contextHint: 'Đang ở sàn RENT · Nhập nhu cầu tự nhiên (số ngày, ngân sách/ngày, mục đích).',
        suggestedPrompts: [
          'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
          'Tìm trang phục dự tiệc Gala cuối tuần giá dưới 250.000đ/ngày',
          'So sánh Canon EOS M50 và Sony A6000 khi đi du lịch',
        ],
      };
    }

    // 5. Màn hình THRIFT Marketplace
    if (path.startsWith('/thrift')) {
      return {
        screenKey: 'THRIFT_MARKETPLACE',
        screenLabel: 'THRIFT Marketplace',
        badgeText: 'Tư vấn đồ thanh lý',
        contextHint: 'Đang ở sàn THRIFT · Tư vấn chọn hiện vật Second-Life chuẩn kiểm định.',
        suggestedPrompts: [
          'Tư vấn các món đồ thanh lý THRIFT đáng mua nhất hiện nay',
          'Đồ Second-Life từ kho RENT có đảm bảo chất lượng không?',
          'Khi nào nên mua đồ THRIFT thay vì thuê RENT?',
        ],
      };
    }

    // 6. Homepage hoặc trang chung
    return {
      screenKey: 'HOMEPAGE',
      screenLabel: 'Trang chủ ReUse Hub',
      badgeText: 'ReUse AI Assistant',
      contextHint: 'Trợ lý mua sắm & thuê đồ thông minh · Hiểu ngữ cảnh RENT & THRIFT.',
      suggestedPrompts: [
        'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
        'So sánh ưu nhược điểm Canon EOS M50 và Sony A6000',
        'Tính chi phí thuê máy ảnh 4 ngày kèm tiền đặt cọc',
        'Tư vấn khi nào nên thuê (RENT) và khi nào nên mua (THRIFT)?',
      ],
    };
  }, [location.pathname, allCatalogProducts]);

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

  // Bộ xử lý AI thông minh dựa trên DB mẫu + dữ liệu thực + ngữ cảnh trang
  const generateAIResponse = (rawQuery: string): AIMessage => {
    const q = rawQuery.toLowerCase();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Trích xuất số ngày thuê (mặc định 4 ngày nếu câu hỏi có "4 ngày" hoặc lấy từ sở thích)
    const daysMatch = q.match(/(\d+)\s*ngày/);
    const days = daysMatch ? Math.max(1, Number(daysMatch[1])) : preferences.travelDaysDefault || 4;

    // Trích xuất ngân sách (ví dụ: "300.000", "300k", "250k")
    let maxBudget = 300000;
    const kMatch = q.match(/(\d+)\s*k/);
    const fullNumMatch = q.match(/(\d{3})[.,]?(\d{3})/);
    if (fullNumMatch) {
      maxBudget = Number(`${fullNumMatch[1]}${fullNumMatch[2]}`);
    } else if (kMatch) {
      maxBudget = Number(kMatch[1]) * 1000;
    } else if (isLoggedIn && preferences.maxDailyRentBudget) {
      maxBudget = preferences.maxDailyRentBudget;
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
          text: 'Với vai trò Guest, mình có thể giúp bạn tìm kiếm sản phẩm, phân tích ưu/nhược điểm và ước tính chi phí thuê. Để tra cứu trực tiếp mã đơn thuê, trạng thái vận chuyển và số dư tiền đặt cọc Smart Escrow của riêng bạn, vui lòng đăng nhập tài khoản Customer nhé!',
          quickFollowUps: [
            'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
            'Giải thích cơ chế bảo vệ tiền cọc Smart Escrow',
          ],
        };
      }

      // Kết hợp đơn thực tế của User hoặc đơn mẫu minh họa nếu tài khoản mới chưa có đơn
      const realOrderCards: AIOrderSummaryCard[] =
        userOrders.length > 0
          ? userOrders.slice(0, 3).map((o) => {
              const firstTitle = o.items?.[0]?.productName || 'Thiết bị thuê ReUse Hub';
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
                depositAmount: Number(o.depositAmount) || 3500000,
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
                productName: 'Canon EOS M50 (Kit 15-45mm STM)',
                type: 'RENT',
                statusLabel: 'Đang thuê (Còn 2 ngày)',
                depositAmount: 3500000,
                escrowStatus: 'Đang khóa bảo chứng Smart Escrow',
                expectedRefundNote: 'Hoàn 3.500.000đ về Ví ngay sau khi trả máy & nghiệm thu CLA.',
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
          'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 2. KỊCH BẢN SO SÁNH SẢN PHẨM (PRODUCT COMPARISON) HOẶC NÊN THUÊ HAY MUA (RENT VS THRIFT)
    if (q.includes('so sánh') || q.includes('ưu nhược điểm') || q.includes('ưu/nhược điểm')) {
      const m50 = AI_MOCK_PRODUCTS_DB[0];
      const a6000 = AI_MOCK_PRODUCTS_DB[1];
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Phân tích & So sánh chuyên sâu từ ReUse AI',
        bannerSubtitle: 'Đánh giá khách quan dựa trên thông số kỹ thuật và chi phí thực tế.',
        text: 'Mình đã lập bảng so sánh trực diện giữa 2 mẫu máy ảnh du lịch được thuê nhiều nhất dưới 300.000đ/ngày để bạn dễ chọn:',
        comparison: {
          title: 'So sánh máy ảnh du lịch (Chu kỳ thuê 4 ngày)',
          leftTitle: 'Canon EOS M50',
          rightTitle: 'Sony A6000',
          rows: [
            {
              criteria: 'Giá thuê / ngày',
              leftValue: '250.000đ/ngày',
              rightValue: '280.000đ/ngày',
            },
            {
              criteria: 'Tổng thuê 4 ngày',
              leftValue: '1.000.000đ',
              rightValue: '1.120.000đ',
            },
            {
              criteria: 'Tiền cọc Escrow',
              leftValue: '3.500.000đ (Hoàn 100%)',
              rightValue: '3.800.000đ (Hoàn 100%)',
            },
            {
              criteria: 'Màn hình & Vlog',
              leftValue: 'Xoay lật 180° cảm ứng (Tốt hơn)',
              rightValue: 'Chỉ lật nghiêng 90°',
            },
            {
              criteria: 'Lấy nét & Chụp nhanh',
              leftValue: '10 fps · Dual Pixel AF',
              rightValue: '11 fps · 179 điểm lấy nét pha (Nhanh hơn)',
            },
            {
              criteria: 'Màu sắc ảnh gốc',
              leftValue: 'Nịnh da hồng hào, chụp chân dung đẹp ngay',
              rightValue: 'Chi tiết sắc nét, hợp phong cảnh & đường phố',
            },
          ],
          verdict:
            'Chọn Canon EOS M50 nếu bạn ưu tiên quay Vlog, chụp chân dung/selfie và tiết kiệm chi phí. Chọn Sony A6000 nếu bạn thích chụp cảnh chuyển động nhanh và độ nét cao.',
        },
        recommendations: [m50, a6000],
        quickFollowUps: [
          'Tính chi phí thuê Canon EOS M50 trong 4 ngày',
          'Nên thuê ngắn hạn hay mua thanh lý THRIFT?',
        ],
      };
    }

    if (q.includes('nên thuê hay mua') || q.includes('rent vs thrift') || q.includes('thuê hay mua')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Tư vấn bài toán kinh tế: Nên Thuê (RENT) hay Mua thanh lý (THRIFT)?',
        bannerSubtitle: 'Tối ưu ngân sách theo tần suất sử dụng thực tế của bạn.',
        text: 'Quy tắc vàng trên ReUse Hub: Nếu bạn chỉ dùng dưới 15 ngày/năm (đi du lịch, dự tiệc), hãy chọn RENT. Nếu sử dụng thường xuyên hàng tuần, mua lại đồ Second-Life tại sàn THRIFT sẽ tiết kiệm tới 50–75%:',
        comparison: {
          title: 'Đặt lên bàn cân: RENT vs THRIFT',
          leftTitle: 'Thuê ngắn hạn (RENT)',
          rightTitle: 'Mua thanh lý (THRIFT)',
          rows: [
            {
              criteria: 'Tần suất phù hợp',
              leftValue: 'Dùng 1–3 lần/năm (Du lịch, Sự kiện)',
              rightValue: 'Dùng hàng tuần / Dài hạn',
            },
            {
              criteria: 'Chi phí bỏ ra',
              leftValue: 'Chỉ 7% – 10% giá trị món đồ',
              rightValue: 'Rẻ hơn 45% – 75% so với mua mới',
            },
            {
              criteria: 'Bảo dưỡng & Khấu hao',
              leftValue: '0đ (Xưởng lo 100% vệ sinh & bảo trì)',
              rightValue: 'Sở hữu vĩnh viễn, đã kiểm định Grade A+',
            },
          ],
          verdict:
            'Với chuyến du lịch 4 ngày sắp tới, phương án THUÊ (RENT) chỉ tốn ~1.000.000đ thay vì bỏ ra hơn 14.000.000đ mua máy mới.',
        },
        recommendations: [AI_MOCK_PRODUCTS_DB[0], AI_MOCK_PRODUCTS_DB[5]],
        quickFollowUps: [
          'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
          'Tư vấn các món đồ thanh lý THRIFT đáng mua nhất hiện nay',
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
      const targetProd = pageContext.activeProduct || AI_MOCK_PRODUCTS_DB[0];
      const daily = targetProd.pricePerDay || 250000;
      const deposit = targetProd.depositAmount || 3500000;
      const shipping = 35000;
      const rentalSubtotal = daily * days;

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: `Bảng ước tính & Giải thích chi phí (${days} ngày)`,
        bannerSubtitle: 'Minh bạch 100% · AI chỉ tư vấn chi phí, quyết định thanh toán thuộc về bạn.',
        text: `Mình bóc tách chi tiết từng khoản khi bạn thuê ${targetProd.name} trong ${days} ngày để bạn hoàn toàn yên tâm trước khi bấm đặt đơn:`,
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
          'So sánh Canon EOS M50 và Sony A6000',
          'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 4. KỊCH BẢN TƯ VẤN SẢN PHẨM ĐANG XEM TRÊN PRODUCT DETAIL
    if (
      pageContext.screenKey === 'PRODUCT_DETAIL' &&
      pageContext.activeProduct &&
      (q.includes('sản phẩm này') ||
        q.includes('đang xem') ||
        q.includes(pageContext.activeProduct.name.toLowerCase()))
    ) {
      const p = pageContext.activeProduct;
      const calcRent = (p.pricePerDay || 250000) * days;
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: `Đánh giá chuyên môn: ${p.name}`,
        bannerSubtitle: `Tình trạng kiểm định: ${p.conditionGrade} · Kho ${p.location}`,
        text: `Ưu điểm nổi bật:\n• ${p.pros.join('\n• ')}\n\nLưu ý nhỏ:\n• ${p.cons.join('\n• ')}`,
        recommendations: [
          {
            ...p,
            calculatedDays: days,
            calculatedTotalRent: calcRent,
          },
        ],
        quickFollowUps: [
          `Tính tổng chi phí thuê ${p.name} trong 4 ngày`,
          'So sánh Canon EOS M50 và Sony A6000',
        ],
      };
    }

    // 5. KỊCH BẢN TƯ VẤN ĐỒ THANH LÝ THRIFT
    if (q.includes('thrift') || q.includes('thanh lý') || q.includes('mua đứt') || q.includes('second-life')) {
      const thriftItems = allCatalogProducts.filter((item) => item.type === 'THRIFT');
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: nowTime,
        bannerTitle: 'Gợi ý hiện vật THRIFT (Second-Life) chuẩn kiểm định!',
        bannerSubtitle: 'Đã lọc các sản phẩm thanh lý tiết kiệm 48% – 76% so với giá gốc.',
        text: 'Các sản phẩm dưới đây được chuyển giao từ kho lưu ký định kỳ hoặc ký gửi đạt chuẩn Grade A+, đi kèm hồ sơ nguồn gốc minh bạch:',
        recommendations: thriftItems,
        quickFollowUps: [
          'Khi nào nên mua đồ THRIFT thay vì thuê RENT?',
          'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.',
        ],
      };
    }

    // 6. KỊCH BẢN TÌM KIẾM SẢN PHẨM BẰNG NGÔN NGỮ TỰ NHIÊN (MẶC ĐỊNH / HÌNH 2)
    // Ví dụ: "Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày."
    const isDressQuery = q.includes('đầm') || q.includes('váy') || q.includes('trang phục') || q.includes('dự tiệc');
    const filteredRent = allCatalogProducts
      .filter((item) => {
        if (item.type !== 'RENT') return false;
        if (isDressQuery) {
          return (
            item.category.toLowerCase().includes('trang phục') ||
            item.name.toLowerCase().includes('đầm') ||
            item.name.toLowerCase().includes('váy')
          );
        }
        const priceOk = (item.pricePerDay || 0) <= maxBudget;
        return priceOk;
      })
      .slice(0, 3)
      .map((item) => ({
        ...item,
        budgetTag: 'Phù hợp ngân sách',
        calculatedDays: days,
        calculatedTotalRent: (item.pricePerDay || 250000) * days,
      }));

    const finalRecs =
      filteredRent.length > 0
        ? filteredRent
        : [AI_MOCK_PRODUCTS_DB[0], AI_MOCK_PRODUCTS_DB[1]].map((item) => ({
            ...item,
            calculatedDays: days,
            calculatedTotalRent: (item.pricePerDay || 250000) * days,
          }));

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      timestamp: nowTime,
      bannerTitle: 'Mình tìm thấy một số sản phẩm phù hợp với bạn!',
      bannerSubtitle: 'Đã lọc theo giá thuê và thời gian sử dụng.',
      text: `Dựa trên nhu cầu thuê ${days} ngày với ngân sách dưới ${formatVND(maxBudget)}/ngày, đây là các thiết bị có sẵn trong kho được đánh giá tốt nhất:`,
      recommendations: finalRecs,
      quickFollowUps: [
        'So sánh ưu nhược điểm Canon EOS M50 và Sony A6000',
        `Tính tổng chi phí thuê ${finalRecs[0]?.name || 'Canon EOS M50'} trong ${days} ngày`,
        'Nên thuê ngắn hạn hay mua thanh lý THRIFT?',
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
      const aiReply =
        beReply && ((beReply.recommendations && beReply.recommendations.length > 0) || beReply.costBreakdown || beReply.orderSummaries)
          ? { ...localReply, ...beReply }
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
      handleSendPrompt('Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.');
    } else if (actionKey === 'COMPARE') {
      handleSendPrompt('So sánh ưu nhược điểm Canon EOS M50 và Sony A6000 khi đi du lịch.');
    } else if (actionKey === 'COST') {
      handleSendPrompt('Tính chi phí thuê máy ảnh 4 ngày và giải thích cơ chế tiền đặt cọc.');
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
                        `Mình cần thuê máy ảnh đi du lịch ${preferences.travelDaysDefault} ngày, ngân sách dưới ${preferences.maxDailyRentBudget.toLocaleString('vi-VN')}đ/ngày.`
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
                            'Mình cần thuê máy ảnh đi du lịch 4 ngày, ngân sách dưới 300.000đ/ngày.'
                          )
                        }
                        title="Thử câu hỏi mẫu tìm máy ảnh"
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
