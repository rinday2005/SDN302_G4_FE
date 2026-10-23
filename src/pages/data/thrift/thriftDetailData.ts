import { THRIFT_PRODUCTS } from './thriftMarketplaceData';
import {
  CAMERA_CATEGORY_CONFIG,
  FASHION_CATEGORY_CONFIG,
  SHOES_CATEGORY_CONFIG,
  CAMPING_CATEGORY_CONFIG,
  ELECTRONICS_CATEGORY_CONFIG,
  BOOKS_CATEGORY_CONFIG,
  LIFESTYLE_CATEGORY_CONFIG,
} from '../categories/categoryDetailData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ThriftDetailThumbnail {
  src: string;
  alt: string;
  title: string;
}

export interface ThriftAuditRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface ThriftRelatedProduct {
  id: string;
  title: string;
  categoryLabel: string;
  location: string;
  condition: string;
  source: 'used' | 'rent';
  sourceLabel: string;
  price: number;
  image: string;
  href: string;
}

export interface ThriftProductDetail {
  id: string;
  slug: string;
  specimenCode: string;
  categoryLabel: string;
  location: string;
  sourceLabel: string;
  source: 'used' | 'rent';
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  conditionLabel: string;
  price: number;
  originalPrice: number;
  discountNote: string;
  verifiedBy: string;
  verifiedByRole: string;
  mainImage: string;
  thumbnails: ThriftDetailThumbnail[];
  reassurancePoints: string[];
  descriptionPoints: string[];
  auditRows: ThriftAuditRow[];
  auditNote: string;
  circularOriginNote: string;
  rentalCycles: number;
  shippingPoints: string[];
  quantity?: number;
  status?: string;
  sourceType?: string;
  category?: string;
  sizes?: string[];
  size?: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export const THRIFT_DETAIL_PRODUCTS: ThriftProductDetail[] = [
  {
    id: 'canon-eos-camera-kit',
    slug: 'canon-eos-camera-kit',
    specimenCode: '#TH-EOS-6592',
    categoryLabel: 'CAMERA & QUANG HỌC',
    location: 'Đà Nẵng',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    title: 'Canon EOS Camera Kit',
    subtitle: 'Kèm ống kính Canon RF 24–105mm f/4–7.1 IS STM. Cảm biến Full-frame thế hệ mới, chống rung quang học ổn định cao.',
    rating: 4.9,
    reviewCount: 86,
    conditionLabel: 'Rất tốt (95%)',
    price: 6500000,
    originalPrice: 9200000,
    discountNote: 'Tiết kiệm 29% so với mua mới',
    verifiedBy: 'Shop Owner',
    verifiedByRole: 'Đối tác lưu ký uỷ quyền bởi ReUse Hub',
    mainImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpl1MDJFb0TRr9Z8WkT3ZrE6lbLeZ4EBvtlq8Uh9BdqRy7OvfKswnakIzJivZFOAYmOypLqtfq_LSnq_xckcY91JOiSDbXYKp4ntSP4zWppBlRbD9aKGLPmLmIcEtjvlvIup1_rguRLliBiudcKdI1mHQhYCvJvWY9GGBhem6JR48qA-4sWoXRNPcVGDo1iV41JgHb9pz9gxU9NivBcr-XcOcXKBmETyN8MBqoYGYm',
    thumbnails: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXAXKjBK38Qz-o545FSona5fIbtQNbf6b7sonI56KeVwNdvcbc14U1G6Je02jXemTOeMtKRptbbDA3e00QmuRQk3oUn6JAy-wFXhEVuticWnNdppw37ZOlqp6ovWWsNULo6VIcOytouTP9hoKYY8yG4IUcgLQi9O9-jeMBw62Ts7-tHfW8o_K2TYhtd7ChpcvgtUy9-CbtSwOGNxT3SGt6ThHphRq0Y30lSPIbco5R', alt: 'Sensor inspection', title: 'Chi tiết cảm biến' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-vSJ2nSI9E__2cq8k4-_WWlOytagG9tUi-8sl2KEJliIzw0WhFlbm1_u4Weh8634Z0sT4r0DCXXVISdVS61e1-OXH8AiPhcRzTL_6_zVs6a2HQt6Gukep7y4dVRIoDbH0o89moB1mIzAVS3LIf_Ifb4TG37me0x4AwniqYrw4hN3bxpoPRm7NdreEZ7mzgz8Sa1z1OCUICrID-7X7KK0x3YDxXdYq6Wa8pY-fQQKo', alt: 'LCD & dials', title: 'Màn hình LCD & Phím xoay' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMKiW7SXLmiFny7vAmkDdILpnooupQcUpUlNSe9LiS5Zu66TXjqwHFiBO0WCnioTa1tDYhacF61s_I2KOmRyCAC3-4HcijMVcL1Aww2v6TRiNoJqMuJT2GWd866vtThsyS9ujUwFcZvw_Xw6MqH3K3McMzC_KEQOhh2k5G55l3CdH_QZdKP1z5-71j_gK32S9dyPo4IDUKJN5G4wB5HbQRCCjmrfYIwk_kxHVDTklG', alt: 'Battery & accessories', title: 'Pin sạc và phụ kiện' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB--nXARzsiR2s6MayZhgkpboPYIDEHWuJ9A_qljWPjZwLqP1zc5Tob4on_rIUz1Vt5QF0jB9epLXEUruw_NCFJNb5iFh8v1niW_xTF7d1Fou_hPpjztEjO53myaRMEGUMcKhK6mDkgiLGCpSx0JuxCGaZ5X0UIAFJFhYmAvJbxIC8z0SrXGGqXbm1KCS2UOogNjtoiOa_Eo4CtCJNbjalxpmcgJewP75iD4z8b1W16', alt: 'Nanuk case', title: 'Hộp Nanuk chống sốc' },
    ],
    reassurancePoints: [
      'Sở hữu vĩnh viễn (100% Outright)',
      'Bảo chứng đổi trả 72h',
      'Khử trùng y tế & đo Shutter',
      'Hộp bảo vệ chống sốc đi kèm',
    ],
    descriptionPoints: [
      'Dòng máy ảnh Canon EOS trang bị cảm biến CMOS Full-frame 24.2MP cho chất lượng hình ảnh sắc nét vượt trội, dải nhạy sáng rộng và khả năng lấy nét tự động Dual Pixel AF.',
      'Ống kính đi kèm: Canon RF 24–105mm f/4–7.1 IS STM',
      'Phụ kiện: 02 pin LP-E6NH zin, sạc đôi, dây đeo nhanh và thẻ SD Sandisk Extreme Pro 128GB',
    ],
    auditRows: [
      { label: 'Độ mới tổng thể', value: '95% (Rất tốt - Grade A)' },
      { label: 'Shutter count', value: '~18.420 lần / 200.000 max', mono: true },
      { label: 'Tình trạng cảm biến', value: 'Không điểm chết (0 Dead Pixel), sạch UV-C' },
      { label: 'Ngoại quan thân máy', value: 'Vết xước dăm cực nhỏ ở đáy máy, cao su chắc chắn' },
    ],
    auditNote: 'Đã vượt qua quy trình 14 bước kiểm định cơ học và quang học bởi kỹ thuật viên ReUse Hub.',
    circularOriginNote:
      'Từng được sử dụng như một sản phẩm RENT. Phục vụ 12 kỳ thuê ngắn hạn, bảo quản tủ chống ẩm tiêu chuẩn và thu hồi để làm mới vòng đời.',
    rentalCycles: 12,
    shippingPoints: [
      'Đóng gói trong thùng xốp giảm chấn chuyên dụng và dán tem niêm phong chống giả mạo.',
      'Giao hỏa tốc 2–4h tại Đà Nẵng, giao tiêu chuẩn bảo hiểm 24–48h đến TP. HCM và Hà Nội.',
      'Đồng kiểm ngoại quan 100% cùng shipper. 72 giờ bảo chứng đổi trả nếu sai lệch mô tả.',
    ],
  },
  {
    id: 'vintage-leather-jacket',
    slug: 'vintage-leather-jacket',
    specimenCode: '#TH-VLJ-2241',
    categoryLabel: 'THỜI TRANG',
    location: 'Đà Nẵng',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    title: 'Vintage Leather Jacket',
    subtitle: 'Áo khoác da vintage phong cách moto 70s. Da thật, đường may chắc chắn, khoá YKK zin. Size M-L unisex.',
    rating: 4.9,
    reviewCount: 42,
    conditionLabel: 'Rất tốt (95%)',
    price: 850000,
    originalPrice: 2500000,
    discountNote: 'Tiết kiệm 66% so với mới',
    verifiedBy: 'Shop Owner',
    verifiedByRole: 'Đối tác lưu ký uỷ quyền bởi ReUse Hub',
    mainImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNH-0eROeU6E1QWBPqGUZxtudCKHUCDCiHWUb3nUY6dQgFrc_2yUZ3WM-68q1qK9W8xAhgkGAPyQfNsDHJfCzBY2gVYh-GAYZOeFmJtP396Wroljg8SHqbpHAxAApJv1Kl2b_uN8HjNNKUmPSfoWs_D4zcZ1CcCTTfbgOSygaUl68Ol-TCeoyceH8WU0MarU1LfIwm4HnJNziZwGjSvkrQ0b80uI6d1jK6Kcmdu_CJ',
    thumbnails: [
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNH-0eROeU6E1QWBPqGUZxtudCKHUCDCiHWUb3nUY6dQgFrc_2yUZ3WM-68q1qK9W8xAhgkGAPyQfNsDHJfCzBY2gVYh-GAYZOeFmJtP396Wroljg8SHqbpHAxAApJv1Kl2b_uN8HjNNKUmPSfoWs_D4zcZ1CcCTTfbgOSygaUl68Ol-TCeoyceH8WU0MarU1LfIwm4HnJNziZwGjSvkrQ0b80uI6d1jK6Kcmdu_CJ', alt: 'Front', title: 'Mặt trước áo' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRX9_Lupi6ioKrTI6CdqUT2LoTPoPPDYope2NS1SXs83eJ30IPao3gwJ2NOmYoeYV4y3JS0AuNH--7g5Z4qFhIOpyB1JWHyTRX5CQamxtzAZ7CDYtmPQI_-JgQ4ew31pRDRXNyWYGanKJWjVqqovQffSBtjOHr9dPh9_adUdEZqnn0AAdm8-0zoHagZYrmYFdjimASLAe40LrLzXCmTK-J31sByBu4qvD_G6bfiVzO', alt: 'Detail', title: 'Chi tiết da' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHn2VdmkJTBi6OoWqffG5cpLJJQ0LGMBBpNLIASNuqZPRbuUBn3-AxfUmHNjoJQGYxRo9SL62-3K_i2lWhrPVXAFw71PeoS8bWtJ-zZ2h5-qYRHqh7PVykzS5WGVcNb4S34RaYvn1Td5pfuxbPQdUVHJ_3KqIfQcpkquMLLEsIEBeiC6zvBMVqhiDqQTDBPNXalmXpYZTDVw5CGt5zPyp0PaZXhXnJQcnEJ7WgTLnS', alt: 'Zipper', title: 'Khoá YKK' },
      { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0JEhXA2GX02l44kXc-KLB8ZswWNd7PNAWiOR7L083YFF0MuCZopf796nCSeWS0rvx7GbBdgXriJJfsHTMLEEu5n7kCRmSvgnDAZ2777GpgwHhP4fUDmU57eG50J5YSukwVXR0aeKZ3I3KaUOL5MDfXVKgfVctXs6f-0BzRpKIbdt4yBEzipU3udGuY6e0G3G526vTQy9sQJQDHxXuL06kEWIltMiAxR_DFBk550cF', alt: 'Back', title: 'Mặt sau' },
    ],
    reassurancePoints: [
      'Sở hữu vĩnh viễn (100% Outright)',
      'Bảo chứng đổi trả 72h',
      'Vệ sinh khử trùng chuyên nghiệp',
      'Đóng gói niêm phong bảo an',
    ],
    descriptionPoints: [
      'Áo khoác da Moto vintage phong cách thập niên 70s, da bò thật dày 1.2mm, đường may zigzag chắc chắn.',
      'Khoá: YKK zin, hoạt động trơn tru 100%.',
      'Size: M (vai 44cm, ngực 96cm, dài 64cm) – phù hợp unisex.',
    ],
    auditRows: [
      { label: 'Độ mới tổng thể', value: '95% (Rất tốt - Grade A)' },
      { label: 'Tình trạng da', value: 'Bề mặt láng bóng, 1 vết xước nhỏ phía trong thân trái' },
      { label: 'Khoá & kim loại', value: 'Hoạt động hoàn hảo, không gỉ' },
      { label: 'Đường may & lót', value: 'Nguyên vẹn, chỉ không đứt' },
    ],
    auditNote: 'Đã kiểm định vật lý 8 bước bởi chuyên viên thời trang của ReUse Hub.',
    circularOriginNote: 'Hàng ký gửi cá nhân, đã qua sử dụng thực tế và được vệ sinh chuyên nghiệp trước khi niêm yết.',
    rentalCycles: 0,
    shippingPoints: [
      'Đóng gói trong túi chống sốc và dán tem niêm phong chống giả mạo.',
      'Giao tiêu chuẩn bảo hiểm 24–48h toàn quốc.',
      '72 giờ bảo chứng đổi trả nếu sai lệch mô tả.',
    ],
  },
];

