import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../common/Button.jsx';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    removeItem,
    subtotal,
    bottleDeposit,
    bottleCount,
    totalAmount,
    totalItems
  } = useCart();
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className={`fixed inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} max-w-full flex pl-10`}>
        <div className="w-screen max-w-md modal-elevation-3 bg-white flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F3F7F1]/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#218838]" />
              <h2 className="text-lg font-bold text-[#14532D]">
                {t('cartTitle')}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#218838] text-white tabular-nums">
                {totalItems}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#F3F7F1] flex items-center justify-center mx-auto mb-4 text-[#218838]">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-base font-semibold text-[#111d23] mb-1">
                  {t('emptyCart')}
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  {lang === 'ur'
                    ? 'آپ کی ٹوکری میں فی الوقت کوئی فارم پروڈکٹ موجود نہیں۔'
                    : 'Experience pure farm milk and traditional butter today.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/catalog');
                  }}
                >
                  {t('emptyCartCta')}
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.unit}`}
                  className="flex gap-3.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#FFFDF5]/50 hover:bg-[#FFFDF5] transition-colors"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'}
                    alt={item.name}
                    className="w-18 h-18 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
                  />

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-semibold text-[#111d23] leading-snug line-clamp-1">
                          {lang === 'ur' ? (item.name_ur || item.name) : item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId, item.unit)}
                          className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-[#14532D] bg-[#F3F7F1] px-2 py-0.5 rounded">
                        {item.unit}{item.unitType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                      {/* Numeric Stepper */}
                      <div className="inline-flex items-center rounded-md border border-[#becaba] bg-white text-xs">
                        <button
                          onClick={() => updateQty(item.productId, item.unit, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.unit, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-normal mr-1">{t('rs')}</span>
                        <span className="text-sm font-bold text-[#14532D] tabular-nums">
                          {(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-3">
              {/* Bottle Deposit Info Box */}
              {bottleCount > 0 && (
                <div className="p-2.5 rounded-lg bg-[#F3F7F1] border border-[#becaba]/60 text-xs text-[#14532D] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#218838] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">
                      {lang === 'ur'
                        ? `شیشے کی بوتلوں کی امانت: روپے ${bottleDeposit} (${bottleCount} بوتلیں)`
                        : `Glass Bottles Deposit: Rs. ${bottleDeposit} (${bottleCount} bottles)`}
                    </span>
                    <span className="text-[11px] text-[#3f4a3d]">
                      {t('bottleDepositNote')}
                    </span>
                  </div>
                </div>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-1.5 text-xs text-[#3f4a3d] pt-1">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-semibold tabular-nums text-[#111d23]">
                    {t('rs')} {subtotal.toLocaleString()}
                  </span>
                </div>
                {bottleDeposit > 0 && (
                  <div className="flex justify-between text-[#14532D]">
                    <span>{t('bottleDeposit')}</span>
                    <span className="font-semibold tabular-nums">
                      + {t('rs')} {bottleDeposit.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#14532D] pt-2 border-t border-[#E2E8F0]">
                  <span>{t('totalAmount')}</span>
                  <span className="tabular-nums">
                    {t('rs')} {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Button
                variant="secondary"
                size="lg"
                onClick={handleCheckout}
                className="w-full text-sm font-bold shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <span>{t('proceedToCheckout')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
