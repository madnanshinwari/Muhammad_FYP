import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle
} from 'lucide-react';

export function CheckoutPage() {
  const { t, lang } = useLanguage();
  const { items, subtotal, bottleDeposit, bottleCount, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    customer_phone: user?.phone || '',
    delivery_address: user?.address || '',
    delivery_slot: 'Morning (5:00 AM - 7:00 AM)',
    payment_method: 'Cash on Delivery',
    order_notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [error, setError] = useState('');

  // Require authentication
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#111d23] mb-2">
          {lang === 'ur' ? 'لاگ ان درکار ہے' : 'Authentication Required'}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          {lang === 'ur' ? 'چیک آؤٹ کرنے سے پہلے براہ کرم لاگ ان کریں' : 'Please sign in before proceeding to checkout.'}
        </p>
        <Link to="/login">
          <Button variant="primary">{lang === 'ur' ? 'لاگ ان کریں' : 'Sign In'}</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#F3F7F1] flex items-center justify-center mx-auto mb-4 text-[#218838]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#111d23] mb-2">{t('emptyCart')}</h2>
        <p className="text-xs text-gray-500 mb-6">Add pure farm fresh dairy products to your basket before checking out.</p>
        <Link to="/catalog">
          <Button variant="primary">{t('emptyCartCta')}</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.customer_name.trim()) {
        throw new Error('Please enter your name');
      }
      if (!formData.customer_phone.trim()) {
        throw new Error('Please enter your phone number');
      }
      if (!formData.delivery_address.trim()) {
        throw new Error('Please enter delivery address');
      }

      const orderPayload = {
        customer_id: user.id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        delivery_slot: formData.delivery_slot,
        total_amount: totalAmount,
        bottle_deposit: bottleDeposit,
        payment_method: formData.payment_method,
        order_notes: formData.order_notes,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          unit: `${item.unit}${item.unitType}`,
          qty: item.qty,
          price: item.price
        }))
      };

      const result = await api.createOrder(orderPayload);
      setConfirmedOrder(result);
      clearCart();

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Order Success Screen
  if (confirmedOrder) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="card-elevation-2 rounded-3xl p-6 sm:p-10 bg-white border border-[#E2E8F0] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#F3F7F1] text-[#218838] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <Badge variant="fresh" className="mb-2">ORDER VERIFIED</Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14532D]">
              {t('orderSuccessTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
              {t('orderSuccessSubtitle')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF5] border border-[#E2E8F0] text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500 font-sans">Order Voucher:</span>
              <span className="font-bold text-[#14532D]">{confirmedOrder.order_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">Delivery Slot:</span>
              <span className="font-sans font-semibold">{confirmedOrder.delivery_slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">Payment Method:</span>
              <span className="font-sans">{confirmedOrder.payment_method}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-bold text-[#14532D]">
              <span className="font-sans">Total Payable:</span>
              <span>{t('rs')} {confirmedOrder.total_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/catalog">
              <Button variant="primary">
                <span>Continue Shopping</span>
              </Button>
            </Link>
            <a href="/">
              <Button variant="outline">
                <span>Back to Home</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="max-w-2xl space-y-1">
        <h1 className="text-3xl font-extrabold text-[#111d23] tracking-tight">
          {t('checkoutTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[#3f4a3d]">
          {t('deliveryDetails')}
        </p>
      </div>

      {error && (
        <div className="max-w-2xl p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Details (7 Cols) */}
        <div className="lg:col-span-7 card-elevation-1 rounded-2xl p-6 sm:p-8 bg-white border border-[#E2E8F0] space-y-5">
          <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-[#E2E8F0] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#218838]" />
            <span>{t('deliveryDetails')}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {t('fullName')}
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {t('phone')}
              </label>
              <input
                type="text"
                required
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              {t('address')}
            </label>
            <textarea
              rows={2}
              required
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {t('deliverySlot')}
              </label>
              <select
                value={formData.delivery_slot}
                onChange={(e) => setFormData({ ...formData, delivery_slot: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#263238] dairy-input"
              >
                <option value="Morning (5:00 AM - 7:00 AM)">Morning (5:00 AM - 7:00 AM)</option>
                <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM - 7:00 PM)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {t('paymentMethod')}
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#263238] dairy-input"
              >
                <option value="Cash on Delivery">{t('cod')}</option>
                <option value="JazzCash">{t('jazzcash')} (+92 300 8472911)</option>
                <option value="EasyPaisa">{t('easypaisa')} (+92 321 4455667)</option>
                <option value="Bank Transfer">{t('bankTransfer')} (Meezan Bank)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              {t('notes')}
            </label>
            <input
              type="text"
              value={formData.order_notes}
              onChange={(e) => setFormData({ ...formData, order_notes: e.target.value })}
              placeholder={t('notesPlaceholder')}
              className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#263238] dairy-input"
              maxLength="500"
            />
          </div>
        </div>

        {/* Right Summary: Items & Price breakdown (5 Cols) */}
        <div className="lg:col-span-5 card-elevation-1 rounded-2xl p-6 bg-white border border-[#E2E8F0] space-y-4">
          <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <span>Order Summary</span>
            <span className="text-xs text-gray-500 font-normal tabular-nums">{items.length} items</span>
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={`${item.productId}-${item.unit}`} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#111d23] block">
                    {lang === 'ur' ? (item.name_ur || item.name) : item.name}
                  </span>
                  <span className="text-gray-400">
                    {item.qty} × {item.unit}{item.unitType}
                  </span>
                </div>
                <span className="font-bold text-[#14532D] tabular-nums">
                  {t('rs')} {(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Bottle Return Credit Policy */}
          {bottleCount > 0 && (
            <div className="p-3 rounded-xl bg-[#F3F7F1] border border-[#becaba]/60 text-xs text-[#14532D] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#218838] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  Returnable Bottle Deposit: Rs. {bottleDeposit}
                </span>
                <span className="text-[11px] text-[#3f4a3d]">
                  Refundable in cash upon returning empty glass bottles.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#3f4a3d]">
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
            <div className="flex justify-between text-lg font-extrabold text-[#14532D] pt-2 border-t border-[#E2E8F0]">
              <span>{t('totalAmount')}</span>
              <span className="tabular-nums">
                {t('rs')} {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            type="submit"
            disabled={submitting}
            className="w-full font-bold shadow-md mt-4"
          >
            <span>{submitting ? 'Confirming Order...' : t('confirmOrder')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