export const THRIFT_RELATED_PRODUCTS: ThriftRelatedProduct[] = [
  {
    id: 'vintage-leather-jacket',
    title: 'Vintage Leather Jacket',
    categoryLabel: 'Thời trang',
    location: 'Đà Nẵng',
    condition: 'Rất tốt (95%)',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 850000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAenHinG7AHbbT7k-vzkbXA2gKWEpgMjEZaTiMu7a2mFsDelkGJrppL2McFQ0BNds5LfNdLxxk9Vsx2BmyfDpDp7sUTaUjaHhZuOhKpVBTjOBXodvCkugUNFplvEjhdpchs-TIWKbkMNck6oitzdXuv-I5Qx-hHpw17tRNX8t8DwoaV8QVBbYfvMxLc326ASz7EJaKFrsCPDD3BkIXh00EfZVzv0MZZzMPxxcJYqmH',
    href: '/thrift/vintage-leather-jacket',
  },
  {
    id: 'classic-sneakers',
    title: 'Classic Sneakers',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    condition: 'Đã qua sử dụng (90%)',
    source: 'used',
    sourceLabel: 'Đồ đã qua sử dụng',
    price: 1200000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBX88HQgRj0FQJEugz5_LH527U52gU6qTcMtaSzm5DSW46uDSyHTQxOW2SVHSrjyhAaA3IpxXpirrmiFRYX1BMb2ea0vHbBeJoBjb1oSCr0LwII78t-K3mjRiNBOFlSzRW1E8QS9Kk8eyMJYdKc9jt79ZPHnEYR8KldyQDbFNHAzD5PE30vBoc12VQ78rg0hAz4s7K9d_H-S9u9MEFXExRSea9dWkAvlvgL0xJqcS_Q',
    href: '/thrift/classic-sneakers',
  },
  {
    id: 'minimal-backpack',
    title: 'Minimal Backpack',
    categoryLabel: 'Lifestyle',
    location: 'Hà Nội',
    condition: 'Như mới (99%)',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 650000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUSp6xgu3ic3CX5LTkabjykd5B29OlCPR_gtVZLzQb8fEksxHPlqG8Vlms0Ek1L5nOWkBC7arP-W7XHCbZ5p-A5WiNaoN6bzwjSv85TtZOYHRKjB2JnOqFpHJh7QhKN0SmIhsDZxt3HamKQN1wNPfspqXgZGCVksp3S7u4Hm5JL7T57bCUb5eCnVm6HqnNBc8NoAjoDSAJNGMbgUw24NGYc4OhSp5M3tEyfvseMZK9',
    href: '/thrift/minimal-backpack',
  },
  {
    id: 'ao-khoac-da-wool',
    title: 'Áo Khoác Dạ Wool Dáng Dài',
    categoryLabel: 'Thời trang',
    location: 'TP. Hồ Chí Minh',
    condition: 'Rất tốt (95%)',
    source: 'rent',
    sourceLabel: 'Từ sản phẩm RENT',
    price: 1450000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6uCN5aEy0Tzwei2WGPAuhcwhlHeuvdklKXJF5jEY5JcAtpgOwh5HejV9ty6KrQva9QMG3dcvjOwIhx-VqXGXv4Ahk8l-ibagNXXcRJPjDO3fP_vvhF6GBMzm4LvTOz1SxoDV3csg7Z6FmNKOl881w3yECdnO9o632H3lOFuh-FCuZemrT_FVb6w-zc3DFnxczhsTy-iSQDSVv4Wxw8yR9SHdI-N5Vbzn1rwEZCqFt',
    href: '/thrift/ao-khoac-da-wool',
  },
];

