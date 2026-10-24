import { RENT_PRODUCTS } from './marketplaceData';
import { normalizeImageUrl } from '../../../utils/imageUrl';
import {
  CAMERA_CATEGORY_CONFIG,
  FASHION_CATEGORY_CONFIG,
  SHOES_CATEGORY_CONFIG,
  CAMPING_CATEGORY_CONFIG,
  ELECTRONICS_CATEGORY_CONFIG,
  BOOKS_CATEGORY_CONFIG,
  LIFESTYLE_CATEGORY_CONFIG,
} from '../categories/categoryDetailData';

export interface AuditLogItem {
  label: string;
  value: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
}

export interface BookedDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  note?: string;
  customerName?: string;
}

export interface RentProductDetailData {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  condition: string;
  grade: string;
  shutterOrUsage: string;
  pricePerDay: number;
  deposit: number;
  depositFormatted: string;
  maxQuantity: number;
  auditCode: string;
  images: {
    src: string;
    alt: string;
    caption: string;
  }[];
  overview: string[];
  accessories: string[];
  auditItems: AuditLogItem[];
  allowedConditions: string;
  prohibitedActions: string;
  bookedDates?: BookedDateRange[];
  size?: string;
  sizes?: string[];
}

export interface RentLifecycleStep {
  step: string;
  title: string;
  desc: string;
  icon: string;
  highlight?: boolean;
}

export interface RelatedRentProduct {
  id: string;
  href: string;
  title: string;
  categoryTag: string;
  grade: string;
  price: number;
  deposit: string;
  image: string;
}

export interface ShopOwnerInfo {
  name: string;
  avatarText: string;
  badge: string;
  successOrders: string;
  responseTime: string;
  isKycVerified: boolean;
}

export const SHOP_OWNER_DATA: ShopOwnerInfo = {
  name: 'Da Nang Optical Vault',
  avatarText: 'OV',
  badge: 'HẠNG 1',
  successOrders: '184 đơn thuê thành công',
  responseTime: 'Phản hồi trong 5 phút',
  isKycVerified: true,
};

export const QUALITY_COMMITMENTS = [
  {
    title: 'Khử trùng y tế',
    desc: 'Tia UV-C sâu & dung dịch cồn quang học chuyên dụng.',
    icon: 'sanitizer',
  },
  {
    title: 'Kiểm định Sensor 100%',
    desc: 'Zero bụi, zero trầy xước, đo biểu đồ Dead Pixel chuẩn xác.',
    icon: 'biotech',
  },
  {
    title: 'Hoàn cọc trong 2h',
    desc: 'Tự động hoàn cọc sau nghiệm thu tại trạm kiểm định.',
    icon: 'history_toggle_off',
  },
];

export const RENT_8_STEPS_LIFECYCLE: RentLifecycleStep[] = [
  {
    step: 'BƯỚC 01',
    title: 'Đặt thuê',
    desc: 'Chọn ngày nhận máy và số lượng phù hợp.',
    icon: 'touch_app',
  },
  {
    step: 'BƯỚC 02',
    title: 'Chủ shop duyệt',
    desc: 'Shop Owner xác nhận lịch máy còn trống.',
    icon: 'rule',
  },
  {
    step: 'BƯỚC 03',
    title: 'Thanh toán',
    desc: 'Tiền cọc giữ an toàn tại Smart Escrow.',
    icon: 'account_balance_wallet',
  },
  {
    step: 'BƯỚC 04',
    title: 'Nhận hàng',
    desc: 'Đồng kiểm tem niêm phong và ngoại quan.',
    icon: 'local_shipping',
  },
  {
    step: 'BƯỚC 05',
    title: 'Sử dụng',
    desc: 'Thoải mái sáng tạo, có hỗ trợ kỹ thuật 24/7.',
    icon: 'photo_camera',
  },
  {
    step: 'BƯỚC 06',
    title: 'Trả hàng',
    desc: 'Bàn giao shipper tận nhà theo lịch hẹn.',
    icon: 'assignment_return',
  },
  {
    step: 'BƯỚC 07',
    title: 'Kiểm tra',
    desc: 'Trạm kỹ thuật kiểm định cảm biến trong 2h.',
    icon: 'fact_check',
  },
  {
    step: 'BƯỚC 08',
    title: 'Hoàn cọc',
    desc: 'Tự động hoàn 100% tiền cọc tức thì.',
    icon: 'payments',
    highlight: true,
  },
];

export const RELATED_RENT_PRODUCTS: RelatedRentProduct[] = [
  {
    id: 'canon-r6',
    href: '/rent/products/canon-eos-r6',
    title: 'Canon EOS R6 Mark II Body',
    categoryTag: 'CAMERA · HÀ NỘI',
    grade: 'Grade A',
    price: 420000,
    deposit: '1.800.000₫',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCo4yLitvdCJXxyR1Bg4OrMHGb9vH2__DAIMGVYGampyhJst54gPWZnGaTmjGMelV8naLpXDpzmRWhJyv2--9dkSRWuyw1LtXGBEV0pfBGaxLdnyTo_jw8uiblGfE97ptJ4lwUzkiJpZ9ClYvErB9xSxYT2qQlEb1ABfyg7SOAnyKhgtDLH0Tt3IWXiuJ_Id5BwKeuleCRxy6mhX6Oo5XVB82OCyKEAjq-oXoGTuWyE',
  },
  {
    id: 'hasselblad',
    href: '/rent/products/hasselblad-503cw',
    title: 'Hasselblad 503CW Film Kit',
    categoryTag: 'MEDIUM FORMAT · TP. HCM',
    grade: 'Grade A+',
    price: 650000,
    deposit: '3.500.000₫',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSJaApDllB4BjPc7Buem6BFQLceFzeORNlwx9uyLd5mIrudIx6c9kBGUUyOMSXQOUTj5WFa7PkzuGMPbr7dxvHo6CHfDU0GTlI6zGruw2v8JgspNHGgM-_Hz_zJG1I61fc5GwYkQxPs8D1aTnfbpbSB3J5P1iJ-4LuTw8_4fWOWL_r5hFffaVU1qdaQ1LYu_czr7BsMhkHj6g0mCcMXivVvFhv9pYE4JF64SIqlsF_',
  },
  {
    id: 'leica-summicron',
    href: '/rent/products/leica-summicron-m-35mm',
    title: 'Leica Summicron-M 35mm f/2',
    categoryTag: 'LENS QUANG HỌC · ĐÀ NẴNG',
    grade: 'Grade Mint',
    price: 380000,
    deposit: '2.500.000₫',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4RylAlksXQZJsyDt4jxBfUPcvF6694ZBglOCqZK3tQO0UPMXqQPjZciQ8-bm3OyUf4nlfLJQmEI02M0aKhLBYAg5BWv2M76vl4axovUx_So5KYVW7o9PB09nxsd-2e5JMMAQhInAR0P5oj79HseTCE4XNOLu5-3m53j0BqX01v28AFfknwvjJp14Yz0Gbz4Dgd4-hb1cVlu1BqZ8zVrgXPkUmhsnWc_XIGnnVGNU3',
  },
  {
    id: 'op1-synth',
    href: '/rent/products/op1-synth',
    title: 'Teenage Engineering OP-1',
    categoryTag: 'ÂM THANH · HÀ NỘI',
    grade: 'Grade A',
    price: 290000,
    deposit: '1.500.000₫',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDK8UKCxOVtk4ZLHxeVkD0AWu7G1eP2NkRBBoj0JpD3ZtQJirPC1MmGM3eVtRsZt--4AH0GgZ9Fwu3QwLmztIYhHP-FSedWGakG8JTK8siweCY3wsUktcObMBexf3WH7Tdh1m9JXuXgiTl1wsnjiViZG-mVrwVjHpWPee_4n9qTtHRX5gcY-0mBiQ3BNcEIEiSa-2A-T8PEikrKDcYBORCFDV3axLsDw_SEnb2Hn6jh',
  },
];

