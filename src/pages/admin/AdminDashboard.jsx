import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { MetricStatCard } from '../../components/cards/MetricStatCard.jsx';
import { ProductModal } from '../../components/forms/ProductModal.jsx';
import { MilkingBatchModal } from '../../components/forms/MilkingBatchModal.jsx';
import { MilkingBatchTable } from '../../components/tables/MilkingBatchTable.jsx';
import { ShoppingBag, Wallet, Receipt, Hourglass, RefreshCw, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';

// A product is "low on stock" when this many units or fewer are left.
const LOW_STOCK_LIMIT = 10;

const STATUSES = ['Placed', 'Milked & Chilled', 'Out for Delivery', 'Delivered', 'Cancelled'];
const OPEN_STATUSES = ['Placed', 'Milked & Chilled', 'Out for Delivery'];

// Plain-language names shown to the farm owner.
const STATUS_LABEL = {
  'Placed': 'New',
  'Milked & Chilled': 'Packed',
  'Out for Delivery': 'On the way',
  'Delivered': 'Delivered',
  'Cancelled': 'Cancelled'
};

const STATUS_STYLE = {
  'Placed': 'bg-[#FEF3C7] text-[#92400E]',
  'Milked & Chilled': 'bg-[#E0E7FF] text-[#3730A3]',
  'Out for Delivery': 'bg-[#e3f0f8] text-[#075985]',
  'Delivered': 'bg-[#b1f2be]/50 text-[#14532D]',
  'Cancelled': 'bg-red-50 text-red-700'
};

const STATUS_BAR_COLOR = {
  'Placed': '#F4C542',
  'Milked & Chilled': '#6366F1',
  'Out for Delivery': '#0EA5E9',
  'Delivered': '#218838',
  'Cancelled': '#EF4444'
};

// The next step for an order, and the button text for it.
const NEXT_STATUS = {
  'Placed': 'Milked & Chilled',
  'Milked & Chilled': 'Out for Delivery',
  'Out for Delivery': 'Delivered'
};
const NEXT_ACTION = {
  'Placed': 'Mark Packed',
  'Milked & Chilled': 'Send for Delivery',
  'Out for Delivery': 'Mark Delivered'
};

const CATEGORY_LABEL = {
  milk: 'Fresh Milk',
  ghee_butter: 'Desi Ghee & Butter',
  yogurt_cream: 'Yogurt & Cream',
  cheese: 'Paneer',
  specials: 'Farm Specials',
  other: 'Other'
};

const PAYMENT_METHODS = ['Cash on Delivery', 'JazzCash', 'EasyPaisa', 'Bank Transfer'];
const PAYMENT_COLOR = {
  'Cash on Delivery': '#218838',
  'JazzCash': '#EF4444',
  'EasyPaisa': '#0EA5E9',
  'Bank Transfer': '#6366F1'
};

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' }
];