// Helper tạo chi tiết chuẩn cho bất kỳ sản phẩm Thrift nào
export function createThriftProductDetail(
  source: Partial<ThriftProductDetail> & { id: string; title: string }
): ThriftProductDetail {
  const price = source.price || 850000;
  const originalPrice = source.originalPrice || Math.round(price * 1.35);
  const discountPercent = Math.max(5, Math.round(((originalPrice - price) / originalPrice) * 100));
  const idStr = String(source.id);
  const isRentSource = source.source === 'rent' || (source.sourceLabel || '').includes('RENT');
  const mainImg = source.mainImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  return {
    id: idStr,
    slug: source.slug || idStr,
    specimenCode: source.specimenCode || `#TH-${idStr.slice(-6).toUpperCase()}`,
    categoryLabel: (source.categoryLabel || 'THRIFT').toUpperCase(),
    location: source.location || 'Đà Nẵng',
    source: isRentSource ? 'rent' : 'used',
    sourceLabel: source.sourceLabel || (isRentSource ? 'Từ sản phẩm RENT' : 'Đồ đã qua sử dụng'),
    title: source.title,
    subtitle: source.subtitle || `${source.title} · Đã qua kiểm chứng chất lượng và vệ sinh tiêu chuẩn ReUse Hub.`,
    rating: source.rating || 4.9,
    reviewCount: source.reviewCount || 36,
    conditionLabel: source.conditionLabel || 'Rất tốt (95%)',
    price,
    originalPrice,
    discountNote: source.discountNote || `Tiết kiệm ${discountPercent}% so với mua mới`,
    verifiedBy: source.verifiedBy || 'Shop Owner',
    verifiedByRole: source.verifiedByRole || 'Đối tác lưu ký uỷ quyền bởi ReUse Hub',
    mainImage: mainImg,
    thumbnails: source.thumbnails && source.thumbnails.length > 0 ? source.thumbnails : [
      { src: mainImg, alt: source.title, title: 'Ngoại quan sản phẩm' },
      { src: 'https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&w=600&q=80', alt: 'Chi tiết tem kiểm định', title: 'Tem kiểm định & Seal' },
      { src: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', alt: 'Phụ kiện kèm theo', title: 'Phụ kiện & đóng gói' },
    ],
    reassurancePoints: source.reassurancePoints && source.reassurancePoints.length > 0 ? source.reassurancePoints : [
      'Sở hữu vĩnh viễn (100% Outright)',
      'Bảo chứng đổi trả 72h',
      'Khử trùng y tế & kiểm định vật lý',
      'Đóng gói tiêu chuẩn bảo hiểm',
    ],
    descriptionPoints: source.descriptionPoints && source.descriptionPoints.length > 0 ? source.descriptionPoints : [
      `${source.title} là sản phẩm tuần hoàn chất lượng cao, đã được thẩm định nghiêm ngặt trước khi niêm yết trên ReUse Thrift.`,
      `Tình trạng vật lý: ${source.conditionLabel || 'Rất tốt (95%)'}, mọi tính năng và chi tiết hoạt động hoàn hảo.`,
      'Trọn bộ sản phẩm bao gồm đầy đủ phụ kiện theo mô tả kèm tem chứng thực ReUse Authentic.',
    ],
    auditRows: source.auditRows && source.auditRows.length > 0 ? source.auditRows : [
      { label: 'Độ mới tổng thể', value: source.conditionLabel || '95% (Rất tốt - Grade A)' },
      { label: 'Tình trạng ngoại quan', value: 'Bề mặt sạch sẽ, không biến dạng, không xước sâu' },
      { label: 'Chức năng cơ học / điện tử', value: 'Hoạt động hoàn hảo 100%' },
      { label: 'Vệ sinh chuyên sâu', value: 'Khử khuẩn Ozone & làm sạch buồng vô trùng' },
    ],
    auditNote: source.auditNote || 'Đã kiểm định vật lý 8 bước bởi chuyên viên của ReUse Hub.',
    circularOriginNote: source.circularOriginNote || (isRentSource ? 'Thu hồi sau chu kỳ cho thuê ngắn hạn, bảo dưỡng toàn diện tại xưởng lưu ký.' : 'Hàng ký gửi cá nhân, được tuyển chọn và xác thực nguồn gốc minh bạch.'),
    rentalCycles: source.rentalCycles ?? (isRentSource ? 3 : 0),
    shippingPoints: source.shippingPoints && source.shippingPoints.length > 0 ? source.shippingPoints : [
      'Đóng gói trong túi chống sốc và dán tem niêm phong chống giả mạo.',
      'Giao tiêu chuẩn bảo hiểm 24–48h toàn quốc.',
      '72 giờ bảo chứng đổi trả nếu sai lệch mô tả.',
    ],
  };
}

export function getThriftProductDetail(slugOrId?: string): ThriftProductDetail {
  if (!slugOrId) return THRIFT_DETAIL_PRODUCTS[0];

  const clean = slugOrId.trim();
  const lower = clean.toLowerCase();

  // 1. Tìm trong THRIFT_DETAIL_PRODUCTS
  const found = THRIFT_DETAIL_PRODUCTS.find((p) => p.slug.toLowerCase() === lower || p.id.toLowerCase() === lower);
  if (found) return found;

  // 2. Tìm trong THRIFT_PRODUCTS (marketplace)
  const foundMarket = THRIFT_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.slug.toLowerCase() === lower ||
      p.href.toLowerCase().endsWith(`/${lower}`) ||
      p.title.toLowerCase().includes(lower)
  );
  if (foundMarket) {
    return createThriftProductDetail({
      id: foundMarket.id,
      slug: foundMarket.slug,
      title: foundMarket.title,
      categoryLabel: foundMarket.categoryLabel,
      location: foundMarket.location,
      source: foundMarket.source,
      sourceLabel: foundMarket.sourceLabel,
      rating: foundMarket.rating,
      reviewCount: foundMarket.reviewCount,
      conditionLabel: foundMarket.condition,
      price: foundMarket.price,
      mainImage: foundMarket.image,
      verifiedBy: foundMarket.verifiedBy,
    });
  }

  // 3. Tìm trong tất cả category thriftItems
  const allConfigs = [
    CAMERA_CATEGORY_CONFIG,
    FASHION_CATEGORY_CONFIG,
    SHOES_CATEGORY_CONFIG,
    CAMPING_CATEGORY_CONFIG,
    ELECTRONICS_CATEGORY_CONFIG,
    BOOKS_CATEGORY_CONFIG,
    LIFESTYLE_CATEGORY_CONFIG,
  ];

  for (const config of allConfigs) {
    const catItem = config.thriftItems.find(
      (item) =>
        item.id.toLowerCase() === lower ||
        item.href.toLowerCase().endsWith(`/${lower}`) ||
        item.title.toLowerCase().includes(lower)
    );
    if (catItem) {
      return createThriftProductDetail({
        id: catItem.id,
        slug: catItem.id,
        title: catItem.title,
        subtitle: catItem.description,
        categoryLabel: config.title,
        location: catItem.locationBadge || 'Đà Nẵng',
        source: catItem.sourceType === 'rent' ? 'rent' : 'used',
        sourceLabel: catItem.sourceLabel,
        rating: catItem.rating,
        reviewCount: catItem.reviewCount,
        conditionLabel: catItem.gradeBadge,
        price: catItem.price,
        discountNote: catItem.discountNote,
        mainImage: catItem.image,
        verifiedBy: catItem.verifiedBy || 'Shop Owner',
      });
    }
  }

  // 4. Kiểm tra trong custom_thrift_products từ localStorage
  try {
    const customRaw = localStorage.getItem('custom_thrift_products');
    if (customRaw) {
      const customList = JSON.parse(customRaw);
      if (Array.isArray(customList)) {
        const foundCustom = customList.find(
          (p: { id?: string; slug?: string; name?: string; title?: string }) =>
            p.id?.toLowerCase() === lower ||
            p.slug?.toLowerCase() === lower ||
            p.name?.toLowerCase() === lower ||
            p.title?.toLowerCase() === lower
        );
        if (foundCustom) {
          return createThriftProductDetail({
            id: String(foundCustom.id || clean),
            slug: String(foundCustom.slug || clean),
            title: foundCustom.name || foundCustom.title || clean,
            categoryLabel: foundCustom.categoryLabel || 'THRIFT',
            price: Number(foundCustom.price) || 500000,
            mainImage: foundCustom.image || foundCustom.mainImage,
            conditionLabel: foundCustom.condition || 'Rất tốt (95%)',
            location: foundCustom.location || 'Đà Nẵng',
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // 5. Nếu có slug/id cụ thể nhưng chưa có trong danh sách tĩnh, tạo chi tiết tương ứng thay vì rơi về Canon EOS
  const formattedTitle = clean
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return createThriftProductDetail({
    id: clean,
    slug: clean,
    title: formattedTitle,
    categoryLabel: 'THRIFT TUYỂN CHỌN',
    location: 'Đà Nẵng',
    conditionLabel: 'Rất tốt (95%)',
    price: 950000,
  });
}

