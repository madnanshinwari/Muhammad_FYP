import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Button } from '../components/common/Button.jsx';

export function NotFoundPage() {
  const { lang } = useLanguage();

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-[#218838]">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#14532D]">
          {lang === 'ur' ? 'صفحہ نہیں ملا' : 'Page not found'}
        </h1>
        <p className="mt-3 text-sm text-[#3f4a3d]">
          {lang === 'ur'
            ? 'یہ صفحہ موجود نہیں ہے یا منتقل کر دیا گیا ہے۔'
            : 'The page you requested does not exist or has moved.'}
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="primary">
            <Home className="h-4 w-4" />
            <span>{lang === 'ur' ? 'ہوم پر جائیں' : 'Return home'}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