const money = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString()}`;
const litres = (value) => `${(Math.round((Number(value) || 0) * 10) / 10).toLocaleString()} L`;

function parseItems(order) {
  try {
    const items = JSON.parse(order.items_json);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

// SQLite stores created_at as UTC "YYYY-MM-DD HH:MM:SS".
function parseDbDate(value) {
  return new Date(`${String(value || '').replace(' ', 'T')}Z`);
}

function orderDate(order) {
  return parseDbDate(order.created_at);
}

function dayKey(date) {
  return date.toLocaleDateString('en-CA');
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Returns the start/end of the chosen range and of the period right before it.
function getRangeBounds(range) {
  if (range === 'all') return { start: null, end: null, prevStart: null };
  const today = startOfDay(new Date());
  const end = addDays(today, 1);
  let start;
  if (range === 'today') start = today;
  else if (range === '7d') start = addDays(today, -6);
  else if (range === '30d') start = addDays(today, -29);
  else start = new Date(today.getFullYear(), today.getMonth(), 1);
  const length = end.getTime() - start.getTime();
  return { start, end, prevStart: new Date(start.getTime() - length) };
}

function lastDays(count) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = addDays(new Date(), -i);
    days.push({
      key: dayKey(date),
      label: count <= 7
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : String(date.getDate())
    });
  }
  return days;
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Trend({ current, previous }) {
  if (previous == null) return null;
  if (previous === 0) {
    return current > 0 ? <span className="font-bold text-[#218838]">New</span> : null;
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return <span className="text-gray-500">Same as before</span>;
  return (
    <span className={`font-bold ${percent > 0 ? 'text-[#218838]' : 'text-red-600'}`}>
      {percent > 0 ? '▲' : '▼'} {Math.abs(percent)}%
    </span>
  );
}

function BarRow({ label, value, max, text, color = '#218838' }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-xs text-[#263238]">
        <span className="truncate">{label}</span>
        <span className="font-semibold tabular-nums">{text ?? value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#F3F7F1]">
        <div className="h-2.5 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Panel({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
      <h2 className="text-sm font-bold text-[#14532D]">{title}</h2>
      {hint ? <p className="mb-4 mt-0.5 text-[11px] text-gray-500">{hint}</p> : <div className="mb-3" />}
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState('7d');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRows, productRows, batchRows] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getBatches()
      ]);
      setOrders(orderRows);
      setProducts(productRows);
      setBatches(batchRows);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const categoryById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product.category])),
    [products]
  );

  // ---------- Pipeline (all orders, right now) ----------
  const pipeline = useMemo(() => {
    const statusCounts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    orders.forEach((order) => {
      if (statusCounts[order.order_status] !== undefined) statusCounts[order.order_status] += 1;
    });
    return statusCounts;
  }, [orders]);

  // ---------- Analytics for the chosen date range ----------
  const stats = useMemo(() => {
    const { start, end, prevStart } = getRangeBounds(range);
    const pick = (from, to) => orders.filter((order) => {
      const time = orderDate(order).getTime();
      return !Number.isNaN(time) && time >= from && time < to;
    });
    const current = start ? pick(start.getTime(), end.getTime()) : orders;
    const previous = start ? pick(prevStart.getTime(), start.getTime()) : null;

    const summarize = (list) => {
      const active = list.filter((order) => order.order_status !== 'Cancelled');
      const sales = active.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      return {
        active,
        orders: active.length,
        sales,
        average: active.length ? sales / active.length : 0,
        cancelled: list.length - active.length
      };
    };

    const now = summarize(current);
    const before = previous ? summarize(previous) : null;

    // Payments
    const byMethod = Object.fromEntries(PAYMENT_METHODS.map((method) => [method, { count: 0, amount: 0 }]));
    let received = 0;
    now.active.forEach((order) => {
      const amount = Number(order.total_amount) || 0;
      if (!byMethod[order.payment_method]) byMethod[order.payment_method] = { count: 0, amount: 0 };
      byMethod[order.payment_method].count += 1;
      byMethod[order.payment_method].amount += amount;
      if (order.payment_status === 'Paid') received += amount;
    });

    // Products & categories
    const productMap = {};
    const categoryMap = {};
    now.active.forEach((order) => {
      parseItems(order).forEach((item) => {
        const name = item.name || 'Unknown';
        const qty = Number(item.qty) || 0;
        const sales = (Number(item.price) || 0) * qty;
        if (!productMap[name]) productMap[name] = { name, qty: 0, sales: 0 };
        productMap[name].qty += qty;
        productMap[name].sales += sales;
        const category = categoryById[item.productId] || 'other';
        if (!categoryMap[category]) categoryMap[category] = { category, qty: 0, sales: 0 };
        categoryMap[category].qty += qty;
        categoryMap[category].sales += sales;
      });
    });
    const categories = Object.values(categoryMap).sort((a, b) => b.sales - a.sales);

    // Sales per day chart
    const chartLength = range === '30d' || range === 'all'
      ? 30
      : range === 'month' ? Math.max(new Date().getDate(), 7) : 7;
    const days = lastDays(chartLength).map((day) => ({ ...day, sales: 0, count: 0 }));
    const dayIndex = Object.fromEntries(days.map((day) => [day.key, day]));
    orders.filter((order) => order.order_status !== 'Cancelled').forEach((order) => {
      const slot = dayIndex[dayKey(orderDate(order))];
      if (slot) {
        slot.sales += Number(order.total_amount) || 0;
        slot.count += 1;
      }
    });

    return {
      now,
      before,
      byMethod,
      received,
      pending: now.sales - received,
      topProducts: Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5),
      categories,
      categoryTotal: categories.reduce((sum, item) => sum + item.sales, 0),
      days,
      maxDaySales: Math.max(...days.map((day) => day.sales), 0)
    };
  }, [orders, range, categoryById]);

  const lowStock = useMemo(
    () => products
      .filter((product) => Number(product.stock_quantity) <= LOW_STOCK_LIMIT)
      .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity)),
    [products]
  );

  // ---------- Milk produced vs sold (last 7 days) ----------
  const milk = useMemo(() => {
    const milkIds = new Set(products.filter((product) => product.category === 'milk').map((product) => product.id));
    const days = lastDays(7).map((day) => ({ ...day, produced: 0, sold: 0 }));
    const dayIndex = Object.fromEntries(days.map((day) => [day.key, day]));

    batches.forEach((batch) => {
      const slot = dayIndex[dayKey(parseDbDate(batch.created_at))];
      if (slot) slot.produced += Number(batch.yield_liters) || 0;
    });
    orders.filter((order) => order.order_status !== 'Cancelled').forEach((order) => {
      const slot = dayIndex[dayKey(orderDate(order))];
      if (!slot) return;
      parseItems(order).forEach((item) => {
        if (milkIds.has(item.productId)) {
          slot.sold += (parseFloat(item.unit) || 0) * (Number(item.qty) || 0);
        }
      });
    });

    const produced = days.reduce((sum, day) => sum + day.produced, 0);
    const sold = days.reduce((sum, day) => sum + day.sold, 0);
    return {
      days,
      produced,
      sold,
      left: produced - sold,
      leftPercent: produced > 0 ? Math.round(((produced - sold) / produced) * 100) : 0,
      max: Math.max(...days.map((day) => Math.max(day.produced, day.sold)), 0)
    };
  }, [orders, products, batches]);

  // ---------- Delivery sheet ----------
  const openOrders = useMemo(
    () => orders.filter((order) => OPEN_STATUSES.includes(order.order_status)),
    [orders]
  );

  const slotGroups = useMemo(() => {
    const sortByAddress = (list) => [...list].sort((a, b) => String(a.delivery_address).localeCompare(String(b.delivery_address)));
    return [
      {
        id: 'morning',
        label: 'Morning Delivery (5:00 AM - 7:00 AM)',
        orders: sortByAddress(openOrders.filter((order) => String(order.delivery_slot).startsWith('Morning')))
      },
      {
        id: 'evening',
        label: 'Evening Delivery (5:00 PM - 7:00 PM)',
        orders: sortByAddress(openOrders.filter((order) => String(order.delivery_slot).startsWith('Evening')))
      }
    ];
  }, [openOrders]);

  // Cash the rider must collect: only unpaid Cash on Delivery orders.
  const cashDue = (order) => (
    order.payment_method === 'Cash on Delivery' && order.payment_status !== 'Paid'
      ? Number(order.total_amount) || 0
      : 0
  );

  // ---------- Orders ----------
  const visibleOrders = orderFilter === 'all'
    ? orders
    : orders.filter((order) => order.order_status === orderFilter);

  const changeStatus = async (order, status) => {
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${order.order_code}?`)) return;
    setBusyOrderId(order.id);
    setError('');
    try {
      const updated = await api.updateOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to update this order.');
    } finally {
      setBusyOrderId(null);
    }
  };

  // ---------- Products ----------
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const saveProduct = async (payload) => {
    setError('');
    try {
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct.id, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await api.createProduct(payload);
        setProducts((current) => [...current, created]);
      }
    } catch (err) {
      setError(err.message || 'Unable to save this product.');
      throw err;
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name_en}"? Customers will no longer see it.`)) return;
    setError('');
    try {
      await api.deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      setError(err.message || 'Unable to delete this product.');
    }
  };

  // ---------- Milking sessions ----------
  const saveBatch = async (payload) => {
    setError('');
    try {
      const created = await api.recordBatch(payload);
      setBatches((current) => [created, ...current]);
    } catch (err) {
      setError(err.message || 'Unable to save this milking session.');
      throw err;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', badge: pipeline['Placed'] },
    { id: 'delivery', label: 'Delivery Sheet', badge: openOrders.length },
    { id: 'milk', label: 'Milk Production' },
    { id: 'products', label: 'Products', badge: lowStock.length, warn: true }
  ];

  const goToOrders = (filter) => {
    setOrderFilter(filter);
    setTab('orders');
  };

  const attentionItems = [];
  if (pipeline['Placed'] > 0) {
    attentionItems.push({
      text: `${pipeline['Placed']} new order${pipeline['Placed'] > 1 ? 's' : ''} waiting to be packed`,
      action: 'View orders',
      onClick: () => goToOrders('Placed')
    });
  }
  if (pipeline['Out for Delivery'] > 0) {
    attentionItems.push({
      text: `${pipeline['Out for Delivery']} order${pipeline['Out for Delivery'] > 1 ? 's' : ''} on the way to customers`,
      action: 'View orders',
      onClick: () => goToOrders('Out for Delivery')
    });
  }
  if (lowStock.length > 0) {
    attentionItems.push({
      text: `${lowStock.length} product${lowStock.length > 1 ? 's' : ''} running low on stock`,
      action: 'View products',
      onClick: () => setTab('products')
    });
  }

  const rangeLabel = RANGES.find((item) => item.id === range)?.label || '';
  const hasData = !loading || orders.length > 0 || products.length > 0;
  const methodMax = Math.max(...Object.values(stats.byMethod).map((item) => item.amount), 0);

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 lg:px-8 sm:py-12">
      <header className="flex flex-col justify-between gap-4 border-b border-[#E2E8F0] pb-5 md:flex-row md:items-center">
        <div>
          <Badge variant="fresh">Farm Account</Badge>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111d23] sm:text-3xl">Farm Management</h1>
          <p className="text-xs text-[#3f4a3d]">See how your farm is doing, manage orders and keep your products up to date.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-[#E2E8F0] pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold ${tab === item.id ? 'border-b-2 border-[#218838] text-[#14532D]' : 'text-gray-500 hover:text-[#14532D]'}`}
          >
            {item.label}
            {item.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${item.warn ? 'bg-red-100 text-red-700' : 'bg-[#F4C542] text-[#263238]'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {loading && !hasData && (
        <div className="py-16 text-center text-xs text-gray-500">Loading your farm data...</div>
      )}

      {/* ================= OVERVIEW ================= */}
      {tab === 'overview' && hasData && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-[#14532D]">What needs your attention</h2>
            {attentionItems.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-[#14532D]">
                <CheckCircle2 className="h-4 w-4 text-[#218838]" /> All good. Nothing needs your attention right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {attentionItems.map((item) => (
                  <li key={item.text} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFFDF5] px-3 py-2 text-xs text-[#263238]">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#B45309]" /> {item.text}
                    </span>
                    <button type="button" onClick={item.onClick} className="font-bold text-[#218838] underline">
                      {item.action}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#14532D]">Show numbers for:</span>
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${range === item.id ? 'bg-[#218838] text-white' : 'border border-[#becaba]/40 bg-[#F3F7F1] text-[#14532D] hover:bg-[#b1f2be]/40'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricStatCard
              title="Orders"
              value={stats.now.orders}
              subtitle={stats.before ? 'vs previous period' : rangeLabel}
              badge={stats.before ? <Trend current={stats.now.orders} previous={stats.before.orders} /> : null}
              icon={ShoppingBag}
              colorScheme="green"
            />
            <MetricStatCard
              title="Sales"
              value={money(stats.now.sales)}
              subtitle={stats.before ? 'vs previous period' : 'Cancelled not counted'}
              badge={stats.before ? <Trend current={stats.now.sales} previous={stats.before.sales} /> : null}
              icon={Wallet}
              colorScheme="gold"
            />
            <MetricStatCard
              title="Average Order"
              value={money(stats.now.average)}
              subtitle={`${stats.now.cancelled} cancelled`}
              badge={stats.before ? <Trend current={stats.now.average} previous={stats.before.average} /> : null}
              icon={Receipt}
              colorScheme="blue"
            />
            <MetricStatCard
              title="Still To Collect"
              value={money(stats.pending)}
              subtitle="Payment not received yet"
              icon={Hourglass}
              colorScheme="gold"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={`Sales per day (${stats.days.length} days)`} hint="Each bar is one day. A taller bar means more sales (in Rs.).">
              <div className="flex h-44 items-end gap-1.5">
                {stats.days.map((day) => (
                  <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col">
                    <span className="mb-1 truncate text-center text-[10px] tabular-nums text-gray-500">
                      {stats.days.length <= 7 && day.sales ? Math.round(day.sales).toLocaleString() : ''}
                    </span>
                    <div className="flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-[#218838]"
                        style={{ height: `${day.sales && stats.maxDaySales ? Math.max((day.sales / stats.maxDaySales) * 100, 4) : 0}%` }}
                        title={`${day.key}: ${money(day.sales)} (${day.count} order${day.count === 1 ? '' : 's'})`}
                      />
                    </div>
                    <span className="mt-1 text-center text-[10px] text-gray-500">{day.label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Where your orders are" hint="How many orders are at each step right now.">
              <div className="space-y-3">
                {STATUSES.map((status) => (
                  <BarRow
                    key={status}
                    label={STATUS_LABEL[status]}
                    value={pipeline[status]}
                    max={Math.max(...Object.values(pipeline), 0)}
                    color={STATUS_BAR_COLOR[status]}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="How customers pay" hint={`Money by payment method (${rangeLabel.toLowerCase()}).`}>
              {stats.now.orders === 0 ? (
                <p className="text-xs text-gray-500">No orders in this period.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(stats.byMethod).map(([method, info]) => (
                      <BarRow
                        key={method}
                        label={method}
                        value={info.amount}
                        max={methodMax}
                        text={`${money(info.amount)} · ${info.count} order${info.count === 1 ? '' : 's'}`}
                        color={PAYMENT_COLOR[method] || '#218838'}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3 text-xs">
                    <div className="rounded-lg bg-[#F3F7F1] p-3">
                      <span className="block text-gray-500">Money received</span>
                      <span className="text-base font-bold tabular-nums text-[#14532D]">{money(stats.received)}</span>
                    </div>
                    <div className="rounded-lg bg-[#FEF3C7] p-3">
                      <span className="block text-[#92400E]">Still to collect</span>
                      <span className="text-base font-bold tabular-nums text-[#92400E]">{money(stats.pending)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">An order counts as received once it is marked Delivered.</p>
                </div>
              )}
            </Panel>

            <Panel title="Sales by category" hint="Which type of product earns the most.">
              {stats.categories.length === 0 ? (
                <p className="text-xs text-gray-500">No sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {stats.categories.map((item) => (
                    <BarRow
                      key={item.category}
                      label={CATEGORY_LABEL[item.category] || item.category}
                      value={item.sales}
                      max={stats.categories[0].sales}
                      text={`${money(item.sales)} · ${stats.categoryTotal ? Math.round((item.sales / stats.categoryTotal) * 100) : 0}%`}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Best-selling products" hint="Which products customers buy the most (number of packs sold).">
              {stats.topProducts.length === 0 ? (
                <p className="text-xs text-gray-500">No sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((product) => (
                    <BarRow
                      key={product.name}
                      label={product.name}
                      value={product.qty}
                      max={stats.topProducts[0].qty}
                      text={`${product.qty} sold · ${money(product.sales)}`}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Stock running low" hint={`Products with ${LOW_STOCK_LIMIT} or fewer left.`}>
              {lowStock.length === 0 ? (
                <p className="text-xs text-gray-500">All products have enough stock.</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg bg-[#FFFDF5] px-3 py-2 text-xs">
                      <span className="text-[#263238]">{product.name_en}</span>
                      <span className={`font-bold tabular-nums ${Number(product.stock_quantity) <= 0 ? 'text-red-600' : 'text-[#B45309]'}`}>
                        {Number(product.stock_quantity) <= 0 ? 'Sold out' : `${product.stock_quantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </section>
      )}

      {/* ================= ORDERS ================= */}
      {tab === 'orders' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', ...STATUSES].map((status) => {
              const count = status === 'all' ? orders.length : pipeline[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOrderFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${orderFilter === status ? 'bg-[#218838] text-white' : 'border border-[#becaba]/40 bg-[#F3F7F1] text-[#14532D] hover:bg-[#b1f2be]/40'}`}
                >
                  {status === 'all' ? 'All' : STATUS_LABEL[status]} <span className="tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F7F1] text-[10px] uppercase tracking-wider text-[#14532D]">
                <tr>
                  <th className="px-3 py-3">Order</th>
                  <th className="px-3 py-3">Customer & Address</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Delivery Time</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {visibleOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500">No orders here yet.</td></tr>
                ) : visibleOrders.map((order) => {
                  const date = orderDate(order);
                  const next = NEXT_STATUS[order.order_status];
                  const canCancel = OPEN_STATUSES.includes(order.order_status);
                  return (
                    <tr key={order.id} className="align-top hover:bg-[#FFFDF5]">
                      <td className="px-3 py-3">
                        <div className="font-mono font-semibold text-[#14532D]">{order.order_code}</div>
                        <div className="text-[10px] text-gray-400">
                          {Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#111d23]">{order.customer_name}</div>
                        <div className="tabular-nums text-gray-600">{order.customer_phone}</div>
                        <div className="max-w-[220px] text-gray-500">{order.delivery_address}</div>
                        {order.order_notes && <div className="mt-1 max-w-[220px] italic text-[#B45309]">Note: {order.order_notes}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <ul className="space-y-0.5 text-[#263238]">
                          {parseItems(order).map((item, index) => (
                            <li key={`${order.id}-${index}`}>{item.name} {item.unit} × {item.qty}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{order.delivery_slot}</td>
                      <td className="px-3 py-3">
                        <div>{order.payment_method}</div>
                        <div className={order.payment_status === 'Paid' ? 'font-semibold text-[#218838]' : 'text-gray-500'}>{order.payment_status}</div>
                      </td>
                      <td className="px-3 py-3 font-bold tabular-nums text-[#14532D]">{money(order.total_amount)}</td>
                      <td className="px-3 py-3"><StatusPill status={order.order_status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          {next && (
                            <Button size="sm" variant="primary" disabled={busyOrderId === order.id} onClick={() => changeStatus(order, next)}>
                              {NEXT_ACTION[order.order_status]}
                            </Button>
                          )}
                          {canCancel && (
                            <Button size="sm" variant="ghost" disabled={busyOrderId === order.id} onClick={() => changeStatus(order, 'Cancelled')}>
                              Cancel order
                            </Button>
                          )}
                          {!next && !canCancel && <span className="text-gray-400">Done</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================= DELIVERY SHEET ================= */}
      {tab === 'delivery' && (
        <section className="space-y-4">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #delivery-sheet, #delivery-sheet * { visibility: visible; }
              #delivery-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; background: #fff; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#3f4a3d]">
              All orders that are not yet delivered, grouped by time slot and sorted by address. Print it and give it to the rider.
            </p>
            <Button size="sm" variant="primary" onClick={() => window.print()} disabled={openOrders.length === 0}>
              <Printer className="h-3.5 w-3.5" /> Print Sheet
            </Button>
          </div>

          <div id="delivery-sheet" className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#14532D]">Delivery Sheet</h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {openOrders.length} order{openOrders.length === 1 ? '' : 's'} to deliver
              </p>
            </div>

            {openOrders.length === 0 && (
              <p className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-8 text-center text-xs text-gray-500">
                No orders waiting for delivery.
              </p>
            )}

            {slotGroups.filter((group) => group.orders.length > 0).map((group) => {
              const totalCash = group.orders.reduce((sum, order) => sum + cashDue(order), 0);
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#14532D]">{group.label}</h3>
                    <span className="text-xs text-[#3f4a3d]">
                      {group.orders.length} stop{group.orders.length === 1 ? '' : 's'} · Cash to collect: <strong className="tabular-nums">{money(totalCash)}</strong>
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3F7F1] text-[10px] uppercase tracking-wider text-[#14532D]">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Address</th>
                          <th className="px-3 py-2">Items</th>
                          <th className="px-3 py-2">Collect</th>
                          <th className="px-3 py-2">Done</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {group.orders.map((order, index) => {
                          const due = cashDue(order);
                          return (
                            <tr key={order.id} className="align-top">
                              <td className="px-3 py-2 tabular-nums text-gray-500">{index + 1}</td>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[#111d23]">{order.customer_name}</div>
                                <div className="tabular-nums text-gray-600">{order.customer_phone}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[240px] text-[#263238]">{order.delivery_address}</div>
                                {order.order_notes && <div className="mt-0.5 max-w-[240px] italic text-[#B45309]">Note: {order.order_notes}</div>}
                              </td>
                              <td className="px-3 py-2">
                                <ul className="space-y-0.5">
                                  {parseItems(order).map((item, itemIndex) => (
                                    <li key={`${order.id}-${itemIndex}`}>{item.name} {item.unit} × {item.qty}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="px-3 py-2">
                                {due > 0 ? (
                                  <span className="font-bold tabular-nums text-[#14532D]">{money(due)}</span>
                                ) : (
                                  <span className="text-gray-500">{order.payment_method === 'Cash on Delivery' ? 'Paid' : `${order.payment_method} (no cash)`}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-base">☐</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= MILK PRODUCTION ================= */}
      {tab === 'milk' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#3f4a3d]">Record every milking session, then compare how much milk you got with how much you sold.</p>
            <Button size="sm" variant="primary" onClick={() => setBatchModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Record Milking Session
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricStatCard title="Milk Produced" value={litres(milk.produced)} subtitle="Last 7 days" icon={ShoppingBag} colorScheme="green" />
            <MetricStatCard title="Milk Sold" value={litres(milk.sold)} subtitle="Fresh milk orders, last 7 days" icon={Wallet} colorScheme="gold" />
            <MetricStatCard
              title={milk.left >= 0 ? 'Milk Left Over' : 'Sold More Than Recorded'}
              value={litres(Math.abs(milk.left))}
              subtitle={milk.produced > 0 ? `${Math.abs(milk.leftPercent)}% of production` : 'No sessions recorded'}
              icon={Hourglass}
              colorScheme="blue"
            />
          </div>

          <Panel
            title="Produced vs sold, day by day"
            hint="Green is milk from the farm, yellow is milk sold to customers. If green is much taller, milk may be going unsold."
          >
            <div className="mb-3 flex gap-4 text-[11px] text-gray-600">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#218838]" /> Produced</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#F4C542]" /> Sold</span>
            </div>
            <div className="flex h-48 items-end gap-2">
              {milk.days.map((day) => (
                <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col">
                  <div className="flex flex-1 items-end gap-1">
                    <div
                      className="flex-1 rounded-t-md bg-[#218838]"
                      style={{ height: `${day.produced && milk.max ? Math.max((day.produced / milk.max) * 100, 4) : 0}%` }}
                      title={`Produced: ${litres(day.produced)}`}
                    />
                    <div
                      className="flex-1 rounded-t-md bg-[#F4C542]"
                      style={{ height: `${day.sold && milk.max ? Math.max((day.sold / milk.max) * 100, 4) : 0}%` }}
                      title={`Sold: ${litres(day.sold)}`}
                    />
                  </div>
                  <span className="mt-1 text-center text-[10px] text-gray-500">{day.label}</span>
                  <span className="text-center text-[10px] tabular-nums text-gray-400">
                    {Math.round(day.produced)}/{Math.round(day.sold)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-gray-500">Under each day: litres produced / litres sold. Orders are counted on the day they are placed.</p>
            {milk.produced === 0 && (
              <p className="mt-2 text-xs text-[#B45309]">No milking sessions were recorded in the last 7 days, so there is nothing to compare yet.</p>
            )}
            {milk.produced > 0 && milk.left < 0 && (
              <p className="mt-2 text-xs text-[#B45309]">More milk was sold than recorded. Some milking sessions may be missing.</p>
            )}
          </Panel>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-[#14532D]">Recent milking sessions</h2>
            <MilkingBatchTable batches={batches} />
          </div>
        </section>
      )}

      {/* ================= PRODUCTS ================= */}
      {tab === 'products' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#3f4a3d]">Change prices and stock here. Customers see the changes straight away.</p>
            <Button size="sm" variant="primary" onClick={openAddProduct}><Plus className="h-3.5 w-3.5" /> Add Product</Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F7F1] text-[10px] uppercase tracking-wider text-[#14532D]">
                <tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">No products yet. Add your first one.</td></tr>
                ) : products.map((product) => {
                  const stock = Number(product.stock_quantity);
                  return (
                    <tr key={product.id} className="hover:bg-[#FFFDF5]">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img src={product.image_url} alt="" className="h-10 w-10 rounded-lg border border-[#E2E8F0] object-cover" />
                          )}
                          <div>
                            <div className="font-semibold text-[#111d23]">{product.name_en}</div>
                            <div className="text-gray-500">{product.name_ur}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{CATEGORY_LABEL[product.category] || product.category}</td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-[#14532D]">{money(product.base_price)} / {product.unit_type}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${stock <= 0 ? 'bg-red-50 text-red-700' : stock <= LOW_STOCK_LIMIT ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#b1f2be]/40 text-[#14532D]'}`}>
                          {stock <= 0 ? 'Sold out' : stock <= LOW_STOCK_LIMIT ? `Low: ${stock}` : `${stock} in stock`}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditProduct(product)}><Pencil className="h-3 w-3" /> Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => deleteProduct(product)}><Trash2 className="h-3 w-3" /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={editingProduct}
        onSave={saveProduct}
      />

      <MilkingBatchModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onSave={saveBatch}
      />
    </div>
  );
}
