import React, { useState, useEffect, useMemo } from 'react';
import { GiftItem, Language, CartItem, DeliveryItem, EmployeeUser, AuthUser, HeroBannerItem } from './types';
import { INITIAL_GIFTS } from './data/initialGifts';
import { INITIAL_EMPLOYEES } from './data/initialEmployees';
import { INITIAL_BANNERS } from './data/initialBanners';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HeroBanners } from './components/HeroBanners';
import { FilterBar } from './components/FilterBar';
import { GiftCard } from './components/GiftCard';
import { GiftModal } from './components/GiftModal';
import { PurchaseModal } from './components/PurchaseModal';
import { DeliveryBoxModal } from './components/DeliveryBoxModal';
import { Dashboard } from './components/Dashboard';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { SupportModal } from './components/SupportModal';
import { VipModal } from './components/VipModal';
import { Footer } from './components/Footer';
import { seedDatabase, subscribeToGifts, subscribeToDeliveries, subscribeToEmployees, subscribeToBanners, addDelivery } from './lib/firebaseService';

export default function App() {
  // Language (Default to Arabic as requested by the user, with RTL support)
  const [lang, setLang] = useState<Language>('ar');

  // Sync HTML document direction and language dynamically
  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : lang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Main View: Storefront vs Admin Dashboard
  const [currentView, setCurrentView] = useState<'store' | 'dashboard'>('store');

  // Gifts State with Firebase persistence
  const [gifts, setGifts] = useState<GiftItem[]>(INITIAL_GIFTS);

  useEffect(() => {
    const unsubscribe = subscribeToGifts((newGifts) => {
      if (newGifts.length > 0) {
        setGifts(newGifts);
      }
    });
    return () => unsubscribe();
  }, []);

  // Purchased Deliveries History (صناديق الاستلام والطلبات المسجلة)
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToDeliveries((newDeliveries) => {
      setDeliveries(newDeliveries);
    });
    return () => unsubscribe();
  }, []);

  // Employees / Creators State with Firebase persistence
  const [employees, setEmployees] = useState<EmployeeUser[]>(INITIAL_EMPLOYEES);

  useEffect(() => {
    const unsubscribe = subscribeToEmployees((newEmployees) => {
      if (newEmployees.length > 0) {
        setEmployees(newEmployees);
      }
    });
    return () => unsubscribe();
  }, []);

  // Hero Banners State with Firebase persistence & real-time sync across all clients
  const [banners, setBanners] = useState<HeroBannerItem[]>(INITIAL_BANNERS);

  useEffect(() => {
    const unsubscribe = subscribeToBanners((newBanners) => {
      if (newBanners && newBanners.length > 0) {
        setBanners(newBanners);
      }
    });
    return () => unsubscribe();
  }, []);

  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(() => {
    return localStorage.getItem('jiawei_active_emp_id') || 'EMP-001';
  });

  useEffect(() => {
    localStorage.setItem('jiawei_active_emp_id', activeEmployeeId);
  }, [activeEmployeeId]);

  // Seed database once on mount if empty
  useEffect(() => {
    seedDatabase();
  }, []);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // User Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('jiawei_current_user_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Start as visitor/explorer so purchase prompts account creation as requested
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('jiawei_current_user_v1', JSON.stringify(user));
    } else {
      localStorage.removeItem('jiawei_current_user_v1');
    }
  }, [user]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('effects-store');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [effectType, setEffectType] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');

  // Modals & Purchase Gate
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [purchaseGift, setPurchaseGift] = useState<GiftItem | null>(null);
  const [pendingPurchaseGift, setPendingPurchaseGift] = useState<GiftItem | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'buyer' | 'staff'>('buyer');
  const [isDeliveriesOpen, setIsDeliveriesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);

  // Filter Logic
  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = gift.title.toLowerCase().includes(q);
        const matchAr = gift.titleAr?.toLowerCase().includes(q);
        const matchEn = gift.titleEn?.toLowerCase().includes(q);
        const matchId = gift.id.toLowerCase().includes(q);
        const matchTheme = gift.theme.toLowerCase().includes(q);
        if (!matchTitle && !matchAr && !matchEn && !matchId && !matchTheme) return false;
      }

      // Category
      if (category !== 'all' && gift.category !== category) return false;

      // Effect 2D/3D
      if (effectType !== 'all' && gift.effectType !== effectType) return false;

      // AI Filter
      if (aiFilter === 'ai' && !gift.tags.includes('AI原创')) return false;
      if (aiFilter === 'handdrawn' && !gift.tags.includes('纯手绘')) return false;

      // Price filter
      if (priceFilter === 'under100' && gift.price >= 100) return false;
      if (priceFilter === '100-250' && (gift.price < 100 || gift.price > 250)) return false;
      if (priceFilter === '250-400' && (gift.price <= 250 || gift.price > 400)) return false;
      if (priceFilter === 'above400' && gift.price <= 400) return false;

      // Format
      if (selectedFormat !== 'all') {
        const hasFormat = gift.formats.some((f) => f.name.toUpperCase().includes(selectedFormat.toUpperCase()));
        if (!hasFormat) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.downloadsCount - a.downloadsCount;
      if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return 0;
    });
  }, [gifts, searchQuery, category, effectType, aiFilter, priceFilter, selectedFormat, sortBy]);

  const handleResetFilters = () => {
    setCategory('all');
    setSortBy('default');
    setEffectType('all');
    setAiFilter('all');
    setPriceFilter('all');
    setSelectedFormat('all');
    setSearchQuery('');
  };

  const handleAddToCart = (gift: GiftItem) => {
    const newItem: CartItem = {
      gift,
      format: gift.formats[0]?.name || 'SVGA全套',
      licenseType: 'standard',
      price: gift.price
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Purchase Gate: User must log in / create account before purchasing, but can explore freely
  const handleInitiatePurchase = (gift: GiftItem) => {
    if (!user) {
      setPendingPurchaseGift(gift);
      setAuthInitialRole('buyer');
      setIsAuthOpen(true);
      return;
    }
    setPurchaseGift(gift);
  };

  const handleCheckoutAll = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    if (!user) {
      setPendingPurchaseGift(cartItems[0].gift);
      setAuthInitialRole('buyer');
      setIsAuthOpen(true);
      return;
    }
    setPurchaseGift(cartItems[0].gift);
  };

  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem('jiawei_current_user_v1', JSON.stringify(authUser));
    setIsAuthOpen(false);

    // If user was trying to purchase, open the purchase modal immediately!
    if (pendingPurchaseGift) {
      setPurchaseGift(pendingPurchaseGift);
      setPendingPurchaseGift(null);
    } else if (authUser.role === 'designer' || authUser.role === 'admin') {
      // If staff logged in, switch to their profile in dashboard
      if (authUser.employeeId) {
        setActiveEmployeeId(authUser.employeeId);
      }
      setCurrentView('dashboard');
    }
  };

  const handleQuickTrialAccount = () => {
    const trialId = 'TRIAL-' + Math.floor(1000 + Math.random() * 9000);
    const trialUser: AuthUser = {
      id: trialId,
      name: lang === 'ar' ? `مستخدم تجريبي #${trialId.slice(-4)}` : `Trial User #${trialId.slice(-4)}`,
      email: `trial_${trialId.toLowerCase()}@streamgifts.com`,
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      isTrial: true
    };
    setUser(trialUser);
    localStorage.setItem('jiawei_current_user_v1', JSON.stringify(trialUser));

    if (pendingPurchaseGift) {
      setPurchaseGift(pendingPurchaseGift);
      setPendingPurchaseGift(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jiawei_current_user_v1');
    if (currentView === 'dashboard') {
      setCurrentView('store');
    }
  };

  const handleStaffLogin = (emp: EmployeeUser) => {
    const staffUser: AuthUser = {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      avatar: emp.avatar,
      employeeId: emp.id,
      isTrial: false
    };
    setUser(staffUser);
    localStorage.setItem('jiawei_current_user_v1', JSON.stringify(staffUser));
    setActiveEmployeeId(emp.id);
  };

  const handlePaymentSuccess = async (newDelivery: DeliveryItem) => {
    await addDelivery(newDelivery);
    setPurchaseGift(null);
    setSelectedGift(null);
    setActiveDelivery(newDelivery);
  };

  const handleQuickCategorySelect = (key: string) => {
    if (key === 'vip') setIsVipOpen(true);
    if (key === 'featured') {
      setCategory('all');
      setSortBy('popular');
    }
    if (key === 'overseas') {
      setCategory('luxury');
    }
    if (key === 'ai') {
      setAiFilter('ai');
    }
    if (key === 'designer') {
      setAiFilter('handdrawn');
    }
    if (key === 'app') {
      setCategory('fun');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#0b0e14] text-slate-100 font-sans ${lang === 'ar' ? 'rtl font-[Cairo]' : 'ltr'}`}>
      {/* Top Main Navigation Header */}
      <Header
        lang={lang}
        setLang={setLang}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={() => {}}
        currentView={currentView}
        setCurrentView={setCurrentView}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        setIsAuthOpen={setIsAuthOpen}
        onOpenStaffAuth={() => {
          setAuthInitialRole('staff');
          setIsAuthOpen(true);
        }}
        onQuickTrialAccount={handleQuickTrialAccount}
        onLogout={handleLogout}
        setIsDeliveriesOpen={setIsDeliveriesOpen}
        setIsSupportOpen={setIsSupportOpen}
        user={user}
      />

      {/* Main Layout */}
      {currentView === 'store' ? (
        <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
          {/* Left Sticky Sidebar (Clone of video) */}
          <Sidebar
            lang={lang}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedCategory={category}
            setSelectedCategory={setCategory}
            onOpenTool={(toolName) => {
              setIsSupportOpen(true);
            }}
            onOpenVipModal={() => setIsVipOpen(true)}
          />

          {/* Center / Right Content Canvas */}
          <main className="flex-1 min-w-0 p-4 lg:p-6">
            {/* Top Carousel Banner Showcase */}
            <HeroBanners
              lang={lang}
              banners={banners}
              onSelectQuickCategory={handleQuickCategorySelect}
              onOpenCustomDesignModal={() => setIsSupportOpen(true)}
            />

            {/* Filter Toolbar (Clone of video filter strip) */}
            <FilterBar
              lang={lang}
              category={category}
              setCategory={setCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              effectType={effectType}
              setEffectType={setEffectType}
              aiFilter={aiFilter}
              setAiFilter={setAiFilter}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              selectedFormat={selectedFormat}
              setSelectedFormat={setSelectedFormat}
              onReset={handleResetFilters}
              totalCount={filteredGifts.length}
            />

            {/* Gifts Grid Showcase */}
            {filteredGifts.length === 0 ? (
              <div className="py-24 text-center text-slate-500 space-y-3">
                <p className="text-sm">{lang === 'ar' ? 'لم يتم العثور على مؤثرات تطابق خيارات التصفية' : '未找到匹配的动效素材，请尝试重置筛选'}</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 text-xs font-semibold"
                >
                  {lang === 'ar' ? 'إعادة ضبط الفلاتر' : '重置筛选条件'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    lang={lang}
                    onSelectGift={(g) => setSelectedGift(g)}
                    onQuickBuy={(g) => handleInitiatePurchase(g)}
                    onAddToCart={(g) => handleAddToCart(g)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      ) : (
        /* DASHBOARD VIEW (Staff Only Access / Role Guard) */
        <main className="flex-1 w-full">
          {(!user || user.role === 'buyer') ? (
            <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-[#111520] border border-slate-800 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">
                  {lang === 'ar' ? 'منطقة لوحة التحكم خاصة بالموظفين والمصممين' : '员工与设计师专属管理后台'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  {lang === 'ar'
                    ? 'يتم الدخول لهذه اللوحة بواسطة البريد الإلكتروني وكلمة المرور الخاصة بالموظف لرفع الهدايا وربط رقم الواتساب وإدارة المبيعات.'
                    : '此区域需要使用管理员分配的员工邮箱与密码登录，以发布动效素材、绑定联系方式并管理收益。'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthInitialRole('staff');
                    setIsAuthOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  {lang === 'ar' ? 'تسجيل دخول موظف / مصمم' : '员工账号登录'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('store')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                >
                  {lang === 'ar' ? 'العودة للمتجر للتسوق' : '返回素材商城'}
                </button>
              </div>
            </div>
          ) : (
            <Dashboard
              lang={lang}
              gifts={gifts}
              setGifts={setGifts}
              onPreviewGift={(g) => setSelectedGift(g)}
              deliveries={deliveries}
              setDeliveries={setDeliveries}
              onOpenDeliveryBox={(d) => setActiveDelivery(d)}
              employees={employees}
              setEmployees={setEmployees}
              activeEmployeeId={activeEmployeeId}
              setActiveEmployeeId={setActiveEmployeeId}
              onStaffLogin={handleStaffLogin}
              banners={banners}
              setBanners={setBanners}
            />
          )}
        </main>
      )}

      {/* Footer */}
      <Footer
        lang={lang}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenTool={() => setIsSupportOpen(true)}
      />

      {/* MODAL 1: Gift Live Video Preview & Specs Modal */}
      <GiftModal
        gift={selectedGift}
        onClose={() => setSelectedGift(null)}
        lang={lang}
        onAddToCart={(g) => handleAddToCart(g)}
        onOpenPurchase={(g) => handleInitiatePurchase(g)}
        allGifts={gifts}
        onSelectGift={(g) => setSelectedGift(g)}
      />

      {/* MODAL 2: Purchase Box ("صندوق شراء") */}
      <PurchaseModal
        gift={purchaseGift}
        onClose={() => setPurchaseGift(null)}
        lang={lang}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* MODAL 3: Instant Delivery & Receiving Box ("صندوق استلام") */}
      <DeliveryBoxModal
        delivery={activeDelivery}
        onClose={() => setActiveDelivery(null)}
        lang={lang}
        allDeliveries={deliveries}
        onSelectDelivery={(del) => setActiveDelivery(del)}
      />

      {/* MODAL 4: Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutAll={handleCheckoutAll}
      />

      {/* MODAL 5: Auth Modal (Dual role: Buyer exploration/trial/login & Staff employee login) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingPurchaseGift(null);
        }}
        lang={lang}
        employees={employees}
        onAuthSuccess={handleAuthSuccess}
        initialRole={authInitialRole}
        pendingGift={pendingPurchaseGift}
      />

      {/* MODAL 6: Customer Support & Custom Design */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        lang={lang}
      />

      {/* MODAL 7: VIP Club Upgrade */}
      <VipModal
        isOpen={isVipOpen}
        onClose={() => setIsVipOpen(false)}
        lang={lang}
        onUpgrade={() => {
          alert(lang === 'ar' ? 'مبروك! تم تفعيل عضوية VIP بنجاح.' : '恭喜！平台 VIP 黄金会员已成功激活。');
        }}
      />

      {/* MODAL 8: My Deliveries Box Shortcut Modal */}
      {isDeliveriesOpen && (
        <DeliveryBoxModal
          delivery={deliveries[0] || null}
          onClose={() => setIsDeliveriesOpen(false)}
          lang={lang}
          allDeliveries={deliveries}
          onSelectDelivery={(del) => setActiveDelivery(del)}
        />
      )}
    </div>
  );
}
