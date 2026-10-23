import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface ThriftListingItem {
  id: string;
  originalUnitId?: string;
  sku: string;
  title: string;
  category: string;
  condition: string;
  price: string;
  description: string;
  image: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SOLD';
  submittedAt: string;
  sourceTag: string;
}

const DEFAULT_THRIFT_LISTINGS: ThriftListingItem[] = [
  {
    id: 'thrift-HBL-500CM-demo',
    originalUnitId: 'INV-HB500-02',
    sku: 'HBL-500CM',
    title: 'Hasselblad 500C/M Body + 80mm Planar T* (Ex-Rental Vintage)',
    category: 'Classic Medium Format Film',
    condition: 'Good Vintage 86.0%',
    price: '48.500.000 ₫',
    description: 'Hiện vật di sản vintage Thụy Điển hoàn tất 22 chu kỳ thuê an toàn.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUN8HCi3sOXhTeh0dmehNYmo57zAHDye6SQDMIHO6MV0gs1lM8acz6IPVme5655aZzTIZcuBfeWTIShx9pWOMGfQguL-0rQ48jmhYIGGP97rfl7-9ODCHu4Bfr8f0eug6R1WoUO8pCOMtEA18LBcsfab6iSn_7v87Rehv8FjtphcR29tVHavTUarY6T57TmL__j8QfWk--_feDS3RT8vWba8Bigrfx6CdXpyWA-ixS',
    status: 'APPROVED',
    submittedAt: '12/10/2026',
    sourceTag: 'Returned RENT Inventory',
  },
];

const THRIFT_LISTINGS_STORAGE_KEY = 'REUSE_HUB_THRIFT_LISTINGS_V1';

export const ShopThriftListings: React.FC = () => {
  const [listings] = useState<ThriftListingItem[]>(() => {
    try {
      const stored = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_THRIFT_LISTINGS));
      return DEFAULT_THRIFT_LISTINGS;
    } catch (e) {
      console.error('Lỗi đọc THRIFT listings:', e);
      return DEFAULT_THRIFT_LISTINGS;
    }
  });
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SOLD'>('ALL');

  const filtered = listings.filter((item) => {
    if (filter === 'PENDING') return item.status === 'PENDING_APPROVAL';
    if (filter === 'APPROVED') return item.status === 'APPROVED';
    if (filter === 'SOLD') return item.status === 'SOLD';
    return true;
  });

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2] min-h-screen">
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8 w-full flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dddad3]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold mb-1">
              <span className="material-symbols-outlined text-[16px]">sell</span>
              <span>QUẢN TRỊ MỤC ĐĂNG BÁN ĐỨT THRIFT</span>
            </div>
            <h1 className="font-serif text-3xl text-[#141310] tracking-tight">
              Danh Sách Hiện Vật Bán Đứt THRIFT
            </h1>
            <p className="text-xs text-[#7b766f] mt-1">
              Các sản phẩm được chuyển giao từ kho RENT hoặc nhập trực tiếp từ người sưu tập đã qua thẩm định.
            </p>
          </div>

          <Link
            to="/shop/rent/convert-thrift/INV-HB907-01"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#141310] text-white text-xs uppercase tracking-wider font-semibold shadow hover:bg-[#292724] transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">autorenew</span>
            + Chuyển đồ RENT sang THRIFT
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filter === 'ALL' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tất cả ({listings.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'PENDING' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Chờ duyệt ({listings.filter((l) => l.status === 'PENDING_APPROVAL').length})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'APPROVED' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            Đã duyệt ({listings.filter((l) => l.status === 'APPROVED').length})
          </button>
          <button
            onClick={() => setFilter('SOLD')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'SOLD' ? 'bg-[#141310] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            Đã bán ({listings.filter((l) => l.status === 'SOLD').length})
          </button>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#ebe8e1] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1ede6] uppercase tracking-wider font-semibold text-[#4a463f]">
              <tr>
                <th className="py-3.5 px-4">Hiện vật THRIFT</th>
                <th className="py-3.5 px-4">Nguồn gốc</th>
                <th className="py-3.5 px-4">Giá bán đứt</th>
                <th className="py-3.5 px-4">Tình trạng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ede6]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#f7f3ec]/60 transition-colors">
                  <td className="py-4 px-4 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 object-cover rounded border border-[#ebe8e1] shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-sm text-[#141310] line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-[#7b766f] font-mono">
                        SKU: {item.sku} {item.originalUnitId && `• Mã RENT: #${item.originalUnitId}`}
                      </div>
                      <div className="text-[10px] text-[#7b766f]">{item.category}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-semibold">
                      <span className="material-symbols-outlined text-[13px]">history_edu</span>
                      {item.sourceTag || 'Returned RENT'}
                    </span>
                    <div className="text-[10px] text-[#7b766f] mt-1">{item.submittedAt}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-sm text-primary font-mono">{item.price}</div>
                    <div className="text-[10px] text-[#7b766f]">Escrow bảo vệ</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-xs text-[#141310]">{item.condition}</span>
                  </td>
                  <td className="py-4 px-4">
                    {item.status === 'PENDING_APPROVAL' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] uppercase font-bold rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                        CHỜ DUYỆT B-CORP
                      </span>
                    )}
                    {item.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#d8e3ce] text-[#3f4a3a] text-[10px] uppercase font-bold rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                        ĐANG NIÊM YẾT
                      </span>
                    )}
                    {item.status === 'SOLD' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 text-gray-700 text-[10px] uppercase font-bold rounded">
                        ĐÃ BÁN ĐỨT
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {item.originalUnitId && (
                      <Link
                        to={`/shop/rent/convert-thrift/${item.originalUnitId}`}
                        className="px-2.5 py-1 bg-[#f1ede6] hover:bg-[#ebe8e1] rounded font-semibold text-[11px] transition-colors"
                      >
                        Xem hồ sơ
                      </Link>
                    )}
                    <Link
                      to="/thrift"
                      className="px-2.5 py-1 bg-[#141310] text-white hover:bg-[#292724] rounded font-semibold text-[11px] transition-colors"
                    >
                      Xem sàn
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7b766f]">
                    Chưa có mục đăng THRIFT nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopThriftListings;
