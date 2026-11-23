import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api.js';
import { ProductCard } from '../../components/cards/ProductCard.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { 
  Clock, 
  ArrowRight, 
  Truck, 
  RotateCcw, 
  Droplet, 
  Thermometer,
  Award
} from 'lucide-react';

export function HomePage() {
  const { t, lang } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({
    today_yield_liters: 760.5,
    pending_orders: 8,
    today_revenue: 18450,
    average_chiller_temp: 3.8
  });

  useEffect(() => {
    api.getProducts().then((res) => {
      setFeaturedProducts(res.slice(0, 4));
    }).catch(console.error);

  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-[#E2E8F0] bg-gradient-to-b from-[#f4faff] via-[#FFFDF5] to-[#FFFDF5]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & Action CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F7F1] border border-[#becaba]/60 text-xs sm:text-sm font-semibold text-[#14532D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#218838] animate-pulse"></span>
                <span>{t('heroBadge')}</span>
              </div>

              {/* Display Hero Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111d23] tracking-tight leading-[1.15]">
                {lang === 'ur' ? (
                  <span>
                    قدرتی غذائیت سے بھرپور <span className="text-[#218838]">فارم فریش دودھ</span> اور خالص دیسی گھی، روزانہ ترسیل
                  </span>
                ) : (
                  <span>
                    Wholesome <span className="text-[#218838]">Farm-Fresh Milk</span> & Artisanal Dairy, Delivered Daily
                  </span>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#3f4a3d] max-w-2xl leading-relaxed">
                {t('heroSubtitle')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/catalog">
                  <Button variant="primary" size="lg" className="shadow-md">
                    <span>{t('heroCtaShop')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

              </div>

              {/* Real-time Farm Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#E2E8F0]">
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                  <span className="text-xs text-gray-500 block">{t('heroStatLiters')}</span>
                  <span className="text-xl font-bold text-[#14532D] tabular-nums">
                    {stats.today_yield_liters} L
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                  <span className="text-xs text-gray-500 block">{t('heroStatCows')}</span>
                  <span className="text-xl font-bold text-[#14532D] tabular-nums">250+</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                  <span className="text-xs text-gray-500 block">{t('metricChillerTemp')}</span>
                  <span className="text-xl font-bold text-[#218838] tabular-nums">
                    {stats.average_chiller_temp}°C
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                  <span className="text-xs text-gray-500 block">{t('heroStatPurity')}</span>
                  <span className="text-xl font-bold text-[#14532D]">100% Halal</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Visual Glass Bottle & Cream Image */}
                <div className="rounded-3xl overflow-hidden bg-white p-2 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=1000&q=80"
                    alt="Abdul Salam Pure Dairy Milk"
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />
                  {/* Floating Freshness Badge Card */}
                  <div className="p-4 bg-white rounded-2xl mt-2 border border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F3F7F1] flex items-center justify-center text-[#218838]">
                        <Thermometer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#14532D]">
                          {lang === 'ur' ? 'صبح کی ترسیل: ۵:۳۰ بجے' : 'Morning Milking Chilled'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {lang === 'ur' ? 'چکنائی: ۶.۸٪ • ایس این ایف: ۹.۲٪' : 'Fat: 6.8% • SNF: 9.2% • Unpasteurized'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="fresh">{t('freshBatchBadge')}</Badge>
                  </div>
                </div>

                {/* Decorative floating card */}
                <div className="certification-card absolute -bottom-5 -left-4 sm:-left-6 bg-[#14532D] text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2e6a41] hidden sm:flex">
                  <Award className="w-7 h-7 text-[#F4C542] shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-white">KPK Food Authority</span>
                    <span className="text-[#b1f2be] text-[10px]">100% Certified Chemical Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purity Guarantee Pillars */}
      <section className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="organic" className="mb-2">
            {lang === 'ur' ? 'خلوص اور اعتماد' : 'Our Quality Pledge'}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111d23] tracking-tight">
            {lang === 'ur' ? 'عبد السلام ڈیری فارم کے چار بنیادی اصول' : 'The Four Pillars of Pure Halal Dairy'}
          </h2>
          <p className="text-xs sm:text-sm text-[#3f4a3d] mt-2">
            {lang === 'ur'
              ? 'ہم ملاوٹ سے پاک قدرتی غذا فراہم کرنے کے لیے جدید سائنسی اور روایتی طریقہ کار پر عمل پیرا ہیں۔'
              : 'Zero shortcuts. Direct from pasture to your glass, verified by continuous laboratory testing.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card-elevation-1 rounded-2xl p-5 bg-white border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-xl bg-[#F3F7F1] flex items-center justify-center text-[#218838] mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14532D] mb-1.5">
              {lang === 'ur' ? '۳۰ منٹ کے اندر کولنگ' : '30-Minute Rapid Chilling'}
            </h3>
            <p className="text-xs text-[#3f4a3d] leading-relaxed">
              {lang === 'ur'
                ? 'دوہنے کے ۳۰ منٹ کے اندر ۴ ڈگری سینٹی گریڈ پر محفوظ کیا جاتا ہے تاکہ بیکٹیریا نہ بن سکیں۔'
                : 'Raw milk is transferred immediately to stainless plate chillers at 4°C to arrest bacterial activity without heat destruction.'}
            </p>
          </div>

          <div className="card-elevation-1 rounded-2xl p-5 bg-white border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-xl bg-[#F3F7F1] flex items-center justify-center text-[#218838] mb-4">
              <Droplet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14532D] mb-1.5">
              {lang === 'ur' ? 'صفر فیصد ملاوٹ' : 'Zero Water or Hormones'}
            </h3>
            <p className="text-xs text-[#3f4a3d] leading-relaxed">
              {lang === 'ur'
                ? 'پانی، صابن، ڈیٹرجنٹ یا آکسیٹوسن انجیکشن سے مکمل پاک۔ نیلی راوی بھینسوں کی قدرتی پیداوار۔'
                : 'Strict zero-tolerance policy against water addition, chemical thickeners, or artificial oxytocin hormone injections.'}
            </p>
          </div>

          <div className="card-elevation-1 rounded-2xl p-5 bg-white border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-xl bg-[#F3F7F1] flex items-center justify-center text-[#218838] mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14532D] mb-1.5">
              {lang === 'ur' ? 'شیشے کی بوتلیں و رعایت' : 'Sterilized Glass Bottles'}
            </h3>
            <p className="text-xs text-[#3f4a3d] leading-relaxed">
              {lang === 'ur'
                ? 'پلاسٹک کے مضر اثرات سے پاک جراثیم کش شیشے کی بوتلیں۔ بوتل واپس کرنے پر ۵۰ روپے بچت۔'
                : 'Delivered in sanitized medical-grade glass bottles to prevent microplastic leaching. Rs. 50 credit on empty bottle return.'}
            </p>
          </div>

          <div className="card-elevation-1 rounded-2xl p-5 bg-white border border-[#E2E8F0]">
            <div className="w-12 h-12 rounded-xl bg-[#F3F7F1] flex items-center justify-center text-[#218838] mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#14532D] mb-1.5">
              {lang === 'ur' ? 'صبح ۶ بجے ترسیل' : 'Early Morning Delivery'}
            </h3>
            <p className="text-xs text-[#3f4a3d] leading-relaxed">
              {lang === 'ur'
                ? 'لاہور بھر میں صبح ۵:۰۰ سے ۷:۰۰ بجے تک آپ کے ناشتے سے پہلے پہنچایا جاتا ہے۔'
                : 'Insulated cooler vehicles deliver direct to your doorstep between 5:00 AM and 7:00 AM before household breakfast.'}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Farm Batches Catalog */}
      <section className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="fresh" className="mb-2">
              {t('catalogSubtitle')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111d23] tracking-tight">
              {t('catalogTitle')}
            </h2>
          </div>

          <Link to="/catalog">
            <Button variant="outline" size="sm">
              <span>{t('allCategories')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

    </div>
  );
}