export const RENT_PRODUCT_DETAILS_MAP: Record<string, RentProductDetailData> = {
  '1': {
    id: '1',
    slug: 'sony-alpha',
    title: 'Sony Alpha A7 IV Mirrorless Kit',
    subtitle: 'Kèm ống kính Sony FE 24-70mm f/2.8 GM thế hệ mới · Cảm biến Full-frame 33MP',
    category: 'CAMERA',
    location: 'Đà Nẵng',
    rating: 4.9,
    reviewCount: 128,
    condition: 'Rất tốt (Grade A+)',
    grade: 'Grade A+',
    shutterOrUsage: 'Shutter: ~2.400 lần chụp',
    pricePerDay: 450000,
    deposit: 2000000,
    depositFormatted: '2.000.000₫',
    maxQuantity: 2,
    auditCode: '#DA-A7IV-0924',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMX4WfCULn5TrzUodIY6mQbCY-Ui_sWiwgdxVQMOqbQ7wbeNEgsTTqtQGrcAwwgcbXF40RTHcd7I98f4raKbo-XMnJZl0VKcaz7D538tsXkfvR8iDFQ9Vkaksx4KhNmu1G4O6xvRTHayutgVl3LPrTtKuygLWGJZqeXQOOiRIvl3Tb6Lj9gJdrXktKFllscpDGvDH3r3wY6KmP2TilJ4GqIs-qaJdVxSYL1vpJ0ZWo',
        alt: 'Sony Alpha A7 IV mirrorless camera',
        caption: 'Ảnh tổng thể thiết bị kèm ống kính 24-70mm',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtLBKWDA0tXgV8VBrvKuIjZm2olYiNwGGYDrEcjfIbXUED07kCZzBfpbqWho-OyrMauazefr1McjwWbRaWXBfmcy4mUt7XGqUi7GED-jkF0gNU__-TuNueGQA5Gv0r68dh_Rg9DRzB-5sgVbVZIJ5tvC1U21SWmAxV9N6cLcwsRhDm8lJbS0sFEMfYwJDJVTOXfrbTX6CxfK3rKCtH_BqXhrrhQHJSxBlNowbB549Z',
        alt: 'Cảm biến sạch không bụi',
        caption: 'Cảm biến sạch',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7m8rWDcU7nKkrql_V79a_4dxLlfhNaET4o82k0UC0a4LTgBgI0K7ocr54-hmvABuSEuoAp9SC0jLELgc-hKaTCciYwh-1n7AgLREidQmLFjYpgPY3e7i1Ae2pQQpdBnHrSHrRAvCv7vyGaJkahthxZuA5kOv-mzIOAaW3v_qelMIcivRkqyaHZu72GZhWn6pWwEzv2AqeMrmz2TN-9vc5TOf2ZjfRMNRZEmavwkeY',
        alt: 'Màn hình và phím bấm nguyên vẹn',
        caption: 'Màn hình & phím',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfGp1Skq5FN4Qh1DwImFeDq833mj_uIxdDtm7JXCeUomBARj2Bj0kt_vSU5zSxxY1FS-Dc4C0xj1SG8qXe6jAKulJSqh3dJCKemmvkQHfmDy1dzdNwjFaw6x-19pwV_LYeauSr1EW8MSDaiPkhToal_6WFFrrMzcRcgirGwcx1xWmt2YHqb_CY3Abra398L5-6zqbHn7mvBYCjIEtlb0sT6yK_FNwcUDqStD2NbENM',
        alt: 'Phụ kiện kèm theo đầy đủ',
        caption: 'Đầy đủ phụ kiện',
      },
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYVzYd37xL8Cgn_x3LwDDEG00wx0ow7EczaVpyvEBcZk_cNdB7JE4my-f8UwojKGjTcnCE96qe0dNTEcAJGE66yUQgGhM9rOym7nqhBux5i_FfpkdYOdB6buwRxY1vIU2b9nTkh8Cb7A2EJ26uLzPqKtc-nNBUmadqn9-u4Qc3yjspGz6Uq3RxCOLWgt6nSa3UfMyOhCTY44Pd1PbQvl14d1KVrBAbr5XtZsoVJd-4',
        alt: 'Hộp chống sốc Nanuk Canada',
        caption: 'Hộp Nanuk',
      },
    ],
    overview: [
      'Sony Alpha A7 IV trang bị cảm biến BSI Exmor R™ CMOS full-frame 33 megapixel cùng bộ xử lý hình ảnh BIONZ XR™ mạnh mẽ. Máy sở hữu dải nhạy sáng 15 stop, hệ thống lấy nét tự động thời gian thực Real-time Eye AF thông minh cho con người, động vật và chim chóc.',
      'Toàn bộ linh kiện đều trải qua quy trình vệ sinh phòng sạch ISO Class 7 và khử trùng UV-C trước khi bàn giao cho khách thuê.',
    ],
    accessories: [
      '01 Thân máy Sony A7 IV (Cap body gốc)',
      '01 Ống kính Sony FE 24-70mm f/2.8 GM (Hood + Cap)',
      '02 Pin Sony NP-FZ100 chính hãng (Tình trạng pin 100%)',
      '01 Bộ sạc đôi nhanh USB-C PD thông minh',
      '01 Thẻ nhớ ProGrade Digital SDXC 128GB V90',
      '01 Hộp chống va đập tiêu chuẩn Nanuk Canada',
    ],
    auditItems: [
      { label: 'Cảm biến (Sensor)', value: '0 Bụi · 0 Dead Pixel' },
      { label: 'Shutter Count', value: '2.412 lần chụp' },
      { label: 'Ngàm E-Mount', value: 'Khít 100% · Không rơ' },
      { label: 'Kính ống kính', value: 'Trong suốt · Không mốc' },
    ],
    allowedConditions:
      'Sử dụng trong nhà, studio, cảnh quan đô thị và thiên nhiên khô ráo. Trong trường hợp tác nghiệp gần bờ biển, tuyệt đối không đặt máy trực tiếp lên cát hoặc thay lens trong gió mạnh.',
    prohibitedActions:
      'Không quay chụp dưới mưa mà không có áo mưa chuyên dụng; không tự ý can thiệp phần mềm / tháo lắp bu lông cơ khí; không sử dụng sạc lô không rõ nguồn gốc dẫn đến cháy nổ mạch.',
  },
  '2': {
    id: '2',
    slug: 'party-dress',
    title: 'Party Dress Thiết Kế Tối Giản',
    subtitle: 'Chất liệu lụa satin cao cấp · Thiết kế dáng suông thanh lịch cho sự kiện & tiệc tối',
    category: 'THỜI TRANG',
    location: 'Đà Nẵng',
    rating: 4.8,
    reviewCount: 84,
    condition: 'Như mới (Grade Mint 99%)',
    grade: 'Grade Mint',
    shutterOrUsage: 'Số lần cho thuê: 03 lần',
    pricePerDay: 180000,
    deposit: 800000,
    depositFormatted: '800.000₫',
    maxQuantity: 1,
    auditCode: '#DA-PDRESS-0811',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtmXKLrFBh-ULvSwIfPH1-6Wt20ZZ6MVkUuMWLCglFjw1kWB6QFMzh2-V6BXtow5H6r3Mbt8RSgMy-DL2iSfu901WIFIU_yZfWuObWTRd4NoP9Nh1jctTIF7wGjHkgI4D5oxH6_dDBVra7zeHdkwYMXvpTTvPzpsf0XKcML75jinBrzziZBMszcYr5tYuRg6PC9_OCoBVNoPUb4MfpHrUPrGF2yzFQQLz7iIk6cPu5',
        alt: 'Party dress thiết kế tối giản',
        caption: 'Trang phục dạ hội lụa satin',
      },
    ],
    overview: [
      'Trang phục dạ tiệc cao cấp với form dáng tôn đường nét tinh tế, chất liệu lụa cao cấp mềm mại thoáng mát.',
      'Sản phẩm được giặt khô sinh học khử khuẩn nhiệt độ cao và bảo quản túi chống bụi chuyên dụng.',
    ],
    accessories: [
      '01 Đầm tiệc dạ hội nguyên tag niêm phong',
      '01 Móc treo gỗ sồi cao cấp ReUse',
      '01 Túi trùm bảo quản chống ẩm chuyên dụng',
    ],
    auditItems: [
      { label: 'Tình trạng vải', value: '100% Nguyên vẹn · Không sờn' },
      { label: 'Đường may & Khóa', value: 'Chắc chắn · Khóa YKK êm' },
      { label: 'Độ sạch vi sinh', value: 'Khử khuẩn 100% chuẩn y tế' },
      { label: 'Mùi hương', value: 'Hương gỗ tự nhiên dịu nhẹ' },
    ],
    allowedConditions:
      'Thích hợp cho tiệc cưới, sự kiện dạ hội, chụp ảnh studio hoặc dạ tiệc trang trọng.',
    prohibitedActions:
      'Không tự ý tẩy rửa bằng hóa chất mạnh, không ủi trực tiếp ở nhiệt độ cao khi chưa qua vải lót bảo vệ.',
  },
  '3': {
    id: '3',
    slug: 'classic-sneakers',
    title: 'Classic Sneakers Da Thật Archive',
    subtitle: 'Da bê nguyên tấm chế tác thủ công · Size 41-42 vừa vặn êm ái',
    category: 'GIÀY DÉP',
    location: 'Đà Nẵng',
    rating: 4.7,
    reviewCount: 52,
    condition: 'Rất tốt (Grade A 95%)',
    grade: 'Grade A',
    shutterOrUsage: 'Số lần sử dụng: 04 lần',
    pricePerDay: 150000,
    deposit: 600000,
    depositFormatted: '600.000₫',
    maxQuantity: 1,
    auditCode: '#DA-SNEAK-1102',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBGX9MLaXkDPpkpvRKdy2axzNTQbnNx_zdNdPhaZIyGar7jQumeRDAiXCgdqV-vo2remereT9vKy1u0lXTPcTjUwHWw2BUN5nVjtbW3A7Kck2D8oSAuMlA4YWikHGVx2wLPa4O73p6BniZAEsLW2gaF64ui2yqlzuI6QxQw-FAJ6EEbSwiKl9WQGZVRuhW0izycAPRBT0Wp20b8b6yIXFPDTRtD61j3kfI03X6CBtE',
        alt: 'Sneakers da thật archive',
        caption: 'Đôi sneakers da thật archive',
      },
    ],
    overview: [
      'Đôi sneaker da thật vintage archive với độ hoàn thiện thủ công tỉ mỉ, đế đúc chống trơn trượt.',
      'Đã được vệ sinh chuyên sâu, dưỡng chất bảo dưỡng da chuyên dụng và khử mùi ozone trước khi giao.',
    ],
    accessories: [
      '01 Đôi sneakers da thật chính hãng',
      '01 Cây giữ form giày gỗ tuyết tùng (Shoe tree)',
      '01 Túi vải rút canvas bảo vệ',
    ],
    auditItems: [
      { label: 'Chất liệu da', value: 'Mềm mại · Không nứt gãy' },
      { label: 'Đế giày', value: 'Độ mòn < 5% · Bám tốt' },
      { label: 'Khử khuẩn', value: 'Xử lý buồng Ozone 30 phút' },
      { label: 'Lót trong', value: 'Lót da êm ái nguyên bản' },
    ],
    allowedConditions: 'Phù hợp đi lại thường nhật, dự sự kiện thời trang, chụp ảnh lookbook.',
    prohibitedActions: 'Không ngâm nước bùn, không phơi trực tiếp dưới nắng gắt trưa hè.',
  },
  '4': {
    id: '4',
    slug: 'camping-tent',
    title: 'Snow Peak Alpha Breeze Camping Tent 4P',
    subtitle: 'Lều cắm trại 4 người chịu mưa bão PU 1800mm · Khung nhôm Duralumin hàng không',
    category: 'CẮM TRẠI',
    location: 'Đà Nẵng',
    rating: 4.7,
    reviewCount: 39,
    condition: 'Rất tốt (Grade A 95%)',
    grade: 'Grade A',
    shutterOrUsage: 'Số chuyến đi: 06 chuyến',
    pricePerDay: 250000,
    deposit: 1000000,
    depositFormatted: '1.000.000₫',
    maxQuantity: 2,
    auditCode: '#DA-TENT-4P-0331',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1UpAkWSNWMQ1I3uDPXGKoJ-9POEmgeq7YpIuQ79QNfhv4wiFY--5DWEuQmRz157eN8zUtLw0-UevOSecwGvpA0ZrRN9VGHK-2-C5pFiUfYSHUx2MqqlZVsl629nHldrxwTBy5kgIb-ZIWJuDAl_Qky-i9C9MXMvUbdPsXpBqf_6hXLn00pNo_aYsD8vvfLcMsOpvOBXd4efa0KQnDAZ_YWGvL09INihtDBxqszHib',
        alt: 'Lều cắm trại Snow Peak Alpha Breeze',
        caption: 'Lều cắm trại 4 người Snow Peak',
      },
    ],
    overview: [
      'Dòng lều dã ngoại gia đình cao cấp từ thương hiệu Snow Peak với khả năng thông gió đa chiều và chống thấm nước tối đa.',
      'Sản phẩm được phơi sấy khô ráo, phủ lớp chống thấm định kỳ và kiểm tra toàn bộ cọc chốt an toàn.',
    ],
    accessories: [
      '01 Thân lều + Mái che chống mưa 75D Polyester',
      '01 Bộ khung cọc nhôm Duralumin kèm bao đựng',
      '14 Cọc ghim đất chống bão + 6 Dây chằng phản quang',
      '01 Túi xách chứa đồ chịu lực có khóa kéo',
    ],
    auditItems: [
      { label: 'Độ kín nước', value: 'Đạt chuẩn 1800mm PU' },
      { label: 'Khung nhôm', value: 'Thẳng 100% · Khớp nối êm' },
      { label: 'Màng lưới chống muỗi', value: 'Không rách · Khóa trơn' },
      { label: 'Vệ sinh', value: 'Khô ráo sạch cát bụi 100%' },
    ],
    allowedConditions: 'Phù hợp dã ngoại bãi biển, cắm trại thảo nguyên, đồi núi trong điều kiện thời tiết thông thường.',
    prohibitedActions: 'Không nhóm lửa hay dùng bếp ga trong lều; không gấp cất khi vải lều còn đang ướt sũng.',
  },
  '5': {
    id: '5',
    slug: 'canon-eos-r6',
    title: 'Canon EOS R6 Mark II Mirrorless',
    subtitle: 'Kèm ống kính Canon RF 24–70mm f/2.8L IS USM · Cảm biến Full-frame 24.2MP 4K 60p không crop',
    category: 'CAMERA',
    location: 'TP. Hồ Chí Minh',
    rating: 4.9,
    reviewCount: 210,
    condition: 'Như mới (Grade A+ 99%)',
    grade: 'Grade A+',
    shutterOrUsage: 'Shutter: ~4.120 lần chụp',
    pricePerDay: 500000,
    deposit: 2500000,
    depositFormatted: '2.500.000₫',
    maxQuantity: 2,
    auditCode: '#HCM-R6M2-1082',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDm9RHp_nAFGyZAGYxDLuSj2aEJ1h1N-U9WI7PAFWW7ZyfVfl1i_9SppV5JiKn77I8cJ_bsDk1yKDbhK7ua6iE0__0FrQpGra28G6Yt_gWfXn44AauvwE85glJuv7mhovOe_fQm_64353WGhh-yXyasdXNywXSTsgjbqL6GWjRg7xe-alf5PYk6YJEQ4Ew9ZErc7V38NU-BCrvgK7m2VReo2j_s_PneV8IEQBWJ0hmx',
        alt: 'Canon EOS R6 Mark II',
        caption: 'Canon EOS R6 Mark II kèm ống kính RF 24-70mm f/2.8L',
      },
    ],
    overview: [
      'Canon EOS R6 Mark II là dòng máy ảnh hybrid quay chụp đỉnh cao với cảm biến Full-frame 24.2MP, chống rung thân máy IBIS 8 stop và lấy nét Dual Pixel CMOS AF II thông minh.',
      'Toàn bộ thiết bị được bảo quản tủ chống ẩm 40% RH, khử khuẩn UV-C và vệ sinh cảm biến định kỳ trước mỗi kỳ thuê.',
    ],
    accessories: [
      '01 Thân máy Canon EOS R6 Mark II',
      '01 Ống kính Canon RF 24-70mm f/2.8L IS USM',
      '02 Pin Canon LP-E6NH chính hãng',
      '01 Sạc đôi nhanh LC-E6',
      '01 Thẻ nhớ SDXC 128GB V60',
      '01 Hộp chống va đập tiêu chuẩn Nanuk Canada',
    ],
    auditItems: [
      { label: 'Cảm biến (Sensor)', value: '0 Bụi · 0 Dead Pixel' },
      { label: 'Shutter Count', value: '~4.120 lần chụp' },
      { label: 'Chống rung IBIS', value: 'Ổn định 8 stop hoàn hảo' },
      { label: 'Kính ống kính', value: 'Trong suốt · Không mốc rễ tre' },
    ],
    allowedConditions: 'Phù hợp tác nghiệp sự kiện, quay phim ngắn, lookbook studio và phong cảnh ngoài trời.',
    prohibitedActions: 'Không sử dụng dưới mưa lớn khi không có áo mưa chuyên dụng; không tự ý tháo mở bu lông ngàm ống kính.',
  },
  '6': {
    id: '6',
    slug: 'wool-coat',
    title: 'Áo Khoác Dạ Wool Dáng Dài Cao Cấp',
    subtitle: 'Chất liệu 100% dạ len lông cừu tự nhiên · Giữ ấm tốt, form dáng trench coat thanh lịch',
    category: 'THỜI TRANG',
    location: 'Hà Nội',
    rating: 4.8,
    reviewCount: 45,
    condition: 'Như mới (Grade Mint 99%)',
    grade: 'Grade Mint',
    shutterOrUsage: 'Số lần sử dụng: 02 lần',
    pricePerDay: 220000,
    deposit: 900000,
    depositFormatted: '900.000₫',
    maxQuantity: 1,
    auditCode: '#HN-COAT-0941',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmFHFDSIg4hOhOPqA36mT1kkDCl3WPEhUJRK08XZrwDTHzuiTwpPS19S9rp72RfWd75ovkeghRObBnjMEjwjM4C-han-LYxuwvvmbNoQxfmQdJ0b32KcCw-X0Jnqe_U23o9wu4QRqi1jvm0k2QIjvQX3uucHyHqIp2-wcXnh_PJzwTUThv7mBwqwtAjiXdUPGAdc-I8uwnLjfVeTg2aWPw2sXhSqhHAp-MSwbmguRZ',
        alt: 'Áo Khoác Dạ Wool',
        caption: 'Áo Khoác Dạ Wool Dáng Dài',
      },
    ],
    overview: [
      'Áo khoác dạ len wool dáng dài cao cấp chuẩn atelier, form dáng đứng tôn dáng, khả năng giữ ấm và cản gió vượt trội.',
      'Được giặt khô sinh học công nghệ CO2 lỏng, ủi hơi nước định hình form dáng và bọc túi chống bụi trước khi giao.',
    ],
    accessories: [
      '01 Áo khoác dạ wool nguyên tag',
      '01 Đai thắt lưng cùng chất liệu',
      '01 Móc gỗ sồi chuyên dụng ReUse',
      '01 Túi trùm bảo quản kháng ẩm cao cấp',
    ],
    auditItems: [
      { label: 'Độ mới chất liệu', value: '99% Như mới (Grade Mint)' },
      { label: 'Sớ vải wool', value: 'Mịn màng · Không xù lông' },
      { label: 'Cúc áo & Khuy', value: 'Nguyên bản chắc chắn 100%' },
      { label: 'Độ sạch vi sinh', value: 'Khử khuẩn chuẩn y tế' },
    ],
    allowedConditions: 'Thích hợp dự tiệc mùa đông, chụp ảnh dã ngoại thu đông hoặc sự kiện trang trọng.',
    prohibitedActions: 'Không giặt nước thông thường, không vắt hay phơi nắng gắt trực tiếp.',
  },
  '7': {
    id: '7',
    slug: 'op1-synth',
    title: 'Dây Chuyền Ngọc Trai Nước Ngọt Khóa Vàng 18K Luxury',
    subtitle: 'Ngọc trai nước ngọt tự nhiên thượng hạng tuyển chọn · Khóa cài mạ vàng 18K tinh xảo',
    category: 'phu-kien',
    location: 'Đà Nẵng',
    rating: 5.0,
    reviewCount: 18,
    condition: 'Rất tốt (Grade A 98%)',
    grade: 'Grade A+',
    shutterOrUsage: 'Độ sáng bóng: Chuẩn AAA',
    pricePerDay: 320000,
    deposit: 1500000,
    depositFormatted: '1.500.000₫',
    maxQuantity: 1,
    auditCode: '#DA-JW-9235',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60',
        alt: 'Dây Chuyền Ngọc Trai Nước Ngọt',
        caption: 'Dây Chuyền Ngọc Trai Nước Ngọt Khóa Vàng 18K Luxury',
      },
    ],
    overview: [
      'Dây chuyền ngọc trai nước ngọt tự nhiên cao cấp kết hợp khóa vàng 18K tinh tế, phù hợp cho sự kiện sang trọng, chụp ảnh lookbook và tiệc cưới.',
      'Từng viên ngọc trai được kiểm định độ bóng xà cừ AAA và khóa cài được đối kiểm cơ học đạt chuẩn 100%.',
    ],
    accessories: [
      '01 Hộp nhung bảo quản trang sức cao cấp',
      '01 Khăn lau chuyên dụng cho ngọc trai',
      '01 Thẻ kiểm định chất lượng ReUse Lab',
    ],
    auditItems: [
      { label: 'Độ bóng ngọc trai', value: 'Bóng gương chuẩn AAA' },
      { label: 'Khóa cài 18K', value: 'Chắc chắn · Không trầy' },
      { label: 'Dây xâu ngọc', value: 'Chỉ lụa chuyên dụng không xơ' },
      { label: 'Chứng nhận', value: 'Kiểm định ReUse Lab đạt chuẩn' },
    ],
    allowedConditions: 'Thích hợp diện tiệc dạ hội, sự kiện sang trọng, chụp ảnh studio hoặc tiệc cưới.',
    prohibitedActions: 'Tránh tiếp xúc trực tiếp với nước hoa, hóa chất tẩy rửa mạnh hoặc va chạm cơ học mạnh.',
  },
  '8': {
    id: '8',
    slug: 'bose-s1',
    title: 'Loa Di Động Bose S1 Pro+ System',
    subtitle: 'Hệ thống âm thanh biểu diễn đa năng PA Bluetooth tích hợp pin sạc 11 giờ & mixer 3 kênh',
    category: 'ÂM THANH',
    location: 'TP. Hồ Chí Minh',
    rating: 4.8,
    reviewCount: 67,
    condition: 'Rất tốt (Grade A 95%)',
    grade: 'Grade A',
    shutterOrUsage: 'Số sự kiện: 14 sự kiện',
    pricePerDay: 280000,
    deposit: 1200000,
    depositFormatted: '1.200.000₫',
    maxQuantity: 2,
    auditCode: '#HCM-BOSE-3190',
    images: [
      {
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAMWq7Usi-8ij0sf0N2-H4NCl1ScKH5274kxXc8AYWyPFy16zT_Kmq3tNSf8LN7ozbRrV99cjXr3HGqO3GJ6PI3P7C3MRDNDCyXlrDzFp3bl8Vy8MCY_G5ZyYkN8df8vo1U6wxOmaDZyNehhN4Oh56uVjgr3kV6uo7bpxr_YUl2Mvvextk0D-dRSVdxpZ5pQYNkX9Qt4yECCk-T8LqKmHDOzynNhWqS_X5lmFv5_qy',
        alt: 'Bose S1 Pro+ System',
        caption: 'Loa Di Động Bose S1 Pro+',
      },
    ],
    overview: [
      'Bose S1 Pro+ mang đến âm thanh biểu diễn chuyên nghiệp mọi lúc mọi nơi với công nghệ ToneMatch độc quyền, màn hình OLED từng kênh và khả năng kết nối không dây siêu tiện lợi.',
      'Hệ thống loa và mạch công suất được đo kiểm đáp tuyến tần số và khử trùng toàn diện trước khi xuất kho.',
    ],
    accessories: [
      '01 Loa biểu diễn Bose S1 Pro+',
      '01 Dây nguồn AC tiêu chuẩn',
      '01 Pin sạc lithium-ion tích hợp sẵn',
      '01 Túi trùm chống bụi chuyên dụng',
    ],
    auditItems: [
      { label: 'Màng loa & Củ loa', value: 'Âm thanh trong trẻo · Không rè' },
      { label: 'Thời lượng pin', value: 'Hoạt động liên tục > 10 giờ' },
      { label: 'Kết nối Bluetooth', value: 'Khoảng cách 15m ổn định' },
      { label: 'Vỏ loa', value: 'Cứng cáp · Khớp nối êm' },
    ],
    allowedConditions: 'Thích hợp acoustic cafe, tiệc dã ngoại ngoài trời, hội thảo và biểu diễn sân khấu nhỏ.',
    prohibitedActions: 'Không để ngoài trời mưa, không cắm nguồn điện sai điện áp định mức.',
  },
};

