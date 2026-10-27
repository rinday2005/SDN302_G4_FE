export interface ThriftListingItem {
  id: string;
  title: string;
  serialNumber: string;
  grade: string;
  price: number;
  imageUrl: string;
}

export interface ShippingInfo {
  carrier: string; // Ví dụ: Viettel Post, GHTK, Chuyên Dụng Nanuk, Hỏa Tốc
  trackingCode: string; // Ví dụ: VTP-88492019-VN
  dispatchedAt?: string;
  notes?: string;
  sealCode?: string; // Mã số niêm phong sáp / chì Atelier
}

export type ThriftOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID' // Đã thanh toán, chờ Shop gửi hàng
  | 'SHIPPED' // Shop đã nhập vận đơn và xác nhận gửi
  | 'DELIVERED' // Đã giao thành công
  | 'COMPLETED' // Hoàn tất đơn hàng
  | 'CANCELLED';

export interface ThriftOrder {
  id: string; // Ví dụ: #TO-2024-9102
  _dbId?: string; // MongoDB ObjectId
  createdAt: string;
  buyer: {
    name: string;
    phone: string;
    email?: string;
    shippingAddress: string;
    kycTier?: string;
  };
  listings: ThriftListingItem[];
  pricing: {
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
  };
  status: ThriftOrderStatus;
  shippingInfo?: ShippingInfo;
  buyerConfirmed?: boolean;
  buyerConfirmedAt?: string;
  rawCreatedAt?: number | string;
}

export const SHOP_THRIFT_ORDERS_STORAGE_KEY = 'SHOP_THRIFT_ORDERS_DATA';

