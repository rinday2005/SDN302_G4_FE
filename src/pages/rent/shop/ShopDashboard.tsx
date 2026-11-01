import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { AuthContext } from '../../../context/auth-context';
import { getShopRentalOrdersApi, type RentalOrderApi } from '../../../services/order.api';
import { getShopThriftListingsApi, type ThriftListingItemApi } from '../../../services/thrift.api';
import { getShopThriftOrdersApi, type ThriftOrderApi } from '../../../services/thriftOrder.api';
import { circularProtocolSteps, quickActionsData } from '../../data/shop/dashboardData';
import { normalizeImageUrl } from '../../../utils/imageUrl';

const FALLBACK_IMG = '/images/clothes2.jpg';

const formatVND = (n: number) => `${Math.round(n || 0).toLocaleString('vi-VN')} ₫`;

const pad = (n: number) => String(n).padStart(2, '0');

const personName = (v: unknown, fallback: string): string => {
  if (v && typeof v === 'object') {
    const o = v as { fullName?: string; name?: string; email?: string };
    return o.fullName || o.name || o.email || fallback;
  }
  return fallback;
};

const shortCode = (code?: string, id?: string) => {
  const raw = code || id || '';
  return raw.startsWith('#') ? raw : `#${raw}`;
};

// Helper trích xuất tên & hình ảnh hiện vật từ DB cho đơn hàng RENT
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractOrderItem = (item: any, productMap: Record<string, string>) => {
  if (!item) return { name: 'Sản phẩm cho thuê', image: FALLBACK_IMG };
  const prodObj = (item.productId && typeof item.productId === 'object') ? item.productId : null;
  const pIdStr = prodObj?._id ? String(prodObj._id) : (item.productId ? String(item.productId) : '');
  const name =
    item.productName ||
    item.name ||
    item.title ||
    prodObj?.name ||
    prodObj?.title ||
    'Sản phẩm cho thuê';
  const rawImg =
    item.imageUrl ||
    item.image ||
    (Array.isArray(item.images) && item.images[0]) ||
    prodObj?.coverImage ||
    (Array.isArray(prodObj?.images) && prodObj.images[0]) ||
    (pIdStr && productMap[pIdStr]) ||
    (name && productMap[name.trim().toLowerCase()]) ||
    FALLBACK_IMG;
  return { name, image: normalizeImageUrl(rawImg) };
};

const RENT_ATTENTION_STATUS: Record<
  string,
  { label: string; urgent: boolean; action: string; icon: string; notice: string }
> = {
  PENDING: {
    label: 'Chờ duyệt đơn',
    urgent: true,
    action: 'Xét duyệt hồ sơ',
    icon: 'fact_check',
    notice: 'Khách vừa gửi yêu cầu thuê, cần xác nhận hoặc từ chối sớm.',
  },
  PAID: {
    label: 'Đã thanh toán Escrow',
    urgent: false,
    action: 'Tạo vận đơn',
    icon: 'package_2',
    notice: 'Khách đã thanh toán, chuẩn bị đóng gói và bàn giao cho đơn vị vận chuyển.',
  },
  RETURN_REQUESTED: {
    label: 'Khách yêu cầu trả đồ',
    urgent: true,
    action: 'Vào bàn nghiệm thu',
    icon: 'assignment_turned_in',
    notice: 'Khách đã yêu cầu hoàn trả, cần đối kiểm khi nhận lại hiện vật.',
  },
  RETURNING: {
    label: 'Đang trên đường hoàn trả',
    urgent: false,
    action: 'Theo dõi hoàn trả',
    icon: 'local_shipping',
    notice: 'Hiện vật đang được gửi trả về xưởng.',
  },
  INSPECTING: {
    label: 'Đang đối kiểm',
    urgent: true,
    action: 'Vào bàn nghiệm thu',
    icon: 'assignment_turned_in',
    notice: 'Hiện vật đã về xưởng, cần hoàn tất đối kiểm và giải tỏa cọc.',
  },
  RETURNED: {
    label: 'Chờ hoàn cọc',
    urgent: false,
    action: 'Hoàn tất đối kiểm',
    icon: 'verified',
    notice: 'Đã nhận lại hiện vật, cần hoàn tất đối kiểm để hoàn cọc.',
  },
};