// Helper để lấy danh sách ngày thiết bị đã được thuê (chỉ hiển thị ngày đã đặt thật từ đơn hàng, bỏ hoàn toàn các gạch mẫu)
export function getProductBookedDates(product?: RentProductDetailData | { id?: string; title?: string; slug?: string } | null): BookedDateRange[] {
  // Bỏ toàn bộ gạch mẫu giả lập, lịch để trống mặc định cho tới khi có đơn đặt thành công thật
  const customList: BookedDateRange[] = [];

  const realBookedRanges: BookedDateRange[] = [];
  const seenDateKey = new Set<string>();

  const prodId = product?.id ? String(product.id).trim().toLowerCase() : '';
  const prodSlug = (product && 'slug' in product && product.slug) ? String(product.slug).trim().toLowerCase() : '';
  const prodTitle = product?.title ? product.title.trim().toLowerCase() : '';

  try {
    // 1. Kiểm tra bộ lưu trữ ngày đã đặt chung (reuse_shared_booked_dates)
    const sharedRaw = localStorage.getItem('reuse_shared_booked_dates');
    if (sharedRaw) {
      interface SharedBookingCheck {
        productId?: string;
        title?: string;
        startDate?: string;
        endDate?: string;
        note?: string;
        customerName?: string;
      }
      const sharedList: SharedBookingCheck[] = JSON.parse(sharedRaw);
      if (Array.isArray(sharedList)) {
        sharedList.forEach((b: SharedBookingCheck) => {
          if (!b.startDate || !b.endDate) return;

          const bProdId = b.productId ? String(b.productId).trim().toLowerCase() : '';
          const bTitle = b.title ? b.title.trim().toLowerCase() : '';

          const isMatch =
            (prodId && bProdId && (bProdId === prodId || bProdId.includes(prodId) || prodId.includes(bProdId))) ||
            (prodSlug && bProdId && (bProdId === prodSlug || bProdId.includes(prodSlug) || prodSlug.includes(bProdId))) ||
            (prodTitle && bTitle && (bTitle === prodTitle || bTitle.includes(prodTitle) || prodTitle.includes(bTitle)));

          if (isMatch) {
            const key = `${b.startDate}_${b.endDate}`;
            if (!seenDateKey.has(key)) {
              seenDateKey.add(key);
              realBookedRanges.push({
                startDate: b.startDate,
                endDate: b.endDate,
                note: b.note || `Đã có khách thuê (${b.title || product?.title || 'Thiết bị'})`,
                customerName: b.customerName || 'Khách hàng ReUse Hub',
              });
            }
          }
        });
      }
    }

    // 2. Quét qua TẤT CẢ các keys trong localStorage liên quan đến user_rental_orders
    const rentalStorageKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_rental_orders')) {
        rentalStorageKeys.push(key);
      }
    }

    rentalStorageKeys.forEach((sKey) => {
      const raw = localStorage.getItem(sKey);
      if (!raw) return;

      interface StoredItemCheck {
        id?: string | number;
        productId?: string | number;
        title?: string;
        productName?: string;
      }
      interface StoredOrderCheck {
        orderCode?: string;
        status?: string;
        paymentStatus?: string;
        startDate?: string;
        endDate?: string;
        custodyHolder?: string;
        items?: StoredItemCheck[];
      }

      try {
        const orders: StoredOrderCheck[] = JSON.parse(raw);
        if (Array.isArray(orders)) {
          orders.forEach((o: StoredOrderCheck) => {
            // Bỏ qua đơn đã hủy hoặc từ chối
            if (o.status === 'CANCELLED' || o.status === 'REJECTED') return;
            if (!o.startDate || !o.endDate) return;

            // Kiểm tra xem đơn này có chứa sản phẩm hay không
            const hasMatchingItem =
              Array.isArray(o.items) &&
              o.items.some((it: StoredItemCheck) => {
                const itId = String(it.productId || it.id || '').trim().toLowerCase();
                const itTitle = String(it.productName || it.title || '').trim().toLowerCase();

                const idMatch =
                  prodId && itId && (itId === prodId || itId.includes(prodId) || prodId.includes(itId));
                const slugMatch =
                  prodSlug && itId && (itId === prodSlug || itId.includes(prodSlug) || prodSlug.includes(itId));
                const titleMatch =
                  prodTitle &&
                  itTitle &&
                  (itTitle === prodTitle || itTitle.includes(prodTitle) || prodTitle.includes(itTitle));

                return Boolean(idMatch || slugMatch || titleMatch);
              });

            if (hasMatchingItem) {
              const key = `${o.startDate}_${o.endDate}`;
              if (!seenDateKey.has(key)) {
                seenDateKey.add(key);
                realBookedRanges.push({
                  startDate: o.startDate,
                  endDate: o.endDate,
                  note: `Đã có khách đặt đơn ${o.orderCode || ''} (${
                    o.status === 'PAID' || o.paymentStatus === 'PAID' ? 'Đã thanh toán Escrow' : 'Đang thuê'
                  })`,
                  customerName: o.custodyHolder || 'Khách hàng ReUse Hub',
                });
              }
            }
          });
        }
      } catch {
        // ignore parse error
      }
    });
  } catch (e) {
    console.error('Lỗi đọc lịch đã thuê:', e);
  }

  return [...customList, ...realBookedRanges];
}

