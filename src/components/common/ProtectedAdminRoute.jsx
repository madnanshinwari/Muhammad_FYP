import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from './Button.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { AlertCircle, Home } from 'lucide-react';

export function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#218838] mx-auto mb-4"></div>
          <p className="text-gray-600">{lang === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'farm_owner') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto card-elevation-2 rounded-3xl p-8 bg-white border border-[#E2E8F0] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#111d23] mb-2">
              {lang === 'ur' ? 'رسائی مسترد' : 'Access Denied'}
            </h1>
            <p className="text-sm text-gray-600">
              {lang === 'ur'
                ? 'صرف فارم کے مالک یا ڈائریکٹر ہی آپریشنز ڈیش بورڈ تک رسائی حاصل کر سکتے ہیں۔'
                : 'Only farm owners or directors can access the operations dashboard.'}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <a href="/">
              <Button variant="primary" className="w-full">
                <Home className="w-4 h-4" />
                <span>{lang === 'ur' ? 'ہوم پر جائیں' : 'Return Home'}</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
