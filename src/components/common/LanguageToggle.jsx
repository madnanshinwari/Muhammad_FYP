import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Languages } from 'lucide-react';

export function LanguageToggle({ className = '' }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      onClick={toggleLang}
      title="Toggle English / اردو"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-[#F3F7F1] border border-[#becaba]/60 text-[#14532D] hover:bg-[#b1f2be]/40 transition-colors duration-300 cursor-pointer select-none ${className}`}
    >
      <Languages className="w-3 h-3 text-[#218838]" />
      <span className={lang === 'en' ? 'font-bold text-[#218838]' : 'text-gray-500'}>EN</span>
      <span className="text-gray-300">|</span>
      <span className={lang === 'ur' ? 'font-bold text-[#218838] font-urdu text-xs' : 'text-gray-500 font-urdu text-xs'}>اردو</span>
    </button>
  );
}