// Helper để ghi nhận ngày đã đặt cho thiết bị khi tạo đơn
export function recordBookedDates(productId: string, startDate: string, endDate: string, note?: string) {
  try {
    const sharedRaw = localStorage.getItem('reuse_shared_booked_dates') || '[]';
    const list = JSON.parse(sharedRaw);
    list.push({
      productId,
      startDate,
      endDate,
      note: note || 'Đã có khách đặt thuê (Bảo chứng Smart Escrow)',
      customerName: 'Khách hàng ReUse Hub',
    });
    localStorage.setItem('reuse_shared_booked_dates', JSON.stringify(list));
  } catch (e) {
    console.error('Lỗi lưu ngày đã thuê:', e);
  }
}

// Helper kiểm tra một ngày cụ thể có bị trùng lịch đã đặt hay không
export function isDateBooked(dateStr: string, bookedRanges: BookedDateRange[] = []): boolean {
  if (!dateStr || !Array.isArray(bookedRanges) || bookedRanges.length === 0) return false;
  return bookedRanges.some((range) => {
    if (!range.startDate || !range.endDate) return false;
    return dateStr >= range.startDate && dateStr <= range.endDate;
  });
}

// Helper kiểm tra khoảng ngày [startDate, endDate] có bị trùng bất kỳ ngày nào đã đặt hay không
export function hasDateRangeConflict(
  startDate: string,
  endDate: string,
  bookedRanges: BookedDateRange[] = []
): boolean {
  if (!startDate || !endDate || !Array.isArray(bookedRanges) || bookedRanges.length === 0) return false;
  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;

  return bookedRanges.some((range) => {
    if (!range.startDate || !range.endDate) return false;
    // Overlap condition: start <= range.endDate && end >= range.startDate
    return !(end < range.startDate || start > range.endDate);
  });
}

