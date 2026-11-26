import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.jsx';
import {
  AlertCircle,
  ArrowRight,
  Package,
  ReceiptText,
  ShoppingBag,
  Truck
} from 'lucide-react';

const statusStyles = {
  Placed: 'bg-[#FEF3C7] text-[#92400E]',
  'Milked & Chilled': 'bg-[#E0E7FF] text-[#3730A3]',
  'Out for Delivery': 'bg-[#DBEAFE] text-[#1D4ED8]',
  Delivered: 'bg-[#DCFCE7] text-[#166534]',
  Cancelled: 'bg-[#FEE2E2] text-[#991B1B]'
};

function parseItems(order) {
  try {
    const items = JSON.parse(order.items_json);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${String(value).replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatUnit(unit) {
  if (!unit) return '';
  const match = String(unit).match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return unit;

  const amount = Number(match[1]);
  const suffix = match[2];
  const normalizedAmount = Number.isInteger(amount) ? amount.toFixed(0) : amount.toString();
  const displaySuffix = suffix;
  return `${normalizedAmount} ${displaySuffix}`;
}

function getStatusLabel(status, lang) {
  const labels = {
    Placed: lang === 'ur' ? 'موصول' : 'Placed',
    'Milked & Chilled': lang === 'ur' ? 'پیک ہو گیا' : 'Packed',
    'Out for Delivery': lang === 'ur' ? 'ترسیل جاری' : 'Out for delivery',
    Delivered: lang === 'ur' ? 'پہنچ گیا' : 'Delivered',
    Cancelled: lang === 'ur' ? 'منسوخ' : 'Cancelled'
  };
  return labels[status] || status;
}

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productMap, setProductMap] = useState({});
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    Promise.all([
      api.getOrders(user.id),
      api.getProducts()
    ])
      .then(([orderRows, productRows]) => {
        if (!active) return;
        setOrders(orderRows);
        setProducts(productRows.slice(0, 4));
        setProductMap(Object.fromEntries(productRows.map((product) => [product.id, product])));
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load your dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ['Placed', 'Milked & Chilled', 'Out for Delivery'].includes(order.order_status)),
    [orders]
  );

  const cancelOrder = async (order) => {
    if (!window.confirm(lang === 'ur' ? 'کیا آپ یہ آرڈر منسوخ کرنا چاہتے ہیں؟' : 'Cancel this order?')) return;
    setCancellingOrderId(order.id);
    setError('');
    try {
      const updated = await api.updateOrderStatus(order.id, 'Cancelled');
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to cancel this order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'customer') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#218838]">
            {lang === 'ur' ? 'خوش آمدید' : 'Welcome'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111d23]">
            {lang === 'ur'
              ? `السلام علیکم، ${user.name}`
              : `Hello, ${user.name}`}
          </h1>
          <p className="mt-1 text-sm text-[#6f7a6c]">
            {lang === 'ur'
              ? 'اپنے تازہ آرڈرز اور پسندیدہ دودھ کے لیے نیچے دیکھیں۔'
              : 'Track your latest orders and shop fresh dairy products.'}
          </p>
        </div>
        <Link to="/profile">
          <Button variant="outline">
            <span>{lang === 'ur' ? 'میرا پروفائل' : 'My Profile'}</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-elevation-1 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">{lang === 'ur' ? 'کل آرڈرز' : 'Total orders'}</p>
              <p className="mt-2 text-3xl font-extrabold text-[#14532D] tabular-nums">{orders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F7F1] text-[#218838]">
              <ReceiptText className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="card-elevation-1 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">{lang === 'ur' ? 'زیرِ عمل' : 'Active orders'}</p>
              <p className="mt-2 text-3xl font-extrabold text-[#14532D] tabular-nums">{activeOrders.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7D6] text-[#A16207]">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <Link to="/catalog" className="card-elevation-1 rounded-2xl p-5 transition hover:card-elevation-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">{lang === 'ur' ? 'نیا آرڈر' : 'New order'}</p>
              <p className="mt-2 text-base font-bold text-[#14532D]">{lang === 'ur' ? 'مصنوعات دیکھیں' : 'Shop fresh dairy'}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F7F1] text-[#218838]">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#14532D]">{lang === 'ur' ? 'میرے آرڈرز' : 'My Orders'}</h2>
              <p className="mt-1 text-xs text-gray-500">{lang === 'ur' ? 'اپنے تمام آرڈرز، صورتحال اور تفصیلات دیکھیں' : 'View previous orders, status, and order details'}</p>
            </div>
          </div>

          <div className="card-elevation-1 overflow-hidden rounded-2xl">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">{lang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <Package className="mx-auto h-10 w-10 text-[#becaba]" />
                <h3 className="mt-3 font-bold text-[#14532D]">{lang === 'ur' ? 'ابھی کوئی آرڈر نہیں' : 'No orders yet'}</h3>
                <p className="mt-1 text-xs text-gray-500">{lang === 'ur' ? 'تازہ ڈیری مصنوعات سے شروع کریں۔' : 'Start with fresh farm dairy products.'}</p>
                <Link to="/catalog" className="mt-4 inline-block">
                  <Button variant="primary">
                    <span>{lang === 'ur' ? 'مصنوعات دیکھیں' : 'Browse products'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">
                {orders.map((order) => {
                  const orderItems = parseItems(order);
                  return (
                    <article key={order.id} className="rounded-xl border border-[#E2E8F0] bg-[#FFFDF5]/40 p-4 transition hover:border-[#218838]/30">
                      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {lang === 'ur' ? 'آرڈر نمبر' : 'Order'}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-sm font-bold text-[#14532D]">
                            {order.order_code}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
                            {getStatusLabel(order.order_status, lang)}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {orderItems.map((item, index) => {
                          const product = productMap[item.productId];
                          const displayName = lang === 'ur'
                            ? (product?.name_ur || item.name)
                            : (product?.name_en || item.name);
                          const unit = formatUnit(item.unit);
                          const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
                          return (
                            <div key={`${order.id}-${item.productId}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-white px-3 py-2.5">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#263238]">{displayName}</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {unit} × {item.qty}
                                </p>
                              </div>
                              <p className="text-right text-sm font-bold text-[#14532D] tabular-nums">
                                Rs. {lineTotal.toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-3">
                        <span className="text-xs font-semibold text-gray-500">
                          {lang === 'ur' ? `کل اشیاء: ${orderItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}` : `${orderItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)} item(s)`}
                        </span>
                        <div className="flex items-center gap-3">
                          {order.order_status === 'Placed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelOrder(order)}
                              disabled={cancellingOrderId === order.id}
                            >
                              {cancellingOrderId === order.id
                                ? (lang === 'ur' ? 'منسوخ ہو رہا ہے...' : 'Cancelling...')
                                : (lang === 'ur' ? 'آرڈر منسوخ کریں' : 'Cancel order')}
                            </Button>
                          )}
                          <div className="text-right">
                          <span className="mr-2 text-xs text-gray-500">{lang === 'ur' ? 'کل' : 'Total'}</span>
                          <span className="text-base font-extrabold text-[#14532D] tabular-nums">
                            Rs. {Number(order.total_amount || 0).toLocaleString()}
                          </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#14532D]">{lang === 'ur' ? 'فوری خریداری' : 'Quick access'}</h2>
            <p className="mt-1 text-xs text-gray-500">{lang === 'ur' ? 'تازہ مصنوعات' : 'Fresh products available'}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              [1, 2].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
              ))
            ) : (
              products.map((product) => (
                <Link
                  key={product.id}
                  to="/catalog"
                  className="card-elevation-1 flex items-center gap-3 rounded-2xl p-3 transition hover:card-elevation-2"
                >
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80'}
                    alt={lang === 'ur' ? product.name_ur : product.name_en}
                    className="h-16 w-16 rounded-xl border border-[#E2E8F0] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#14532D]">
                      {lang === 'ur' ? product.name_ur : product.name_en}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#218838] tabular-nums">
                      Rs. {Number(product.base_price || 0).toLocaleString()} / {product.unit_type}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
