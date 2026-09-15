import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Video, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Search, 
  Eye, 
  EyeOff,
  Lock,
  Copy,
  Layers, 
  DollarSign, 
  PackageCheck,
  TrendingUp,
  FileCode,
  Globe,
  Play,
  Printer,
  FileText,
  Award,
  Package,
  Plus,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageCircle,
  UserCheck,
  UserPlus,
  PhoneCall,
  Shield,
  Briefcase,
  X,
  Image as ImageIcon,
  SlidersHorizontal
} from 'lucide-react';
import { GiftItem, Language, DeliveryItem, GiftFormat, EmployeeUser, HeroBannerItem, AuthUser, UserRole, UserPermissions } from '../types';
import { translations } from '../utils/translations';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { INITIAL_BANNERS } from '../data/initialBanners';
import { PrintDocumentModal } from './PrintDocumentModal';
import { BannerManager } from './BannerManager';
import { InternationalPhoneInput } from './InternationalPhoneInput';
import { 
  addGift, 
  updateGift, 
  deleteGift, 
  updateCreatorGiftsWhatsapp,
  updateEmployee, 
  changeEmployeeRole,
  deleteEmployee, 
  toggleEmployeeStatus,
  toggleEmployeeGiftPermission,
  updateEmployeePermissions,
  addDelivery, 
  deleteDelivery,
  saveCategory,
  deleteCategory,
  saveSiteSettings,
  subscribeToSiteSettings
} from '../lib/firebaseService';

