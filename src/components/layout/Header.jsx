import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { LanguageToggle } from '../common/LanguageToggle.jsx';
import { api } from '../../services/api.js';
import { ShoppingBag, ShieldCheck, User, Menu, X, Tag } from 'lucide-react';

export function Header() {
  const { t, lang } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);

  const isActive = (path) => location.pathname === path;
  const accountLabel = user
    ? user.role === 'farm_owner'
      ? t('navFarmOwnerAccount')
      : user.role === 'admin'
        ? t('navFarmDirectorAccount')
        : user.role === 'rider'
          ? 'Rider Account'
          : t('navCustomerAccount')
    : '';
  const showPrices = !user || (user.role !== 'customer' && user.role !== 'farm_owner');
  const showStoreLinks = user?.role !== 'rider';
  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch((error) => console.error('Unable to load navbar product prices:', error));
  }, []);

  const formatPrice = (product) => {
    const price = Math.round(Number(product.base_price));
    return `${t('rs')} ${price.toLocaleString()} /${product.unit_type}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs">
      {/* Top Agricultural Notice Strip */}
      <div className="bg-[#14532D] text-[#e6f3fb] text-[11px] sm:text-xs py-1.5 px-4 font-medium">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#94f99a] animate-ping"></span>
            <span className="truncate">
              {lang === 'ur'
                ? 'صبح کا تازہ بیچ دستیاب ہے • ۱۰۰٪ خالص حلال دودھ • رائیونڈ فارم سے براہ راست'
                : 'Fresh Morning Batch Available • 100% Halal Pure Milk • Direct from Raiwind Pastures'}
            </span>
          </div>

          <div className="hidden md:flex shrink-0 items-center gap-4">
            <span className="flex items-center gap-1 text-[#b1f2be]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {lang === 'ur' ? 'لیب سے تصدیق شدہ' : 'Lab Tested Fat & SNF'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="tabular-nums">WhatsApp: +92 300 8472911</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto flex items-center gap-3 px-4 py-3 lg:px-8">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 group">
          <img
            src="/assets/dairy_logo.png"
            alt={t('brandName')}
            className="h-12 w-16 shrink-0 object-contain transition-transform group-hover:scale-105 sm:h-14 sm:w-20"
          />
          <div className="hidden min-[420px]:block">
            <span className="block max-w-[170px] text-base font-bold leading-tight tracking-tight text-[#14532D] lg:text-lg">
              {t('brandName')}
            </span>
            <span className="block text-[11px] font-medium text-[#6f7a6c] leading-tight">
              {t('brandSubtitle')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 text-xs font-medium lg:flex xl:gap-1.5">
          {showStoreLinks && (
            <>
              <Link
                to="/"
                className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors xl:px-2.5 ${
                  isActive('/')
                    ? 'text-[#218838] font-semibold bg-[#F3F7F1]'
                    : 'text-[#263238] hover:text-[#14532D] hover:bg-[#F3F7F1]'
                }`}
              >
                {t('navHome')}
              </Link>
              <Link
                to="/catalog"
                className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors xl:px-2.5 ${
                  isActive('/catalog')
                    ? 'text-[#218838] font-semibold bg-[#F3F7F1]'
                    : 'text-[#263238] hover:text-[#14532D] hover:bg-[#F3F7F1]'
                }`}
              >
                {t('navShop')}
              </Link>
            </>
          )}
          {user?.role === 'customer' && (
            <Link
              to="/dashboard"
              className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors xl:px-2.5 ${
                isActive('/dashboard')
                  ? 'text-[#218838] font-semibold bg-[#F3F7F1]'
                  : 'text-[#263238] hover:text-[#14532D] hover:bg-[#F3F7F1]'
              }`}
            >
              {lang === 'ur' ? 'ڈیش بورڈ' : 'Dashboard'}
            </Link>
          )}
          {showPrices && (
            <div className="group relative">
              <button
                type="button"
                aria-label={t('navPrices')}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-[#14532D] transition-colors hover:bg-[#F3F7F1] xl:px-2.5"
              >
                <Tag className="h-3.5 w-3.5 text-[#218838]" />
                <span>{t('navPrices')}</span>
              </button>
              <div className="invisible absolute right-0 top-full z-50 mt-2 w-60 translate-y-1 rounded-xl border border-[#E2E8F0] bg-white p-3 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="mb-2 border-b border-[#E2E8F0] pb-2 text-[11px] font-bold uppercase tracking-wide text-[#14532D]">
                  {t('navPrices')}
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-[#263238]">
                  {products.map((product) => (
                    <span key={product.id} className="flex justify-between gap-3">
                      <span>{lang === 'ur' ? product.name_ur : product.name_en}</span>
                      <strong>{formatPrice(product)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 transition-colors xl:px-2.5 ${
                isActive('/admin')
                  ? 'text-[#14532D] font-bold bg-[#b1f2be]/40 border border-[#218838]/30'
                  : 'text-[#14532D] hover:bg-[#F3F7F1]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#218838]"></span>
              {t('navAdminDashboard')}
            </Link>
          )}
        </nav>

        {/* Right Action Controls */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <LanguageToggle />

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={t('navCart')}
            className="relative rounded-lg bg-[#F3F7F1] p-2 text-[#14532D] transition-colors hover:bg-[#b1f2be]/40"
          >
            <ShoppingBag className="h-5 w-5 text-[#218838]" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F4C542] text-xs font-bold tabular-nums text-[#263238] shadow-xs">
                {totalItems}
              </span>
            )}
          </button>

          <Link
            to={user?.role === 'customer'
              ? '/dashboard'
              : user?.role === 'rider' ? '/rider' : user ? '/profile' : '/login'}
            className="hidden items-center gap-1.5 rounded-lg p-2 text-[#263238] transition-colors hover:bg-[#F3F7F1] sm:flex"
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.name || 'Profile'}
                className="h-7 w-7 rounded-full border border-[#E2E8F0] object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-[#6f7a6c]" />
            )}
            {user && (
              <span className="flex max-w-[125px] flex-col truncate text-left">
                <span className="truncate text-xs font-semibold text-[#14532D]">{user.name}</span>
                <span className="truncate text-[10px] text-[#6f7a6c]">{accountLabel}</span>
              </span>
            )}
          </Link>

          <div className="hidden items-center border-l border-[#E2E8F0] pl-2 lg:flex">
            {user ? (
              <button
                onClick={logout}
                className="cursor-pointer px-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                {t('navLogout')}
              </button>
            ) : (
              <Link
                to="/login"
                className="flex cursor-pointer items-center gap-1 rounded-md bg-[#14532D] px-2.5 py-1 text-xs text-white transition-colors hover:bg-[#218838]"
              >
                <span>{t('navLogin')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="ml-auto flex shrink-0 items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="p-2 rounded-lg text-[#263238] transition-colors hover:bg-[#F3F7F1] lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-[#E2E8F0] bg-white px-4 py-4 lg:hidden">
          <div className="grid grid-cols-1 gap-1.5">
          {showStoreLinks && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#263238]"
              >
                {t('navHome')}
              </Link>
              <Link
                to="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-[#263238]"
              >
                {t('navShop')}
              </Link>
            </>
          )}
          {user?.role === 'customer' && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#14532D]"
            >
              {lang === 'ur' ? 'میرا ڈیش بورڈ' : 'My Dashboard'}
            </Link>
          )}
          {showPrices && (
            <div className="rounded-xl bg-[#F3F7F1] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#14532D]">
                <Tag className="h-3.5 w-3.5 text-[#218838]" />
                {t('navPrices')}
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-[#263238] sm:grid-cols-2">
                {products.map((product) => (
                  <span key={product.id} className="flex justify-between gap-2">
                    <span>{lang === 'ur' ? product.name_ur : product.name_en}</span>
                    <strong>{formatPrice(product)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#14532D] bg-[#F3F7F1] px-3 rounded-md"
            >
              {t('navAdminDashboard')}
            </Link>
          )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0]">
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-600 font-medium"
              >
                {t('navLogout')}
              </button>
            )}
            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs bg-[#14532D] text-white px-2.5 py-1 rounded"
              >
                {t('navLogin')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
