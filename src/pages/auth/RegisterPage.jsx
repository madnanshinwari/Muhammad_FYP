import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Lock, Mail, User, Phone, MapPin, AlertCircle, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export function RegisterPage() {
  const { register, loading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'customer',
    farm_name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register(formData);
      navigate(user.role === 'admin' || user.role === 'farm_owner'
        ? '/admin'
        : user.role === 'rider' ? '/rider' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-20 flex items-center justify-center">
      <div className="card-elevation-2 rounded-3xl p-6 sm:p-10 bg-white border border-[#E2E8F0] max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/assets/dairy_logo.png"
            alt="Abdul Salam Dairy Farm"
            className="mx-auto h-16 w-28 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-[#111d23] tracking-tight">
          {formData.role === 'farm_owner'
            ? 'Create Farm Owner Account'
            : formData.role === 'rider' ? 'Create Rider Account' : 'Create Customer Account'}
          </h1>
          <p className="text-xs text-[#3f4a3d]">
          {formData.role === 'farm_owner'
            ? 'Manage products, batches, orders, and farm operations.'
            : formData.role === 'rider'
              ? 'Manage your assigned deliveries and delivery history.'
              : 'Join Abdul Salam Dairy Farm for pure raw milk delivered to your door.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'customer', farm_name: '' })}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition-all ${
                  formData.role === 'customer'
                    ? 'border-[#218838] bg-[#F3F7F1] text-[#14532D] ring-2 ring-[#218838]/15'
                    : 'border-[#E2E8F0] bg-white text-[#6f7a6c] hover:border-[#218838]/50'
                }`}
              >
                <User className="h-6 w-6" />
                <span className="text-xs font-bold">Customer</span>
                <span className="text-[10px] leading-tight">Shop and subscribe</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'farm_owner', farm_name: '' })}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition-all ${
                  formData.role === 'farm_owner'
                    ? 'border-[#218838] bg-[#F3F7F1] text-[#14532D] ring-2 ring-[#218838]/15'
                    : 'border-[#E2E8F0] bg-white text-[#6f7a6c] hover:border-[#218838]/50'
                }`}
              >
                <ShieldCheck className="h-6 w-6" />
                <span className="text-xs font-bold">Farm Owner</span>
                <span className="text-[10px] leading-tight">Manage farm operations</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'rider', farm_name: '' })}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition-all ${
                  formData.role === 'rider'
                    ? 'border-[#218838] bg-[#F3F7F1] text-[#14532D] ring-2 ring-[#218838]/15'
                    : 'border-[#E2E8F0] bg-white text-[#6f7a6c] hover:border-[#218838]/50'
                }`}
              >
                <Truck className="h-6 w-6" />
                <span className="text-xs font-bold">Rider</span>
                <span className="text-[10px] leading-tight">Deliver assigned orders</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Haji Muhammad Aslam"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aslam@example.com"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Phone Number (WhatsApp)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input tabular-nums"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Delivery Address
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House, Street, Town / Phase"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {formData.role === 'farm_owner' && (
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Farm Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.farm_name}
                  onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                  placeholder="e.g. Abdul Salam Dairy Farm"
                  className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
                />
                <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full font-bold shadow-sm"
          >
            <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-[#E2E8F0]">
          <span>Already registered? </span>
          <Link to="/login" className="font-bold text-[#218838] hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
