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
}

export const SHOP_THRIFT_ORDERS_STORAGE_KEY = 'SHOP_THRIFT_ORDERS_DATA';

export const INITIAL_MOCK_THRIFT_ORDERS: ThriftOrder[] = [
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
        title: 'Hasselblad 907X 50C Kit Medium Format',
        serialNumber: 'HB-907-2023-A',
        grade: 'Grade A+ Mint 98%',
        price: 122000000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAAXcZM2VN08rOtSf-LcHxvy9EiHYPdG5PJZXiBxSxMS0U24w17nrrfEd4tUFxPMIokFM89LeY5mo1PMo3ICSXNx6UDNzNFjfDqAeGwvNdEbz2R8imW8JbSA_MRLu3cAJGStojkxqD1DvW6_jfVUEe74QBczPr-BYPS_2mQo2iznSVEM90vIl8rcrn07JTzvM4nc7qVK8FCkU9L-1hEHZRn3WGAxj0o2-cKojKtmVT9',
      },
      {
        id: 'lst-9102-2',
        title: 'Carl Zeiss Sonnar T* 150mm f/4 Prime Lens',
        serialNumber: 'CZ-SON-150-88',
        grade: 'Optics Clear 95%',
        price: 18500000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDvYsHc7yJYhYGZzTgllIScX5UmrHggJCMHoY-ppqxgej0v-dQzrZuTyrQVu5JcfyMsLcvUSBHoCIp_bblaLbOK6xXZQDWTFk6V_3v1TQC4oSdOpmPkCc4OfAmPBnyUTDht4BXEHeV4RkNVvvDi5xIWbImn8IOGFTxAsTtpbg72it1pKklrLEcCjbxEDfM4QO79K3Uj11n-UCyU4kXi6ouHmOYtAyGnWCVrjgtsbKUV',
      },
    ],
    pricing: {
      subtotal: 140500000,
      shippingFee: 250000,
      totalAmount: 140750000,
    },
    status: 'PAID',
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
        title: 'Canon EOS R6 Mark II Body (Ex-Rental)',
        serialNumber: 'CAN-R6M2-9901',
        grade: 'Shutter 4.2k • 96%',
        price: 42000000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCeGZZpwWtm5yYCHHbO2zp3U09FphEgkrkckGxVguTtbEeRz_evwu3hGI2n3TJLuo9xsYQd-httAHxL_HszM5D5XRTWng5KqG6z-z7-65HfW6PLEibE3iEQGlWx9CAa5IldvqXmnLW77rd-dbl9u7MEC7aWlK7Aghlj7qOL5BAMZqEtTWbRzmXNXsRRVS0KPRoFQ8Dp0Iy-R-nDyCiha2jq2ajd-9nf5jVh4biJN2aM',
      },
      {
        id: 'lst-9088-2',
        title: 'Canon Lens RF 24-70mm f/2.8L IS USM',
        serialNumber: 'RF-2470-L-0432',
        grade: 'Kèm Hood Gốc • 98%',
        price: 38000000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDXF9LrtEbzDhn4DvZfXlpXMHnuTPttlEdLOsooGuCHLXjFOs4awvrMFsyGZ-cd5wIJxf2vOpDjFM6gaIoJSXRdhzHLPFg0docjeilrVDYuxCDp_R5F9LU9FXPzqEto6qv5mlOtLE9Srl9xBBPbFleyoInYi56RA5seoOVYaQa_mUSMT23IqxDXIyg7FAxuLEitRXJaccXmrYsWyqzH3-cMNFq2pWdGFGf2fSAH2dR6',
      },
      {
        id: 'lst-9088-3',
        title: 'Bộ Đèn Aputure 600d Pro Cinematic Set',
        serialNumber: 'AP-600D-PRO-11',
        grade: 'Valy Chống Sốc • 94%',
        price: 28500000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwm-PPzHwNAlTUP3EEdsGOxUeapMzMT64uvxv1rkkA-hk2dEn9SO6AgqWKzY2Ddoz8yfId-dFmoE_CB7_mTMXd7PkiGDO8D7_FL0TBJDE0vVshqz4JHSTsRLSRGe7w0GlT2Z2izMg_8kTVfLRgNRVZG3_6N2n4pFuORZg5X1m2AgS7nGGOOluPRjTTxpvxyFDgSvktBS0Jb-rCF4n39VU2SDuRxBveGg2dDOFpBMz',
      },
    ],
    pricing: {
      subtotal: 108500000,
      shippingFee: 350000,
      totalAmount: 108850000,
    },
    status: 'SHIPPED',
    shippingInfo: {
      carrier: 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: 'VTP-88492019-VN',
      dispatchedAt: '20/11/2024 16:30',
      notes: 'Niêm phong chì số #SEAL-88201. Đã kèm biên bản bàn giao có chữ ký xưởng.',
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
      kycTier: 'Sound & Analog Collector',
    },
    listings: [
      {
        id: 'lst-8991-1',
        title: 'Teenage Engineering OP-1 Field Synthesizer',
        serialNumber: 'TE-OP1-FIELD-019',
        grade: 'Full Box • Like New 99%',
        price: 32000000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAM2kp3BGW8EVPFzNCH3lCEmPz507I9TBbG6DxwDwVFpsg1H52Qjj7rtUIufnx4TjM5cz_GuYdGg0a2fL5n15JJKLryFHBBF_loqLevF3FpqN8CI2Q3zn7RMlAxK6o_g_r7F7vbscnhK3MAEcI287hZEiTut32GA095PVoQ9-7bjoE5ZcTXAgdjlMa_OuklTCTLpckxdKgWUCbmMUSTqkXOhEMZeJ_sciAvrLyMB54r',
      },
    ],
    pricing: {
      subtotal: 32000000,
      shippingFee: 120000,
      totalAmount: 32120000,
    },
    status: 'COMPLETED',
    shippingInfo: {
      carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      trackingCode: 'GHTK-99210-VN',
      dispatchedAt: '02/11/2024 11:15',
      notes: 'Đã giao thành công cho Marcus Vance ngày 05/11/2024. Đã tất toán Escrow 100%.',
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
        title: 'Kính lọc CPL B+W 007 Master MRC Nano 77mm',
        serialNumber: 'BW-CPL-77-991',
        grade: 'Chính Hãng Đức • 99%',
        price: 2850000,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD901cWe4zBrqfoHm4xXfdXZxQzufSJGcH04Fn9KCKXNKFTcQF2qXksH8wIxbht1Qgmu3UbKEJcQ0XAn_0YTXxfR2KLy_u7AkVQfsQPVkPB7BFajDT5yPis2fudlmirT7YKBb339tZaLcFZS3iBVg34wWepngTsXjuI9IvSPdHq6Z_JYFYLEUnMxKXGiRrHM4NPsJO6UbLf4FrA38eWDQ0nLHzdrgMUmJ3eS6WuQHzn',
      },
    ],
    pricing: {
      subtotal: 2850000,
      shippingFee: 50000,
      totalAmount: 2900000,
    },
    status: 'DELIVERED',
    shippingInfo: {
      carrier: 'Hỏa Tốc Nội Thành Nanuk Courier',
      trackingCode: 'NOW-88192-HCM',
      dispatchedAt: '18/11/2024 09:30',
      notes: 'Bàn giao trực tiếp tại sảnh căn hộ có bảo vệ ký nhận.',
    },
  },
];
