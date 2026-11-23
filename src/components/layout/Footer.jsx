import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ShieldCheck, MapPin, Phone, Mail, Award, Clock } from 'lucide-react';

export function Footer() {
  const { t, lang } = useLanguage();

  return (
    <footer className="bg-[#14532D] text-[#e6f3fb] pt-14 pb-8 border-t border-[#2e6a41]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Farm Philosophy */}
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#218838] flex items-center justify-center text-white font-bold text-lg">
                AS
              </div>
              <div>
                <span className="block text-base font-bold text-white leading-tight">
                  {t('brandName')}
                </span>
                <span className="block text-[11px] text-[#b1f2be]">
                  {t('brandSubtitle')}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#d7e4ec] leading-relaxed mb-4">
              {t('footerAbout')}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2e6a41] text-xs font-semibold text-[#94f99a]">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('footerHalal')}</span>
            </div>
          </div>

          {/* Farm Contact & Location */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#b1f2be] mb-3.5">
              {lang === 'ur' ? 'فارم کا پتہ و رابطہ' : 'Farm Location & Contact'}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#d7e4ec]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F4C542] shrink-0 mt-0.5" />
                <span>{t('footerAddress')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4C542] shrink-0" />
                <span className="tabular-nums">{t('footerPhone')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4C542] shrink-0" />
                <span>info@abdulsalamdairy.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F4C542] shrink-0" />
                <span>
                  {lang === 'ur'
                    ? 'سروس کے اوقات: صبح ۸:۰۰ بجے سے رات ۹:۰۰ بجے تک'
                    : 'Service Hours: 8:00 AM - 9:00 PM'}
                </span>
              </li>
            </ul>
          </div>

          {/* Purity Standards & Assurance */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#b1f2be] mb-3.5">
              {lang === 'ur' ? 'معیار اور صفائی کا وعدہ' : 'Quality Standards & Assurance'}
            </h4>
            <ul className="space-y-2 text-xs text-[#d7e4ec]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94f99a]"></span>
                <span>{lang === 'ur' ? 'خالص نیلی راوی بھینس و ساہیوال گائے' : 'Pedigree Nili-Ravi & Sahiwal Herd'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94f99a]"></span>
                <span>{lang === 'ur' ? 'دوہنے کے ۳۰ منٹ میں ۴ ڈگری پر محفوظ' : 'Instant 4°C Rapid Plate Cooling'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94f99a]"></span>
                <span>{lang === 'ur' ? 'پانی، صابن یا کیمیکل کی ملاوٹ سے پاک' : 'Zero Water, Preservatives or Urea'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94f99a]"></span>
                <span>{lang === 'ur' ? 'جراثیم سے پاک شیشے کی بوتلیں' : 'Sanitized Reusable Glass Bottles'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94f99a]"></span>
                <span>{lang === 'ur' ? 'لیب سے فیٹ اور ایس این ایف تصدیق شدہ' : 'Daily Calibrated Lactometer & Fat Tests'}</span>
              </li>
            </ul>
          </div>

          {/* Bottle Return Credit Policy */}
          <div className="bg-[#2e6a41]/50 p-4 rounded-xl border border-[#b1f2be]/20">
            <div className="flex items-center gap-2 text-[#F4C542] font-semibold text-sm mb-1.5">
              <Award className="w-4 h-4" />
              <span>{lang === 'ur' ? 'بوتل واپسی بچت پالیسی' : 'Eco Bottle Return Credit'}</span>
            </div>
            <p className="text-xs text-[#d7e4ec] leading-relaxed mb-3">
              {lang === 'ur'
                ? 'خالی شیشے کی بوتلیں ہمارے رائیڈر کو واپس کریں اور فی بوتل ۵۰ روپے ڈسکاؤنٹ حاصل کریں۔ ماحول دوست اور حفظان صحت کے مطابق۔'
                : 'Return empty sterilized glass bottles to your daily delivery rider and receive Rs. 50 cash credit per bottle on your next bill.'}
            </p>
            <div className="text-xs font-bold text-white bg-[#218838] py-1 px-2.5 rounded text-center">
              {lang === 'ur' ? 'روپے ۵۰ فی بوتل کیش بیک' : 'Rs. 50 Rebate / Glass Bottle'}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#2e6a41] flex flex-col sm:flex-row items-center justify-between text-xs text-[#becaba] gap-3">
          <div>{t('copyright')}</div>
          <div className="flex items-center gap-4 text-xs">
            <span>KPK Food Authority 100% Certified Lic. #LHR-49102-DF</span>
            <span>Halal Research Council Accredited</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
