import React from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Headphones, 
  RotateCcw, 
  LayoutDashboard, 
  Store, 
  PackageCheck,
  Globe,
  Sparkles,
  Zap,
  LogOut,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Language, CartItem, AuthUser, SiteSettings } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  currentView: 'store' | 'dashboard';
  setCurrentView: (view: 'store' | 'dashboard') => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  setIsAuthOpen: (open: boolean) => void;
  onOpenStaffAuth: () => void;
  onLogout: () => void;
  setIsDeliveriesOpen: (open: boolean) => void;
  setIsSupportOpen: (open: boolean) => void;
  user: AuthUser | null;
  siteSettings?: SiteSettings;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  searchQuery,
  setSearchQuery,
  onSearch,
  currentView,
  setCurrentView,
  cartItems,
  setIsCartOpen,
  setIsAuthOpen,
  onOpenStaffAuth,
  onLogout,
  setIsDeliveriesOpen,
  setIsSupportOpen,
  user,
  siteSettings
}) => {
  const t = translations[lang];

  const handleDashboardClick = () => {
    if (!user) {
      onOpenStaffAuth();
      return;
    }
    const hasUploadPermission = user.permissions?.giftUploadAndPublish;
    const isAdmin = user.role === 'admin' || user.role === 'employee' || user.role === 'designer';
    
    if (!isAdmin && !hasUploadPermission) {
      alert(lang === 'ar' 
        ? '⚠️ ليس لديك صلاحية للدخول إلى لوحة التحكم. يمكنك طلب ترقية حسابك من الإدارة.' 
        : '您没有权限进入控制台。');
      return;
    }
    setCurrentView(currentView === 'store' ? 'dashboard' : 'store');
  };

  const displayName = siteSettings?.siteName?.trim() || t.siteName;
  const displaySlogan = siteSettings?.siteSlogan?.trim() || t.siteSlogan;
  const displaySubtitle = siteSettings?.siteSubTitle?.trim() || 'JIAWEI EFFECTS · LIVE STREAM VFX';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0e14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5 transition-all">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4 shrink-0">
          <div 
            onClick={() => setCurrentView('store')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Custom Logo Image or Default Stylized Cyan-Blue V Logo */}
            {siteSettings?.logoUrl ? (
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <img
                  src={siteSettings.logoUrl}
                  alt={displayName}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            ) : (
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" preserveAspectRatio="xMidYMid meet">
                  <path d="M3.5 4L9.5 19.5L14 9.5L12 5.5L8 14L5.5 4H3.5ZM14.5 4L20.5 19.5H18L13.5 8L15 4H14.5Z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                  {displayName}
                </span>
                {displaySlogan && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30">
                    {displaySlogan}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider">
                {displaySubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        {currentView === 'store' && (
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSearch();
              }}
              className="relative flex items-center"
            >
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full h-10 pl-10 pr-24 rounded-full bg-slate-900/90 border border-slate-700/70 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  {t.searchBtn}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Nav & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dashboard / Store Toggle Button - ONLY SHOW IF HAS PERMISSION OR IS ADMIN */}
          {user && (
            user.role === 'admin' || 
            user.role === 'designer' || 
            user.permissions?.giftUploadAndPublish || 
            user.permissions?.viewOrders || 
            user.permissions?.manageAccounts || 
            user.permissions?.manageBanners || 
            user.permissions?.manageSettings
          ) && (
            <button
              onClick={handleDashboardClick}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentView === 'dashboard'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent hover:opacity-95 shadow-md shadow-blue-500/20'
              }`}
            >
              {currentView === 'dashboard' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.backToStore}</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                  <span>{t.dashboard}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </>
              )}
            </button>
          )}

          {/* Deliveries Box Shortcut */}
          <button
            onClick={() => setIsDeliveriesOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            title={t.myDeliveries}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">{t.myDeliveries}</span>
          </button>

          {/* Customer Service */}
          <button
            onClick={() => setIsSupportOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{t.customerService}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-slate-400 hidden sm:inline" />
            <button
              onClick={() => setLang('zh')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                lang === 'zh' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                lang === 'ar' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                lang === 'en' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* User Account / Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 pr-2">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-xl border border-cyan-500/40 object-cover shrink-0"
              />
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-100 max-w-[110px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium">
                  {user.role === 'admin'
                    ? (lang === 'ar' ? '👑 مشرف المنصة' : '超级管理员')
                    : user.role === 'designer'
                    ? (lang === 'ar' ? '🎨 مصمم معتمد' : '签约设计师')
                    : user.isTrial
                    ? (lang === 'ar' ? '⚡ حساب تجريبي' : '体验账号')
                    : (lang === 'ar' ? 'مشتري' : '买家')}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title={lang === 'ar' ? 'تسجيل الخروج' : '退出登录'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Login / Register Button */}
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs text-white font-bold shadow-md shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تسجيل الدخول / حساب جديد' : t.login}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
