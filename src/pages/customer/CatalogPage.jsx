import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api.js';
import { ProductCard } from '../../components/cards/ProductCard.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

export function CatalogPage() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'all', label: t('allCategories') },
    { id: 'milk', label: t('catMilk') },
    { id: 'ghee_butter', label: t('catGheeButter') },
    { id: 'yogurt_cream', label: t('catYogurtCream') },
    { id: 'cheese', label: t('catCheese') },
    { id: 'specials', label: t('catSpecials') }
  ];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const nameEn = (item.name_en || '').toLowerCase();
    const nameUr = (item.name_ur || '').toLowerCase();
    const descEn = (item.description_en || '').toLowerCase();
    return matchesCategory && (nameEn.includes(q) || nameUr.includes(q) || descEn.includes(q));
  });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="max-w-2xl space-y-2">
        <Badge variant="fresh">{t('freshBatchBadge')}</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111d23] tracking-tight">
          {t('catalogTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[#3f4a3d]">
          {t('catalogSubtitle')}
        </p>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#218838] text-white shadow-xs'
                  : 'bg-[#F3F7F1] text-[#14532D] hover:bg-[#b1f2be]/40 border border-[#becaba]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-10 px-3.5 pl-9 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E2E8F0]">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            {lang === 'ur' ? 'اس کیٹیگری میں کوئی پراڈکٹ نہیں ملی' : 'No farm products match your search.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs text-[#218838] font-bold underline"
          >
            {lang === 'ur' ? 'تمام مصنوعات دیکھیں' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
