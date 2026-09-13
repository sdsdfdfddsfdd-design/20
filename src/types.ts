export type Language = 'zh' | 'ar' | 'en';

export interface GiftFormat {
  name: string; // e.g., 'MP4带声音', 'SVGA动效', 'VAP透明通道', 'PAG', 'JSON', 'GIF', 'WEBP', 'MOV'
  size: string; // e.g., '5.08MB', '10.2MB'
  url?: string;
  notes?: string;
}

export interface GiftItem {
  id: string; // e.g. 'NO.243751'
  title: string;
  titleAr?: string;
  titleEn?: string;
  price: number; // in CNY
  vipPrice: number; // in CNY
  exclusivePrice: number; // 全网排他
  videoUrl: string; // Direct external video link (0 server bandwidth)
  posterUrl: string; // Thumbnail / poster image
  formats: GiftFormat[];
  tags: string[]; // e.g. ['AI原创', '浪漫', '礼物', '2D', '热销']
  category: 'romance' | 'tech' | 'ancient' | 'festival' | 'luxury' | 'fun' | 'character';
  theme: string;
  effectType: '2D' | '3D';
  author: {
    id?: string;
    name: string;
    avatar: string;
    whatsapp?: string; // Direct WhatsApp contact for clients and buyers
    verified?: boolean;
    sales?: number;
  };
  duration: number; // in seconds, e.g. 14
  resolution: string; // e.g. '1080x1920'
  fps?: number;
  deliveryUrl?: string; // Instant delivery link after purchase
  cloudDiskCode?: string; // 网盘提取码
  licenseCode?: string;
  downloadsCount: number;
  favoritesCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isVip?: boolean;
  createdAt: string;
}

export interface CartItem {
  gift: GiftItem;
  format: string;
  licenseType: 'standard' | 'exclusive';
  price: number;
}

export interface DeliveryItem {
  id: string;
  orderId: string;
  giftId: string;
  giftTitle: string;
  posterUrl: string;
  videoUrl: string;
  format: string;
  licenseType: 'standard' | 'exclusive';
  licenseKey: string;
  downloadUrl: string;
  fileSize: string;
  cloudDiskCode?: string;
  purchaseDate: string;
  price: number;
  buyerName?: string;
  buyerContact?: string;
  paymentMethod?: 'wechat' | 'alipay' | 'card' | 'bank' | 'cash';
  notes?: string;
  status?: 'completed' | 'processing' | 'shipped';
}

export interface OrderRecord {
  orderId: string;
  date: string;
  buyerName: string;
  buyerEmail: string;
  items: DeliveryItem[];
  totalPrice: number;
  paymentMethod: 'wechat' | 'alipay' | 'card' | 'balance';
  status: 'completed';
}

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Login password assigned by admin
  whatsapp: string; // e.g. +966501234567 or 966501234567
  role: 'designer' | 'employee' | 'admin';
  avatar: string;
  joinedDate: string;
  bio?: string;
  giftsCount?: number;
  totalSales?: number;
  isProfileCompleted: boolean;
}

export interface HeroBannerItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  bgGradient?: string;
  btnText: string;
  btnLink?: string;
  dimensionsNote?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type UserRole = 'buyer' | 'designer' | 'employee' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  whatsapp?: string;
  isTrial?: boolean; // Trial / Demo account
  employeeId?: string; // If logged in as staff
}

