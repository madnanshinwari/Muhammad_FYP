import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackageCheck,
  UserRound,
  Phone,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { EditProfilePage } from '../customer/EditProfilePage.jsx';

const activeStatuses = ['Out for Delivery'];

function getOrderItems(order) {
  try {
    const items = JSON.parse(order.items_json);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function getSection(pathname) {
  if (pathname === '/rider/deliveries') return 'deliveries';
  if (pathname === '/rider/history') return 'history';
  if (pathname === '/rider/profile') return 'profile';
  return 'dashboard';
}

export function RiderDashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [error, setError] = useState('');
  const section = getSection(location.pathname);

  useEffect(() => {
    if (user?.role !== 'rider') return undefined;
    let active = true;
    api.getOrders()
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load your deliveries.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const deliveries = useMemo(
    () => orders.filter((order) => activeStatuses.includes(order.order_status)),
    [orders]
  );
  const history = useMemo(
    () => orders.filter((order) => order.order_status === 'Delivered'),
    [orders]
  );

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'rider') return <Navigate to={user.role === 'admin' || user.role === 'farm_owner' ? '/admin' : '/dashboard'} replace />;

  const markDelivered = async (order) => {
    setBusyOrderId(order.id);
    setError('');
    try {
      const updated = await api.updateOrderStatus(order.id, 'Delivered');
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err.message || 'Unable to complete this delivery.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', to: '/rider', icon: LayoutDashboard },
    { id: 'deliveries', label: 'My Deliveries', to: '/rider/deliveries', icon: Truck },
    { id: 'history', label: 'Delivery History', to: '/rider/history', icon: ClipboardList },
    { id: 'profile', label: 'My Profile', to: '/rider/profile', icon: UserRound }
  ];

  const renderOrders = (rows, showCompleteAction) => {
    if (!rows.length) {
      return (
        <div className="rounded-2xl border border-dashed border-[#cbd5cf] bg-white px-5 py-12 text-center text-sm text-[#6f7a6c]">
          {showCompleteAction ? 'No deliveries are currently assigned to you.' : 'No completed deliveries yet.'}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {rows.map((order) => (
          <article key={order.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#14532D]">{order.order_code}</h3>
                <p className="mt-1 text-xs text-[#6f7a6c]">
                  {order.delivery_slot} · {order.order_status}
                </p>
              </div>
              {showCompleteAction && (
                <button
                  type="button"
                  disabled={busyOrderId === order.id}
                  onClick={() => markDelivered(order)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#218838] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#14532D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PackageCheck className="h-4 w-4" />
                  {busyOrderId === order.id ? 'Updating...' : 'Mark delivered'}
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p className="flex items-start gap-2 text-[#263238]">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#218838]" />
                <span>{order.customer_name}</span>
              </p>
              <a className="flex items-start gap-2 text-[#263238] hover:text-[#218838]" href={`tel:${order.customer_phone}`}>
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#218838]" />
                <span>{order.customer_phone}</span>
              </a>
              <p className="flex items-start gap-2 text-[#263238] sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#218838]" />
                <span>{order.delivery_address}</span>
              </p>
              <p className="flex items-start gap-2 text-xs text-[#6f7a6c] sm:col-span-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#218838]" />
                <span>{getOrderItems(order).map((item) => `${item.name} ${item.unit} × ${item.qty}`).join(', ')}</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-[#E2E8F0] pt-3 text-xs">
              <span className="text-[#6f7a6c]">{order.payment_method} · {order.payment_status}</span>
              <strong className="text-[#14532D]">Rs. {Number(order.total_amount || 0).toLocaleString()}</strong>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const titles = {
    dashboard: 'Rider Dashboard',
    deliveries: 'My Deliveries',
    history: 'Delivery History',
    profile: 'My Profile'
  };

  return (
    <div className="container mx-auto flex-1 px-4 py-8 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-4 border-b border-[#E2E8F0] px-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7a6c]">Rider Account</p>
            <p className="mt-1 truncate font-bold text-[#14532D]">{user.name}</p>
          </div>
          <nav aria-label="Rider navigation" className="grid gap-1">
            {navigation.map(({ id, label, to, icon: Icon }) => (
              <Link
                key={id}
                to={to}
                aria-current={section === id ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  section === id ? 'bg-[#F3F7F1] text-[#14532D]' : 'text-[#4d5b50] hover:bg-[#F3F7F1]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <section className="min-w-0">
          {section !== 'profile' && (
            <div className="mb-5">
              <h1 className="text-2xl font-extrabold text-[#14532D]">{titles[section]}</h1>
              <p className="mt-1 text-sm text-[#6f7a6c]">Welcome back, {user.name}.</p>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {section === 'profile' ? (
            <EditProfilePage />
          ) : loading ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-12 text-center text-sm text-[#6f7a6c]">Loading deliveries...</div>
          ) : section === 'deliveries' ? (
            renderOrders(deliveries, true)
          ) : section === 'history' ? (
            renderOrders(history, false)
          ) : (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7a6c]">Assigned deliveries</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#14532D]">{deliveries.length}</p>
                </div>
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6f7a6c]">Completed deliveries</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#14532D]">{history.length}</p>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-bold text-[#14532D]">Today’s deliveries</h2>
                <Link to="/rider/deliveries" className="text-xs font-bold text-[#218838] hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-10 text-center text-sm text-[#6f7a6c]">Loading deliveries...</div>
              ) : (
                renderOrders(deliveries.slice(0, 3), true)
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
