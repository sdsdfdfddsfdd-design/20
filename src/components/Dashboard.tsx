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
  X
} from 'lucide-react';
import { GiftItem, Language, DeliveryItem, GiftFormat, EmployeeUser } from '../types';
import { translations } from '../utils/translations';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { PrintDocumentModal } from './PrintDocumentModal';
import { addGift, updateGift, deleteGift, updateEmployee } from '../lib/firebaseService';

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
  onStaffLogin
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'orders' | 'staff' | 'guide'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const activeStaff = staffList.find((e) => e.id === currentEmpId) || staffList[0];

  // First-Time Profile Setup Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileWhatsapp, setProfileWhatsapp] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  // Sync profile form when active employee changes
  useEffect(() => {
    if (activeStaff) {
      setProfileName(activeStaff.name);
      setProfileWhatsapp(activeStaff.whatsapp || '');
      setProfileBio(activeStaff.bio || '');
      setProfileAvatar(activeStaff.avatar || '');
      // Automatically prompt profile setup if not completed yet (as requested: لأول مرة فقط)
      if (!activeStaff.isProfileCompleted) {
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

    if (setDeliveries) {
      setDeliveries((prev) => [newDelivery, ...prev]);
    }

    setSuccessMessage(
      lang === 'ar'
        ? `تم رفع الطلب [${newDelivery.orderId}] بنجاح وتوليد شهادة الترخيص!`
        : `订单 [${newDelivery.orderId}] 上传录入成功！`
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
      
      const updatedGift = {
        ...gifts.find(g => g.id === editingId),

              ...g,
              title: title.trim(),
              titleAr: titleAr.trim() || undefined,
              price: Number(price),
              vipPrice: Number(vipPrice),
              exclusivePrice: Number(exclusivePrice),
              videoUrl: videoUrl.trim(),
              posterUrl: posterUrl.trim() || g.posterUrl,
              formats: parsedFormats,
              category,
              theme: theme.trim() || '精品',
              effectType,
              deliveryUrl: deliveryUrl.trim() || g.deliveryUrl,
              cloudDiskCode: cloudDiskCode.trim() || g.cloudDiskCode
            
      };
      updateGift(updatedGift as GiftItem);

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
        posterUrl: posterUrl.trim() || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
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

  // Save First-Time Profile Setup (لأول مرة فقط)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسمك أو لقبك كمصمم' : '请输入设计师姓名');
      return;
    }
    if (!profileWhatsapp.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال رقم الواتساب' : '请输入WhatsApp号码');
      return;
    }

    updateEmployee({ ...activeStaff,
              ...emp,
              name: profileName.trim(),
              whatsapp: profileWhatsapp.trim(),
              bio: profileBio.trim() || emp.bio,
              avatar: profileAvatar.trim() || emp.avatar,
              isProfileCompleted: true
            });

    setAuthorName(profileName.trim());
    setIsProfileModalOpen(false);
    setSuccessMessage(
      lang === 'ar'
        ? 'تم حفظ ملفك ورقم الواتساب بنجاح! يمكنك الآن رفع الهدايا مباشرة دون تكرار إدخال بياناتك.'
        : '个人资料与WhatsApp已保存，现在可以一键上传素材！'
    );
    setTimeout(() => setSuccessMessage(null), 3000);
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
      avatar: newStaffAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      bio: newStaffBio.trim() || (newStaffRole === 'designer' ? 'مصمم ومعدل مؤثرات بصرية' : 'مشرف إداري بالمنصة'),
      joinedDate: new Date().toISOString().split('T')[0],
      giftsCount: 0,
      totalSales: 0,
      isProfileCompleted: true
    };

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
        ? `تم إنشاء حساب الموظف [${newEmp.name}] بنجاح، وكلمة المرور: (${assignedPassword}). تم تسجيل دخوله والتبديل إليه لرفع الهدايا باسمه!`
        : `新员工 [${newEmp.name}] 创建成功 (初始密码: ${assignedPassword})，已登录并切换至该创作者！`
    );

    // Take them directly to the Upload panel!
    setActiveTab('create');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Delete Staff
  const handleDeleteStaff = (empId: string) => {
    if (staffList.length <= 1) {
      alert(lang === 'ar' ? 'لا يمكن حذف الموظف الوحيد في المنصة.' : '不能删除唯一的员工账号');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الموظف؟' : '确认删除此员工？')) {
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
    setPosterUrl(gift.posterUrl);
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

  const filteredGifts = gifts.filter((g) =>
    g.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    g.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (g.titleAr && g.titleAr.includes(searchFilter))
  );

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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'create'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingId ? (lang === 'ar' ? 'تعديل الهدية' : '编辑礼物素材') : t.addNewGift}</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'list'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.manageGifts} ({gifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>{t.ordersLog} ({deliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'staff'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>{t.staffManagement} ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'guide'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{t.cdnGuide}</span>
        </button>
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
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoTestError(false);
                  }}
                  placeholder="https://your-bucket.r2.cloudflarestorage.com/video.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />

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

              {/* Poster Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.posterUrlInput}
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-xxx?w=800"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
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
                    <option value="ancient">{t.catAncient}</option>
                    <option value="romance">{t.catRomance}</option>
                    <option value="tech">{t.catTech}</option>
                    <option value="festival">{t.catFestival}</option>
                    <option value="luxury">{t.catLuxury}</option>
                    <option value="fun">{t.catFun}</option>
                    <option value="character">{t.catCharacter}</option>
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
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{editingId ? (lang === 'ar' ? 'حفظ التعديلات' : '保存修改') : t.submitGiftBtn}</span>
                </button>

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
                    {videoUrl ? new URL(videoUrl).hostname : 'External CDN'}
                  </span>
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
                        <img
                          src={g.posterUrl}
                          alt={g.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                        />
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

      {/* TAB 3: STAFF & CREATORS MANAGEMENT (Part 3 of user request) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="p-5 rounded-2xl bg-[#111520] border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">{t.staffManagement}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {lang === 'ar'
                  ? 'إدارة حسابات المصممين والموظفين بالمنصة. يمكنك إنشاء حساب موظف جديد وتحديد رقم الواتساب لربطه تلقائياً بالهدايا، أو التبديل بين المصممين للرفع باسمهم.'
                  : '管理平台创作者与员工账号。创建新账号并绑定WhatsApp号码，上传的素材将自动归属于该员工，买家可直接一键咨询。'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-400 font-medium">{t.totalStaff}</div>
                <div className="text-base font-black text-cyan-300 font-mono">{staffList.length}</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-400 font-medium">{t.totalGiftsUploaded}</div>
                <div className="text-base font-black text-purple-300 font-mono">
                  {staffList.reduce((acc, curr) => acc + (curr.giftsCount || 0), 0) + gifts.length}
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-400 font-medium">{t.totalSalesCount}</div>
                <div className="text-base font-black text-emerald-400 font-mono">{deliveries.length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Create New Staff Form */}
            <div className="lg:col-span-5 bg-[#111520] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{t.createStaffAccount}</h3>
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
                    <span className="text-[10px] text-slate-400 font-normal">مع مفتاح الدولة (مثل +966...)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStaffWhatsapp}
                    onChange={(e) => setNewStaffWhatsapp(e.target.value)}
                    placeholder="+966551234567 أو +201012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 dir-ltr text-left"
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
                      <option value="designer">{t.designerRole}</option>
                      <option value="admin">{t.adminRole}</option>
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
                      <span>{lang === 'ar' ? 'كلمة المرور للموظف (Password) *' : '员工登录密码 *'}</span>
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
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'ar' 
                      ? 'يستخدمها الموظف لتسجيل الدخول إلى حسابه في المنصة والوصول للوحة التحكم.'
                      : '该密码用于员工在前端登录界面进入后台并绑定创作者信息。'}
                  </p>
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

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="text-cyan-300 font-bold">
                    {lang === 'ar' ? '✨ خطوة لمرة واحدة فقط:' : '✨ 一次性设置:'}
                  </p>
                  <p>
                    {lang === 'ar'
                      ? 'عند إنشاء هذا الحساب، ستتحول لوحة التحكم إليه تلقائياً لرفع الهدايا، ولن يحتاج لإعادة كتابة اسمه أو واتسابه أبداً.'
                      : '创建账号后可立即发布素材，无需重复输入个人与联络信息。'}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إنشاء حساب موظف وبدء الرفع مباشرة' : '创建员工并立即发布素材'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Staff Members List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>{t.staffList} ({staffList.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {lang === 'ar' ? 'انقر على "التبديل والرفع" للرفع باسم أي مصمم' : '点击切换按钮即可代表该创作者上传'}
                </span>
              </div>

              <div className="space-y-3">
                {staffList.map((emp) => {
                  const isActive = emp.id === activeStaff.id;
                  return (
                    <div
                      key={emp.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-slate-900 via-[#13192a] to-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                          : 'bg-[#111520] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="relative shrink-0">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className={`w-12 h-12 rounded-2xl object-cover border-2 ${
                                isActive ? 'border-cyan-400 shadow-md' : 'border-slate-700'
                              }`}
                            />
                            {isActive && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#111520] flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-white">{emp.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                                {emp.role === 'admin' ? t.adminRole : t.designerRole}
                              </span>
                              {isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  <span>{lang === 'ar' ? 'الحساب النشط حالياً' : '当前使用中'}</span>
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
                              </div>

                              <span>•</span>
                              <span>{t.uploadedGifts}: <strong className="text-white">{emp.giftsCount || 0}</strong></span>
                              <span>•</span>
                              <span>{t.salesDone}: <strong className="text-emerald-400">{emp.totalSales || 0}</strong></span>
                            </div>

                            {/* Staff Login Credentials (Email & Password) */}
                            <div className="pt-2 mt-1 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px]">
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
                                  className="text-slate-400 hover:text-white p-0.5"
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
                                  className="text-slate-400 hover:text-cyan-400 p-0.5"
                                  title="نسخ كلمة السر"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAuthorName(emp.name);
                                setActiveTab('create');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 shadow"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'رفع هدية باسمه' : '发布素材'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleSwitchStaff(emp.id);
                                setAuthorName(emp.name);
                                if (onStaffLogin) {
                                  onStaffLogin(emp);
                                }
                                setActiveTab('create');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{lang === 'ar' ? 'تسجيل الدخول والرفع' : '切换为此账号并发布'}</span>
                            </button>
                          )}

                          {staffList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(emp.id)}
                              className="p-2 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-colors"
                              title={t.deleteStaffBtn}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {t.firstTimeProfileTitle}
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-semibold">
                    {lang === 'ar' ? 'إدخال البيانات الأساسية لمرة واحدة فقط' : '只需填写一次，后续自动关联'}
                  </p>
                </div>
              </div>

              {activeStaff?.isProfileCompleted && (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
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
                <span>{lang === 'ar' ? 'لماذا يطلب منك إدخال الاسم ورقم الواتساب؟' : '为什么需要完善此信息？'}</span>
              </p>
              <p className="text-[11px] text-slate-300">
                {t.firstTimeProfileDesc}
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
                  <span className="text-[10px] text-slate-400 font-normal">مع مفتاح الدولة (مثل +966...)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={profileWhatsapp}
                  onChange={(e) => setProfileWhatsapp(e.target.value)}
                  placeholder="+966551234567 أو +201012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/60 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400 dir-ltr text-left"
                />
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
                {activeStaff?.isProfileCompleted && (
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
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
    </div>
  );
};
