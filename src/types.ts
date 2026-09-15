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
  posterUrl?: string; // Thumbnail / poster image (optional - if omitted, video acts as main showcase face)
  formats: GiftFormat[];
  tags: string[]; // e.g. ['AI原创', '浪漫', '礼物', '2D', '热销']
  category: string; // 'general' (القسم العام) or custom category created by admin
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

export type AccountStatus = 'active' | 'inactive';

export interface UserPermissions {
  giftUploadAndPublish: boolean; // Gift Upload & Publishing Permission (صلاحية رفع ونشر الهدايا)
  manageAccounts?: boolean;       // إدارة وتفعيل الحسابات
  manageBanners?: boolean;        // إدارة البنرات الإعلانية
  viewOrders?: boolean;           // عرض سجل الطلبات والمبيعات
  manageSettings?: boolean;       // إدارة إعدادات الموقع والأقسام
}

export type UserRole = 'buyer' | 'designer' | 'employee' | 'admin';

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Login password assigned by admin
  whatsapp: string; // e.g. +966501234567
  role: UserRole;
  status: AccountStatus; // Active / Inactive (مفعل / غير مفعل)
  permissions: UserPermissions; // Fine-grained permissions
  avatar: string;
  joinedDate: string;
  bio?: string;
  giftsCount?: number;
  totalSales?: number;
  isProfileCompleted: boolean;
  lastLogin?: string;
}

export interface HeroBannerItem {
  id: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  bgGradient?: string;
  btnText?: string;
  btnLink?: string; // Target URL or link (e.g. https://... or internal category/action)
  dimensionsNote?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface CustomCategory {
  id: string;
  name: string; // e.g. "القسم العام", "سيارات فارهة", "شخصيات ثلاثية الأبعاد"
  nameAr?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface SiteSettings {
  siteName: string;
  siteSlogan?: string;
  siteSubTitle?: string;
  logoUrl?: string; // Custom uploaded site logo (base64 data URL or external URL)
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus; // Active / Inactive
  permissions: UserPermissions;
  avatar: string;
  whatsapp?: string;
  isTrial?: boolean; // Trial / Demo account
  employeeId?: string; // If logged in as staff
  lastLogin?: string;
}