// Helper tìm khoảng ngày trống hợp lệ đầu tiên (không trùng quá khứ và không trùng bất kỳ lịch đã đặt nào)
export function findEarliestAvailableRentalRange(
  bookedRanges: BookedDateRange[] = [],
  durationDays: number = 3,
  minStartDate?: string
): { startDate: string; endDate: string; days: number } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let candidateDate = new Date(tomorrow);
  if (minStartDate) {
    const [y, m, d] = minStartDate.split('-').map(Number);
    if (y && m && d) {
      const minD = new Date(y, m - 1, d);
      if (minD > candidateDate) {
        candidateDate = minD;
      }
    }
  }

  const daysToRent = Math.max(1, durationDays);

  // Duyệt tối đa 120 ngày để tìm khoảng ngày trống liên tục
  for (let i = 0; i < 120; i++) {
    const curStartStr = formatYMD(candidateDate);
    const candidateEndDate = new Date(candidateDate);
    candidateEndDate.setDate(candidateEndDate.getDate() + daysToRent);
    const curEndStr = formatYMD(candidateEndDate);

    if (!hasDateRangeConflict(curStartStr, curEndStr, bookedRanges)) {
      return {
        startDate: curStartStr,
        endDate: curEndStr,
        days: daysToRent,
      };
    }

    // Tịnh tiến sang ngày tiếp theo
    candidateDate.setDate(candidateDate.getDate() + 1);
  }

  // Fallback an toàn nếu không tìm thấy
  const defaultStart = formatYMD(tomorrow);
  const defaultEndDate = new Date(tomorrow);
  defaultEndDate.setDate(defaultEndDate.getDate() + daysToRent);
  return {
    startDate: defaultStart,
    endDate: formatYMD(defaultEndDate),
    days: daysToRent,
  };
}

