import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { MetricStatCard } from '../../components/cards/MetricStatCard.jsx';
import { ProductModal } from '../../components/forms/ProductModal.jsx';
import { MilkingBatchModal } from '../../components/forms/MilkingBatchModal.jsx';
import { MilkingBatchTable } from '../../components/tables/MilkingBatchTable.jsx';
import { ShoppingBag, Wallet, Receipt, Hourglass, RefreshCw, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Printer, Download, UserCheck } from 'lucide-react';

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
const EXPENSE_CATEGORIES = ['Electricity Bill', 'Salaries', 'Cow Meals', 'Other'];
const ANIMAL_STATUSES = ['Milking', 'Pregnant', 'Dry', 'Calf'];

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' }
];

const money = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString()}`;
const litres = (value) => `${(Math.round((Number(value) || 0) * 10) / 10).toLocaleString()} L`;

const animalAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Age not set';
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 'Age not set';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years -= 1; months += 12; }
  if (years > 0) return `${years}y${months ? ` ${months}m` : ''}`;
  return `${Math.max(months, 0)}m`;
};

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

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
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
  const [riders, setRiders] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [financeRows, setFinanceRows] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [busyRiderOrderId, setBusyRiderOrderId] = useState(null);
  const [riderSelections, setRiderSelections] = useState({});
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    transaction_date: new Date().toISOString().slice(0, 10),
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: ''
  });
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [animalSearch, setAnimalSearch] = useState('');
  const [animalFormOpen, setAnimalFormOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [animalForm, setAnimalForm] = useState({
    tag_id: '', name: '', breed: '', species: 'Cow', gender: 'Female',
    date_of_birth: '', weight_kg: '', status: 'Milking', purchase_date: '', purchase_price: ''
  });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRows, productRows, batchRows, financeRowsResult, livestockRows, riderRows] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getBatches(),
        api.getFarmResource('finance'),
        api.getFarmResource('livestock'),
        api.getRiders()
      ]);
      setOrders(orderRows);
      setProducts(productRows);
      setBatches(batchRows);
      setFinanceRows(financeRowsResult);
      setLivestock(livestockRows);
      setRiders(riderRows);
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

  const expenseReports = useMemo(() => {
    const monthRows = financeRows.filter((row) =>
      row.transaction_type === 'expense' && String(row.transaction_date).startsWith(reportMonth)
    );
    const yearRows = financeRows.filter((row) =>
      row.transaction_type === 'expense' && String(row.transaction_date).startsWith(reportMonth.slice(0, 4))
    );
    const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, 0]));
    monthRows.forEach((row) => {
      byCategory[row.category] = (byCategory[row.category] || 0) + (Number(row.amount) || 0);
    });
    return {
      monthRows,
      yearRows,
      monthTotal: monthRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
      yearTotal: yearRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
      byCategory
    };
  }, [financeRows, reportMonth]);

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

  const assignRider = async (order, riderId) => {
    setBusyRiderOrderId(order.id);
    setError('');
    try {
      const updated = await api.assignOrderRider(order.id, riderId ? Number(riderId) : null);
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setRiderSelections((current) => ({ ...current, [order.id]: String(updated.rider_id || '') }));
    } catch (err) {
      setError(err.message || 'Unable to assign this order.');
    } finally {
      setBusyRiderOrderId(null);
    }
  };

  const downloadSalesHistory = (days, label) => {
    const now = new Date();
    const end = addDays(startOfDay(now), 1);
    const start = days === 1 ? startOfDay(now) : addDays(end, -days);
    const periodOrders = orders.filter((order) => {
      if (order.order_status === 'Cancelled') return false;
      const time = orderDate(order).getTime();
      return !Number.isNaN(time) && time >= start.getTime() && time < end.getTime();
    });

    const headers = [
      'Order Code',
      'Date',
      'Customer',
      'Phone',
      'Address',
      'Items',
      'Delivery Slot',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Bottle Deposit',
      'Total Amount'
    ];
    const rows = periodOrders.map((order) => {
      const items = parseItems(order)
        .map((item) => `${item.name || 'Unknown'} ${item.unit || ''} x ${item.qty || 0}`)
        .join('; ');
      const date = orderDate(order);
      return [
        order.order_code,
        Number.isNaN(date.getTime()) ? '' : date.toISOString(),
        order.customer_name,
        order.customer_phone,
        order.delivery_address,
        items,
        order.delivery_slot,
        order.payment_method,
        order.payment_status,
        order.order_status,
        Number(order.bottle_deposit) || 0,
        Number(order.total_amount) || 0
      ];
    });
    const salesTotal = periodOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const csv = [
      headers.map(csvCell).join(','),
      ...rows.map((row) => row.map(csvCell).join(',')),
      '',
      csvCell('Sales total'), csvCell(salesTotal)
    ].join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const datePart = now.toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `farm-sales-${label}-${datePart}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
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

  const openAddAnimal = () => {
    setEditingAnimal(null);
    setAnimalForm({
      tag_id: '', name: '', breed: '', species: 'Cow', gender: 'Female',
      date_of_birth: '', weight_kg: '', status: 'Milking', purchase_date: '', purchase_price: ''
    });
    setAnimalFormOpen(true);
  };

  const openEditAnimal = (animal) => {
    setEditingAnimal(animal);
    setAnimalForm({
      tag_id: animal.tag_id || '', name: animal.name || '', breed: animal.breed || '',
      species: animal.species || 'Cow', gender: animal.gender || 'Female',
      date_of_birth: animal.date_of_birth || '', weight_kg: animal.weight_kg ?? '',
      status: animal.status || 'Milking', purchase_date: animal.purchase_date || '',
      purchase_price: animal.purchase_price ?? ''
    });
    setAnimalFormOpen(true);
  };

  const saveAnimal = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const saved = editingAnimal
        ? await api.updateFarmLivestock(editingAnimal.id, animalForm)
        : await api.createFarmResource('livestock', animalForm);
      setLivestock((current) => editingAnimal
        ? current.map((animal) => (animal.id === saved.id ? saved : animal))
        : [saved, ...current]);
      setAnimalFormOpen(false);
      setEditingAnimal(null);
    } catch (err) {
      setError(err.message || 'Unable to save this animal.');
    }
  };

  const deleteAnimal = async (animal) => {
    if (!window.confirm(`Delete animal record "${animal.tag_id}"?`)) return;
    setError('');
    try {
      await api.deleteFarmLivestock(animal.id);
      setLivestock((current) => current.filter((item) => item.id !== animal.id));
    } catch (err) {
      setError(err.message || 'Unable to delete this animal.');
    }
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const created = await api.createFarmResource('finance', {
        ...expenseForm,
        transaction_type: 'expense',
        payment_status: 'Paid'
      });
      setFinanceRows((current) => [created, ...current]);
      setExpenseForm((current) => ({ ...current, description: '', amount: '' }));
    } catch (err) {
      setError(err.message || 'Unable to save this expense.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', badge: pipeline['Placed'] },
    { id: 'delivery', label: 'Delivery Sheet', badge: openOrders.length },
    { id: 'milk', label: 'Milk Production' },
    { id: 'animals', label: 'Animal Management' },
    { id: 'history', label: 'Sales History' },
    { id: 'expenses', label: 'Expenses' },
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

      {/* ================= SALES HISTORY ================= */}
      {tab === 'history' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-bold text-[#14532D]">Download sales history</h2>
                <p className="mt-1 text-xs text-gray-500">
                  CSV downloads include all non-cancelled orders in the selected period.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadSalesHistory(1, '1-day')}>
                  <Download className="h-3.5 w-3.5" /> 1 Day
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadSalesHistory(30, '1-month')}>
                  <Download className="h-3.5 w-3.5" /> 1 Month
                </Button>
                <Button size="sm" variant="primary" onClick={() => downloadSalesHistory(90, '3-months')}>
                  <Download className="h-3.5 w-3.5" /> 3 Months
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F7F1] text-[10px] uppercase tracking-wider text-[#14532D]">
                <tr>
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3">Orders</th>
                  <th className="px-3 py-3">Sales</th>
                  <th className="px-3 py-3">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {[
                  { days: 1, label: '1 day', fileLabel: '1-day' },
                  { days: 30, label: '1 month', fileLabel: '1-month' },
                  { days: 90, label: '3 months', fileLabel: '3-months' }
                ].map((period) => {
                  const end = addDays(startOfDay(new Date()), 1);
                  const start = period.days === 1
                    ? startOfDay(new Date())
                    : addDays(end, -period.days);
                  const periodOrders = orders.filter((order) => {
                    if (order.order_status === 'Cancelled') return false;
                    const time = orderDate(order).getTime();
                    return !Number.isNaN(time) && time >= start.getTime() && time < end.getTime();
                  });
                  const total = periodOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                  return (
                    <tr key={period.label} className="hover:bg-[#FFFDF5]">
                      <td className="px-3 py-3 font-semibold text-[#263238]">{period.label}</td>
                      <td className="px-3 py-3 tabular-nums">{periodOrders.length}</td>
                      <td className="px-3 py-3 font-bold tabular-nums text-[#14532D]">{money(total)}</td>
                      <td className="px-3 py-3">
                        <Button size="sm" variant={period.days === 90 ? 'primary' : 'outline'} onClick={() => downloadSalesHistory(period.days, period.fileLabel)}>
                          <Download className="h-3.5 w-3.5" /> Download CSV
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  const canAdvanceStatus = next && next !== 'Delivered';
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
                          {canAdvanceStatus && (
                            <Button size="sm" variant="primary" disabled={busyOrderId === order.id} onClick={() => changeStatus(order, next)}>
                              {NEXT_ACTION[order.order_status]}
                            </Button>
                          )}
                          {order.order_status === 'Out for Delivery' && (
                            <span className="text-[11px] text-gray-500">
                              {order.rider_id ? 'Assigned rider marks delivered' : 'Assign a rider from the Delivery Sheet'}
                            </span>
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
              Assign active orders to Riders here. Each Rider sees only assigned deliveries in their portal. You can also print the sheet.
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
                          <th className="px-3 py-2">Rider</th>
                          <th className="px-3 py-2">Collect</th>
                          <th className="px-3 py-2">Assign</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {group.orders.map((order, index) => {
                          const due = cashDue(order);
                          const selectedRiderId = riderSelections[order.id] ?? String(order.rider_id || '');
                          const assignedRider = riders.find((rider) => String(rider.id) === String(order.rider_id));
                          const selectedRider = riders.find((rider) => String(rider.id) === selectedRiderId);
                          const assignmentChanged = selectedRiderId !== String(order.rider_id || '');
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
                                <select
                                  aria-label={`Assign rider for ${order.order_code}`}
                                  value={selectedRiderId}
                                  disabled={busyRiderOrderId === order.id || riders.length === 0}
                                  onChange={(event) => setRiderSelections((current) => ({
                                    ...current,
                                    [order.id]: event.target.value
                                  }))}
                                  className="min-w-36 max-w-44 rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#263238] disabled:opacity-60"
                                >
                                  <option value="">{riders.length ? 'Unassigned' : 'No riders yet'}</option>
                                  {riders.map((rider) => (
                                    <option key={rider.id} value={rider.id}>{rider.name}</option>
                                  ))}
                                </select>
                                <span className="mt-1 block max-w-44 truncate text-[10px] text-gray-500">
                                  {assignmentChanged
                                    ? selectedRider ? `Selected: ${selectedRider.name}` : 'Choose a rider'
                                    : assignedRider ? `Assigned: ${assignedRider.name}` : 'Not assigned'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {due > 0 ? (
                                  <span className="font-bold tabular-nums text-[#14532D]">{money(due)}</span>
                                ) : (
                                  <span className="text-gray-500">{order.payment_method === 'Cash on Delivery' ? 'Paid' : `${order.payment_method} (no cash)`}</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  aria-label={selectedRiderId ? `Save rider assignment for ${order.order_code}` : `Unassign rider from ${order.order_code}`}
                                  title={selectedRiderId ? 'Save rider assignment' : 'Remove rider assignment'}
                                  disabled={busyRiderOrderId === order.id || riders.length === 0 || !assignmentChanged}
                                  onClick={() => assignRider(order, selectedRiderId)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#218838]/30 bg-[#F3F7F1] text-[#218838] transition-colors hover:bg-[#b1f2be]/40 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              </td>
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

      {/* ================= ANIMAL MANAGEMENT ================= */}
      {tab === 'animals' && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#14532D]">Animal Management</h2>
              <p className="text-xs text-[#3f4a3d]">Add, view, edit, and manage farm animals.</p>
            </div>
            <Button size="sm" variant="primary" onClick={openAddAnimal}>
              <Plus className="h-3.5 w-3.5" /> Add New Animal
            </Button>
          </div>

          {animalFormOpen && (
            <form onSubmit={saveAnimal} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#14532D]">{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</h3>
                <button type="button" onClick={() => setAnimalFormOpen(false)} className="text-xs font-semibold text-gray-500 hover:text-[#14532D]">Close</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['tag_id', 'Tag ID', 'text', 'e.g. CW-089'],
                  ['name', 'Animal Name', 'text', 'e.g. Sona'],
                  ['breed', 'Breed', 'text', 'e.g. Sahiwal'],
                  ['weight_kg', 'Weight (kg)', 'number', '0']
                ].map(([name, label, type, placeholder]) => (
                  <label key={name} className="text-xs font-semibold text-[#263238]">
                    {label}
                    <input required={name !== 'name' && name !== 'weight_kg'} type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.1' : undefined} value={animalForm[name]} onChange={(event) => setAnimalForm({ ...animalForm, [name]: event.target.value })} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-[#becaba] px-3 py-2 font-normal" />
                  </label>
                ))}
                <label className="text-xs font-semibold text-[#263238]">Species
                  <select value={animalForm.species} onChange={(event) => setAnimalForm({ ...animalForm, species: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] bg-white px-3 py-2 font-normal">
                    <option>Cow</option><option>Buffalo</option><option>Calf</option><option>Other</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#263238]">Gender
                  <select value={animalForm.gender} onChange={(event) => setAnimalForm({ ...animalForm, gender: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] bg-white px-3 py-2 font-normal">
                    <option>Female</option><option>Male</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#263238]">Status
                  <select value={animalForm.status} onChange={(event) => setAnimalForm({ ...animalForm, status: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] bg-white px-3 py-2 font-normal">
                    {ANIMAL_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#263238]">Date of Birth
                  <input type="date" value={animalForm.date_of_birth} onChange={(event) => setAnimalForm({ ...animalForm, date_of_birth: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] px-3 py-2 font-normal" />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAnimalFormOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" variant="primary">{editingAnimal ? 'Save Changes' : 'Add Animal'}</Button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-3">
            <input value={animalSearch} onChange={(event) => setAnimalSearch(event.target.value)} placeholder="Search by tag, name, breed or status" className="w-full max-w-md rounded-lg border border-[#becaba] bg-white px-3 py-2 text-xs" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {livestock
              .filter((animal) => `${animal.tag_id} ${animal.name} ${animal.breed} ${animal.status}`.toLowerCase().includes(animalSearch.toLowerCase()))
              .map((animal) => (
                <article key={animal.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{animal.tag_id}</p>
                      <h3 className="mt-1 font-extrabold text-[#14532D]">{animal.name || 'Unnamed Animal'}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${animal.status === 'Milking' ? 'bg-[#DCFCE7] text-[#166534]' : animal.status === 'Pregnant' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F3F7F1] text-[#263238]'}`}>{animal.status}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div><dt className="text-gray-500">Breed</dt><dd className="mt-1 font-semibold">{animal.breed}</dd></div>
                    <div><dt className="text-gray-500">Age</dt><dd className="mt-1 font-semibold">{animalAge(animal.date_of_birth)}</dd></div>
                    <div><dt className="text-gray-500">Species</dt><dd className="mt-1 font-semibold">{animal.species}</dd></div>
                    <div><dt className="text-gray-500">Gender</dt><dd className="mt-1 font-semibold">{animal.gender}</dd></div>
                  </dl>
                  <div className="mt-4 flex gap-2 border-t border-[#E2E8F0] pt-3">
                    <Button size="sm" variant="outline" onClick={() => openEditAnimal(animal)}><Pencil className="h-3 w-3" /> Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteAnimal(animal)}><Trash2 className="h-3 w-3" /> Delete</Button>
                  </div>
                </article>
              ))}
          </div>
          {livestock.length === 0 && <p className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center text-xs text-gray-500">No animal records yet. Add your first animal.</p>}
        </section>
      )}

      {/* ================= EXPENSES ================= */}
      {tab === 'expenses' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#14532D]">Farm Expenses</h2>
              <p className="text-xs text-[#3f4a3d]">Record electricity, salaries, cow meals, and other farm costs.</p>
            </div>
            <label className="text-xs font-semibold text-[#14532D]">
              Report month
              <input
                type="month"
                value={reportMonth}
                onChange={(event) => setReportMonth(event.target.value)}
                className="ml-2 rounded-lg border border-[#becaba] bg-white px-2 py-1.5 font-normal text-[#263238]"
              />
            </label>
          </div>

          <form onSubmit={saveExpense} className="grid gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-[#263238]">
              Date
              <input required type="date" value={expenseForm.transaction_date} onChange={(event) => setExpenseForm({ ...expenseForm, transaction_date: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] px-3 py-2 font-normal" />
            </label>
            <label className="text-xs font-semibold text-[#263238]">
              Category
              <select value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] bg-white px-3 py-2 font-normal">
                {EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#263238]">
              Description
              <input required value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} placeholder="e.g. Monthly electricity" className="mt-1 w-full rounded-lg border border-[#becaba] px-3 py-2 font-normal" />
            </label>
            <label className="text-xs font-semibold text-[#263238]">
              Amount (Rs.)
              <input required min="1" step="0.01" type="number" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-[#becaba] px-3 py-2 font-normal" />
            </label>
            <Button type="submit" variant="primary" className="self-end">Add Expense</Button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricStatCard title="Monthly Expenses" value={money(expenseReports.monthTotal)} subtitle={reportMonth} icon={Wallet} colorScheme="gold" />
            <MetricStatCard title="Yearly Expenses" value={money(expenseReports.yearTotal)} subtitle={reportMonth.slice(0, 4)} icon={Receipt} colorScheme="green" />
          </div>

          <Panel title={`Monthly breakdown (${reportMonth})`} hint="Expenses are grouped by category for the selected month.">
            <div className="space-y-4">
              {EXPENSE_CATEGORIES.map((category) => (
                <BarRow
                  key={category}
                  label={category}
                  value={expenseReports.byCategory[category]}
                  max={Math.max(...Object.values(expenseReports.byCategory), 0)}
                  text={money(expenseReports.byCategory[category])}
                  color={category === 'Electricity Bill' ? '#F4C542' : '#218838'}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Recent expenses" hint="The latest recorded farm expenses.">
            {expenseReports.yearRows.length === 0 ? (
              <p className="text-xs text-gray-500">No expenses recorded for this year.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider text-[#14532D]">
                    <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {expenseReports.yearRows.slice(0, 20).map((row) => (
                      <tr key={row.id}><td className="px-3 py-2">{row.transaction_date}</td><td className="px-3 py-2">{row.category}</td><td className="px-3 py-2">{row.description}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{money(row.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
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