export const INITIAL_MOCK_THRIFT_ORDERS: ThriftOrder[] = [
  {
    id: '#RH-THF-2024-9108',
    createdAt: '20/11/2024 · 14:30 ICT',
    buyer: {
      name: 'Elena Rostova',
      phone: '+84 908 421 892 (Đã mã hóa vi phốt)',
      email: 'elena.rostova@atelier-archive.com',
      shippingAddress: '48 Bạch Đằng, Tầng 4 Archive Suite, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
      kycTier: 'KYC XÁC THỰC CCCD · TIER 2',
    },
    listings: [
      {
        id: 'lst-9108-1',
        title: 'Áo Khoác Da Vintage Atelier Heritage 1994 (Vintage Distressed Leather Bomber)',
        serialNumber: '#LTH-JKT-1994-08',
        grade: 'GRADE 1 · MINT- 98.0% (Size L Âu)',
        price: 14500000,
        imageUrl:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: 'lst-9108-2',
        title: 'Đầm Dạ Hội Lụa Tơ Tằm Cung Đình Thêu Tay (Hand-Embroidered Mulberry Silk Gown)',
        serialNumber: '#SLK-GWN-8820',
        grade: 'GRADE 1 · PRISTINE 99.0% (Size M)',
        price: 8850000,
        imageUrl:
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60',
      },
    ],
    pricing: {
      subtotal: 23350000,
      shippingFee: 150000,
      totalAmount: 23500000,
    },
    status: 'PAID',
    shippingInfo: {
      carrier: 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: '#NNK-883910-TH',
      dispatchedAt: '20/11/2024 · 14:35',
      notes: 'Vali bọc chì Nanuk chống ẩm và giữ phom dáng. Thẻ seal sáp di sản #SEAL-ATELIER-9108.',
    },
  },
  {
    id: '#TO-2024-9102',
    createdAt: '21/11/2024 14:32',
    buyer: {
      name: 'Lê Minh Khoa',
      phone: '0908 ••• 456',
      email: 'minhkhoa.le@visualarts.vn',
      shippingAddress: '48 Tôn Thất Thiệp, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      kycTier: 'Tier 2 Verified Patron',
    },
    listings: [
      {
        id: 'lst-9102-1',
        title: 'Áo Măng Tô Dạ Cashmere Dáng Dài (Atelier Tailored Double-Breasted Cashmere Trench Coat)',
        serialNumber: 'CSH-TRN-902',
        grade: 'Grade A+ Mint 98% (Size XL)',
        price: 16200000,
        imageUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: 'lst-9102-2',
        title: 'Quần Tây May Đo Thủ Công Xếp Ly (Bespoke Pleated Wool Trousers - Florence Cut)',
        serialNumber: 'WOL-TRS-441',
        grade: 'Vải Len Super 130s · 96% (Size 32)',
        price: 3800000,
        imageUrl:
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=60',
      },
    ],
    pricing: {
      subtotal: 20000000,
      shippingFee: 200000,
      totalAmount: 20200000,
    },
    status: 'PAID',
    shippingInfo: {
      carrier: 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: 'NNK-910200-VN',
      notes: 'Đang trong khâu Atelier thẩm định sợi vải và ủi dưỡng phom trong buồng Ozone.',
    },
  },
  {
    id: '#TO-2024-9088',
    createdAt: '20/11/2024 09:15',
    buyer: {
      name: 'Trần Quốc Nam',
      phone: '0914 ••• 882',
      email: 'nam.tran@studiosg.com',
      shippingAddress: 'Studio Lumina, Số 12 Đường 15, Phường Tân Phong, Quận 7, TP. HCM',
      kycTier: 'B-Corp Certified Partner',
    },
    listings: [
      {
        id: 'lst-9088-1',
        title: 'Áo Khoác Denim Vintage Selvedge 14oz (Japanese Indigo Selvedge Denim Jacket - Type II)',
        serialNumber: 'DNM-JKT-14OZ',
        grade: 'Vải Kojima Chàm Cổ Điển · 97% (Size M)',
        price: 5600000,
        imageUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: 'lst-9088-2',
        title: 'Khăn Choàng Tơ Tằm Dệt Tay Họa Tiết Cổ Điển (Hand-Woven Silk Twill Heritage Scarf)',
        serialNumber: 'SLK-SCF-019',
        grade: 'Lụa Tơ Tằm Nguyên Chất 100% · Brand New 100%',
        price: 2400000,
        imageUrl:
          'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=60',
      },
      {
        id: 'lst-9088-3',
        title: 'Thắt Lưng Da Bò Thuộc Thảo Mộc Khóa Đồng Đúc (Full-Grain Vegetable Tanned Leather Belt)',
        serialNumber: 'LTH-BLT-TUSC',
        grade: 'Da Bò Tuscany Ý · Mint 99%',
        price: 1850000,
        imageUrl:
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&auto=format&fit=crop&q=60',
      },
    ],
    pricing: {
      subtotal: 9850000,
      shippingFee: 150000,
      totalAmount: 10000000,
    },
    status: 'SHIPPED',
    shippingInfo: {
      carrier: 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: 'VTP-88492019-VN',
      dispatchedAt: '20/11/2024 16:30',
      notes: 'Niêm phong chì sáp số #SEAL-CLOTHES-88201. Đóng vali Nanuk chống nhăn nếp gấp.',
    },
  },
  {
    id: '#TO-2024-8845',
    createdAt: '18/11/2024 08:45',
    buyer: {
      name: 'Elena Rostova',
      phone: '0903 ••• 771',
      email: 'elena.rostova@designarch.vn',
      shippingAddress: 'Căn hộ Panorama, Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh',
      kycTier: 'Verified Architect / Patron',
    },
    listings: [
      {
        id: 'lst-8845-1',
        title: 'Áo Blazer Dạ Tweed Phom Suông Cổ Điển (Vintage Scottish Tweed Oversized Blazer)',
        serialNumber: 'TWD-BLZ-SCOT',
        grade: 'Harris Tweed Scotland · Like New 99% (Size S/M)',
        price: 7800000,
        imageUrl:
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=60',
      },
    ],
    pricing: {
      subtotal: 7800000,
      shippingFee: 80000,
      totalAmount: 7880000,
    },
    status: 'DELIVERED',
    shippingInfo: {
      carrier: 'Hỏa Tốc Nội Thành Nanuk Courier',
      trackingCode: 'NNK-88192-HCM',
      dispatchedAt: '18/11/2024 09:30',
      notes: 'Đã giao tới tay khách hàng. Đang trong 72 giờ đối kiểm sợi vải và phom dáng.',
    },
  },
  {
    id: '#TO-2024-8991',
    createdAt: '01/11/2024 10:20',
    buyer: {
      name: 'Marcus Vance',
      phone: '0988 ••• 192',
      email: 'marcus.v@analog.io',
      shippingAddress: 'Villa 14, Đường Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP. HCM',
      kycTier: 'Heritage Fashion Collector',
    },
    listings: [
      {
        id: 'lst-8991-1',
        title: 'Áo Trench Coat Burberry Cổ Điển Lót Kẻ Nova Check (Heritage Archive Gabardine Trench Coat)',
        serialNumber: 'BBY-TRN-1988-V',
        grade: 'Full Tag • Tuyển Chọn Cổ Điển 98% (Size 50)',
        price: 24500000,
        imageUrl:
          'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=60',
      },
    ],
    pricing: {
      subtotal: 24500000,
      shippingFee: 150000,
      totalAmount: 24650000,
    },
    status: 'COMPLETED',
    shippingInfo: {
      carrier: 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: 'VTP-99210-VN',
      dispatchedAt: '02/11/2024 11:15',
      notes: 'Đã nghiệm thu thành công. Smart Escrow đã hoàn tất giải ngân tiền về ví xưởng Atelier.',
    },
  },
];
