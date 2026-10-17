import React, { useState } from 'react';

interface ThriftOrderMock {
  orderId: string;
  itemTitle: string;
  itemSku: string;
  customerName: string;
  customerPhone: string;
  amount: string;
  status: 'PENDING_DISPATCH' | 'SHIPPED' | 'DELIVERED';
  courier: string;
  createdAt: string;
}

const MOCK_ORDERS: ThriftOrderMock[] = [
  {
    orderId: '#TF-ORD-9021',
    itemTitle: 'Hasselblad 500C/M Body + 80mm Planar T*',
    itemSku: 'HBL-500CM',
    customerName: 'Hoàng Nhật Quang',
    customerPhone: '0912.***.889',
    amount: '48.500.000 ₫',
    status: 'PENDING_DISPATCH',
    courier: 'Nanuk White-Glove Crate (Insured)',
    createdAt: '16/10/2026',
  },
  {
    orderId: '#TF-ORD-8940',
    itemTitle: 'Leica Summicron-M 35mm f/2 ASPH',
    itemSku: 'LCA-35F2',
    customerName: 'Nguyễn Văn Hùng',
    customerPhone: '0903.***.112',
    amount: '62.000.000 ₫',
    status: 'DELIVERED',
    courier: 'Chuyển phát nhanh bọc chì',
    createdAt: '10/10/2026',
  },
];

export const ShopThriftOrders: React.FC = () => {
  const [orders, setOrders] = useState<ThriftOrderMock[]>(MOCK_ORDERS);

  const handleDispatch = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'SHIPPED' } : o))
    );
    alert(`Đã bàn giao đơn hàng ${orderId} cho đơn vị vận chuyển Nanuk Crate!`);
  };

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2] min-h-screen">
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8 w-full flex flex-col gap-6">
        <div className="pb-2 border-b border-[#dddad3]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold mb-1">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>QUẢN TRỊ ĐƠN BÁN THRIFT</span>
          </div>
          <h1 className="font-serif text-3xl text-[#141310] tracking-tight">
            Đơn Hàng Bán Đứt THRIFT
          </h1>
          <p className="text-xs text-[#7b766f] mt-1">
            Các đơn hàng mua đứt hiện vật tuần hoàn đã hoàn tất thanh toán Escrow và chờ xuất kho niêm phong chì.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#ebe8e1] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1ede6] uppercase tracking-wider font-semibold text-[#4a463f]">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn &amp; Thời gian</th>
                <th className="py-3.5 px-4">Hiện vật THRIFT</th>
                <th className="py-3.5 px-4">Người mua</th>
                <th className="py-3.5 px-4">Giá trị thanh toán</th>
                <th className="py-3.5 px-4">Trạng thái vận chuyển</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ede6]">
              {orders.map((o) => (
                <tr key={o.orderId} className="hover:bg-[#f7f3ec]/60 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-bold text-sm font-mono text-primary block">{o.orderId}</span>
                    <span className="text-[10px] text-[#7b766f]">{o.createdAt}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-xs text-[#141310]">{o.itemTitle}</div>
                    <div className="text-[10px] text-[#7b766f] font-mono">SKU: {o.itemSku}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-xs text-[#141310]">{o.customerName}</div>
                    <div className="text-[10px] text-[#7b766f]">{o.customerPhone}</div>
                  </td>
                  <td className="py-4 px-4 font-bold text-primary font-mono text-sm">
                    {o.amount}
                  </td>
                  <td className="py-4 px-4">
                    {o.status === 'PENDING_DISPATCH' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-bold text-[10px] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                        CHỜ XUẤT KHO NANUK
                      </span>
                    )}
                    {o.status === 'SHIPPED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-900 rounded font-bold text-[10px] uppercase">
                        <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                        ĐANG GIAO VẬN
                      </span>
                    )}
                    {o.status === 'DELIVERED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#d8e3ce] text-[#3f4a3a] rounded font-bold text-[10px] uppercase">
                        <span className="material-symbols-outlined text-[13px]">check</span>
                        ĐÃ GIAO THÀNH CÔNG
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {o.status === 'PENDING_DISPATCH' ? (
                      <button
                        onClick={() => handleDispatch(o.orderId)}
                        className="px-3 py-1.5 bg-[#141310] text-white hover:bg-[#292724] rounded font-semibold text-[11px] uppercase tracking-wider"
                      >
                        Bàn giao Nanuk
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#7b766f] italic">Đã niêm phong</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopThriftOrders;
