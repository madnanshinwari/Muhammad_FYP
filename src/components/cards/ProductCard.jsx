import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';

export function ProductCard({ product }) {
  const { lang, t } = useLanguage();
  const { addItem, updateQty, getItemQty, setIsCartOpen } = useCart();

  // Parse available units
  let units = ["1.0"];
  try {
    if (typeof product.available_units === 'string') {
      units = JSON.parse(product.available_units);
    } else if (Array.isArray(product.available_units)) {
      units = product.available_units;
    }
  } catch (e) {
    units = ["1.0"];
  }

  const [selectedUnit, setSelectedUnit] = useState(units[0] || "1.0");

  const currentQty = getItemQty(product.id, selectedUnit);

  // Compute price for unit
  const unitNum = parseFloat(selectedUnit) || 1.0;
  const currentPrice = Math.round(product.base_price * unitNum);

  const handleAddToCart = () => {
    addItem(product, selectedUnit, 1);
  };

  const handleIncrement = () => {
    updateQty(product.id, selectedUnit, 1);
  };

  const handleDecrement = () => {
    updateQty(product.id, selectedUnit, -1);
  };

  const name = lang === 'ur' ? (product.name_ur || product.name_en) : product.name_en;
  const description = lang === 'ur' ? (product.description_ur || product.description_en) : product.description_en;

  return (
    <div className="card-elevation-1 hover:card-elevation-2 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group">
      {/* Visual Image Frame */}
      <div className="relative h-48 w-full bg-[#e3f0f8] overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {product.is_fresh_batch ? (
            <Badge variant="fresh">{t('freshBatchBadge')}</Badge>
          ) : (
            <span></span>
          )}
          {product.is_organic ? (
            <Badge variant="organic">{t('organicBadge')}</Badge>
          ) : null}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Title */}
          <h3 className="text-base sm:text-lg font-semibold text-[#111d23] mb-1 line-clamp-1 group-hover:text-[#218838] transition-colors">
            {name}
          </h3>

          {/* Description */}
          <p className="text-xs text-[#3f4a3d] line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        </div>

        <div>
          {/* Segmented Unit Selector */}
          <div className="mb-3.5">
            <span className="text-[11px] font-semibold text-[#6f7a6c] uppercase tracking-wider block mb-1.5">
              {t('unitSelectorLabel')}
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#F3F7F1] rounded-lg border border-[#E2E8F0]">
              {units.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setSelectedUnit(unit)}
                  className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold tabular-nums transition-all ${
                    selectedUnit === unit
                      ? 'bg-[#218838] text-white shadow-xs'
                      : 'text-[#263238] hover:text-[#14532D] hover:bg-white/60'
                  }`}
                >
                  {unit}{product.unit_type}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Add To Cart CTA Row */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
            <div>
              <span className="text-xs text-gray-400 block -mb-0.5">{t('rs')}</span>
              <div className="text-xl font-bold text-[#14532D] tabular-nums">
                {currentPrice.toLocaleString()}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  / {selectedUnit}{product.unit_type}
                </span>
              </div>
            </div>

            {/* Dual-State CTA: Single Button morphing into Stepper */}
            {currentQty === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                className="px-3.5 py-2 font-semibold shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('addToCart')}</span>
              </Button>
            ) : (
              <div className="inline-flex items-center rounded-lg bg-[#218838] p-0.5 shadow-sm text-white">
                <button
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#14532D] active:scale-95 transition-all text-white cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold tabular-nums">
                  {currentQty}
                </span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#14532D] active:scale-95 transition-all text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