// Helper tạo chi tiết chuẩn cho bất kỳ sản phẩm nào từ dữ liệu tóm tắt
export function createRentProductDetail(source: Partial<RentProductDetailData> & { id: string; title: string }): RentProductDetailData {
  const price = source.pricePerDay || 450000;
  const deposit = source.deposit || price * 5;
  const cat = source.category || 'RENT';
  const idStr = String(source.id);

  return {
    id: idStr,
    slug: source.slug || idStr,
    title: source.title,
    subtitle: source.subtitle || `${source.title} · Chuẩn kiểm định ReUse Standard`,
    category: cat.toUpperCase(),
    location: source.location || 'Đà Nẵng',
    rating: source.rating || 4.9,
    reviewCount: source.reviewCount || 42,
    condition: source.condition || 'Rất tốt (Grade A+)',
    grade: source.grade || 'Grade A+',
    shutterOrUsage: source.shutterOrUsage || 'Đã kiểm định kỹ thuật 14 bước tiêu chuẩn',
    pricePerDay: price,
    deposit: deposit,
    depositFormatted: source.depositFormatted || `${deposit.toLocaleString('vi-VN')}₫`,
    maxQuantity: source.maxQuantity || 2,
    size: source.size || 'L',
    sizes: source.sizes && source.sizes.length > 0 ? source.sizes : ['S', 'M', 'L', 'XL'],
    auditCode: source.auditCode || `#RH-${idStr.slice(-6).toUpperCase()}`,
    images: source.images && source.images.length > 0 ? source.images : [
      { src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', alt: source.title, caption: source.title }
    ],
    overview: source.overview && source.overview.length > 0 ? source.overview : [
      `${source.title} là sản phẩm lưu ký cao cấp thuộc danh mục ${cat}, được kiểm định nghiêm ngặt bởi Shop Owner và ReUse Hub.`,
      'Thiết bị đã trải qua quy trình vệ sinh phòng sạch và kiểm tra chất lượng 8 bước ReUse Standard trước khi bàn giao.'
    ],
    accessories: source.accessories && source.accessories.length > 0 ? source.accessories : [
      `01 ${source.title} nguyên bản kiểm định`,
      'Trọn bộ phụ kiện và dây nguồn/cáp kết nối tiêu chuẩn',
      'Hộp bảo vệ chống sốc Nanuk/ReUse chuyên dụng kèm tem niêm phong',
    ],
    auditItems: source.auditItems && source.auditItems.length > 0 ? source.auditItems : [
      { label: 'Tình trạng ngoại quan', value: '100% Nguyên vẹn · Đạt Grade A' },
      { label: 'Chức năng vận hành', value: 'Hoạt động hoàn hảo 100%' },
      { label: 'Vệ sinh phòng sạch', value: 'Khử khuẩn buồng UV-C / Ozone' },
      { label: 'Tem bảo chứng', value: 'Đã dán tem Smart Escrow' },
    ],
    allowedConditions: source.allowedConditions || 'Sử dụng đúng mục đích, trong môi trường an toàn, khô ráo, tránh va đập mạnh hoặc ngập nước.',
    prohibitedActions: source.prohibitedActions || 'Không tự ý can thiệp phần cứng, tháo mở ốc vít cơ khí hoặc cho bên thứ ba thuê lại khi chưa có văn bản đồng ý.',
  };
}

// Helper để lấy chi tiết sản phẩm theo id hoặc slug từ bất kỳ nguồn nào (Rent, Categories, hoặc Map)
export function getRentProductDetail(idOrSlug?: string): RentProductDetailData {
  if (!idOrSlug) return RENT_PRODUCT_DETAILS_MAP['1'];

  const clean = idOrSlug.trim();
  const lower = clean.toLowerCase();
  // 0. Kiểm tra bộ nhớ đệm sản phẩm thực tế từ MongoDB (nếu đã tải từ API)
  try {
    const rawCache = localStorage.getItem('cached_rent_products_db');
    if (rawCache) {
      const dbList = JSON.parse(rawCache);
      if (Array.isArray(dbList) && dbList.length > 0) {
        const foundDb = dbList.find(
          (p: { _id?: string; slug?: string; name?: string }) =>
            (p._id && p._id.toLowerCase() === lower) ||
            (p.slug && p.slug.toLowerCase() === lower) ||
            (p.name && p.name.toLowerCase() === lower)
        );
        if (foundDb) {
          const catName = typeof foundDb.categoryId === 'object' && foundDb.categoryId?.name ? foundDb.categoryId.name : 'RENT';
          const cond = foundDb.condition || 'GOOD';
          const condLabel = cond === 'NEW' ? 'Mới 100%' : cond === 'LIKE_NEW' ? 'Như mới 99%' : 'Rất tốt 95%';
          const price = Number(foundDb.pricePerDay) || 100000;
          const deposit = Number(foundDb.depositAmount) || (price * 5);
          const images = Array.isArray(foundDb.images) && foundDb.images.length > 0
            ? foundDb.images.map((src: string, idx: number) => ({ src: normalizeImageUrl(src), alt: `${foundDb.name} - Ảnh ${idx + 1}`, caption: foundDb.name }))
            : [{ src: '/images/shoesrent.jpg', alt: foundDb.name, caption: foundDb.name }];

          return createRentProductDetail({
            id: foundDb._id,
            slug: foundDb._id,
            title: foundDb.name,
            subtitle: foundDb.description || `${foundDb.name} · Tiêu chuẩn kiểm định ReUse`,
            category: catName.toUpperCase(),
            location: foundDb.location || 'Đà Nẵng',
            rating: 5.0,
            reviewCount: 1,
            condition: condLabel,
            grade: cond === 'NEW' ? 'Grade Mint' : 'Grade A+',
            shutterOrUsage: `Lưu ký xác thực: ${condLabel}`,
            pricePerDay: price,
            deposit: deposit,
            depositFormatted: `${deposit.toLocaleString('vi-VN')}₫`,
            maxQuantity: foundDb.totalQuantity || 1,
            images,
            overview: [foundDb.description || `${foundDb.name} là sản phẩm lưu ký cao cấp.`],
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // 1. Tìm theo key map trực tiếp trong RENT_PRODUCT_DETAILS_MAP
  if (RENT_PRODUCT_DETAILS_MAP[clean]) {
    return RENT_PRODUCT_DETAILS_MAP[clean];
  }

  // 2. Tìm theo slug hoặc id trong values của RENT_PRODUCT_DETAILS_MAP
  const foundMap = Object.values(RENT_PRODUCT_DETAILS_MAP).find(
    (item) => item.slug.toLowerCase() === lower || item.id.toLowerCase() === lower
  );
  if (foundMap) return foundMap;

  // 3. Tìm trong RENT_PRODUCTS (tất cả các sản phẩm marketplace RENT)
  const foundMarket = RENT_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.href.toLowerCase().endsWith(`/${lower}`) ||
      p.title.toLowerCase().includes(lower)
  );
  if (foundMarket) {
    const depNum = parseInt(foundMarket.deposit.replace(/\D/g, ''), 10) || (foundMarket.price * 5);
    return createRentProductDetail({
      id: foundMarket.id,
      slug: foundMarket.href.split('/').pop() || foundMarket.id,
      title: foundMarket.title,
      subtitle: `${foundMarket.title} · Chuẩn kiểm định ${foundMarket.categoryLabel}`,
      category: foundMarket.categoryLabel.toUpperCase(),
      location: foundMarket.location,
      rating: foundMarket.rating,
      reviewCount: foundMarket.reviewCount,
      condition: foundMarket.conditionLabel,
      grade: foundMarket.conditionLabel.includes('99') ? 'Grade Mint' : 'Grade A+',
      shutterOrUsage: `Tiêu chuẩn lưu ký: ${foundMarket.condition}`,
      pricePerDay: foundMarket.price,
      deposit: depNum,
      depositFormatted: foundMarket.deposit,
      images: [
        { src: foundMarket.image, alt: foundMarket.title, caption: foundMarket.title }
      ],
      overview: [
        `${foundMarket.title} là thiết bị cao cấp thuộc danh mục ${foundMarket.categoryLabel}, được lưu giữ tại kho ${foundMarket.location}.`,
        'Thiết bị đã trải qua quy trình vệ sinh phòng sạch và kiểm tra chất lượng 8 bước ReUse Standard trước khi bàn giao.'
      ],
    });
  }

  // 4. Tìm trong tất cả các danh mục lưu trữ (CategoryDetailData rentItems)
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
    const catItem = config.rentItems.find(
      (item) =>
        item.id.toLowerCase() === lower ||
        item.href.toLowerCase().endsWith(`/${lower}`) ||
        item.title.toLowerCase().includes(lower)
    );
    if (catItem) {
      const depNum = catItem.deposit || catItem.price * 5;
      return createRentProductDetail({
        id: catItem.id,
        slug: catItem.id,
        title: catItem.title,
        subtitle: catItem.description,
        category: config.title.toUpperCase(),
        location: catItem.locationBadge || 'Đà Nẵng',
        rating: catItem.rating,
        reviewCount: catItem.reviewCount,
        condition: catItem.gradeBadge,
        grade: catItem.gradeBadge.includes('Mint') ? 'Grade Mint' : 'Grade A+',
        shutterOrUsage: 'Kiểm định 14 bước cảm biến & cơ học ReUse Hub',
        pricePerDay: catItem.price,
        deposit: depNum,
        depositFormatted: `${depNum.toLocaleString('vi-VN')}₫`,
        images: [
          { src: catItem.image, alt: catItem.alt || catItem.title, caption: catItem.title }
        ],
        overview: [
          catItem.description,
          `${catItem.title} đạt đầy đủ các tiêu chuẩn an toàn lưu ký và bảo chứng Escrow 100%.`
        ],
      });
    }
  }

  // 5. Kiểm tra trong custom_rent_products từ localStorage
  try {
    const customRentRaw = localStorage.getItem('custom_rent_products');
    if (customRentRaw) {
      const customList = JSON.parse(customRentRaw);
      if (Array.isArray(customList)) {
        const foundCustom = customList.find(
          (p: { id?: string; slug?: string; name?: string; title?: string }) =>
            p.id?.toLowerCase() === lower ||
            p.slug?.toLowerCase() === lower ||
            p.name?.toLowerCase() === lower ||
            p.title?.toLowerCase() === lower
        );
        if (foundCustom) {
          return createRentProductDetail({
            id: String(foundCustom.id || clean),
            slug: String(foundCustom.slug || clean),
            title: foundCustom.name || foundCustom.title || clean,
            category: foundCustom.category || 'RENT',
            pricePerDay: Number(foundCustom.pricePerDay || foundCustom.price) || 200000,
            deposit: Number(foundCustom.depositAmount || foundCustom.deposit) || 1000000,
            images: foundCustom.images || (foundCustom.image ? [{ src: foundCustom.image, alt: foundCustom.title || clean, caption: foundCustom.title || clean }] : undefined),
            condition: foundCustom.condition || 'Rất tốt (Grade A+)',
            location: foundCustom.location || 'Đà Nẵng',
            overview: foundCustom.description ? [foundCustom.description] : undefined,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  // 6. Nếu có id/slug nhưng chưa nằm trong danh sách tĩnh, tạo chi tiết động khớp với slug/tên sản phẩm đó
  if (clean && clean !== '1') {
    const formattedTitle = clean
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return createRentProductDetail({
      id: clean,
      slug: clean,
      title: formattedTitle,
      subtitle: `${formattedTitle} · Tiêu chuẩn kiểm định ReUse Standard`,
      category: 'THIẾT BỊ LƯU KÝ',
      location: 'Đà Nẵng',
      rating: 5.0,
      reviewCount: 1,
      condition: 'Rất tốt (Grade A+)',
      grade: 'Grade A+',
      pricePerDay: 350000,
      deposit: 1750000,
      depositFormatted: '1.750.000₫',
      overview: [
        `${formattedTitle} là sản phẩm lưu ký cao cấp được kiểm định nghiêm ngặt bởi Shop Owner và ReUse Hub.`,
        'Thiết bị đã trải qua quy trình vệ sinh phòng sạch và kiểm tra chất lượng 8 bước ReUse Standard trước khi bàn giao.'
      ],
    });
  }

  // Fallback an toàn (chỉ khi hoàn toàn không có tham số idOrSlug)
  return RENT_PRODUCT_DETAILS_MAP['1'];
}