interface DashboardProps {
  lang: Language;
  gifts: GiftItem[];
  setGifts: React.Dispatch<React.SetStateAction<GiftItem[]>>;
  onPreviewGift: (gift: GiftItem) => void;
  deliveries: DeliveryItem[];
  setDeliveries?: React.Dispatch<React.SetStateAction<DeliveryItem[]>>;
  onOpenDeliveryBox: (item: DeliveryItem) => void;
  employees?: EmployeeUser[];
  setEmployees?: React.Dispatch<React.SetStateAction<EmployeeUser[]>>;
  activeEmployeeId?: string;
  setActiveEmployeeId?: (id: string) => void;
  onStaffLogin?: (employee: EmployeeUser) => void;
  banners?: HeroBannerItem[];
  setBanners?: React.Dispatch<React.SetStateAction<HeroBannerItem[]>>;
  currentUser?: AuthUser | null;
  categories?: { id: string; name: string }[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  lang,
  gifts,
  setGifts,
  onPreviewGift,
  deliveries,
  setDeliveries,
  onOpenDeliveryBox,
  employees,
  setEmployees,
  activeEmployeeId,
  setActiveEmployeeId,
  onStaffLogin,
  banners,
  setBanners,
  currentUser,
  categories = []
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'orders' | 'staff' | 'banners' | 'guide' | 'settings' | 'categories'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const bannersList = banners || INITIAL_BANNERS;

  // Fallback Employees state if not passed from parent
  const [localEmployees, setLocalEmployees] = useState<EmployeeUser[]>(() => {
    const saved = localStorage.getItem('jiawei_employees_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_EMPLOYEES;
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const staffList = employees || localEmployees;
  const setStaffList = setEmployees || setLocalEmployees;

  // Account filter in Staff/Accounts Tab
  const [accountFilter, setAccountFilter] = useState<'all' | 'active' | 'inactive' | 'upload_allowed'>('all');
  const [newStaffCanUpload, setNewStaffCanUpload] = useState<boolean>(true);

  const [localActiveEmpId, setLocalActiveEmpId] = useState<string>(() => {
    return localStorage.getItem('jiawei_active_emp_id') || 'EMP-001';
  });

  const currentEmpId = activeEmployeeId || localActiveEmpId;

  const handleSwitchStaff = (id: string) => {
    if (setActiveEmployeeId) {
      setActiveEmployeeId(id);
    } else {
      setLocalActiveEmpId(id);
    }
    localStorage.setItem('jiawei_active_emp_id', id);

    const targetEmp = staffList.find((e) => e.id === id);
    if (targetEmp && !targetEmp.isProfileCompleted) {
      setIsProfileModalOpen(true);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'employee' || currentUser?.role === 'designer';
  
  const activeStaff = isAdmin 
    ? (staffList.find((e) => e.id === currentEmpId) || staffList[0]) 
    : (currentUser as unknown as EmployeeUser) || staffList[0];

  const currentUserPermissions: Partial<UserPermissions> = (currentUser as unknown as EmployeeUser)?.permissions || {};
  const isSuperAdmin = currentUser?.role === 'admin';

  const canManageGifts = isSuperAdmin || currentUserPermissions.giftUploadAndPublish !== false;
  const canManageAccounts = isSuperAdmin || !!currentUserPermissions.manageAccounts;
  const canManageBanners = isSuperAdmin || !!currentUserPermissions.manageBanners;
  const canViewOrders = isSuperAdmin || !!currentUserPermissions.viewOrders;
  const canManageSettings = isSuperAdmin || !!currentUserPermissions.manageSettings;

  // If user lands here, ensure activeTab is one they have access to
  useEffect(() => {
    if (!isAdmin) {
      if (activeTab !== 'create' && activeTab !== 'list') setActiveTab('create');
    } else {
      if (!canManageGifts && (activeTab === 'create' || activeTab === 'list')) {
        if (canViewOrders) setActiveTab('orders');
        else if (canManageAccounts) setActiveTab('staff');
        else setActiveTab('settings');
      }
    }
  }, [isAdmin, activeTab, canManageGifts, canViewOrders, canManageAccounts]);

  // First-Time / Profile Setup Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingStaffTarget, setEditingStaffTarget] = useState<EmployeeUser | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileWhatsapp, setProfileWhatsapp] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  const handleOpenProfileModal = (targetEmployee?: EmployeeUser) => {
    const emp = targetEmployee || activeStaff;
    setEditingStaffTarget(emp);
    setProfileName(emp.name || '');
    setProfileWhatsapp(emp.whatsapp || '');
    setProfileBio(emp.bio || '');
    setProfileAvatar(emp.avatar || '');
    setIsProfileModalOpen(true);
  };

  // Sync profile form when active employee changes
  useEffect(() => {
    if (activeStaff) {
      setProfileName(activeStaff.name);
      setProfileWhatsapp(activeStaff.whatsapp || '');
      setProfileBio(activeStaff.bio || '');
      setProfileAvatar(activeStaff.avatar || '');
      // Automatically prompt profile setup if not completed yet (as requested: لأول مرة فقط)
      if (!activeStaff.isProfileCompleted) {
        setEditingStaffTarget(activeStaff);
        setIsProfileModalOpen(true);
      }
    }
  }, [activeStaff?.id]);

  // Form State for Gifts (Default in USD as requested)
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [price, setPrice] = useState<number>(35);
  const [vipPrice, setVipPrice] = useState<number>(20);
  const [exclusivePrice, setExclusivePrice] = useState<number>(180);
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [usePosterImage, setUsePosterImage] = useState<boolean>(true);
  const [formatsText, setFormatsText] = useState('SVGA动效文件 (10MB), MP4带声音透明通道 (5.2MB), VAP特效 (12MB), PAG文件 (7MB)');
  const [category, setCategory] = useState<GiftItem['category']>('ancient');
  const [theme, setTheme] = useState('国风仙侠');
  const [effectType, setEffectType] = useState<'2D' | '3D'>('3D');
  const [authorName, setAuthorName] = useState(activeStaff?.name || 'سارة المهندس');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [cloudDiskCode, setCloudDiskCode] = useState('JW6688');

  // New Staff Creation Form State (in Staff tab)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffWhatsapp, setNewStaffWhatsapp] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('123456');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [visibleStaffPasswords, setVisibleStaffPasswords] = useState<{ [id: string]: boolean }>({});
  const [newStaffRole, setNewStaffRole] = useState<'designer' | 'admin'>('designer');
  const [newStaffBio, setNewStaffBio] = useState('');
  const [newStaffAvatar, setNewStaffAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80');

  // Video Testing
  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const [videoTestError, setVideoTestError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual Order Upload State
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderGiftId, setOrderGiftId] = useState<string>(gifts[0]?.id || '');
  const [orderCustomTitle, setOrderCustomTitle] = useState('');
  const [orderBuyerName, setOrderBuyerName] = useState('');
  const [orderBuyerContact, setOrderBuyerContact] = useState('');
  const [orderLicenseType, setOrderLicenseType] = useState<'standard' | 'exclusive'>('standard');
  const [orderPrice, setOrderPrice] = useState<number>(360);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'wechat' | 'alipay' | 'card' | 'bank' | 'cash'>('card');
  const [orderNotes, setOrderNotes] = useState('');

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    siteName: '',
    siteSlogan: '',
    logoUrl: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToSiteSettings((settings) => {
      if (settings) setSiteSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSiteSettings(siteSettings);
    setSuccessMessage(lang === 'ar' ? 'تم حفظ إعدادات الموقع بنجاح' : 'Settings saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Categories State for UI
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    const id = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await saveCategory({ id, name: newCatName, nameAr: newCatNameAr || newCatName });
    
    setNewCatName('');
    setNewCatNameAr('');
    setSuccessMessage(lang === 'ar' ? 'تمت إضافة القسم بنجاح' : 'Category added successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteCategory = async (id: string) => {
    if (id === 'all') return;
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this category?')) {
      await deleteCategory(id);
      setSuccessMessage(lang === 'ar' ? 'تم حذف القسم بنجاح' : 'Category deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Print Document Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDelivery, setPrintDelivery] = useState<DeliveryItem | null>(null);
  const [printDocType, setPrintDocType] = useState<'invoice' | 'certificate' | 'voucher' | 'report'>('invoice');

  const openPrintModal = (delivery: DeliveryItem | null, type: 'invoice' | 'certificate' | 'voucher' | 'report' = 'invoice') => {
    setPrintDelivery(delivery);
    setPrintDocType(type);
    setIsPrintModalOpen(true);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedGift = gifts.find((g) => g.id === orderGiftId);
    const giftTitle = orderCustomTitle.trim() || selectedGift?.title || 'مؤثر بث مباشر مخصص (Custom VFX Gift)';
    const randomOrder = 'JW' + Date.now().toString().slice(-8);
    const randomLicense = 'CERT-JW-' + Math.floor(100000 + Math.random() * 900000);

    const newDelivery: DeliveryItem = {
      id: 'DEL-' + Math.random().toString(36).substring(2, 9),
      orderId: randomOrder,
      giftId: selectedGift?.id || 'CUSTOM-VFX',
      giftTitle: giftTitle,
      posterUrl: selectedGift?.posterUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      videoUrl: selectedGift?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-bright-light-particles-loop-32943-large.mp4',
      format: selectedGift?.formats.map(f => f.name).join(', ') || 'SVGA + MP4 شفاف + VAP + PAG',
      licenseType: orderLicenseType,
      licenseKey: randomLicense,
      downloadUrl: selectedGift?.deliveryUrl || `https://cdn.jwtexiao.com/downloads/order-${randomOrder.toLowerCase()}.zip`,
      fileSize: '48.2 MB',
      cloudDiskCode: selectedGift?.cloudDiskCode || 'JW' + Math.floor(1000 + Math.random() * 9000),
      purchaseDate: new Date().toISOString().split('T')[0],
      price: Number(orderPrice),
      buyerName: orderBuyerName.trim() || (lang === 'ar' ? 'عميل معتمد' : 'VIP Client'),
      buyerContact: orderBuyerContact.trim() || 'streamer@live.com',
      paymentMethod: orderPaymentMethod,
      notes: orderNotes.trim() || undefined,
      status: 'completed'
    };

    // Save to Firestore real-time collection so all users see it immediately!
    addDelivery(newDelivery);

    if (setDeliveries) {
      setDeliveries((prev) => [newDelivery, ...prev]);
    }

    setSuccessMessage(
      lang === 'ar'
        ? `تم رفع الطلب [${newDelivery.orderId}] بنجاح وتوليد شهادة الترخيص وسماع التحديث لجميع المستخدمين فورياً!`
        : `订单 [${newDelivery.orderId}] 上传录入成功，全网实时同步！`
    );

    // Reset Order Form
    setOrderBuyerName('');
    setOrderBuyerContact('');
    setOrderNotes('');
    setIsOrderFormOpen(false);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب من السجل؟' : '确认删除该订单记录？')) {
      deleteDelivery(orderId);
      if (setDeliveries) {
        setDeliveries((prev) => prev.filter((d) => d.id !== orderId));
      }
    }
  };

  // Search in list
  const [searchFilter, setSearchFilter] = useState('');

  // Sample Working Video Links for quick insertion
  const sampleVideos = [
    {
      name: 'Glowing Light Orb / كرة ضوئية مشعة',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-bright-light-particles-loop-32943-large.mp4',
      poster: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Golden Dust Whirlwind / عاصفة الغبار الذهبي',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-golden-dust-particles-in-motion-33008-large.mp4',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Purple Cosmic Nebula / سديم كوني بنفسجي',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-purple-and-blue-light-particles-in-dark-space-41271-large.mp4',
      poster: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Cyber Neon Tunnel / نفق نيون مستقبلي',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-around-in-a-futuristic-tunnel-with-neon-lights-42571-large.mp4',
      poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const handleApplySample = (sample: typeof sampleVideos[0]) => {
    setVideoUrl(sample.url);
    if (!posterUrl) {
      setPosterUrl(sample.poster);
    }
    setIsTestingVideo(true);
  };

  const handleSaveGift = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسم الهدية' : '请输入礼物名称');
      return;
    }

    if (!videoUrl.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال رابط الفيديو الخارجي' : '请输入外链视频URL');
      return;
    }

    // Check Gift Upload & Publishing Permission (صلاحية رفع ونشر الهدايا)
    const canUploadGifts = (activeStaff?.permissions?.giftUploadAndPublish !== false) && (activeStaff?.status !== 'inactive');
    if (!canUploadGifts) {
      alert(
        lang === 'ar'
          ? '⚠️ تم رفض العملية: ليس لديك صلاحية رفع ونشر الهدايا (Gift Upload & Publishing Permission) أو تم إيقاف هذا الحساب. يرجى مراجعة إدارة المنصة لتفعيل الصلاحية.'
          : 'Permission Denied: You do not have Gift Upload & Publishing Permission or account is inactive.'
      );
      return;
    }

    // Enforce profile completion for first-time uploaders as requested
    if (!activeStaff.isProfileCompleted) {
      setIsProfileModalOpen(true);
      return;
    }

    // Parse formats
    const parsedFormats: GiftFormat[] = formatsText.split(',').map((f) => {
      const trimmed = f.trim();
      return {
        name: trimmed,
        size: trimmed.includes('(') ? trimmed.split('(')[1].replace(')', '') : '8.5MB'
      };
    });

    if (editingId) {
      // Update existing
      const existing = gifts.find(g => g.id === editingId);
      if (existing) {
        const updatedGift: GiftItem = {
          ...existing,
          title: title.trim(),
          titleAr: titleAr.trim() || undefined,
          price: Number(price),
          vipPrice: Number(vipPrice),
          exclusivePrice: Number(exclusivePrice),
          videoUrl: videoUrl.trim(),
          posterUrl: usePosterImage ? posterUrl.trim() : '',
          formats: parsedFormats,
          category,
          theme: theme.trim() || '精品',
          effectType,
          deliveryUrl: deliveryUrl.trim() || existing.deliveryUrl,
          cloudDiskCode: cloudDiskCode.trim() || existing.cloudDiskCode
        };
        updateGift(updatedGift);
      }

      setEditingId(null);
      setSuccessMessage(lang === 'ar' ? 'تم تحديث الهدية بنجاح!' : '素材更新成功！');
    } else {
      // Create new - Automatically linked to current active staff & WhatsApp!
      const newId = 'NO.' + Math.floor(200000 + Math.random() * 90000);
      const newGift: GiftItem = {
        id: newId,
        title: title.trim(),
        titleAr: titleAr.trim() || undefined,
        price: Number(price),
        vipPrice: Number(vipPrice),
        exclusivePrice: Number(exclusivePrice),
        videoUrl: videoUrl.trim(),
        posterUrl: usePosterImage ? posterUrl.trim() : '',
        formats: parsedFormats,
        tags: ['AI原创', theme.trim() || '精选', '礼物', effectType, '新秀'],
        category,
        theme: theme.trim() || '定制精选',
        effectType,
        author: {
          id: activeStaff.id,
          name: activeStaff.name || authorName.trim() || 'سارة المهندس',
          avatar: activeStaff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          verified: true,
          whatsapp: activeStaff.whatsapp
        },
        duration: 12,
        resolution: '1080x1920',
        fps: 60,
        deliveryUrl: deliveryUrl.trim() || `https://cdn.jwtexiao.com/downloads/${newId.toLowerCase()}.zip`,
        cloudDiskCode: cloudDiskCode.trim() || 'JW8866',
        downloadsCount: 0,
        favoritesCount: 0,
        isNew: true,
        isFeatured: true,
        createdAt: new Date().toISOString().split('T')[0]
      };

      addGift(newGift);

      // Increment employee's gifts count
      updateEmployee({ ...activeStaff, giftsCount: (activeStaff.giftsCount || 0) + 1 });

      setSuccessMessage(lang === 'ar' ? `تم نشر الهدية [${newGift.title}] بنجاح في المتجر وربطها بالمصمم ${activeStaff.name}!` : `礼物 [${newGift.title}] 成功发布！`);
    }

    // Reset Form
    setTitle('');
    setTitleAr('');
    setVideoUrl('');
    setPosterUrl('');
    setIsTestingVideo(false);

    setTimeout(() => {
      setSuccessMessage(null);
      setActiveTab('list');
    }, 1200);
  };

  // Save First-Time / Profile Setup & Sync WhatsApp to all gifts
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسمك أو لقبك كمصمم' : '请输入设计师姓名');
      return;
    }
    if (!profileWhatsapp.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم الواتساب مع كود الدولة' : '请输入WhatsApp号码');
      return;
    }

    const targetStaff = editingStaffTarget || activeStaff;
    const cleanWhatsapp = profileWhatsapp.trim();

    const updatedStaff: EmployeeUser = {
      ...targetStaff,
      name: profileName.trim(),
      whatsapp: cleanWhatsapp,
      bio: profileBio.trim() || targetStaff.bio,
      avatar: profileAvatar.trim() || targetStaff.avatar,
      isProfileCompleted: true
    };

    // Update in Firestore
    await updateEmployee(updatedStaff);

    // Update in local staff list (activeStaff will automatically update because it is derived from staffList)
    setStaffList((prev) => prev.map((e) => (e.id === updatedStaff.id ? updatedStaff : e)));

    if (targetStaff.id === activeStaff?.id) {
      setAuthorName(profileName.trim());
    }

    // Update WhatsApp across ALL gifts created/uploaded by this user in local state
    let updatedGiftsCount = 0;
    setGifts((prevGifts) =>
      prevGifts.map((gift) => {
        const matchById = gift.author?.id && (gift.author.id === targetStaff.id || gift.author.id === activeStaff.id);
        const matchByName = gift.author?.name && (
          gift.author.name.trim().toLowerCase() === targetStaff.name?.trim().toLowerCase() ||
          gift.author.name.trim().toLowerCase() === profileName.trim().toLowerCase()
        );
        if (matchById || matchByName) {
          updatedGiftsCount++;
          return {
            ...gift,
            author: {
              ...gift.author,
              whatsapp: cleanWhatsapp
            }
          };
        }
        return gift;
      })
    );

    // Update WhatsApp on all gifts in Firestore database
    try {
      const cloudUpdated = await updateCreatorGiftsWhatsapp(
        targetStaff.id,
        profileName.trim() || targetStaff.name,
        cleanWhatsapp
      );
      console.log(`Successfully synced WhatsApp across ${cloudUpdated} gifts in cloud database.`);
    } catch (err) {
      console.error('Error syncing gifts WhatsApp in Firestore:', err);
    }

    setIsProfileModalOpen(false);
    setEditingStaffTarget(null);
    setSuccessMessage(
      lang === 'ar'
        ? `تم حفظ وتأكيد رقم الواتساب (${cleanWhatsapp}) وتحديثه بنجاح على جميع هداياك (${updatedGiftsCount} هدية)!`
        : `WhatsApp number (${cleanWhatsapp}) confirmed and synced across all ${updatedGiftsCount} gifts!`
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Create New Staff Member (انشاء حساب موظف داخل المنصة)
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      alert(lang === 'ar' ? 'يرجى كتابة اسم الموظف / المصمم' : '请输入员工姓名');
      return;
    }
    if (!newStaffWhatsapp.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم الواتساب' : '请输入WhatsApp号码');
      return;
    }

    const newEmpId = 'EMP-' + Math.floor(100 + Math.random() * 900);
    const assignedPassword = newStaffPassword.trim() || '123456';
    const newEmp: EmployeeUser = {
      id: newEmpId,
      name: newStaffName.trim(),
      email: newStaffEmail.trim() || `staff_${newEmpId.toLowerCase()}@streamgifts.com`,
      password: assignedPassword,
      whatsapp: newStaffWhatsapp.trim(),
      role: newStaffRole,
      status: 'active',
      permissions: {
        giftUploadAndPublish: newStaffCanUpload,
        manageAccounts: newStaffRole === 'admin',
        manageBanners: newStaffRole === 'admin',
        viewOrders: true
      },
      avatar: newStaffAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      bio: newStaffBio.trim() || (newStaffRole === 'designer' ? 'مصمم ومعدل مؤثرات بصرية' : 'مشرف إداري بالمنصة'),
      joinedDate: new Date().toISOString().split('T')[0],
      giftsCount: 0,
      totalSales: 0,
      isProfileCompleted: true
    };

    // Save to Firestore
    updateEmployee(newEmp);

    setStaffList((prev) => [newEmp, ...prev]);
    handleSwitchStaff(newEmpId);
    setAuthorName(newEmp.name);
    if (onStaffLogin) {
      onStaffLogin(newEmp);
    }

    // Clear form
    setNewStaffName('');
    setNewStaffWhatsapp('');
    setNewStaffEmail('');
    setNewStaffPassword('123456');
    setNewStaffBio('');

    setSuccessMessage(
      lang === 'ar'
        ? `تم إنشاء حساب [${newEmp.name}] بنجاح، وكلمة المرور: (${assignedPassword}). ${newStaffCanUpload ? 'مع منح صلاحية رفع ونشر الهدايا.' : 'بدون صلاحية رفع الهدايا.'}`
        : `新员工 [${newEmp.name}] 创建成功 (初始密码: ${assignedPassword})！`
    );

    // If granted upload permission, take them to upload panel
    if (newStaffCanUpload) {
      setActiveTab('create');
    }
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Toggle Account Active / Inactive Status (تفعيل أو إلغاء تفعيل الحساب)
  const handleToggleStaffStatus = async (empId: string, currentStatus: 'active' | 'inactive', role: UserRole) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleEmployeeStatus(empId, newStatus, role);
      setStaffList((prev) => prev.map((e) => e.id === empId ? { ...e, status: newStatus } : e));
      setSuccessMessage(
        lang === 'ar'
          ? `تم تحديث حالة الحساب بنجاح إلى: [${newStatus === 'active' ? 'مفعل ✅' : 'غير مفعل / معطل ❌'}]`
          : `账号状态已更新为: ${newStatus}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تغيير حالة الحساب' : '更新账号状态失败');
    }
  };

  // Toggle specific permission
  const handleTogglePermission = async (empId: string, permKey: keyof UserPermissions, currentValue: boolean, role: UserRole) => {
    const newValue = !currentValue;
    try {
      // Find the employee to get current permissions
      const emp = staffList.find(e => e.id === empId);
      if (!emp) return;
      
      const newPermissions = {
        ...(emp.permissions || {
          giftUploadAndPublish: false,
          manageAccounts: false,
          manageBanners: false,
          viewOrders: false,
          manageSettings: false
        }),
        [permKey]: newValue
      };

      await updateEmployeePermissions(empId, newPermissions, role);
      setStaffList((prev) => prev.map((e) => e.id === empId ? { ...e, permissions: newPermissions } : e));
      setSuccessMessage(
        lang === 'ar'
          ? `تم تحديث الصلاحيات بنجاح`
          : `Permissions updated successfully`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تعديل الصلاحيات' : 'Failed to update permissions');
    }
  };

  // Delete Staff
  const handleDeleteStaff = (empId: string, role: UserRole) => {
    if (staffList.length <= 1) {
      alert(lang === 'ar' ? 'لا يمكن حذف الموظف الوحيد في المنصة.' : '不能删除唯一的员工账号');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟' : '确认删除此账号？')) {
      deleteEmployee(empId, role);
      setStaffList((prev) => prev.filter((e) => e.id !== empId));
      if (activeStaff.id === empId) {
        const remaining = staffList.filter((e) => e.id !== empId);
        if (remaining.length > 0) {
          handleSwitchStaff(remaining[0].id);
        }
      }
    }
  };

  const handleStartEdit = (gift: GiftItem) => {
    setEditingId(gift.id);
    setTitle(gift.title);
    setTitleAr(gift.titleAr || '');
    setPrice(gift.price);
    setVipPrice(gift.vipPrice);
    setExclusivePrice(gift.exclusivePrice);
    setVideoUrl(gift.videoUrl);
    setPosterUrl(gift.posterUrl || '');
    setUsePosterImage(Boolean(gift.posterUrl && gift.posterUrl.trim()));
    setFormatsText(gift.formats.map((f) => f.name).join(', '));
    setCategory(gift.category);
    setTheme(gift.theme);
    setEffectType(gift.effectType);
    setAuthorName(gift.author.name);
    setDeliveryUrl(gift.deliveryUrl || '');
    setCloudDiskCode(gift.cloudDiskCode || 'JW8866');
    setActiveTab('create');
  };

  const handleDeleteGift = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الهدية؟' : '确认删除该礼物素材？')) {
      deleteGift(id);
    }
  };

  const filteredGifts = gifts.filter((g) => {
    // Search filter
    const matchesSearch = g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      g.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (g.titleAr && g.titleAr.includes(searchFilter));
      
    // Permission filter
    const matchesPermission = isAdmin || (currentUser && g.author.id === currentUser.id);
    
    return matchesSearch && matchesPermission;
  });

  return (
    <div className="max-w-[1720px] mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#121724] to-blue-950/70 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {t.dashTitle}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            {t.dashSub}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium">{t.totalGiftsCount}</div>
            <div className="text-lg font-black text-cyan-300 font-mono">{gifts.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium">{t.totalSales}</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{deliveries.length}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium">{t.activeFormats}</div>
            <div className="text-lg font-black text-purple-300 font-mono">8+</div>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        {canManageGifts && (
          <>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'create'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{editingId ? (lang === 'ar' ? 'تعديل الهدية' : '编辑礼物素材') : t.addNewGift}</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'list'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.manageGifts} ({gifts.length})</span>
            </button>
          </>
        )}

        {(isAdmin && canViewOrders) && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>{t.ordersLog} ({deliveries.length})</span>
          </button>
        )}

        {isAdmin && (
          <>
            {canManageAccounts && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'إدارة الحسابات والصلاحيات' : t.staffManagement} ({staffList.length})</span>
              </button>
            )}

            {canManageBanners && (
              <button
                onClick={() => setActiveTab('banners')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'banners'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>{lang === 'ar' ? 'إدارة البنرات (Banners)' : '横幅广告管理'} ({bannersList.length})</span>
              </button>
            )}

            {canManageSettings && (
              <>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'guide'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{t.cdnGuide}</span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'categories'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'إدارة الأقسام' : '分类管理'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'إعدادات الموقع' : '网站设置'}</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* TAB 1: ADD / EDIT GIFT FORM (Part 2 of user request) */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Active Creator & WhatsApp Linkage Header Banner (CRITICAL USER REQUEST) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#131929] to-cyan-950/40 border border-slate-700/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={activeStaff.avatar}
                  alt={activeStaff.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-cyan-500/70 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#111520] flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{t.activeStaffTitle}:</span>
                  <span className="text-sm font-black text-white">{activeStaff.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {activeStaff.role === 'admin' ? t.adminRole : t.designerRole}
                  </span>

                  {/* Account Status Badge */}
                  {activeStaff.status === 'inactive' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span>{lang === 'ar' ? 'الحساب غير مفعل (معطل)' : '账号已停用'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{lang === 'ar' ? 'حساب مفعل' : '账号正常'}</span>
                    </span>
                  )}

                  {/* Gift Upload & Publishing Permission Badge */}
                  {activeStaff.permissions?.giftUploadAndPublish !== false && activeStaff.status !== 'inactive' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>{lang === 'ar' ? 'صلاحية رفع ونشر الهدايا: مصرح ومفعل ✅' : '礼品上传权限: 已开启'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>{lang === 'ar' ? 'صلاحية رفع الهدايا: مسحوبة وموقوفة ⛔' : '礼品上传权限: 已禁用'}</span>
                    </span>
                  )}

                  {activeStaff.isProfileCompleted ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{t.profileCompleted}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold animate-pulse hover:bg-amber-500/30"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>{t.completeProfileNow}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">{t.whatsappNumber}:</span>
                    <span className="font-mono text-emerald-400 font-bold dir-ltr">{activeStaff.whatsapp || 'لم يحدد بعد'}</span>
                  </div>

                  {activeStaff.whatsapp && (
                    <a
                      href={`https://wa.me/${activeStaff.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، أود الاستفسار عن تصاميم ومؤثرات الهدايا في متجر جياوي')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 transition-colors"
                      title={t.whatsappChat}
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-400" />
                      <span>{t.whatsappChat}</span>
                    </a>
                  )}

                  <span className="text-slate-500 text-[11px]">|</span>
                  <span className="text-slate-400 text-[11px]">{t.uploadedGifts}: <strong className="text-cyan-300">{activeStaff.giftsCount || 0}</strong></span>
                </div>

                <p className="text-[11px] text-slate-400">
                  {lang === 'ar' 
                    ? '⚡ جميع الهدايا التي ترفعها الآن سيتم تسجيلها وحفظها باسمك وبرقم الواتساب الخاص بك تلقائياً ليشتريها العملاء مباشرة.' 
                    : '⚡ 您发布的素材将自动附加您的创作者信息与WhatsApp直连，买家可一键点击咨询。'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.editProfileBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-cyan-300 text-xs font-semibold border border-cyan-500/50 transition-all flex items-center gap-1.5 shadow"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.switchStaffBtn}</span>
              </button>
            </div>
          </div>

          {/* Permission Lock Warning Banner (when permission is disabled) */}
          {(activeStaff.permissions?.giftUploadAndPublish === false || activeStaff.status === 'inactive') && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-amber-950/40 to-slate-900 border border-red-500/50 text-slate-200 space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? '⚠️ تنبيه الصلاحية: تم إيقاف أو سحب [صلاحية رفع ونشر الهدايا - Gift Upload & Publishing Permission] لهذا الحساب'
                    : '⚠️ Permission Notice: Gift Upload & Publishing Permission is Revoked for this Account'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'ar'
                  ? activeStaff.status === 'inactive'
                    ? 'هذا الحساب معطل حالياً من قِبل إدارة المنصة. لا يمكنك رفع ملفات أو إضافة هدايا جديدة حتى يتم تفعيل الحساب من لوحة إدارة الحسابات.'
                    : 'تم سحب صلاحية رفع ونشر الهدايا من هذا الحساب. يمكنك استعراض الهدايا أو مراجعة المسؤول لتفعيل الصلاحية من لوحة إدارة الحسابات والصلاحيات.'
                  : 'You do not have permission to upload or publish gifts. Please contact the administrator to enable this permission.'}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'الانتقال إلى لوحة إدارة الحسابات والصلاحيات' : 'Open Accounts & Permissions'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Form Fields */}
            <div className="lg:col-span-8 bg-[#111520] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <form onSubmit={handleSaveGift} className="space-y-5">
              {/* Special Zero-Server-Load Notice Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/70 to-cyan-950/70 border border-cyan-500/40 flex items-start gap-3">
                <Video className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-300">
                  <strong className="text-cyan-300 block mb-0.5">
                    {lang === 'ar' ? 'ميزة ربط الفيديو الخارجي (0% استهلاك لمساحة وباندويث السيرفر):' : '外链视频直连（零服务器存储与带宽负载）：'}
                  </strong>
                  {t.videoUrlHelp}
                </div>
              </div>

              {/* Title & Arabic Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.giftNameInput} *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="如: 簪花扑月 / 金龙盘霄 / 幻影跑车"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {lang === 'ar' ? 'الاسم بالعربية (اختياري)' : '阿拉伯语名称 (可选)'}
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: زهرة القمر الطائر / التنين الذهبي"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Price Row: Regular, VIP, Exclusive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.giftPriceInput} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.giftVipPriceInput}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={vipPrice}
                    onChange={(e) => setVipPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.giftExcPriceInput}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={exclusivePrice}
                    onChange={(e) => setExclusivePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-purple-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* External Video Direct URL (CRITICAL USER REQUEST) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>{t.videoUrlInput} *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTestingVideo(true)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    {t.testVideoBtn}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setVideoTestError(false);
                    }}
                    placeholder="https://your-bucket.r2.cloudflarestorage.com/video.mp4"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'ar' ? 'رفع ملف فيديو' : '上传视频文件'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const blobUrl = URL.createObjectURL(file);
                          setVideoUrl(blobUrl);
                          setVideoTestError(false);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Quick Presets for User to test without hunting for URLs */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">
                    {lang === 'ar' ? 'نماذج سريعة جاهزة:' : '快速填入测试直链:'}
                  </span>
                  {sampleVideos.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySample(sample)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poster Image / Cover Section with Checkmark (✓) and Cross (✕) Toggle */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>{t.posterUrlInput}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === 'ar'
                        ? 'اختر [صح ✓] لتعيين صورة غلاف، أو [إكس ✕] لعرض الفيديو نفسه مباشرة كواجهة رئيسية للهدية'
                        : '选择 [✓ 启用] 设置封面图，或 [✕ 禁用] 直接以视频首帧作为展台主界面'}
                    </p>
                  </div>

                  {/* Toggle Controls: Checkmark (✓) vs Cross (✕) */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => setUsePosterImage(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        usePosterImage
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      title={lang === 'ar' ? 'تفعيل صورة الغلاف المخصصة' : '启用图片封面'}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{lang === 'ar' ? 'صح (✓) تفعيل الصورة' : '启用图片 (✓)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUsePosterImage(false);
                        setPosterUrl('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        !usePosterImage
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      title={lang === 'ar' ? 'إلغاء الصورة - سيظهر الفيديو فقط في واجهة العرض' : '禁用图片 - 仅显示视频'}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>{lang === 'ar' ? 'إكس (✕) فيديو فقط' : '仅视频 (✕)'}</span>
                    </button>
                  </div>
                </div>

                {usePosterImage ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-xxx?w=800"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <label className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                        <UploadCloud className="w-4 h-4 text-cyan-400" />
                        <span>{lang === 'ar' ? 'رفع صورة' : '上传图片'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setPosterUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ar'
                        ? 'ستظهر صورة الغلاف كواجهة أولية، وعند تمرير الماوس فوق الهدية يتم تشغيل الفيديو.'
                        : '封面图为常态展示，悬停时转换为视频播放。'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/40 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="text-xs leading-relaxed text-slate-300">
                      <strong className="text-cyan-300 block mb-0.5">
                        {lang === 'ar' ? '✓ تم تفعيل وضع الفيديو فقط (✕ إخفاء الصورة تماماً):' : '已开启仅视频模式 (✕ 隐藏封面图)：'}
                      </strong>
                      <span>
                        {lang === 'ar'
                          ? 'لن تظهر أي صورة غلاف، وسيأخذ الفيديو نفسه نفس الواجهة الرئيسية للهدية في شاشة العرض وبطاقة المتجر مباشرة.'
                          : '卡片将完全不显示任何图片，直接呈现视频首帧作为主界面并自动生效。'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Formats included (صيغ الهدية: SVGA, MP4, VAP, PAG, etc.) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.formatInclude}
                </label>
                <input
                  type="text"
                  value={formatsText}
                  onChange={(e) => setFormatsText(e.target.value)}
                  placeholder="SVGA动效, MP4透明带声, VAP, PAG, JSON"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Category, Theme & Effect 2D/3D */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.categorySelect}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{lang === 'ar' && cat.nameAr ? cat.nameAr : cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.themeInput}
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="如: 中秋专属 / 豪华座驾"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {t.effectTypeSelect}
                  </label>
                  <select
                    value={effectType}
                    onChange={(e) => setEffectType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="2D">{t.effect2D}</option>
                    <option value="3D">{t.effect3D}</option>
                  </select>
                </div>
              </div>

              {/* Delivery Box Assets Configuration (صندوق استلام عند الشراء) */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'إعدادات صندوق الاستلام والتسليم التلقائي:' : '自动交付盒资源设置:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {t.deliveryUrlInput}
                    </label>
                    <input
                      type="url"
                      value={deliveryUrl}
                      onChange={(e) => setDeliveryUrl(e.target.value)}
                      placeholder="https://cdn.example.com/gifts/gift-bundle.zip"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {t.cloudCodeInput}
                    </label>
                    <input
                      type="text"
                      value={cloudDiskCode}
                      onChange={(e) => setCloudDiskCode(e.target.value)}
                      placeholder="JW8866"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-400 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                {(() => {
                  const canUpload = (activeStaff?.permissions?.giftUploadAndPublish !== false) && (activeStaff?.status !== 'inactive');
                  return (
                    <button
                      type="submit"
                      disabled={!canUpload}
                      className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 ${
                        canUpload
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-95 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {!canUpload
                          ? (lang === 'ar' ? '⚠️ صلاحية رفع الهدايا موقوفة لهذا الحساب' : '无上传权限')
                          : (editingId ? (lang === 'ar' ? 'حفظ التعديلات' : '保存修改') : t.submitGiftBtn)
                        }
                      </span>
                    </button>
                  );
                })()}

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setTitle('');
                      setVideoUrl('');
                    }}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    {lang === 'ar' ? 'إلغاء التعديل' : '取消'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Video Preview Column & Live Test Monitor */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#111520] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === 'ar' ? 'معاينة الفيديو والبث' : '实时外链预览测试'}</span>
                </h3>
                {videoUrl && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                    ONLINE
                  </span>
                )}
              </div>

              {/* Video Monitor Box */}
              <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl flex items-center justify-center">
                {videoUrl ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoTestError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs space-y-2">
                    <Video className="w-8 h-8 mx-auto opacity-40" />
                    <p>{lang === 'ar' ? 'ضع رابط الفيديو بالأعلى لعرض المعاينة المباشرة هنا فوراً' : '在此处实时预览外链播放效果'}</p>
                  </div>
                )}

                {videoTestError && (
                  <div className="absolute inset-0 bg-red-950/80 p-4 flex flex-col items-center justify-center text-center text-xs text-red-200">
                    <AlertCircle className="w-6 h-6 mb-1 text-red-400" />
                    <span>{lang === 'ar' ? 'تعذر تشغيل الفيديو من الرابط المحدد. تأكد من أن الرابط مباشر وينتهي بـ .mp4 أو .webm' : '视频直链解析失败，请检查链接格式'}</span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'استهلاك خادمك:' : '本站服务器带宽占用:'}</span>
                  <strong className="text-emerald-400 font-mono">0 KB/s (Zero)</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'المصدر المضيف:' : '视频数据源:'}</span>
                  <span className="text-cyan-300 truncate max-w-[140px] font-mono">
                    {videoUrl ? (videoUrl.startsWith('blob:') ? 'Local File' : new URL(videoUrl).hostname) : 'External CDN'}
                  </span>
                </div>
              </div>

              {/* Store Card Face Preview (معاينة واجهة العرض في المتجر) */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{lang === 'ar' ? 'واجهة العرض في المتجر:' : '商场卡片展示形态:'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    !usePosterImage || !posterUrl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {!usePosterImage || !posterUrl
                      ? (lang === 'ar' ? '🎬 واجهة الفيديو مباشرة (فيديو فقط)' : '仅视频直出')
                      : (lang === 'ar' ? '🖼️ صورة غلاف مع تشغيل بالماوس' : '封面图+悬停动效')}
                  </span>
                </div>

                <div className="relative aspect-[4/5] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-lg flex items-center justify-center">
                  {usePosterImage && posterUrl ? (
                    <img
                      src={posterUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : videoUrl ? (
                    <video
                      key={videoUrl}
                      src={`${videoUrl}#t=0.001`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[11px] p-3 text-center">
                      <Video className="w-6 h-6 mb-1 opacity-40 text-cyan-400" />
                      <span>{lang === 'ar' ? 'ضع رابط الفيديو ليأخذ الواجهة هنا' : '输入视频直链'}</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-slate-950/85 backdrop-blur text-[10px] text-white truncate font-medium text-center border border-slate-800">
                    {title || (lang === 'ar' ? 'اسم الهدية' : '礼物名称')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: ACTIVE GIFTS LIST */}
      {activeTab === 'list' && (
        <div className="bg-[#111520] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Search in List */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث في الهدايا...' : '搜索礼物...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setActiveTab('create');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.addNewGift}</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">ID / 封面</th>
                  <th className="p-3">{lang === 'ar' ? 'اسم الهدية' : '礼物名称'}</th>
                  <th className="p-3">{lang === 'ar' ? 'السعر' : '价格 (CNY)'}</th>
                  <th className="p-3">{lang === 'ar' ? 'التصنيف' : '分类/维度'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الصيغ' : '包含格式'}</th>
                  <th className="p-3">{lang === 'ar' ? 'التحميلات' : '下载量'}</th>
                  <th className="p-3 text-right">{lang === 'ar' ? 'الإجراءات' : '操作'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredGifts.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {g.posterUrl ? (
                          <img
                            src={g.posterUrl}
                            alt={g.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-black border border-cyan-500/40 flex items-center justify-center overflow-hidden">
                            <video src={g.videoUrl ? `${g.videoUrl}#t=0.001` : undefined} muted playsInline className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="font-mono text-cyan-400 text-[11px]">{g.id}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{g.title}</div>
                      {g.titleAr && <div className="text-[11px] text-slate-400">{g.titleAr}</div>}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      ¥ {g.price}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {g.category} · {g.effectType}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      {g.formats.map((f) => f.name.split('动')[0]).join(', ')}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {g.downloadsCount}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewGift(g)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(g)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-400"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGift(g.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & DELIVERIES LOG WITH MANUAL UPLOAD & PRINTING */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Orders Header and Action Buttons */}
          <div className="bg-[#111520] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {t.ordersManagement || (lang === 'ar' ? 'إدارة ورفع الطلبات والمبيعات' : 'Orders Management')}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' 
                  ? 'رفع الطلبات يدوياً، إصدار التراخيص، وطباعة الفواتير والشهادات الرسمية وكشوف المبيعات' 
                  : 'Manage and upload orders manually, issue licenses, and print tax invoices and certificates'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Manual Order Upload Button */}
              <button
                type="button"
                onClick={() => setIsOrderFormOpen(!isOrderFormOpen)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  isOrderFormOpen
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isOrderFormOpen 
                    ? (lang === 'ar' ? 'إغلاق نموذج الرفع' : 'Close Form') 
                    : (lang === 'ar' ? 'رفع / تسجيل طلب جديد' : 'Upload New Order')}
                </span>
                {isOrderFormOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Print Full Sales Report */}
              <button
                type="button"
                onClick={() => openPrintModal(null, 'report')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title={lang === 'ar' ? 'طباعة تقرير مبيعات شامل' : 'Print Full Sales Report'}
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'ar' ? 'طباعة كشف المبيعات الشامل' : 'Print Sales Report'}</span>
              </button>
            </div>
          </div>

          {/* MANUAL ORDER UPLOAD FORM (Collapsible) */}
          {isOrderFormOpen && (
            <form 
              onSubmit={handleCreateManualOrder}
              className="bg-gradient-to-b from-[#141928] to-[#101420] border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    {lang === 'ar' ? 'نموذج رفع وتسجيل طلب جديد (Manual Order Upload)' : 'Upload New Customer Order'}
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {lang === 'ar' ? 'توليد تلقائي للترخيص وكود الاستخراج' : 'Auto-generates license certificate'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* 1. Select Gift */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'الهدية المطلوبة (اختر من المتجر):' : 'Select Gift Item:'}
                  </label>
                  <select
                    value={orderGiftId}
                    onChange={(e) => {
                      setOrderGiftId(e.target.value);
                      const found = gifts.find(g => g.id === e.target.value);
                      if (found) {
                        setOrderPrice(orderLicenseType === 'exclusive' ? found.exclusivePrice : found.price);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {gifts.map((g) => (
                      <option key={g.id} value={g.id}>
                        [{g.id}] {g.title} {g.titleAr ? `(${g.titleAr})` : ''} - ¥{g.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Custom Title (Optional override) */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'اسم مخصص للهدية (اختياري):' : 'Custom Title (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={orderCustomTitle}
                    onChange={(e) => setOrderCustomTitle(e.target.value)}
                    placeholder={lang === 'ar' ? 'اتركه فارغاً لاعتماد اسم الهدية الأصلي' : 'Leave empty for original'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Buyer Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'اسم المشتري / الحساب أو القناة:' : 'Buyer / Channel Name:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderBuyerName}
                    onChange={(e) => setOrderBuyerName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: مشاري لايف / المذيعة سارة' : 'e.g., StarStreamer88'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 4. Buyer Contact */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'رقم الهاتف أو البريد الإلكتروني:' : 'Buyer Phone / Email:'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderBuyerContact}
                    onChange={(e) => setOrderBuyerContact(e.target.value)}
                    placeholder={lang === 'ar' ? 'client@streamer.com أو +966...' : 'client@email.com'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 5. License Type */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'نوع الترخيص المطلوب:' : 'License Authorization:'}
                  </label>
                  <select
                    value={orderLicenseType}
                    onChange={(e) => {
                      const val = e.target.value as 'standard' | 'exclusive';
                      setOrderLicenseType(val);
                      const found = gifts.find(g => g.id === orderGiftId);
                      if (found) {
                        setOrderPrice(val === 'exclusive' ? found.exclusivePrice : found.price);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="standard">{lang === 'ar' ? 'ترخيص تجاري عام للبث (Standard)' : 'Standard Commercial'}</option>
                    <option value="exclusive">{lang === 'ar' ? 'شراء حقوق حصرية كاملة (Exclusive Buyout)' : 'Exclusive Buyout'}</option>
                  </select>
                </div>

                {/* 6. Order Price */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'قيمة الطلب المستلمة (USD $):' : 'Amount Received (USD $):'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 7. Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'طريقة التحصيل / الدفع:' : 'Payment Method:'}
                  </label>
                  <select
                    value={orderPaymentMethod}
                    onChange={(e) => setOrderPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="card">{lang === 'ar' ? 'بطاقة مصرفية / فيزا أو ماستركارد' : 'Credit / Debit Card'}</option>
                    <option value="bank">{lang === 'ar' ? 'تحويل بنكي مباشر' : 'Direct Bank Wire'}</option>
                    <option value="wechat">{lang === 'ar' ? 'WeChat Pay (وي تشات باي)' : 'WeChat Pay'}</option>
                    <option value="alipay">{lang === 'ar' ? 'Alipay (علي باي)' : 'Alipay'}</option>
                    <option value="cash">{lang === 'ar' ? 'تحصيل يدوي / نقدي' : 'Cash / Manual'}</option>
                  </select>
                </div>

                {/* 8. Additional Notes */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-semibold block">
                    {lang === 'ar' ? 'ملاحظات وتفاصيل إضافية للطلب:' : 'Order Notes (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: تم إرسال الملفات مسبقاً، تسليم فوري وتوثيق البث' : 'e.g. Verified via VIP streamer desk'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOrderFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-bold shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.dispatchOrderBtn || (lang === 'ar' ? 'تسجيل ورفع الطلب وإصدار الترخيص' : 'Upload & Dispatch Order')}</span>
                </button>
              </div>
            </form>
          )}

          {/* ORDERS TABLE WITH FULL PRINTING CAPABILITIES */}
          <div className="bg-[#111520] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'سجل الطلبات والعمليات المسجلة' : 'Registered Orders & Deliveries'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
                  {deliveries.length}
                </span>
              </h4>

              <span className="text-xs text-slate-400">
                {lang === 'ar' ? 'انقر على أيقونات الطباعة لمعاينة الفاتورة أو شهادة الترخيص وطباعتها فوراً' : 'Click print icons to print invoice or certificate'}
              </span>
            </div>

            {deliveries.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                <PackageCheck className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p>{lang === 'ar' ? 'لا توجد طلبات مسجلة حتى الآن. يمكنك الضغط على "رفع / تسجيل طلب جديد" لإضافة أول طلب!' : 'No orders recorded yet. Click "Upload New Order" above to create one.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">{t.orderNumber}</th>
                      <th className="p-3">{lang === 'ar' ? 'العميل / المشتري' : 'Buyer'}</th>
                      <th className="p-3">{lang === 'ar' ? 'الهدية' : 'Gift'}</th>
                      <th className="p-3">{lang === 'ar' ? 'الترخيص' : 'License'}</th>
                      <th className="p-3">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="p-3">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="p-3 text-center">{lang === 'ar' ? 'خيارات الطباعة' : 'Print Options'}</th>
                      <th className="p-3 text-right rtl:text-left">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-cyan-300 block">{del.orderId}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{del.licenseKey}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{del.buyerName || (lang === 'ar' ? 'عميل معتمد' : 'VIP Client')}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{del.buyerContact || 'streamer@live.com'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-200">{del.giftTitle}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{del.format}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            del.licenseType === 'exclusive' 
                              ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}>
                            {del.licenseType === 'exclusive' 
                              ? (lang === 'ar' ? 'شراء حصري' : '全网买断') 
                              : (lang === 'ar' ? 'ترخيص تجاري' : '商用通用')}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          ¥ {del.price}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {del.purchaseDate}
                        </td>

                        {/* PRINTING SHORTCUTS (The user requested: "وطابع منها كل شيء") */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print Invoice */}
                            <button
                              type="button"
                              onClick={() => openPrintModal(del, 'invoice')}
                              className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1"
                              title={lang === 'ar' ? 'طباعة فاتورة البيع الرسمية' : 'Print Invoice'}
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-400" />
                              <span>{lang === 'ar' ? 'فاتورة' : 'Invoice'}</span>
                            </button>

                            {/* Print Certificate */}
                            <button
                              type="button"
                              onClick={() => openPrintModal(del, 'certificate')}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1"
                              title={lang === 'ar' ? 'طباعة شهادة الترخيص والملكية' : 'Print Certificate'}
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>{lang === 'ar' ? 'شهادة' : 'Cert'}</span>
                            </button>

                            {/* Print Voucher */}
                            <button
                              type="button"
                              onClick={() => openPrintModal(del, 'voucher')}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1"
                              title={lang === 'ar' ? 'طباعة بطاقة الاستلام' : 'Print Slip'}
                            >
                              <Package className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{lang === 'ar' ? 'بطاقة' : 'Slip'}</span>
                            </button>
                          </div>
                        </td>

                        {/* Order Actions */}
                        <td className="p-3 text-right rtl:text-left">
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenDeliveryBox(del)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 flex items-center gap-1"
                              title={lang === 'ar' ? 'فتح صندوق الاستلام الرقمي' : 'Open Delivery Box'}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'صندوق الاستلام' : '交付盒'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(del.id)}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                              title={lang === 'ar' ? 'حذف هذا الطلب' : 'Delete Order'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & CREATORS MANAGEMENT (لوحة إدارة الحسابات والصلاحيات) */}
      {activeTab === 'staff' && (() => {
        const activeAccountsCount = staffList.filter((e) => (e.status || 'active') === 'active').length;
        const inactiveAccountsCount = staffList.filter((e) => e.status === 'inactive').length;
        const uploadAllowedCount = staffList.filter((e) => (e.permissions?.giftUploadAndPublish !== false) && (e.status !== 'inactive')).length;

        const filteredStaffList = staffList.filter((e) => {
          if (accountFilter === 'active') return (e.status || 'active') === 'active';
          if (accountFilter === 'inactive') return e.status === 'inactive';
          if (accountFilter === 'upload_allowed') return (e.permissions?.giftUploadAndPublish !== false) && (e.status !== 'inactive');
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Header & Stats Banner */}
            <div className="p-5 rounded-2xl bg-[#111520] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">
                    {lang === 'ar' ? 'لوحة تفعيل وإدارة الحسابات والصلاحيات' : 'Account & Permissions Management'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {lang === 'ar'
                    ? 'التحكم الكامل في حسابات المنصة: تفعيل أو تعطيل الحسابات، وإدارة [صلاحية رفع ونشر الهدايا - Gift Upload & Publishing Permission] لكل حساب بشكل مستقل، وتعيين بيانات الاتصال بالواتساب.'
                    : 'Manage platform accounts, toggle active/inactive status, and grant/revoke Gift Upload & Publishing Permissions independently.'}
                </p>
              </div>

              {/* Real-time Status Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center">
                  <div className="text-[10px] text-slate-400 font-medium">{lang === 'ar' ? 'إجمالي الحسابات' : 'Total Accounts'}</div>
                  <div className="text-sm sm:text-base font-black text-cyan-300 font-mono">{staffList.length}</div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <div className="text-[10px] text-emerald-400 font-medium">{lang === 'ar' ? 'حسابات مفعلة' : 'Active'}</div>
                  <div className="text-sm sm:text-base font-black text-emerald-300 font-mono">{activeAccountsCount}</div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-center">
                  <div className="text-[10px] text-red-400 font-medium">{lang === 'ar' ? 'معطلة / موقوفة' : 'Inactive'}</div>
                  <div className="text-sm sm:text-base font-black text-red-300 font-mono">{inactiveAccountsCount}</div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center">
                  <div className="text-[10px] text-purple-300 font-medium">{lang === 'ar' ? 'مصرح بالرفع' : 'Can Upload'}</div>
                  <div className="text-sm sm:text-base font-black text-purple-300 font-mono">{uploadAllowedCount}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Create New Staff Form */}
              <div className="lg:col-span-5 bg-[#111520] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'إنشاء حساب جديد وتعيين الصلاحيات' : t.createStaffAccount}
                  </h3>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="مثال: يوسف ديزاينر / سارة فلكس"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.whatsappNumber} *</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-normal">
                        {lang === 'ar' ? 'اختر الدولة وأدخل الرقم' : 'Select country & enter phone'}
                      </span>
                    </label>
                    <InternationalPhoneInput
                      value={newStaffWhatsapp}
                      onChange={setNewStaffWhatsapp}
                      lang={lang}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        {t.staffRole}
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="buyer">{lang === 'ar' ? 'مستخدم / مشتري' : 'Buyer'}</option>
                        <option value="designer">{t.designerRole}</option>
                        <option value="employee">{lang === 'ar' ? 'موظف / مشرف' : 'Employee'}</option>
                        {isSuperAdmin && <option value="admin">{t.adminRole}</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        {lang === 'ar' ? 'البريد الإلكتروني للدخول *' : '员工登录邮箱 *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="designer@streamgifts.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Password for Employee Login */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{lang === 'ar' ? 'كلمة المرور للدخول (Password) *' : '员工登录密码 *'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomPass = 'JW' + Math.floor(1000 + Math.random() * 9000);
                          setNewStaffPassword(randomPass);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        {lang === 'ar' ? '⚡ توليد كلمة سر عشوائية' : '⚡ 随机生成'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        required
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="أدخل كلمة مرور للموظف"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Independent Permission Switch: Gift Upload & Publishing Permission */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{lang === 'ar' ? 'صلاحية رفع ونشر الهدايا' : 'Gift Upload Permission'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {lang === 'ar'
                            ? 'تمكين هذا الحساب من رفع ملفات ومؤثرات الهدايا ونشرها على المنصة فوراً'
                            : 'Allow this user to upload and publish gifts immediately'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNewStaffCanUpload(!newStaffCanUpload)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          newStaffCanUpload ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            newStaffCanUpload ? (lang === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400">{lang === 'ar' ? 'الحالة المبدئية عند الإنشاء:' : 'Initial Status:'}</span>
                      <span className={`font-bold ${newStaffCanUpload ? 'text-cyan-300' : 'text-amber-400'}`}>
                        {newStaffCanUpload
                          ? (lang === 'ar' ? 'مصرح له بالرفع والنشر ✅' : 'Allowed')
                          : (lang === 'ar' ? 'ممنوع من الرفع (مسحوبة) ⛔' : 'Disabled')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      {lang === 'ar' ? 'صورة الرمز الشخصي (Avatar):' : '头像选择:'}
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
                      ].map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewStaffAvatar(img)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-transform ${
                            newStaffAvatar === img ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="preset" className="w-10 h-10 object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="url"
                      value={newStaffAvatar}
                      onChange={(e) => setNewStaffAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      {t.bioSpecialty}
                    </label>
                    <input
                      type="text"
                      value={newStaffBio}
                      onChange={(e) => setNewStaffBio(e.target.value)}
                      placeholder="مثال: متخصص في مؤثرات التيك توك و SVGA ثلاثية الأبعاد"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إنشاء وتفعيل الحساب فوراً' : '创建员工并完成配置'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Staff Members List & Permission Toggles */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'ar' ? 'قائمة الحسابات والصلاحيات' : t.staffList} ({filteredStaffList.length})
                    </h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAccountFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        accountFilter === 'all'
                          ? 'bg-cyan-500 text-black font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lang === 'ar' ? 'الكل' : 'All'} ({staffList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountFilter('active')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        accountFilter === 'active'
                          ? 'bg-emerald-500 text-black font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lang === 'ar' ? 'المفعلة' : 'Active'} ({activeAccountsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountFilter('inactive')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        accountFilter === 'inactive'
                          ? 'bg-red-500 text-white font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lang === 'ar' ? 'المعطلة' : 'Inactive'} ({inactiveAccountsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountFilter('upload_allowed')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        accountFilter === 'upload_allowed'
                          ? 'bg-purple-500 text-white font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lang === 'ar' ? 'مصرح بالرفع' : 'Can Upload'} ({uploadAllowedCount})
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {filteredStaffList.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#111520] border border-slate-800 text-slate-400 text-xs">
                      {lang === 'ar' ? 'لا توجد حسابات مطابقة للتصفية المختارة' : 'No accounts matching the filter.'}
                    </div>
                  ) : (
                    filteredStaffList.map((emp) => {
                      const isActiveAccount = (emp.status || 'active') === 'active';
                      const hasUploadPermission = (emp.permissions?.giftUploadAndPublish !== false) && isActiveAccount;
                      const isCurrentActive = emp.id === activeStaff.id;

                      return (
                        <div
                          key={emp.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrentActive
                              ? 'bg-gradient-to-r from-slate-900 via-[#13192a] to-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                              : 'bg-[#111520] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-3.5">
                            {/* Top row: Avatar + Identity + Status Badges */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3.5">
                                <div className="relative shrink-0">
                                  <img
                                    src={emp.avatar}
                                    alt={emp.name}
                                    className={`w-12 h-12 rounded-2xl object-cover border-2 ${
                                      isCurrentActive
                                        ? 'border-cyan-400 shadow-md'
                                        : isActiveAccount
                                        ? 'border-slate-700'
                                        : 'border-red-500/50 opacity-60'
                                    }`}
                                  />
                                  {isCurrentActive && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#111520] flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-black text-white">{emp.name}</span>
                                    
                                    <select
                                      value={emp.role}
                                      onChange={(e) => {
                                        const newRole = e.target.value as UserRole;
                                        // Find if we need to call an API to update the role
                                        // Use the new changeEmployeeRole function
                                        changeEmployeeRole(emp, newRole).then(() => {
                                          setStaffList((prev) => prev.map((u) => u.id === emp.id ? { ...u, role: newRole } : u));
                                          setSuccessMessage(lang === 'ar' ? `تم تغيير وظيفة/صلاحيات ${emp.name} بنجاح` : 'Role updated successfully');
                                          setTimeout(() => setSuccessMessage(null), 3000);
                                        }).catch((err) => {
                                          alert(lang === 'ar' ? 'حدث خطأ أثناء تغيير الصلاحية' : 'Error updating role');
                                        });
                                      }}
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
                                      title={lang === 'ar' ? 'تغيير الوظيفة والصلاحيات' : 'Change Role'}
                                    >
                                      <option value="buyer">{lang === 'ar' ? 'مستخدم عادي / مشتري' : 'Buyer'}</option>
                                      <option value="designer">{t.designerRole}</option>
                                      <option value="employee">{lang === 'ar' ? 'موظف' : 'Employee'}</option>
                                      {isSuperAdmin && <option value="admin">{t.adminRole}</option>}
                                    </select>

                                    {/* Active Account Status Badge */}
                                    {isActiveAccount ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        <span>{lang === 'ar' ? 'حساب مفعل' : 'Active'}</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                        <span>{lang === 'ar' ? 'حساب معطل ⏸️' : 'Inactive'}</span>
                                      </span>
                                    )}

                                    {isCurrentActive && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                                        <span>{lang === 'ar' ? 'الحساب المختار حالياً' : 'Selected'}</span>
                                      </span>
                                    )}
                                  </div>

                                  {emp.bio && (
                                    <p className="text-xs text-slate-300">{emp.bio}</p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="font-mono text-emerald-400 font-semibold dir-ltr">{emp.whatsapp}</span>
                                      {emp.whatsapp && (
                                        <a
                                          href={`https://wa.me/${emp.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${emp.name}، استفسار بخصوص مؤثرات المتجر`)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1"
                                          title={t.whatsappChat}
                                        >
                                          <span>واتساب</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProfileModal(emp)}
                                        className="ml-1 text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                        title={lang === 'ar' ? 'تعديل رقم الواتساب وتحديثه على جميع هداياه' : 'Edit WhatsApp and sync all gifts'}
                                      >
                                        <Edit3 className="w-2.5 h-2.5" />
                                        <span>{lang === 'ar' ? 'تعديل الرقم' : 'Edit'}</span>
                                      </button>
                                    </div>

                                    <span>•</span>
                                    <span>{t.uploadedGifts}: <strong className="text-white">{emp.giftsCount || 0}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Direct Status Control Button (تفعيل / تعطيل الحساب) */}
                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffStatus(emp.id, isActiveAccount ? 'inactive' : 'active', emp.role)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isActiveAccount
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30'
                                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-sm'
                                  }`}
                                  title={isActiveAccount ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                                >
                                  {isActiveAccount ? (
                                    <>
                                      <span>تعطيل الحساب ⏸️</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>تفعيل الحساب ▶️</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Detailed Permissions Management */}
                            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                              <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold text-white">
                                  {lang === 'ar' ? 'الصلاحيات الممنوحة لهذا المشرف:' : 'Account Permissions:'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { id: 'giftUploadAndPublish', label: lang === 'ar' ? 'إدارة ورفع الهدايا' : 'Manage Gifts' },
                                  { id: 'viewOrders', label: lang === 'ar' ? 'مشاهدة الطلبات' : 'View Orders' },
                                  { id: 'manageAccounts', label: lang === 'ar' ? 'إدارة الحسابات' : 'Manage Accounts' },
                                  { id: 'manageBanners', label: lang === 'ar' ? 'إدارة البنرات' : 'Manage Banners' },
                                  { id: 'manageSettings', label: lang === 'ar' ? 'إعدادات الموقع' : 'Site Settings' },
                                ].map((perm) => (
                                  <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      emp.permissions?.[perm.id as keyof UserPermissions] !== false && (perm.id === 'giftUploadAndPublish' || emp.permissions?.[perm.id as keyof UserPermissions])
                                        ? 'bg-cyan-500 border-cyan-500' 
                                        : 'bg-slate-800 border-slate-700 group-hover:border-cyan-500/50'
                                    }`}>
                                      {(emp.permissions?.[perm.id as keyof UserPermissions] !== false && (perm.id === 'giftUploadAndPublish' || emp.permissions?.[perm.id as keyof UserPermissions])) && (
                                        <Check className="w-3 h-3 text-black stroke-[3]" />
                                      )}
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      className="hidden"
                                      checked={emp.permissions?.[perm.id as keyof UserPermissions] !== false && (perm.id === 'giftUploadAndPublish' || emp.permissions?.[perm.id as keyof UserPermissions]) ? true : false}
                                      onChange={() => {
                                        // Default for giftUploadAndPublish is true if undefined, others false
                                        let currentVal = emp.permissions?.[perm.id as keyof UserPermissions];
                                        if (currentVal === undefined) {
                                          currentVal = perm.id === 'giftUploadAndPublish' ? true : false;
                                        }
                                        handleTogglePermission(emp.id, perm.id as keyof UserPermissions, Boolean(currentVal), emp.role);
                                      }}
                                    />
                                    <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">{perm.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Staff Login Credentials (Email & Password) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px]">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                                  <Mail className="w-3 h-3 text-cyan-400" />
                                  <span className="text-slate-400">البريد:</span>
                                  <span className="text-slate-200 font-mono font-medium">{emp.email}</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                                  <Lock className="w-3 h-3 text-amber-400" />
                                  <span className="text-slate-400">كلمة المرور:</span>
                                  <span className="text-amber-300 font-mono font-bold">
                                    {visibleStaffPasswords[emp.id] ? (emp.password || '123456') : '••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVisibleStaffPasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }));
                                    }}
                                    className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                    title="إظهار / إخفاء"
                                  >
                                    {visibleStaffPasswords[emp.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(emp.password || '123456');
                                      alert(lang === 'ar' ? 'تم نسخ كلمة المرور' : '密码已复制');
                                    }}
                                    className="text-slate-400 hover:text-cyan-400 p-0.5 cursor-pointer"
                                    title="نسخ كلمة السر"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Actions: Select For Uploading + Delete */}
                              <div className="flex items-center gap-2">
                                {isCurrentActive ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!hasUploadPermission) {
                                        alert(lang === 'ar' ? 'تنبيه: هذا الحساب ليس لديه صلاحية رفع الهدايا حالياً. يرجى تفعيل الصلاحية أولاً.' : 'Upload permission is disabled.');
                                        return;
                                      }
                                      setAuthorName(emp.name);
                                      setActiveTab('create');
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 shadow cursor-pointer"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>{lang === 'ar' ? 'رفع هدية بهذا الحساب' : '发布素材'}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isActiveAccount) {
                                        alert(lang === 'ar' ? 'تنبيه: هذا الحساب معطل حالياً. يرجى تفعيل الحساب أولاً للتمكن من استخدامه.' : 'Account is inactive.');
                                        return;
                                      }
                                      handleSwitchStaff(emp.id);
                                      setAuthorName(emp.name);
                                      if (onStaffLogin) {
                                        onStaffLogin(emp);
                                      }
                                      if (hasUploadPermission) {
                                        setActiveTab('create');
                                      }
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                                      isActiveAccount
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                        : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                                    }`}
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{lang === 'ar' ? 'تحديد الحساب للرفع' : '切换为此账号'}</span>
                                  </button>
                                )}

                                {staffList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStaff(emp.id, emp.role)}
                                    className="p-1.5 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                                    title={t.deleteStaffBtn}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRINT DOCUMENT MODAL (For Invoice, Certificate, Delivery Slip, or Sales Report) */}
      <PrintDocumentModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        delivery={printDelivery}
        allDeliveries={deliveries}
        defaultDocType={printDocType}
        lang={lang}
      />

      {/* FIRST-TIME PROFILE SETUP MODAL (لأول مرة فقط) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111520] border border-cyan-500/50 shadow-2xl p-6 space-y-5 text-xs text-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingStaffTarget && editingStaffTarget.id !== activeStaff?.id
                      ? (lang === 'ar' ? `تعديل بيانات ورقم ${editingStaffTarget.name}` : `Edit ${editingStaffTarget.name}`)
                      : t.firstTimeProfileTitle}
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-semibold">
                    {editingStaffTarget && editingStaffTarget.id !== activeStaff?.id
                      ? (lang === 'ar' ? 'تحديث رقم الواتساب ومزامنته مع جميع هدايا هذا المصمم' : 'Update WhatsApp & sync all gifts')
                      : (lang === 'ar' ? 'إدخال البيانات الأساسية ورقم الواتساب لمزامنة الهدايا' : '只需填写一次，后续自动关联')}
                  </p>
                </div>
              </div>

              {(activeStaff?.isProfileCompleted || editingStaffTarget) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setEditingStaffTarget(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-slate-300 leading-relaxed space-y-1">
              <p className="text-cyan-200 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'ar' ? 'مزامنة رقم الواتساب تلقائياً مع جميع الهدايا' : 'Automatic WhatsApp Sync with Gifts'}</span>
              </p>
              <p className="text-[11px] text-slate-300">
                {lang === 'ar' 
                  ? 'اختر كود دولتك من القائمة وأدخل رقمك؛ بمجرد التأكيد سيقوم النظام فوراً بتحديث رقم التواصل على جميع هداياك المعروضة في المتجر للعملاء.'
                  : t.firstTimeProfileDesc}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="مثال: سارة المهندس / كول ديزاين"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.whatsappNumber} *</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-normal">
                    {lang === 'ar' ? 'اختر كود دولتك وأدخل رقمك' : 'Select country code & enter phone'}
                  </span>
                </label>
                <InternationalPhoneInput
                  value={profileWhatsapp}
                  onChange={setProfileWhatsapp}
                  lang={lang}
                  required
                />
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 text-xs shrink-0 mt-0.5">⚡</span>
                  <span className="leading-tight">
                    {lang === 'ar'
                      ? 'ميزة التحديث الشامل: عند الضغط على تأكيد وحفظ، سيتم تحديث هذا الرقم فوراً على جميع الهدايا والتصاميم التي قمت برفعها مسبقاً.'
                      : 'Sync feature: Confirming will automatically update this number across all gifts and effects you uploaded.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.bioSpecialty}
                </label>
                <input
                  type="text"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="مثال: مصممة هدايا SVGA وبثوث لايف"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'ar' ? 'اختر صورة رمزية لملفك:' : '选择头像:'}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
                  ].map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfileAvatar(img)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-transform ${
                        profileAvatar === img ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="preset" className="w-10 h-10 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                {(activeStaff?.isProfileCompleted || editingStaffTarget) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setEditingStaffTarget(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    {lang === 'ar' ? 'إلغاء' : '取消'}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.saveProfileAndUpload}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: HERO BANNERS MANAGEMENT (With Dimension Specs & Uploads) */}
      {activeTab === 'banners' && (
        <BannerManager
          lang={lang}
          banners={bannersList}
          setBanners={setBanners}
        />
      )}

      {/* TAB 4: EXTERNAL VIDEO CDN GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-[#111520] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-300">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'ar' ? 'كيفية رفع الفيديو كروابط خارجية لتوفير استهلاك السيرفر 100%' : '外链视频直连接入指南（0 服务器负载）'}</span>
          </h3>

          <p className="leading-relaxed text-slate-300">
            {lang === 'ar' 
              ? 'موقع جياوي للمؤثرات يتيح لك وضع روابط فيديو مباشرة بحيث يتم بث وتشغيل فيديو الهدية فورياً من خوادم سحابية خارجية (CDN) دون تحميل السيرفر أي ميجابايت من التخزين أو الباندويث.'
              : '为了避免视频大文件（如1080P高清动效）占用服务器存储与宝贵的出网带宽，本平台支持直接绑定外链直连视频地址。'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <strong className="text-cyan-400 font-bold block text-sm">1. Cloudflare R2</strong>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'ar' 
                  ? 'مجاني تماماً حتى 10GB، ولا يوجد أي رسوم على باندويث التحميل (Zero Egress Fees). ممتاز جداً لبث فيديوهات الهدايا بسرعة خارقة.'
                  : '零出口带宽费用，免费提供 10GB 存储，直连速度极快，推荐首选。'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <strong className="text-purple-400 font-bold block text-sm">2. Bunny CDN / Vimeo</strong>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'ar' 
                  ? 'يقدم روابط mp4 مباشرة مع دعم للترميز التلقائي وقنوات الشفافية Alpha Channels.'
                  : '提供原画直链与透明通道视频流支持，全球边缘节点低延迟。'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <strong className="text-emerald-400 font-bold block text-sm">3. Google Drive / GitHub Releases</strong>
              <p className="text-slate-400 leading-relaxed">
                {lang === 'ar' 
                  ? 'يمكنك وضع رابط التحميل المباشر من Google Drive أو GitHub Assets وتضمينه مباشرة في حقل رابط الفيديو.'
                  : '可通过直链转换工具将网盘文件转换为直接在线播放的视频源。'}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* TAB 6: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="bg-[#111520] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-300">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>{lang === 'ar' ? 'إدارة أقسام الموقع (Categories)' : '分类管理'}</span>
          </h3>

          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم القسم (مثال: حيوانات أليفة)' : '分类名称'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة قسم جديد' : '添加分类'}</span>
            </button>
          </form>

          <div className="space-y-2 mt-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="font-bold text-slate-300">{lang === 'ar' ? 'القسم العام (الأساسي)' : '通用分类'}</div>
              <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'لا يمكن حذفه' : '不可删除'}</span>
            </div>
            
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="font-bold text-white">{cat.name}</div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title={lang === 'ar' ? 'حذف القسم' : '删除分类'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-[#111520] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-300">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <span>{lang === 'ar' ? 'إعدادات الموقع الأساسية' : '网站基础设置'}</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                {lang === 'ar' ? 'اسم الموقع / البراند' : '网站/品牌名称'}
              </label>
              <input
                type="text"
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                placeholder="مثال: جياوي ستور"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                {lang === 'ar' ? 'الوصف / الشعار (Slogan)' : '标语/描述'}
              </label>
              <input
                type="text"
                value={siteSettings.siteSlogan}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteSlogan: e.target.value })}
                placeholder="مثال: منصة هدايا البث المباشر الأولى"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                {lang === 'ar' ? 'رابط لوجو الموقع (URL)' : '网站Logo链接'}
              </label>
              <input
                type="url"
                value={siteSettings.logoUrl}
                onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ الإعدادات' : '保存设置'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