const THRIFT_ATTENTION_STATUS: Record<string, { label: string; action: string; icon: string; alert?: boolean }> = {
  PAID: { label: 'Chờ đóng gói & giao', action: 'Xử lý đơn', icon: 'lock' },
  PROCESSING: { label: 'Đang đóng gói', action: 'Cập nhật vận đơn', icon: 'package_2' },
  SHIPPED: { label: 'Đang vận chuyển', action: 'Chi tiết vận đơn →', icon: '' },
  DISPUTED: { label: 'Khiếu nại', action: 'Mở hồ sơ khiếu nại', icon: 'forum', alert: true },
};

export const ShopDashboard: React.FC = () => {
  const { products } = useShop();
  const auth = useContext(AuthContext);
  const ownerName = auth?.user?.fullName || auth?.user?.name || auth?.user?.username || 'Chủ xưởng';

  const [orders, setOrders] = useState<RentalOrderApi[]>([]);
  const [thriftListings, setThriftListings] = useState<ThriftListingItemApi[]>([]);
  const [thriftOrders, setThriftOrders] = useState<ThriftOrderApi[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getShopRentalOrdersApi().catch(() => [] as RentalOrderApi[]),
      getShopThriftListingsApi().catch(() => [] as ThriftListingItemApi[]),
      getShopThriftOrdersApi({ limit: 100 })
        .then((r) => r.orders)
        .catch(() => [] as ThriftOrderApi[]),
    ]).then(([ordersData, listingData, thriftOrderData]) => {
      if (!isMounted) return;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setThriftListings(Array.isArray(listingData) ? listingData : []);
      setThriftOrders(Array.isArray(thriftOrderData) ? thriftOrderData : []);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Số liệu kho từ sản phẩm RENT thật ──
  const inventory = useMemo(() => {
    const total = products.reduce((acc, p) => acc + (Number(p.totalUnits) || 0), 0);
    const renting = products.reduce((acc, p) => acc + (Number(p.rentingUnits) || 0), 0);
    const maintenance = products.reduce((acc, p) => acc + (Number(p.maintenanceUnits) || 0), 0);
    const ready = Math.max(0, total - renting - maintenance);
    // Quy tắc đồng bộ với trang Kho hiện vật: mỗi sản phẩm có từ 3 cá thể trở lên có 1 hiện vật đủ chuẩn THRIFT
    const thriftEligible = products.filter((p) => (Number(p.totalUnits) || 0) >= 3);
    const pct = (v: number) => (total > 0 ? Number(((v / total) * 100).toFixed(1)) : 0);
    return {
      total,
      renting,
      maintenance,
      ready,
      thriftEligible,
      rentingPct: pct(renting),
      readyPct: pct(ready),
      maintenancePct: pct(maintenance),
      utilization: pct(renting),
    };
  }, [products]);

  const rentAttentionOrders = useMemo(
    () => orders.filter((o) => RENT_ATTENTION_STATUS[(o.status || '').toUpperCase()]),
    [orders]
  );
  const thriftAttentionOrders = useMemo(
    () => thriftOrders.filter((o) => THRIFT_ATTENTION_STATUS[o.status]),
    [thriftOrders]
  );

  const productImageById = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      map[p.sku] = p.coverImage;
      if (p.name) {
        map[p.name.trim().toLowerCase()] = p.coverImage;
      }
    });
    return map;
  }, [products]);

  // ── Thẻ chỉ số vận hành ──
  const metrics = useMemo(() => {
    const upper = (s?: string) => (s || '').toUpperCase();
    const pendingOrders = orders.filter((o) => upper(o.status) === 'PENDING').length;
    const inspectionOrders = orders.filter((o) =>
      ['RETURN_REQUESTED', 'RETURNING', 'INSPECTING', 'RETURNED'].includes(upper(o.status))
    ).length;
    const pendingThrift = thriftListings.filter((t) =>
      ['PENDING', 'PENDING_APPROVAL'].includes(upper(t.status))
    ).length;

    // Doanh thu thực nhận đồng bộ 100% với Sổ cái tài chính xưởng (RevenueDashboard)
    // RENT: Chỉ đơn hoàn tất nghiệm thu COMPLETED mới giải ngân
    const rentRevenue = orders
      .filter((o) => upper(o.status) === 'COMPLETED')
      .reduce((acc, ro) => {
        const rawAmount =
          Number(ro.rentalFee) ||
          (Number(ro.totalAmount) - (Number(ro.depositAmount) || 0) > 0
            ? Number(ro.totalAmount) - (Number(ro.depositAmount) || 0)
            : Number(ro.totalAmount)) ||
          0;
        return acc + rawAmount;
      }, 0);

    // THRIFT: Đơn COMPLETED, trừ 3.5% phí sàn ReUse Hub
    const thriftRevenue = thriftOrders
      .filter((o) => upper(o.status) === 'COMPLETED')
      .reduce((acc, to) => {
        const grossAmount =
          Number(to.itemsSubtotal) ||
          (Number(to.totalAmount) - (Number(to.shippingFee) || 0) > 0
            ? Number(to.totalAmount) - (Number(to.shippingFee) || 0)
            : Number(to.totalAmount)) ||
          0;
        const netAmount = Math.round(grossAmount * 0.965);
        return acc + netAmount;
      }, 0);

    const totalNetRevenue = rentRevenue + thriftRevenue;

    return [
      {
        id: 'm1',
        title: 'Đơn thuê cần duyệt',
        count: pad(pendingOrders),
        unit: 'đơn',
        subtitle: pendingOrders > 0 ? 'Cần xử lý sớm' : 'Không có đơn chờ',
        icon: 'pending_actions',
        link: '/shop/rent/orders',
        highlightColor: pendingOrders > 0,
      },
      {
        id: 'm2',
        title: 'Hiện vật đang cho thuê',
        count: pad(inventory.renting),
        unit: 'món',
        subtitle: `${orders.length} đơn thuê trong hệ thống`,
        icon: 'swap_horiz',
        link: '/shop/rent/orders',
      },
      {
        id: 'm3',
        title: 'Trả đồ chờ đối kiểm',
        count: pad(inspectionOrders),
        unit: 'yêu cầu',
        subtitle: 'Đối soát khi nhận lại',
        icon: 'assignment_turned_in',
        link: '/shop/rent/orders',
      },
      {
        id: 'm4',
        title: 'Đồ thanh lý chờ duyệt',
        count: pad(pendingThrift),
        unit: 'món',
        subtitle: `${thriftListings.length} bài đăng THRIFT`,
        icon: 'inventory_2',
        link: '/shop/thrift/listings',
      },
      {
        id: 'm5',
        title: 'Tổng hiện vật trong kho',
        count: pad(inventory.total),
        unit: 'món',
        subtitle: `${products.length} sản phẩm RENT`,
        icon: 'category',
        link: '/shop/rent/products',
      },
      {
        id: 'm6',
        title: 'Doanh thu tích lũy',
        count: formatVND(totalNetRevenue),
        unit: '',
        subtitle: 'Đồng bộ sổ cái ví xưởng (Net)',
        icon: 'payments',
        link: '/shop/revenue',
      },
    ];
  }, [orders, products, thriftListings, thriftOrders, inventory]);

  // ── Preview gian hàng công khai từ dữ liệu thật ──
  const marketplacePreview = useMemo(() => {
    const items: {
      id: string;
      badge: string;
      badgeColorClass: string;
      displayId: string;
      title: string;
      price: string;
      statusText: string;
      imageUrl: string;
    }[] = [];
    const rentLive = products.find((p) => p.approvalStatus === 'APPROVED' && p.isVisible) || products[0];
    if (rentLive) {
      items.push({
        id: `rent-${rentLive.sku}`,
        badge: 'RENT',
        badgeColorClass: 'bg-[#D8E3CE] text-[#3F4A3A]',
        displayId: `ID: #${rentLive.sku.slice(-6).toUpperCase()}`,
        title: rentLive.name,
        price: `${formatVND(rentLive.pricePerDay)} / ngày`,
        statusText:
          rentLive.approvalStatus === 'APPROVED'
            ? `Đang hiển thị · Sẵn sàng ${rentLive.readyUnits}/${rentLive.totalUnits}`
            : 'Đang chờ Admin duyệt',
        imageUrl: rentLive.coverImage || FALLBACK_IMG,
      });
    }
    const thriftLive =
      thriftListings.find((t) => ['ACTIVE', 'APPROVED'].includes((t.status || '').toUpperCase())) ||
      thriftListings[0];
    if (thriftLive) {
      items.push({
        id: `thrift-${thriftLive._id}`,
        badge: 'THRIFT',
        badgeColorClass: 'bg-[#F0E0CB] text-[#4F4535]',
        displayId: `ID: #${thriftLive._id.slice(-6).toUpperCase()}`,
        title: thriftLive.name || thriftLive.title || 'Hiện vật THRIFT',
        price: formatVND(thriftLive.price),
        statusText: `Tình trạng: ${thriftLive.condition || 'Chưa cập nhật'}`,
        imageUrl: thriftLive.images?.[0] || FALLBACK_IMG,
      });
    }
    return items;
  }, [products, thriftListings]);

  const emptyBox = (text: string) => (
    <div className="bg-white p-6 rounded-xl border border-dashed border-[#d9d3c7] text-center text-xs text-[#7B766F]">
      {text}
    </div>
  );

  const mainRent = rentAttentionOrders.slice(0, 2);
  const subRent = rentAttentionOrders.slice(2, 4);
  const mainThrift = thriftAttentionOrders.slice(0, 2);
  const subThrift = thriftAttentionOrders.slice(2, 4);

  const urgentReturns = orders.filter((o) =>
    ['RETURN_REQUESTED', 'INSPECTING'].includes((o.status || '').toUpperCase())
  ).length;
  const toPack = orders.filter((o) => (o.status || '').toUpperCase() === 'PAID').length;

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-10">
      {/* WELCOME EDITORIAL BANNER */}
      <div className="bg-gradient-to-br from-[#F5F1EA] via-[#FDF9F2] to-[#ECE7DE] rounded-xl p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#E5DDD0]/50 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D8E3CE] text-[#3F4A3A] text-[11px] font-semibold tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                Đồng bộ MongoDB &amp; Cloudinary
              </span>
              <span className="text-xs text-[#7B766F]">
                Chủ xưởng: <strong className="text-[#292724]">{ownerName}</strong>
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#141310] font-normal tracking-tight">
              Chào mừng bạn trở lại, <span className="italic font-serif font-light text-[#576151]">{ownerName}.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#4A463F] leading-relaxed max-w-xl">
              Quản trị vòng đời sản phẩm cho thuê &amp; thanh lý của bạn. Toàn bộ đơn hàng, kho hiện vật và doanh thu được đồng bộ trực tiếp từ cơ sở dữ liệu.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/shop/rent/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141310] text-white text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-[#292724] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                Tạo sản phẩm RENT
              </Link>
              <Link
                to="/shop/thrift/listings/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E6E2DB] text-[#141310] text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-[#DCD6CD] transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">sell</span>
                Tạo món đồ THRIFT
              </Link>
              <Link
                to="/shop/revenue"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent text-[#4A463F] hover:text-[#141310] text-xs font-medium tracking-wider uppercase transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                Báo cáo doanh thu →
              </Link>
            </div>
          </div>

          {/* Mini Quick Status Snapshot */}
          <div className="w-full lg:w-auto bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm min-w-[280px] lg:min-w-[320px] flex flex-col gap-4 border border-[#ebe8e1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDE6]">
              <span className="text-xs uppercase tracking-wider text-[#7B766F] font-semibold">Tình trạng vận hành</span>
              <span className="font-mono text-xs font-bold text-[#576151]">MONGODB LIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Cần đối kiểm / nghiệm thu</span>
              <span className="px-2 py-0.5 rounded bg-[#FFDAD6] text-[#93000A] font-bold text-xs">
                {urgentReturns} đơn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Chờ đóng gói xuất kho</span>
              <span className="px-2 py-0.5 rounded bg-[#F0E0CB] text-[#4F4535] font-semibold text-xs">
                {toPack} đơn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Sản phẩm trong kho RENT</span>
              <span className="px-2 py-0.5 rounded bg-[#D8E3CE] text-[#3F4A3A] font-bold text-xs">
                {products.length} sản phẩm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. BUSINESS OVERVIEW */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Tổng quan số liệu thực tế</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Chỉ số vận hành xưởng (MongoDB)</h2>
          </div>
          <span className="text-xs text-[#7B766F] hidden sm:inline">Cập nhật tự động theo cơ sở dữ liệu</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {metrics.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className={`group p-5 rounded-xl transition-all duration-200 shadow-sm flex flex-col justify-between h-44 ${item.id === 'm6'
                  ? 'bg-[#292724] text-white hover:bg-[#141310] shadow-md'
                  : 'bg-[#F7F3EC] hover:bg-white text-[#141310]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`material-symbols-outlined p-2 rounded-lg transition-colors ${item.id === 'm6' ? 'bg-[#494643] text-[#D3C4B0]' : 'bg-[#EBE8E1] text-[#576151] group-hover:bg-[#D8E3CE]'
                    }`}
                >
                  {item.icon}
                </span>
                <span className="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-0.5 transition-transform">
                  {item.id === 'm6' ? 'north_east' : 'arrow_forward'}
                </span>
              </div>
              <div>
                <div
                  className={`font-serif text-3xl font-medium ${item.id === 'm6' ? 'text-[#E7E1DD] text-xl lg:text-[22px]' : 'text-[#141310]'
                    }`}
                >
                  {item.count}{' '}
                  <span className="text-xs font-sans font-normal opacity-70">{item.unit}</span>
                </div>
                <div className="text-xs font-semibold mt-1">{item.title}</div>
                <div
                  className={`text-[11px] mt-0.5 ${item.id === 'm6'
                      ? 'text-[#8FA77B] font-semibold flex items-center gap-1'
                      : item.highlightColor
                        ? 'text-[#BA1A1A] font-medium'
                        : 'text-[#7B766F]'
                    }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. SPLIT ROW: RENT ATTENTION & THRIFT ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RENT ATTENTION */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]"></span>
              <h2 className="font-serif text-xl text-[#141310] font-normal">Cần xử lý · Đơn thuê RENT</h2>
            </div>
            <Link to="/shop/rent/orders" className="text-xs font-semibold text-[#576151] hover:underline uppercase tracking-wider">
              Xem tất cả ({pad(orders.length)}) →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {rentAttentionOrders.length === 0 && emptyBox('Hiện không có đơn thuê nào cần xử lý.')}
            {mainRent.map((order) => {
              const cfg = RENT_ATTENTION_STATUS[(order.status || '').toUpperCase()] || {
                label: 'Cần xử lý',
                urgent: false,
                action: 'Xem chi tiết',
                icon: 'visibility',
                notice: 'Đơn thuê cần xử lý đối kiểm.',
              };
              const first = order.items?.[0];
              const { name, image } = extractOrderItem(first, productImageById);
              return (
                <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-[#ebe8e1]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#141310]">{shortCode(order.orderCode, order._id)}</span>
                      <span className="text-xs text-[#7B766F] ml-2">
                        Khách: <strong>{personName(order.renterId, 'Khách thuê')}</strong>
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${cfg.urgent ? 'bg-[#FFDAD6] text-[#93000A]' : 'bg-[#D8E3CE] text-[#3F4A3A]'
                        }`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] shrink-0 overflow-hidden flex items-center justify-center">
                      <img className="w-full h-full object-cover" src={image} alt={name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#141310] truncate">{name}</div>
                      <div className="text-xs text-[#7B766F]">
                        Tiền cọc Escrow: <strong className="text-[#141310]">{formatVND(order.depositAmount)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 p-3 rounded-lg bg-[#FFF8F6] text-xs text-[#7B766F] flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#BA1A1A] text-base shrink-0 mt-0.5">schedule</span>
                    <span>{cfg.notice}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                    <Link
                      to={`/shop/rent/orders/${order._id}`}
                      className="px-4 py-2 bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#292724] transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                      {cfg.action}
                    </Link>
                  </div>
                </div>
              );
            })}

            {subRent.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subRent.map((order) => {
                  const cfg = RENT_ATTENTION_STATUS[(order.status || '').toUpperCase()] || {
                    label: 'Cần xử lý',
                    action: 'Chi tiết',
                  };
                  const first = order.items?.[0];
                  const { name } = extractOrderItem(first, productImageById);
                  return (
                    <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-[#141310]">{shortCode(order.orderCode, order._id)}</span>
                          <span className="text-[#BA1A1A] font-semibold">{cfg.label}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#141310] truncate">{name}</div>
                        <div className="text-[11px] text-[#7B766F]">Khách: {personName(order.renterId, 'Khách thuê')}</div>
                      </div>
                      <Link to={`/shop/rent/orders/${order._id}`} className="mt-3 text-xs text-[#576151] font-semibold hover:underline">
                        {cfg.action} →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* THRIFT ATTENTION */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#576151]"></span>
              <h2 className="font-serif text-xl text-[#141310] font-normal">Cần xử lý · Đơn bán THRIFT</h2>
            </div>
            <Link to="/shop/thrift/orders" className="text-xs font-semibold text-[#576151] hover:underline uppercase tracking-wider">
              Xem tất cả ({pad(thriftOrders.length)}) →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {thriftAttentionOrders.length === 0 && emptyBox('Hiện không có đơn bán THRIFT nào cần xử lý.')}
            {mainThrift.map((order) => {
              const cfg = THRIFT_ATTENTION_STATUS[order.status] || {
                label: 'Cần xử lý',
                action: 'Xem đơn',
                icon: 'package_2',
              };
              const first = order.items?.[0];
              const listing =
                first && typeof first.listingId === 'object' && first.listingId
                  ? first.listingId
                  : first && typeof first.productId === 'object' && first.productId
                    ? first.productId
                    : null;
              const firstExtra = first as { title?: string; imageUrl?: string; image?: string } | undefined;
              const title =
                first?.name ||
                first?.productName ||
                firstExtra?.title ||
                listing?.name ||
                listing?.title ||
                'Hiện vật THRIFT';
              const rawImg =
                listing?.images?.[0] ||
                firstExtra?.imageUrl ||
                firstExtra?.image ||
                (Array.isArray(first?.images) && first.images[0]) ||
                FALLBACK_IMG;
              const img = normalizeImageUrl(rawImg);
              return (
                <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-[#ebe8e1]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#141310]">{shortCode(order.orderCode, order._id)}</span>
                      <span className="text-xs text-[#7B766F] ml-2">
                        Người mua: <strong>{personName(order.buyerId, 'Người mua')}</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F0E0CB] text-[#4F4535] text-[11px] font-semibold uppercase tracking-wider">
                      {cfg.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] shrink-0 overflow-hidden flex items-center justify-center">
                      <img className="w-full h-full object-cover" src={img} alt={title} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#141310] truncate">{title}</div>
                      <div className="text-xs font-serif font-medium text-[#141310]">{formatVND(order.totalAmount)}</div>
                    </div>
                  </div>
                  <div className="mt-3.5 flex items-center justify-between text-xs text-[#7B766F]">
                    <span>{order.trackingCode ? `Mã theo dõi: ${order.trackingCode}` : `Thanh toán: ${order.paymentStatus}`}</span>
                    <Link
                      to={`/shop/thrift/orders/${order._id}`}
                      className="px-4 py-2 bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#292724] transition-colors flex items-center gap-1.5"
                    >
                      {cfg.icon && <span className="material-symbols-outlined text-sm">{cfg.icon}</span>}
                      {cfg.action}
                    </Link>
                  </div>
                </div>
              );
            })}

            {subThrift.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subThrift.map((order) => {
                  const cfg = THRIFT_ATTENTION_STATUS[order.status];
                  const first = order.items?.[0];
                  return (
                    <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-[#141310]">{shortCode(order.orderCode, order._id)}</span>
                          <span className={cfg.alert ? 'text-[#BA1A1A] font-semibold' : 'text-[#4F4535] font-semibold'}>{cfg.label}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#141310] truncate">
                          {first?.name || first?.productName || first?.title || 'Hiện vật THRIFT'}
                        </div>
                        <div className="text-[11px] text-[#7B766F]">
                          {formatVND(order.totalAmount)} · {personName(order.buyerId, 'Người mua')}
                        </div>
                      </div>
                      <Link
                        to={`/shop/thrift/orders/${order._id}`}
                        className={`mt-3 text-xs font-semibold hover:underline flex items-center gap-1 ${cfg.alert ? 'text-[#BA1A1A]' : 'text-[#576151]'}`}
                      >
                        {cfg.alert && <span className="material-symbols-outlined text-xs">forum</span>}
                        {cfg.action}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 3. INVENTORY CIRCULAR LIFECYCLE */}
      <section className="bg-[#F7F3EC] p-6 lg:p-8 rounded-xl shadow-sm flex flex-col gap-6 border border-[#ebe8e1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#576151]">Giao thức chuyển đổi tự động</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Vòng đời kho tuần hoàn · Lưu ký chuyển giao THRIFT</h2>
          </div>
          <Link
            to="/shop/rent/inventory"
            className="text-xs font-semibold text-[#141310] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            Toàn bộ {inventory.total} hiện vật trong kho <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>

        {/* Stepper Visual */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#ebe8e1]">
          <div className="text-xs uppercase tracking-wider text-[#7B766F] font-semibold mb-4">
            Quy trình luân chuyển khép kín (Circular Protocol)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {circularProtocolSteps.map((step) => (
              <div
                key={step.step}
                className={`flex flex-col items-center p-3 rounded-lg ${step.isHighlight ? 'bg-[#D8E3CE] text-[#3F4A3A]' : 'bg-[#FAF8F5]'
                  }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-mono mb-2 ${step.isHighlight ? 'bg-[#3F4A3A]' : step.step === '01' ? 'bg-[#141310]' : 'bg-[#576151]'
                    }`}
                >
                  {step.step}
                </span>
                <span className="text-xs font-bold text-[#141310]">{step.title}</span>
                <span className="text-[11px] text-[#7B766F] mt-1">{step.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution & Promotion Callout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#141310]">Phân bố kho hiện vật thực tế</span>
              <span className="text-xs text-[#7B766F]">Tổng: {inventory.total} hiện vật lưu ký</span>
            </div>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Đang cho khách thuê giữ (Active Rental)</span>
                  <span className="font-bold text-[#141310]">{pad(inventory.renting)} món ({inventory.rentingPct}%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#576151] h-full rounded-full" style={{ width: `${inventory.rentingPct}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Khả dụng sẵn sàng thuê trong ngày</span>
                  <span className="font-bold text-[#141310]">{pad(inventory.ready)} món ({inventory.readyPct}%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#292724] h-full rounded-full" style={{ width: `${inventory.readyPct}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Bảo dưỡng / Đối kiểm hoàn trả</span>
                  <span className="font-bold text-[#141310]">{pad(inventory.maintenance)} món ({inventory.maintenancePct}%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#BA1A1A] h-full rounded-full" style={{ width: `${inventory.maintenancePct}%` }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F1EDE6] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7B766F]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#576151]"></span>Tỷ lệ khai thác hiện vật: <strong>{inventory.utilization}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#292724]"></span>Sản phẩm đang chờ duyệt:{' '}
                <strong>{products.filter((p) => p.approvalStatus === 'PENDING').length}</strong>
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#292724] to-[#141310] text-white p-6 rounded-xl shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0E0CB]/20 text-[#F0E0CB] text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                Cơ hội luân chuyển
              </div>
              <h3 className="font-serif text-xl font-normal leading-snug">
                {pad(inventory.thriftEligible.length)} hiện vật đủ tiêu chuẩn sang THRIFT
              </h3>
              <p className="text-xs text-[#CBC6C1] mt-2 leading-relaxed">
                Các hiện vật đã luân chuyển đủ chu kỳ cho thuê và hoàn tất kiểm định, sẵn sàng mở bán đứt trên sàn THRIFT.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#494643] flex flex-col gap-3">
              <div className="text-[11px] text-[#CBC6C1] flex items-center justify-between font-mono gap-2">
                <span className="truncate">
                  {inventory.thriftEligible.length > 0
                    ? inventory.thriftEligible.slice(0, 2).map((p) => p.name).join(' · ')
                    : 'Chưa có hiện vật đủ điều kiện'}
                </span>
                {inventory.thriftEligible.length > 0 && <span className="text-[#8FA77B] shrink-0">SẴN SÀNG</span>}
              </div>
              <Link
                to="/shop/rent/inventory"
                className="w-full py-2.5 px-4 bg-[#F0E0CB] text-[#141310] hover:bg-white text-xs font-semibold uppercase tracking-wider rounded text-center transition-colors"
              >
                Xem kho hiện vật →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUICK ACTIONS GRID */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Lối tắt điều hành</span>
          <h2 className="font-serif text-2xl text-[#141310] font-normal">Thao tác nhanh</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActionsData.map((qa) => (
            <Link
              key={qa.id}
              to={qa.link}
              className="p-5 rounded-xl bg-white hover:bg-[#FAF8F5] transition-all shadow-sm hover:shadow group flex items-start gap-4 border border-[#ebe8e1]"
            >
              <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] group-hover:bg-[#141310] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-[#576151] group-hover:text-white">
                  {qa.icon}
                </span>
              </div>
              <div>
                <div className="font-semibold text-sm text-[#141310] group-hover:text-[#576151] transition-colors">
                  {qa.title}
                </div>
                <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">{qa.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. MARKETPLACE PREVIEW */}
      <section className="bg-[#F1EDE6] p-6 lg:p-8 rounded-xl shadow-sm flex flex-col gap-6 border border-[#ebe8e1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Góc nhìn công khai</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Giao diện khách hàng nhìn thấy</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/rent"
              target="_blank"
              className="px-4 py-2 bg-white text-[#141310] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              Khám phá gian hàng RENT
            </Link>
            <Link
              to="/thrift"
              target="_blank"
              className="px-4 py-2 bg-[#292724] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#141310] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              Khám phá sàn THRIFT
            </Link>
          </div>
        </div>

        {marketplacePreview.length === 0 ? (
          emptyBox('Chưa có sản phẩm nào để hiển thị. Hãy tạo sản phẩm RENT hoặc THRIFT đầu tiên của bạn.')
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplacePreview.map((live) => (
              <div key={live.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 items-center border border-[#ebe8e1]">
                <div className="w-24 h-24 rounded-lg bg-[#FAF8F5] shrink-0 overflow-hidden">
                  <img className="w-full h-full object-cover" src={live.imageUrl} alt={live.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${live.badgeColorClass}`}>
                      {live.badge}
                    </span>
                    <span className="text-[11px] text-[#7B766F]">{live.displayId}</span>
                  </div>
                  <div className="font-semibold text-sm text-[#141310] truncate">{live.title}</div>
                  <div className="text-xs text-[#576151] font-semibold mt-1">{live.price}</div>
                  <div className="text-[11px] text-[#7B766F] mt-0.5">{live.statusText}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};