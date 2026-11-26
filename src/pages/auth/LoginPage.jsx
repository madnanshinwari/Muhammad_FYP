import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login, error, loading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin' || user.role === 'farm_owner') {
        navigate('/admin');
      } else if (user.role === 'rider') {
        navigate('/rider');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setFormError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-20 flex items-center justify-center bg-[#FFFDF5]">
      <div className="card-elevation-2 rounded-3xl p-6 sm:p-10 bg-white border border-[#E2E8F0] max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/assets/dairy_logo.png"
            alt={lang === 'ur' ? 'عبد السلام ڈیری فارم' : 'Abdul Salam Dairy Farm'}
            className="mx-auto h-16 w-28 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-[#111d23] tracking-tight">
            {lang === 'ur' ? 'عبد السلام ڈیری میں خوش آمدید' : 'Welcome to Abdul Salam Dairy'}
          </h1>
          <p className="text-xs text-[#3f4a3d]">
            {lang === 'ur' ? 'فارم مینجمنٹ اور آن لائن آرڈرز کے لیے لاگ اِن کریں' : 'Sign in to access your orders or farm operations.'}
          </p>
        </div>

        {(formError || error) && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@abdulsalamdairy.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            className="w-full font-bold shadow-sm"
          >
            <span>{loading ? 'Signing In...' : t('navLogin')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-[#E2E8F0]">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-bold text-[#218838] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
